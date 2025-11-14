import json
import os
import sqlite3
import time
from contextlib import contextmanager

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Database configuration
DATABASE_PATH = "plants.db"


def init_database():
    """Initialize the SQLite database with plants table"""
    with sqlite3.connect(DATABASE_PATH) as conn:
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


@contextmanager
def get_db_connection():
    """Context manager for database connections"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # Enable column access by name
    try:
        yield conn
    finally:
        conn.close()


@app.route("/api/plants", methods=["GET"])
def get_plants():
    """Get all plant configurations"""
    try:
        with get_db_connection() as conn:
            cursor = conn.execute("""
                SELECT * FROM plants ORDER BY timestamp DESC
            """)
            plants = cursor.fetchall()

            result = []
            for plant in plants:
                result.append(
                    {
                        "id": plant["id"],
                        "name": plant["name"],
                        "timestamp": plant["timestamp"],
                        "axiom": plant["axiom"],
                        "rules": plant["rules"],
                        "iterations": plant["iterations"],
                        "angle": plant["angle"],
                        "angleVariation": plant["angle_variation"],
                        "lengthVariation": plant["length_variation"],
                        "lengthTapering": plant["length_tapering"],
                        "leafProbability": plant["leaf_probability"],
                        "leafGenerationThreshold": plant["leaf_generation_threshold"],
                        "length": plant["length"],
                        "thickness": plant["thickness"],
                        "tapering": plant["tapering"],
                    }
                )

            return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/plants/<int:plant_id>", methods=["GET"])
def get_plant(plant_id):
    """Get a specific plant configuration by ID"""
    try:
        with get_db_connection() as conn:
            cursor = conn.execute(
                """
                SELECT * FROM plants WHERE id = ?
            """,
                (plant_id,),
            )
            plant = cursor.fetchone()

            if not plant:
                return jsonify({"error": "Plant not found"}), 404

            result = {
                "id": plant["id"],
                "name": plant["name"],
                "timestamp": plant["timestamp"],
                "axiom": plant["axiom"],
                "rules": plant["rules"],
                "iterations": plant["iterations"],
                "angle": plant["angle"],
                "angleVariation": plant["angle_variation"],
                "lengthVariation": plant["length_variation"],
                "lengthTapering": plant["length_tapering"],
                "leafProbability": plant["leaf_probability"],
                "leafGenerationThreshold": plant["leaf_generation_threshold"],
                "length": plant["length"],
                "thickness": plant["thickness"],
                "tapering": plant["tapering"],
            }

            return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/plants/<name>", methods=["GET"])
def get_plant_by_name(name):
    """Get a specific plant configuration by name"""
    try:
        with get_db_connection() as conn:
            cursor = conn.execute(
                """
                SELECT * FROM plants WHERE name = ?
            """,
                (name,),
            )
            plant = cursor.fetchone()

            if not plant:
                return jsonify({"error": "Plant not found"}), 404

            result = {
                "id": plant["id"],
                "name": plant["name"],
                "timestamp": plant["timestamp"],
                "axiom": plant["axiom"],
                "rules": plant["rules"],
                "iterations": plant["iterations"],
                "angle": plant["angle"],
                "angleVariation": plant["angle_variation"],
                "lengthVariation": plant["length_variation"],
                "lengthTapering": plant["length_tapering"],
                "leafProbability": plant["leaf_probability"],
                "leafGenerationThreshold": plant["leaf_generation_threshold"],
                "length": plant["length"],
                "thickness": plant["thickness"],
                "tapering": plant["tapering"],
            }

            return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/plants", methods=["POST"])
def create_plant():
    """Create a new plant configuration"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        # Validate required fields
        required_fields = ["name", "axiom", "rules", "iterations", "angle"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        # Set default values for optional fields
        timestamp = int(time.time() * 1000)  # Milliseconds timestamp

        with get_db_connection() as conn:
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
                        data["name"],
                        timestamp,
                        data["axiom"],
                        data["rules"],
                        data["iterations"],
                        data["angle"],
                        data.get("angleVariation", 0),
                        data.get("lengthVariation", 0),
                        data.get("lengthTapering", 1.0),
                        data.get("leafProbability", 0),
                        data.get("leafGenerationThreshold", 0),
                        data.get("length", 1.0),
                        data.get("thickness", 0.1),
                        data.get("tapering", 0.8),
                    ),
                )
                conn.commit()

                # Get the created plant
                cursor = conn.execute(
                    """
                    SELECT * FROM plants WHERE name = ? ORDER BY timestamp DESC LIMIT 1
                """,
                    (data["name"],),
                )
                plant = cursor.fetchone()

                result = {
                    "id": plant["id"],
                    "name": plant["name"],
                    "timestamp": plant["timestamp"],
                    "axiom": plant["axiom"],
                    "rules": plant["rules"],
                    "iterations": plant["iterations"],
                    "angle": plant["angle"],
                    "angleVariation": plant["angle_variation"],
                    "lengthVariation": plant["length_variation"],
                    "lengthTapering": plant["length_tapering"],
                    "leafProbability": plant["leaf_probability"],
                    "leafGenerationThreshold": plant["leaf_generation_threshold"],
                    "length": plant["length"],
                    "thickness": plant["thickness"],
                    "tapering": plant["tapering"],
                }

                return jsonify(result), 201

            except sqlite3.IntegrityError:
                # Plant name already exists, update instead
                conn.execute(
                    """
                    UPDATE plants SET
                        timestamp = ?, axiom = ?, rules = ?, iterations = ?, angle = ?,
                        angle_variation = ?, length_variation = ?, length_tapering = ?,
                        leaf_probability = ?, leaf_generation_threshold = ?,
                        length = ?, thickness = ?, tapering = ?
                    WHERE name = ?
                """,
                    (
                        timestamp,
                        data["axiom"],
                        data["rules"],
                        data["iterations"],
                        data["angle"],
                        data.get("angleVariation", 0),
                        data.get("lengthVariation", 0),
                        data.get("lengthTapering", 1.0),
                        data.get("leafProbability", 0),
                        data.get("leafGenerationThreshold", 0),
                        data.get("length", 1.0),
                        data.get("thickness", 0.1),
                        data.get("tapering", 0.8),
                        data["name"],
                    ),
                )
                conn.commit()

                # Get the updated plant
                cursor = conn.execute(
                    """
                    SELECT * FROM plants WHERE name = ?
                """,
                    (data["name"],),
                )
                plant = cursor.fetchone()

                result = {
                    "id": plant["id"],
                    "name": plant["name"],
                    "timestamp": plant["timestamp"],
                    "axiom": plant["axiom"],
                    "rules": plant["rules"],
                    "iterations": plant["iterations"],
                    "angle": plant["angle"],
                    "angleVariation": plant["angle_variation"],
                    "lengthVariation": plant["length_variation"],
                    "lengthTapering": plant["length_tapering"],
                    "leafProbability": plant["leaf_probability"],
                    "leafGenerationThreshold": plant["leaf_generation_threshold"],
                    "length": plant["length"],
                    "thickness": plant["thickness"],
                    "tapering": plant["tapering"],
                }

                return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/plants/<int:plant_id>", methods=["PUT"])
