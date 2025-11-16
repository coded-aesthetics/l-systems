import * as THREE from "three";
import { TerrainSystem, TerrainType } from "../src/systems/TerrainSystem.js";

/**
 * TerrainSystem Usage Examples
 *
 * This file demonstrates various ways to use the TerrainSystem for creating
 * different types of terrain in the forest application.
 */

// Example 1: Basic Terrain Setup
export function createBasicTerrain(scene: THREE.Scene): TerrainSystem {
    const terrainSystem = new TerrainSystem(scene, {
        size: 1000,
        segments: 50,
        heightVariation: 1,
        color: 0x228b22,
        level: -2,
    });

    terrainSystem.init();
    return terrainSystem;
}

// Example 2: Large Mountainous Terrain
export function createMountainousTerrain(scene: THREE.Scene): TerrainSystem {
    const terrainSystem = new TerrainSystem(scene, {
        size: 3000,
        segments: 150,
        heightVariation: 8,
        color: 0x4a5d23, // Darker green for mountains
        level: -5,
    });

    terrainSystem.init();
    terrainSystem.setTerrainType(TerrainType.MOUNTAINOUS);
    return terrainSystem;
}

// Example 3: Rolling Hills for Natural Forests
export function createRollingHillsTerrain(scene: THREE.Scene): TerrainSystem {
    const terrainSystem = new TerrainSystem(scene, {
        size: 2000,
        segments: 100,
        heightVariation: 3,
        color: 0x32cd32, // Lime green for lush hills
        level: -3,
    });

    terrainSystem.init();
    terrainSystem.setTerrainType(TerrainType.ROLLING);
    return terrainSystem;
}

// Example 4: Flat Terrain for Structured Forests
export function createFlatTerrain(scene: THREE.Scene): TerrainSystem {
    const terrainSystem = new TerrainSystem(scene, {
        size: 1500,
        segments: 75,
        heightVariation: 0.2,
        color: 0x228b22,
        level: -2,
    });

    terrainSystem.init();
    terrainSystem.setTerrainType(TerrainType.FLAT);
    return terrainSystem;
}

// Example 5: Hilly Terrain with High Detail
export function createDetailedHillyTerrain(scene: THREE.Scene): TerrainSystem {
    const terrainSystem = new TerrainSystem(scene, {
        size: 2500,
        segments: 200, // High detail
        heightVariation: 5,
        color: 0x3cb371, // Medium sea green
        level: -4,
    });

    terrainSystem.init();
    terrainSystem.setTerrainType(TerrainType.HILLY);
    return terrainSystem;
}

// Example 6: Dynamic Terrain Modification
export function demonstrateTerrainModification(terrainSystem: TerrainSystem): void {
    console.log("=== Terrain Modification Demo ===");

    // Get initial stats
    console.log("Initial terrain stats:", terrainSystem.getStats());

    // Change terrain type
    setTimeout(() => {
        console.log("Changing to hilly terrain...");
        terrainSystem.setTerrainType(TerrainType.HILLY);
        console.log("New terrain stats:", terrainSystem.getStats());
    }, 2000);

    // Increase height variation
    setTimeout(() => {
        console.log("Increasing height variation...");
        terrainSystem.setHeightVariation(6);
        console.log("Updated terrain stats:", terrainSystem.getStats());
    }, 4000);

    // Change color
    setTimeout(() => {
        console.log("Changing terrain color...");
        terrainSystem.setTerrainColor(0x8fbc8f); // Dark sea green
    }, 6000);

    // Change to mountainous
    setTimeout(() => {
        console.log("Changing to mountainous terrain...");
        terrainSystem.setTerrainType(TerrainType.MOUNTAINOUS);
        console.log("Final terrain stats:", terrainSystem.getStats());
    }, 8000);
}

