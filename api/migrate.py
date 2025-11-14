#!/usr/bin/env python3
"""
Migration script to transfer L-system plant configurations from localStorage to SQLite database.

This script helps users migrate their existing plant configurations from the browser's
localStorage to the new SQLite database backend.

Usage:
1. Export your localStorage data from the browser console:
   localStorage.getItem('lsystem-saved-plants')

2. Save the JSON data to a file (e.g., plants.json)

3. Run this script:
   python migrate.py plants.json

Or run interactively:
   python migrate.py
"""

import json
import sqlite3
import sys
import time
from pathlib import Path


def init_database(db_path="plants.db"):
    """Initialize the SQLite database with plants table"""
    with sqlite3.connect(db_path) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS plants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                axiom TEXT NOT NULL,
                rules TEXT NOT NULL,
                iterations INTEGER NOT NULL,
                angle REAL NOT NULL,
                angle_variation REAL DEFAULT 0,
                length_variation REAL DEFAULT 0,
                length_tapering REAL DEFAULT 1.0,
                leaf_probability REAL DEFAULT 0,
                leaf_generation_threshold INTEGER DEFAULT 0,
                length REAL DEFAULT 1.0,
                thickness REAL DEFAULT 0.1,
                tapering REAL DEFAULT 0.8,
                UNIQUE(name)
            )
        """)
        conn.commit()
    print(f"Database initialized: {db_path}")


def migrate_plant_data(plants_data, db_path="plants.db"):
    """Migrate plant data to SQLite database"""

    if isinstance(plants_data, str):
        try:
            plants_data = json.loads(plants_data)
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON: {e}")
            return False

    if not isinstance(plants_data, list):
        print("Error: Plant data must be a list/array")
        return False

    migrated_count = 0
    skipped_count = 0
    errors = []

    with sqlite3.connect(db_path) as conn:
        for plant_data in plants_data:
            try:
                # Validate required fields
                required_fields = ["name", "axiom", "rules", "iterations", "angle"]
                missing_fields = [
                    field for field in required_fields if field not in plant_data
                ]

                if missing_fields:
                    errors.append(
                        f"Plant '{plant_data.get('name', 'unnamed')}' missing fields: {missing_fields}"
                    )
                    continue

                # Map localStorage format to database format
                mapped_data = {
                    "name": plant_data["name"],
                    "timestamp": plant_data.get("timestamp", int(time.time() * 1000)),
                    "axiom": plant_data["axiom"],
                    "rules": plant_data["rules"],
                    "iterations": plant_data["iterations"],
                    "angle": plant_data["angle"],
                    "angle_variation": plant_data.get("angleVariation", 0),
                    "length_variation": plant_data.get("lengthVariation", 0),
                    "length_tapering": plant_data.get("lengthTapering", 1.0),
                    "leaf_probability": plant_data.get("leafProbability", 0),
                    "leaf_generation_threshold": plant_data.get(
                        "leafThreshold", 0
                    ),  # Note: mapping leafThreshold to leaf_generation_threshold
                    "length": plant_data.get("length", 1.0),
                    "thickness": plant_data.get("thickness", 0.1),
                    "tapering": plant_data.get("tapering", 0.8),
                }

                try:
                    conn.execute(
                        """
                        INSERT INTO plants (
                            name, timestamp, axiom, rules, iterations, angle,
                            angle_variation, length_variation, length_tapering,
                            leaf_probability, leaf_generation_threshold,
                            length, thickness, tapering
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                        (
                            mapped_data["name"],
                            mapped_data["timestamp"],
                            mapped_data["axiom"],
                            mapped_data["rules"],
                            mapped_data["iterations"],
                            mapped_data["angle"],
                            mapped_data["angle_variation"],
                            mapped_data["length_variation"],
                            mapped_data["length_tapering"],
                            mapped_data["leaf_probability"],
                            mapped_data["leaf_generation_threshold"],
                            mapped_data["length"],
                            mapped_data["thickness"],
                            mapped_data["tapering"],
                        ),
                    )

                    migrated_count += 1
                    print(f"✓ Migrated: {mapped_data['name']}")

                except sqlite3.IntegrityError:
                    # Plant already exists
                    skipped_count += 1
                    print(f"⚠ Skipped (already exists): {mapped_data['name']}")

            except Exception as e:
                error_msg = f"Error processing plant '{plant_data.get('name', 'unnamed')}': {str(e)}"
                errors.append(error_msg)
                print(f"✗ {error_msg}")
                continue

        conn.commit()

    print(f"\nMigration Summary:")
    print(f"  Migrated: {migrated_count} plants")
    print(f"  Skipped: {skipped_count} plants (already existed)")
    print(f"  Errors: {len(errors)} plants")

    if errors:
        print(f"\nErrors encountered:")
        for error in errors:
            print(f"  - {error}")

    return migrated_count > 0


def interactive_migration():
    """Interactive migration process"""
    print("=== L-System Plant Configuration Migration ===")
    print()
    print(
        "This script will help you migrate your plant configurations from localStorage to the database."
    )
    print()
    print("Instructions:")
    print("1. Open your browser's developer console (F12)")
    print("2. Navigate to the L-system application")
    print("3. Run: localStorage.getItem('lsystem-saved-plants')")
    print("4. Copy the JSON output")
    print("5. Paste it below when prompted")
    print()

    # Get JSON input
    print("Paste your localStorage JSON data (press Enter twice when done):")
    lines = []
    while True:
        try:
            line = input()
            if line.strip() == "" and len(lines) > 0:
                break
            lines.append(line)
        except KeyboardInterrupt:
            print("\nMigration cancelled.")
            return False

    json_data = "\n".join(lines).strip()

    if not json_data:
        print("No data provided. Exiting.")
        return False

    # Remove quotes if the JSON is wrapped in quotes (common when copying from console)
    if json_data.startswith('"') and json_data.endswith('"'):
        json_data = json_data[1:-1]
        # Unescape JSON
        json_data = json_data.replace('\\"', '"').replace("\\\\", "\\")

    return migrate_plant_data(json_data)


def main():
    """Main migration function"""

    # Initialize database
    init_database()

    if len(sys.argv) > 1:
        # File-based migration
        json_file = Path(sys.argv[1])

        if not json_file.exists():
            print(f"Error: File '{json_file}' not found.")
            return False

        try:
            with open(json_file, "r", encoding="utf-8") as f:
                json_data = f.read().strip()

            print(f"Loading plant data from: {json_file}")
            return migrate_plant_data(json_data)

        except Exception as e:
            print(f"Error reading file '{json_file}': {e}")
            return False
    else:
        # Interactive migration
        return interactive_migration()


if __name__ == "__main__":
    try:
        success = main()
        if success:
            print(f"\n🎉 Migration completed successfully!")
            print(
                f"Your plants are now stored in the database and ready to use with the API."
            )
        else:
            print(f"\n❌ Migration failed or no data was migrated.")

    except KeyboardInterrupt:
        print(f"\n\nMigration interrupted by user.")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
