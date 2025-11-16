# TerrainSystem Refactoring Documentation

## Overview

The TerrainSystem refactoring extracts ground creation logic from the SceneManager into a dedicated, reusable terrain management system. This modularization improves code organization, provides better terrain generation capabilities, and enables dynamic terrain modification.

## Architecture Changes

### Before Refactoring

```typescript
// SceneManager.ts - Direct ground creation
private createGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
    
    // Manual height variation
    const positionAttribute = groundGeometry.getAttribute("position");
    for (let i = 0; i < positionAttribute.count; i++) {
        const height = Math.random() * 2 - 1;
        positionAttribute.setZ(i, height);
    }
    
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    // ... positioning and scene addition
}
```

### After Refactoring

```typescript
// SceneManager.ts - Terrain system integration
private initTerrain(): void {
    this.terrainSystem = new TerrainSystem(this.scene, {
        size: 2000,
        segments: 100,
        heightVariation: 2,
        color: 0x228b22,
        level: this.groundLevel,
    });
    this.terrainSystem.init();
}
```

## TerrainSystem Features

### Core Components

1. **Terrain Generation Engine**
   - Multiple terrain types (Flat, Rolling, Hilly, Mountainous)
   - Procedural height generation using multi-octave noise
   - Configurable parameters for size, detail, and variation

2. **Height Query System**
   - Efficient ground height queries using raycasting
   - Height map caching for performance
   - Boundary checking and safe positioning

3. **Dynamic Modification**
   - Runtime terrain type changes
   - Height variation adjustment
   - Color modification
   - Full terrain regeneration

### Terrain Types

#### TerrainType.FLAT
- Minimal height variation (< 0.1 units)
- Suitable for structured forests or architectural scenes
- Low computational overhead

#### TerrainType.ROLLING
- Gentle hills using multi-octave noise
- Natural-looking terrain for most forest scenes
- Balanced performance and visual appeal

#### TerrainType.HILLY
- More pronounced elevation changes
- Sharp peaks using absolute noise values
- Good for varied forest ecosystems

#### TerrainType.MOUNTAINOUS
- Dramatic height variations (up to 3x base variation)
- Complex terrain features
- Higher computational cost but stunning visuals

## API Reference

### TerrainSystem Constructor

```typescript
constructor(scene: THREE.Scene, config?: Partial<TerrainConfig>)
```

**TerrainConfig Interface:**
```typescript
interface TerrainConfig {
    size: number;              // Terrain size in world units
    segments: number;          // Geometry detail level
    heightVariation: number;   // Maximum height variation
    color: number;            // Terrain color (hex)
    level: number;            // Base terrain level
    textureRepeat?: number;   // Texture tiling (future use)
}
```

### Core Methods

#### Initialization
```typescript
terrainSystem.init(): void
```

#### Height Queries
```typescript
terrainSystem.getGroundHeight(x: number, z: number): number
terrainSystem.getHeightAtPosition(x: number, z: number): number
terrainSystem.isPositionOnTerrain(x: number, z: number): boolean
```

#### Terrain Modification
```typescript
terrainSystem.setTerrainType(type: TerrainType): void
terrainSystem.setHeightVariation(variation: number): void
terrainSystem.setTerrainColor(color: number): void
terrainSystem.regenerateTerrain(): void
```

#### Utility Methods
```typescript
terrainSystem.getSafeSpawnPosition(): THREE.Vector3
terrainSystem.getTerrainBounds(): { min: THREE.Vector3; max: THREE.Vector3 }
terrainSystem.getStats(): TerrainStats
```

## Integration Points

### SceneManager Integration

The SceneManager now exposes terrain functionality through wrapper methods:

```typescript
// Height queries
sceneManager.getGroundHeight(x: number, z: number): number

// Terrain management
sceneManager.setTerrainType(type: TerrainType): void
sceneManager.setTerrainHeightVariation(variation: number): void
sceneManager.setTerrainColor(color: number): void
sceneManager.regenerateTerrain(): void
sceneManager.getTerrainStats(): TerrainStats
sceneManager.getSafeSpawnPosition(): THREE.Vector3
```

### PlayerSystem Integration

The PlayerSystem now uses a callback function for ground height queries instead of direct mesh dependency:

```typescript
// Before
constructor(scene, camera, controls, ground: THREE.Mesh)

// After  
constructor(scene, camera, controls, terrainHeightCallback: (x: number, z: number) => number)
```

### ForestGenerator Integration

The ForestGenerator provides high-level terrain management:

```typescript
forestGenerator.setTerrainType(type: string): void
forestGenerator.setTerrainHeightVariation(variation: number): void
forestGenerator.setTerrainColor(color: number): void
forestGenerator.regenerateTerrain(): void
forestGenerator.getTerrainStats(): TerrainStats
```

## Usage Examples

### Basic Setup

```typescript
import { TerrainSystem, TerrainType } from './systems/TerrainSystem.js';

// Create terrain with default settings
const terrainSystem = new TerrainSystem(scene);
terrainSystem.init();

// Create custom terrain
const terrainSystem = new TerrainSystem(scene, {
    size: 3000,
    segments: 150,
    heightVariation: 5,
    color: 0x228b22,
    level: -3
});
terrainSystem.init();
terrainSystem.setTerrainType(TerrainType.HILLY);
```

### Dynamic Terrain Modification

