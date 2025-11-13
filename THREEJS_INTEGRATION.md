# Three.js Integration Guide

This guide demonstrates how to use the L-Systems library with Three.js to create interactive 3D fractal visualizations.

## Quick Start

### 1. Basic HTML Example

See `example-threejs.html` for a complete working example. Run it with:

```bash
npm run build
npm start
# Navigate to: http://localhost:8080/example-threejs.html
```

### 2. TypeScript Integration

```typescript
import * as THREE from 'three';
import { LSystem } from './dist/core/LSystem.js';
import { ThreeJSAdapter } from './dist/lib/adapters/ThreeJSAdapter.js';

// Create a scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

// Create an L-System
const rules = LSystem.parseRules('F=F[+F]F[-F]F');
const lSystem = new LSystem('F', rules, 25);

// Generate and convert to Three.js mesh
const meshGroup = ThreeJSAdapter.createMeshFromLSystem(
    lSystem,
    4,      // iterations
    1.0,    // length
    0.05,   // thickness
    0.8,    // tapering
    [0.2, 0.8, 0.2], // leaf color
    {
        materialType: 'standard',
        branchColor: 0x8B4513,
        leafColor: 0x228B22,
        castShadow: true
    }
);

// Add to scene
scene.add(meshGroup.group);

// Fit camera to view the entire structure
ThreeJSAdapter.fitCameraToMesh(meshGroup, camera);
```

## API Reference

### ThreeJSAdapter

The `ThreeJSAdapter` class provides easy integration between L-Systems and Three.js.

#### Methods

##### `createMeshFromLSystem(lSystem, iterations, length, thickness, tapering, leafColor, options)`

Creates a Three.js mesh group from an L-System.

**Parameters:**
- `lSystem`: LSystem instance
- `iterations`: Number of iterations to generate
- `length`: Base segment length (default: 1.0)
- `thickness`: Base segment thickness (default: 0.05)
- `tapering`: Thickness reduction factor (default: 0.8)
- `leafColor`: RGB array for leaf color (default: [0.2, 0.8, 0.2])
- `options`: ThreeJSAdapterOptions object

**Returns:** `LSystemMeshGroup` object containing:
- `branches`: Three.js mesh for branches
- `leaves`: Three.js mesh for leaves
- `group`: Three.js group containing both meshes
- `boundingBox`: Bounding box of the entire structure
- `stats`: Vertex and triangle counts

##### `createFromPreset(presetName, iterations, options)`

Creates a mesh from a predefined preset.

**Available presets:**
- `'tree'`: Basic branching tree
- `'fern'`: Fractal fern pattern
- `'bush'`: Dense bush structure
- `'dragon'`: Dragon curve

##### `exportToOBJ(meshGroup)`

Exports the mesh group to OBJ format string.

##### `updateMaterials(meshGroup, options)`

Updates material properties of an existing mesh group.

##### `fitCameraToMesh(meshGroup, camera, controls, padding)`

Automatically positions the camera to view the entire L-System.

### ThreeJSAdapterOptions

Configuration object for material and rendering options:

```typescript
interface ThreeJSAdapterOptions {
    materialType?: 'standard' | 'phong' | 'lambert' | 'basic';
    branchColor?: string | number;      // e.g., 0x8B4513 or '#8B4513'
    leafColor?: string | number;        // e.g., 0x228B22 or '#228B22'
    castShadow?: boolean;
    receiveShadow?: boolean;
    transparent?: boolean;
    opacity?: number;                   // 0.0 to 1.0
    roughness?: number;                 // For standard material
    metalness?: number;                 // For standard material
    shininess?: number;                 // For phong material
}
```

### ThreeJSLSystemExample Class

A complete example class that demonstrates advanced usage:

```typescript
import { ThreeJSLSystemExample } from './dist/lib/examples/threejs-example.js';

const canvas = document.getElementById('canvas');
const app = new ThreeJSLSystemExample(canvas, OrbitControls);

// Generate different types of L-Systems
app.generateTree();
app.generateFern();

// Custom L-System
app.generateCustom(
    'F',                    // axiom
    'F -> F[+F]F[-F][F]',  // rules
    25,                     // angle
    4,                      // iterations
    {
        materialType: 'standard',
        branchColor: 0x654321,
        leafColor: 0x228B22
    }
);
```

