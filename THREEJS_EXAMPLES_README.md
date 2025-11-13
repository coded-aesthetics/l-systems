# Three.js Integration Examples

This document provides a comprehensive guide to using the L-Systems library with Three.js for creating interactive 3D fractal visualizations.

## Quick Start

### 1. Build the Library

```bash
npm install
npm run build
```

### 2. Run Examples

```bash
# Test basic functionality
npm start
# Open: http://localhost:8080/test-threejs.html

# Full Three.js example
npm run start:threejs
# Open: http://localhost:8080/example-threejs.html
```

## Files Overview

### Core Files

- **`example-threejs.html`** - Complete interactive Three.js example with UI controls
- **`test-threejs.html`** - Simple test page to verify setup and functionality
- **`src/lib/adapters/ThreeJSAdapter.ts`** - TypeScript adapter for easy Three.js integration
- **`src/lib/examples/threejs-example.ts`** - Comprehensive example class

### Documentation

- **`THREEJS_INTEGRATION.md`** - Detailed API documentation
- **`THREEJS_EXAMPLES_README.md`** - This file

## Example 1: Basic Test Page (test-threejs.html)

A simple diagnostic page that tests each component step by step:

1. **Test Basic Three.js** - Verifies Three.js loads and creates a spinning cube
2. **Test L-System Import** - Verifies the L-System library imports correctly
3. **Test L-System Generation** - Tests L-System string and geometry generation
4. **Test Full Integration** - Creates a complete Three.js scene with L-System geometry

### Usage

Open `test-threejs.html` and click each test button in sequence to verify everything works.

## Example 2: Interactive Three.js Application (example-threejs.html)

A complete interactive application featuring:

### Features

- **Real-time L-System Generation** - Generate fractals with custom parameters
- **Interactive Controls** - Adjust iterations, angles, colors, and materials
- **Preset Library** - Pre-configured L-Systems (tree, fern, dragon, bush, coral, spiral)
- **Material Options** - Standard, Phong, Lambert, and Basic materials
- **Export Functionality** - Export generated models to OBJ format
- **Camera Controls** - Mouse orbit, zoom, and pan controls

### Controls

| Control | Description |
|---------|-------------|
| **Axiom** | Starting string for the L-System |
| **Rules** | Production rules (use arrow notation: `F -> F[+F]F[-F]F`) |
| **Iterations** | Number of generations to produce |
| **Angle** | Branching angle in degrees |
| **Length** | Base segment length |
| **Thickness** | Base segment thickness |
| **Tapering** | Thickness reduction factor per generation |

### L-System Syntax

#### Basic Symbols
- `F` - Draw forward (create geometry)
- `f` - Move forward (no geometry)
- `+` - Turn left by angle
- `-` - Turn right by angle
- `[` - Push current state to stack
- `]` - Pop state from stack

#### 3D Symbols
- `^` - Pitch up
- `v` - Pitch down
- `&` - Roll left
- `\` - Roll right
- `|` - Turn around (180°)

#### Rule Examples

```
# Simple tree
F -> F[+F]F[-F]F

# Fern
X -> F[+X]F[-X]+X
F -> FF

# Complex bush
F -> FF+[+F-F-F]-[-F+F+F]

# 3D coral structure
F -> F[++F][--F][^F][vF]

# Dragon curve
X -> X+YF+
Y -> -FX-Y
```

## Programmatic Usage

### Basic Integration

```javascript
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LSystem } from './dist/core/LSystem.js';

// Create Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create L-System
const rules = LSystem.parseRules('F -> F[+F]F[-F]F');
const lSystem = new LSystem('F', rules, 25);

// Generate geometry
const lSystemString = lSystem.generate(4);
const geometryData = lSystem.interpretToGeometry(
    lSystemString,
    1.0,    // length
    0.05,   // thickness
    0.8,    // tapering
    [0.2, 0.8, 0.2] // leaf color
);

// Create Three.js mesh
if (geometryData.vertices && geometryData.vertices.length > 0) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(geometryData.vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(geometryData.normals, 3));
    geometry.setIndex(geometryData.indices);

    const material = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
}

// Add lighting and controls
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 5);
scene.add(light);

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(5, 5, 5);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();
```

### Using the TypeScript Adapter

```typescript
import { ThreeJSAdapter, ThreeJSAdapterOptions } from './dist/lib/adapters/ThreeJSAdapter.js';
import { LSystem } from './dist/core/LSystem.js';

// Create L-System
const rules = LSystem.parseRules('F -> F[+F]F[-F]F');
const lSystem = new LSystem('F', rules, 25);