// Example 7: Terrain Query Functions
export function demonstrateTerrainQueries(terrainSystem: TerrainSystem): void {
    console.log("=== Terrain Query Demo ===");

    // Test various positions
    const testPositions = [
        { x: 0, z: 0 },
        { x: 100, z: 100 },
        { x: -200, z: 300 },
        { x: 500, z: -400 },
    ];

    testPositions.forEach((pos, index) => {
        const height = terrainSystem.getGroundHeight(pos.x, pos.z);
        const isOnTerrain = terrainSystem.isPositionOnTerrain(pos.x, pos.z);

        console.log(`Position ${index + 1} (${pos.x}, ${pos.z}):`);
        console.log(`  Height: ${height.toFixed(2)}`);
        console.log(`  On Terrain: ${isOnTerrain}`);
    });

    // Get safe spawn position
    const safeSpawn = terrainSystem.getSafeSpawnPosition();
    console.log(`Safe spawn position: (${safeSpawn.x.toFixed(2)}, ${safeSpawn.y.toFixed(2)}, ${safeSpawn.z.toFixed(2)})`);

    // Get terrain bounds
    const bounds = terrainSystem.getTerrainBounds();
    console.log("Terrain bounds:");
    console.log(`  Min: (${bounds.min.x}, ${bounds.min.y}, ${bounds.min.z})`);
    console.log(`  Max: (${bounds.max.x}, ${bounds.max.y}, ${bounds.max.z})`);
}

// Example 8: Forest Plant Placement Using Terrain
export function placeTreesOnTerrain(
    terrainSystem: TerrainSystem,
    scene: THREE.Scene,
    treeCount: number = 50
): THREE.Group {
    const forestGroup = new THREE.Group();
    scene.add(forestGroup);

    // Create simple tree geometry
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.8, 3);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });

    const foliageGeometry = new THREE.SphereGeometry(2);
    const foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });

    for (let i = 0; i < treeCount; i++) {
        // Get safe spawn position from terrain
        const spawnPos = terrainSystem.getSafeSpawnPosition();

        // Create tree
        const tree = new THREE.Group();

        // Trunk
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 1.5;
        tree.add(trunk);

        // Foliage
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = 4;
        tree.add(foliage);

        // Position tree on terrain
        tree.position.copy(spawnPos);

        // Add random rotation
        tree.rotation.y = Math.random() * Math.PI * 2;

        // Add random scale variation
        const scale = 0.8 + Math.random() * 0.4;
        tree.scale.setScalar(scale);

        forestGroup.add(tree);
    }

    console.log(`Placed ${treeCount} trees on terrain`);
    return forestGroup;
}

// Example 9: Terrain Configuration Presets
export const TerrainPresets = {
    // Gentle countryside
    COUNTRYSIDE: {
        size: 2000,
        segments: 80,
        heightVariation: 2,
        color: 0x90EE90,
        level: -2,
        type: TerrainType.ROLLING,
    },

    // Dense forest floor
    FOREST_FLOOR: {
        size: 1500,
        segments: 120,
        heightVariation: 1.5,
        color: 0x556B2F,
        level: -3,
        type: TerrainType.HILLY,
    },

    // Alpine terrain
    ALPINE: {
        size: 3500,
        segments: 200,
        heightVariation: 12,
        color: 0x8FBC8F,
        level: -8,
        type: TerrainType.MOUNTAINOUS,
    },

    // Park or garden
    PARK: {
        size: 1000,
        segments: 50,
        heightVariation: 0.5,
        color: 0x7CFC00,
        level: -1,
        type: TerrainType.FLAT,
    },

    // Badlands
    BADLANDS: {
        size: 4000,
        segments: 250,
        heightVariation: 15,
        color: 0x8B7355,
        level: -10,
        type: TerrainType.MOUNTAINOUS,
    },
};

// Example 10: Apply Terrain Preset
export function applyTerrainPreset(
    scene: THREE.Scene,
    presetName: keyof typeof TerrainPresets
): TerrainSystem {
    const preset = TerrainPresets[presetName];

    const terrainSystem = new TerrainSystem(scene, {
        size: preset.size,
        segments: preset.segments,
        heightVariation: preset.heightVariation,
        color: preset.color,
        level: preset.level,
    });

    terrainSystem.init();
    terrainSystem.setTerrainType(preset.type);

    console.log(`Applied terrain preset: ${presetName}`);
    console.log("Terrain stats:", terrainSystem.getStats());

    return terrainSystem;
}

// Example usage in main application:
/*
import { createRollingHillsTerrain, demonstrateTerrainModification, TerrainPresets } from './examples/terrain-examples.js';

// In your scene setup:
const scene = new THREE.Scene();

// Method 1: Use a predefined terrain function
const terrain1 = createRollingHillsTerrain(scene);

// Method 2: Use a preset
const terrain2 = applyTerrainPreset(scene, 'ALPINE');

// Method 3: Demonstrate dynamic modification
setTimeout(() => {
    demonstrateTerrainModification(terrain1);
}, 1000);
*/