def update_plant(plant_id):
    """Update an existing plant configuration"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        timestamp = int(time.time() * 1000)

        with get_db_connection() as conn:
            # Check if plant exists
            cursor = conn.execute("SELECT id FROM plants WHERE id = ?", (plant_id,))
            if not cursor.fetchone():
                return jsonify({"error": "Plant not found"}), 404

            # Update plant
            conn.execute(
                """
                UPDATE plants SET
                    name = COALESCE(?, name),
                    timestamp = ?,
                    axiom = COALESCE(?, axiom),
                    rules = COALESCE(?, rules),
                    iterations = COALESCE(?, iterations),
                    angle = COALESCE(?, angle),
                    angle_variation = COALESCE(?, angle_variation),
                    length_variation = COALESCE(?, length_variation),
                    length_tapering = COALESCE(?, length_tapering),
                    leaf_probability = COALESCE(?, leaf_probability),
                    leaf_generation_threshold = COALESCE(?, leaf_generation_threshold),
                    length = COALESCE(?, length),
                    thickness = COALESCE(?, thickness),
                    tapering = COALESCE(?, tapering)
                WHERE id = ?
            """,
                (
                    data.get("name"),
                    timestamp,
                    data.get("axiom"),
                    data.get("rules"),
                    data.get("iterations"),
                    data.get("angle"),
                    data.get("angleVariation"),
                    data.get("lengthVariation"),
                    data.get("lengthTapering"),
                    data.get("leafProbability"),
                    data.get("leafGenerationThreshold"),
                    data.get("length"),
                    data.get("thickness"),
                    data.get("tapering"),
                    plant_id,
                ),
            )
            conn.commit()

            # Return updated plant
            cursor = conn.execute("SELECT * FROM plants WHERE id = ?", (plant_id,))
            plant = cursor.fetchone()

            result = {
                "id": plant["id"],
                "name": plant["name"],
                "timestamp": plant["timestamp"],
                "axiom": plant["axiom"],
                "rules": plant["rules"],
                "iterations": plant["iterations"],
                "angle": plant["angle"],
                "angleVariation": plant["angle_variation"],
                "lengthVariation": plant["length_variation"],
                "lengthTapering": plant["length_tapering"],
                "leafProbability": plant["leaf_probability"],
                "leafGenerationThreshold": plant["leaf_generation_threshold"],
                "length": plant["length"],
                "thickness": plant["thickness"],
                "tapering": plant["tapering"],
            }

            return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/plants/<int:plant_id>", methods=["DELETE"])
def delete_plant(plant_id):
    """Delete a plant configuration"""
    try:
        with get_db_connection() as conn:
            # Check if plant exists
            cursor = conn.execute("SELECT name FROM plants WHERE id = ?", (plant_id,))
            plant = cursor.fetchone()
            if not plant:
                return jsonify({"error": "Plant not found"}), 404

            # Delete plant
            conn.execute("DELETE FROM plants WHERE id = ?", (plant_id,))
            conn.commit()

            return jsonify({"message": f'Plant "{plant["name"]}" deleted successfully'})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/plants/name/<name>", methods=["DELETE"])
def delete_plant_by_name(name):
    """Delete a plant configuration by name"""
    try:
        with get_db_connection() as conn:
            # Check if plant exists
            cursor = conn.execute("SELECT id FROM plants WHERE name = ?", (name,))
            plant = cursor.fetchone()
            if not plant:
                return jsonify({"error": "Plant not found"}), 404

            # Delete plant
            conn.execute("DELETE FROM plants WHERE name = ?", (name,))
            conn.commit()

            return jsonify({"message": f'Plant "{name}" deleted successfully'})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/plants/migrate", methods=["POST"])
def migrate_from_localstorage():
    """Migrate plant data from localStorage format"""
    try:
        data = request.get_json()
        if not data or "plants" not in data:
            return jsonify({"error": "No plants data provided"}), 400

        plants = data["plants"]
        if not isinstance(plants, list):
            return jsonify({"error": "Plants data must be an array"}), 400

        migrated_count = 0
        errors = []

        with get_db_connection() as conn:
            for plant_data in plants:
                try:
                    # Map localStorage format to API format
                    mapped_data = {
                        "name": plant_data.get("name"),
                        "axiom": plant_data.get("axiom"),
                        "rules": plant_data.get("rules"),
                        "iterations": plant_data.get("iterations"),
                        "angle": plant_data.get("angle"),
                        "angleVariation": plant_data.get("angleVariation", 0),
                        "lengthVariation": plant_data.get("lengthVariation", 0),
                        "lengthTapering": plant_data.get("lengthTapering", 1.0),
                        "leafProbability": plant_data.get("leafProbability", 0),
                        "leafGenerationThreshold": plant_data.get("leafThreshold", 0),
                        "length": plant_data.get("length", 1.0),
                        "thickness": plant_data.get("thickness", 0.1),
                        "tapering": plant_data.get("tapering", 0.8),
                    }

                    # Validate required fields
                    required_fields = ["name", "axiom", "rules", "iterations", "angle"]
                    if not all(
                        mapped_data.get(field) is not None for field in required_fields
                    ):
                        errors.append(
                            f"Missing required fields in plant: {plant_data.get('name', 'unnamed')}"
                        )
                        continue

                    timestamp = plant_data.get("timestamp", int(time.time() * 1000))

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
                                timestamp,
                                mapped_data["axiom"],
                                mapped_data["rules"],
                                mapped_data["iterations"],
                                mapped_data["angle"],
                                mapped_data["angleVariation"],
                                mapped_data["lengthVariation"],
                                mapped_data["lengthTapering"],
                                mapped_data["leafProbability"],
                                mapped_data["leafGenerationThreshold"],
                                mapped_data["length"],
                                mapped_data["thickness"],
                                mapped_data["tapering"],
                            ),
                        )
                        migrated_count += 1
                    except sqlite3.IntegrityError:
                        # Plant already exists, skip
                        errors.append(
                            f"Plant '{mapped_data['name']}' already exists, skipped"
                        )
                        continue

                except Exception as e:
                    errors.append(
                        f"Error processing plant {plant_data.get('name', 'unnamed')}: {str(e)}"
                    )
                    continue

            conn.commit()

        return jsonify(
            {
                "message": f"Migration completed. {migrated_count} plants migrated.",
                "migrated_count": migrated_count,
                "errors": errors,
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "timestamp": int(time.time() * 1000)})


if __name__ == "__main__":
    # Initialize database on startup
    init_database()
    print(f"Database initialized at: {os.path.abspath(DATABASE_PATH)}")
    print("Starting Flask API server on port 5001...")
    app.run(debug=True, host="0.0.0.0", port=5001)