## L-System Syntax

The library supports standard L-System notation:

### Basic Symbols
- `F`: Draw forward (create geometry)
- `f`: Move forward (no geometry)
- `+`: Turn left by angle
- `-`: Turn right by angle
- `[`: Push current state to stack
- `]`: Pop state from stack

### 3D Symbols
- `^`: Pitch up
- `v`: Pitch down
- `&`: Roll left
- `\`: Roll right
- `|`: Turn around (180°)

### Example Rules

```typescript
// Simple tree
const treeRules = 'F -> F[+F]F[-F]F';

// Fern
const fernRules = `
X -> F[+X]F[-X]+X
F -> FF
`;

// Complex bush
const bushRules = 'F -> FF+[+F-F-F]-[-F+F+F]';

// 3D coral structure
const coralRules = 'F -> F[++F][--F][^F][vF]';
```

## Features

### Material Types
- **Standard**: PBR material with roughness and metalness
- **Phong**: Classic Phong shading with shininess
- **Lambert**: Diffuse lighting only
- **Basic**: No lighting, flat colors

### Lighting Setup
The example includes:
- Ambient light for overall illumination
- Directional light with shadows (sun)
- Point light for highlights

### Camera Controls
- Orbit controls for mouse interaction
- Auto-fit camera to generated structures
- Smooth damping for natural movement

### Export Functionality
- Export to OBJ format
- Preserves separate branch and leaf meshes
- Includes normals and texture coordinates

## Performance Tips

1. **Limit Iterations**: Each iteration typically doubles the complexity
2. **Use LOD**: Consider level-of-detail for complex scenes
3. **Optimize Materials**: Use simpler materials for better performance
4. **Instance Leaves**: For many leaves, consider instanced rendering
5. **Frustum Culling**: Large structures benefit from proper culling

## Examples

### 1. Animated Growth

```typescript
let currentIterations = 1;
const maxIterations = 6;

function animateGrowth() {
    if (currentIterations <= maxIterations) {
        app.generateCustom('F', 'F=F[+F]F[-F]F', 25, currentIterations);
        currentIterations++;
        setTimeout(animateGrowth, 1000);
    }
}

animateGrowth();
```

### 2. Interactive Parameter Control

```typescript
const gui = new dat.GUI();
const params = {
    iterations: 4,
    angle: 25,
    materialType: 'standard',
    branchColor: '#8B4513',
    leafColor: '#228B22'
};

gui.add(params, 'iterations', 1, 8, 1).onChange(updateLSystem);
gui.add(params, 'angle', 5, 90, 1).onChange(updateLSystem);
gui.addColor(params, 'branchColor').onChange(updateMaterials);

function updateLSystem() {
    app.generateCustom('F', 'F -> F[+F]F[-F]F', params.angle, params.iterations);
}
```

### 3. Multiple L-Systems in One Scene

```typescript
const lsystems = [
    { position: [-5, 0, 0], preset: 'tree' },
    { position: [0, 0, 0], preset: 'fern' },
    { position: [5, 0, 0], preset: 'bush' }
];

lsystems.forEach(({ position, preset }) => {
    const meshGroup = ThreeJSAdapter.createFromPreset(preset, 4);
    meshGroup.group.position.set(...position);
    scene.add(meshGroup.group);
});
```

## Troubleshooting

### Common Issues

1. **Empty Geometry**: Check that your L-System rules are valid and contain 'F' symbols
2. **No Shadows**: Ensure shadow mapping is enabled on renderer and lights cast shadows
3. **Poor Performance**: Reduce iterations or use simpler materials
4. **Camera Issues**: Use `fitCameraToMesh()` to properly position camera

### Debug Mode

Enable debug logging:

```typescript
// Check L-System generation
const lSystemString = lSystem.generate(iterations);
console.log('Generated string:', lSystemString);

// Check geometry stats
console.log('Mesh stats:', meshGroup.stats);
```

## Contributing

To add new features or presets:

1. Extend the `ThreeJSAdapter` class
2. Add new presets to the `createFromPreset` method
3. Update the examples with new functionality
4. Add tests for new features

For more advanced usage, see the source code in `src/lib/adapters/ThreeJSAdapter.ts` and `src/lib/examples/threejs-example.ts`.