// Generate Three.js mesh with options
const options: ThreeJSAdapterOptions = {
    materialType: 'standard',
    branchColor: 0x8B4513,
    leafColor: 0x228B22,
    castShadow: true,
    receiveShadow: true
};

const meshGroup = ThreeJSAdapter.createMeshFromLSystem(
    lSystem,
    4,      // iterations
    1.0,    // length
    0.05,   // thickness
    0.8,    // tapering
    [0.2, 0.8, 0.2], // leaf color
    options
);

// Add to scene
scene.add(meshGroup.group);

// Auto-fit camera
ThreeJSAdapter.fitCameraToMesh(meshGroup, camera, controls);

// Export to OBJ
const objData = ThreeJSAdapter.exportToOBJ(meshGroup);
```

### Using Presets

```javascript
// Create from preset
const meshGroup = ThreeJSAdapter.createFromPreset('tree', 4, {
    materialType: 'phong',
    branchColor: 0x654321,
    leafColor: 0x228B22
});

scene.add(meshGroup.group);
```

## Advanced Examples

### Animated Growth

```javascript
let currentIterations = 1;
const maxIterations = 6;

function animateGrowth() {
    if (currentIterations <= maxIterations) {
        const meshGroup = ThreeJSAdapter.createFromPreset('tree', currentIterations);
        
        // Clear previous mesh
        scene.clear();
        scene.add(meshGroup.group);
        
        currentIterations++;
        setTimeout(animateGrowth, 1000);
    }
}

animateGrowth();
```

### Multiple L-Systems

```javascript
const lsystems = [
    { position: [-5, 0, 0], preset: 'tree', color: 0x8B4513 },
    { position: [0, 0, 0], preset: 'fern', color: 0x228B22 },
    { position: [5, 0, 0], preset: 'bush', color: 0x654321 }
];

lsystems.forEach(({ position, preset, color }) => {
    const meshGroup = ThreeJSAdapter.createFromPreset(preset, 4, {
        branchColor: color
    });
    meshGroup.group.position.set(...position);
    scene.add(meshGroup.group);
});
```

### Interactive Parameter Control

```javascript
const params = {
    iterations: 4,
    angle: 25,
    preset: 'tree'
};

function updateVisualization() {
    // Clear scene
    scene.clear();
    
    // Generate new L-System
    const meshGroup = ThreeJSAdapter.createFromPreset(
        params.preset, 
        params.iterations
    );
    scene.add(meshGroup.group);
    
    // Fit camera
    ThreeJSAdapter.fitCameraToMesh(meshGroup, camera, controls);
}

// Hook up to UI controls
document.getElementById('iterations').addEventListener('input', (e) => {
    params.iterations = parseInt(e.target.value);
    updateVisualization();
});
```

## Troubleshooting

### Common Issues

1. **"THREE is not defined"**
   - Ensure you're using the correct import method
   - Use importmap for ES6 modules or UMD build for globals

2. **"Failed to resolve module specifier"**
   - Check that all import paths are correct
   - Ensure the dist folder exists (`npm run build`)

3. **Empty geometry**
   - Verify L-System rules use arrow notation: `F -> F[+F]`
   - Check that generated string contains 'F' symbols
   - Ensure iterations > 0

4. **Performance issues**
   - Limit iterations (each iteration typically doubles complexity)
   - Use simpler materials for complex geometries
   - Consider level-of-detail for large scenes

### Debug Steps

1. **Test imports**: Use `test-threejs.html` to verify each component
2. **Check console**: Look for error messages and warnings
3. **Verify rules**: Ensure rules use correct arrow syntax
4. **Test generation**: Check that L-System string is generated
5. **Inspect geometry**: Verify vertex and index arrays have data

### Browser Compatibility

- **Modern browsers**: Chrome 89+, Firefox 88+, Safari 14+
- **Requirements**: ES6 modules, WebGL support
- **Import maps**: Required for ES6 module imports

## Performance Tips

1. **Limit complexity**: Each iteration typically doubles the geometry
2. **Use appropriate materials**: Standard materials are more expensive than Basic
3. **Enable frustum culling**: Large structures benefit from proper culling
4. **Consider instancing**: For repeated leaf geometry
5. **LOD systems**: Implement level-of-detail for complex scenes

## Export Features

- **OBJ format**: Export generated models for use in other applications
- **Separate meshes**: Branches and leaves exported as separate objects
- **Include normals**: Proper shading information preserved
- **Texture coordinates**: UV mapping included when available

## Contributing

To add new features:

1. Extend `ThreeJSAdapter` class for new functionality
2. Add presets to the `createFromPreset` method
3. Update documentation with new examples
4. Add tests to `test-threejs.html`

For more detailed API information, see `THREEJS_INTEGRATION.md`.