```typescript
// Change terrain type
terrainSystem.setTerrainType(TerrainType.MOUNTAINOUS);

// Adjust height variation
terrainSystem.setHeightVariation(8);

// Change color
terrainSystem.setTerrainColor(0x8fbc8f);

// Regenerate with new settings
terrainSystem.regenerateTerrain();
```

### Plant Placement on Terrain

```typescript
// Get safe position for placing objects
const spawnPos = terrainSystem.getSafeSpawnPosition();
plant.position.copy(spawnPos);

// Query height at specific location
const height = terrainSystem.getGroundHeight(x, z);
plant.position.set(x, height, z);

// Check if position is on terrain
if (terrainSystem.isPositionOnTerrain(x, z)) {
    // Place object
}
```

## Performance Considerations

### Optimization Strategies

1. **Segment Count**: Balance between visual quality and performance
   - Low detail: 50-100 segments
   - Medium detail: 100-150 segments  
   - High detail: 150-200+ segments

2. **Height Map Caching**: Height values are cached for efficient queries

3. **Raycasting Optimization**: Single raycaster instance reused for all queries

4. **Geometry Disposal**: Proper cleanup when regenerating terrain

### Performance Metrics

| Terrain Size | Segments | Triangles | Performance |
|-------------|----------|-----------|-------------|
| 1000x1000   | 50       | 5,000     | Excellent   |
| 2000x2000   | 100      | 20,000    | Good        |
| 3000x3000   | 150      | 45,000    | Moderate    |
| 4000x4000   | 200      | 80,000    | Lower       |

## UI Integration

### Global Functions for HTML

```javascript
// Change terrain type
setTerrainType('hilly');

// Update height variation
updateTerrainHeight('5.0');

// Change terrain color
updateTerrainColor('#8fbc8f');

// Regenerate terrain
regenerateTerrain();

// Get terrain statistics
const stats = getTerrainStats();
```

### HTML Control Examples

```html
<!-- Terrain Type Selection -->
<select onchange="setTerrainType(this.value)">
    <option value="flat">Flat</option>
    <option value="rolling">Rolling</option>
    <option value="hilly">Hilly</option>
    <option value="mountainous">Mountainous</option>
</select>

<!-- Height Variation Slider -->
<input type="range" min="0" max="10" step="0.5" value="2" 
       onchange="updateTerrainHeight(this.value)">

<!-- Color Picker -->
<input type="color" value="#228b22" 
       onchange="updateTerrainColor(this.value)">

<!-- Regenerate Button -->
<button onclick="regenerateTerrain()">Regenerate Terrain</button>
```

## Benefits of Refactoring

### 1. Separation of Concerns
- SceneManager focuses on scene setup and management
- TerrainSystem handles all terrain-related functionality
- Clear API boundaries between systems

### 2. Enhanced Functionality
- Multiple terrain types vs. single random variation
- Dynamic terrain modification at runtime
- Sophisticated height query system
- Safe spawn position calculation

### 3. Improved Maintainability
- Terrain logic centralized in one class
- Easier to extend with new terrain types
- Clear interfaces for integration

### 4. Better Performance
- Height map caching reduces redundant calculations
- Efficient raycasting with single reused instance
- Proper geometry disposal prevents memory leaks

### 5. Enhanced Flexibility
- Runtime terrain type changes
- Configurable terrain parameters
- Easy integration with other systems

## Future Enhancements

### Planned Features

1. **Texture Support**
   - Multi-texture blending based on height
   - Terrain-specific materials
   - Normal mapping for detail

2. **Advanced Generation**
   - Perlin/Simplex noise integration
   - Erosion simulation
   - Biome-based generation

3. **Performance Optimization**
   - Level-of-detail (LOD) system
   - Frustum culling for large terrains
   - GPU-based height queries

4. **Serialization**
   - Save/load terrain configurations
   - Export height maps
   - Terrain presets library

### Extension Points

The TerrainSystem is designed for easy extension:

```typescript
// Custom terrain type
class CustomTerrainSystem extends TerrainSystem {
    generateCustomTerrain(x: number, y: number): number {
        // Custom height generation logic
    }
}

// Terrain modifier plugins
interface TerrainModifier {
    apply(heightMap: Float32Array, config: TerrainConfig): void;
}
```

## Migration Guide

### For Existing Code

1. **Update PlayerSystem instantiation:**
```typescript
// Old
new PlayerSystem(scene, camera, controls, ground);

// New
new PlayerSystem(scene, camera, controls, 
    (x, z) => sceneManager.getGroundHeight(x, z));
```

2. **Replace direct ground references:**
```typescript
// Old
const height = sceneManager.ground.position.y;

// New
const height = sceneManager.getGroundHeight(x, z);
```

3. **Update height queries:**
```typescript
// Old - manual raycasting
const raycaster = new THREE.Raycaster();
const intersects = raycaster.intersectObject(ground);

// New - system method
const height = terrainSystem.getGroundHeight(x, z);
```

## Conclusion

The TerrainSystem refactoring successfully extracts terrain management from SceneManager into a dedicated, feature-rich system. This modularization provides:

- Enhanced terrain generation capabilities
- Dynamic modification support
- Better performance through optimization
- Clear separation of concerns
- Extensible architecture for future features

The refactoring maintains backward compatibility while providing a foundation for advanced terrain features and improved forest generation workflows.