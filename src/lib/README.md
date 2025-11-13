# L-Systems Tree Generator Library

A lightweight, WebGL-ready library for generating 3D tree structures using L-Systems (Lindenmayer Systems). Generate procedural trees, ferns, and other organic structures with customizable parameters.

## Features

- **WebGL Optimized**: Returns Float32Arrays and typed arrays ready for GPU rendering
- **Framework Agnostic**: Core library works with any WebGL framework
- **Three.js Adapter**: Built-in adapter for seamless Three.js integration
- **Parameterized Colors**: Support for colored L-systems with named colors and hex values
- **TypeScript**: Full type safety and IntelliSense support
- **Lightweight**: Minimal dependencies, focused on performance

## Quick Start

### Basic Usage

```typescript
import { LSystemsLibrary } from './LSystemsLibrary.js';

// Define your L-system
const config = {
    axiom: "F",
    rules: "F -> F[+F]F[-F]F",
    iterations: 4,
    angle: 25
};

// Generate tree geometry
const treeGeometry = LSystemsLibrary.generateTree(config, {
    length: 1.0,
    thickness: 0.05,
    tapering: 0.8,
    leafColor: [0.2, 0.8, 0.2]
});

// Use the geometry data
console.log(`Generated ${treeGeometry.statistics.totalVertices} vertices`);
```

### Three.js Integration

```typescript
import { ThreeJSAdapter } from './adapters/ThreeJSAdapter.js';
import * as THREE from 'three';

// Create mesh group from L-system
const meshGroup = ThreeJSAdapter.createMeshFromLSystem(config, {
    length: 1.0,
    thickness: 0.05,
    tapering: 0.8,
    leafColor: [0.2, 0.8, 0.2]
}, {
    materialType: 'standard',
    branchColor: 0x8b4513,
    leafColor: 0x228b22,
    castShadow: true
});

// Add to your Three.js scene
scene.add(meshGroup.group);

// Fit camera to view the tree
ThreeJSAdapter.fitCameraToMesh(meshGroup, camera, controls);
```

## API Reference

### LSystemsLibrary

#### Constructor
```typescript
new LSystemsLibrary(config: LSystemConfig)
```

#### Static Methods
```typescript
// Quick generation (creates and disposes library instance)
LSystemsLibrary.generateTree(config: LSystemConfig, geometryParams?: GeometryParameters): TreeGeometry

// Parse rule strings
LSystemsLibrary.parseRules(ruleString: string): LSystemRule[]
```

#### Instance Methods
```typescript
// Generate tree with custom geometry parameters
generateTree(iterations: number, geometryParams?: GeometryParameters): TreeGeometry

// Update configuration
updateConfig(config: Partial<LSystemConfig>): void

// Generate only the L-system string
generateString(iterations: number): string
```

### Types

#### LSystemConfig
```typescript
interface LSystemConfig {
    axiom: string;                      // Starting symbol(s)
    rules: string | LSystemRule[];      // Production rules
    iterations: number;                 // Number of generations
    angle: number;                      // Turn angle in degrees
    angleVariation?: number;            // Random angle variation
    lengthVariation?: number;           // Random length variation
    leafProbability?: number;           // Probability of leaf generation
    leafGenerationThreshold?: number;   // Minimum depth for leaves
}
```

#### GeometryParameters
```typescript
interface GeometryParameters {
    length?: number;                    // Base segment length
    thickness?: number;                 // Base segment thickness
    tapering?: number;                  // Thickness reduction factor
    leafColor?: [number, number, number]; // RGB leaf color
}
```

#### TreeGeometry
```typescript
interface TreeGeometry {
    branches: {
        vertices: Float32Array;         // Vertex positions
        normals: Float32Array;          // Vertex normals
        colors: Float32Array;           // Vertex colors (RGBA)
        indices: Uint16Array | Uint32Array; // Triangle indices
        uvs: Float32Array;              // Texture coordinates
        depths: Float32Array;           // Depth values
        heights: Float32Array;          // Height values
    };
    leaves: {
        vertices: Float32Array;
        normals: Float32Array;
        colors: Float32Array;
        indices: Uint16Array | Uint32Array;
        uvs: Float32Array;
    };
    statistics: {
        branchVertices: number;
        leafVertices: number;
        totalVertices: number;
        generatedString: string;
    };
}
```

## L-System Rule Syntax

### Basic Rules
```
F -> F[+F]F[-F]F    // F becomes F with two branches
X -> F[+X][-X]      // X becomes F with two X branches
```

### Symbols
- `F` - Move forward and draw
- `+` - Turn right
- `-` - Turn left
- `[` - Push state (save position/angle)
- `]` - Pop state (restore position/angle)
- `^` - Pitch up
- `&` - Pitch down
- `\` - Roll left
- `/` - Roll right
- `|` - Turn around

### Parameterized Colors
```
F{color:brown} -> F{color:bark_brown}[+L{color:leaf_green}]
L{color:green} -> L{color:autumn_orange}
```

Supported color formats:
- Named colors: `red`, `green`, `blue`, `brown`, `leaf_green`, `bark_brown`, `autumn_red`, etc.
- Hex RGB: `#FF0000` or `FF0000`
- Hex RGBA: `#FF0000AA` or `FF0000AA`

## Example L-Systems

### Tree
```javascript
{
    axiom: "F",
    rules: "F -> F[+F]F[-F]F",
    angle: 25,
    iterations: 4
}
```

### Fern
```javascript
{
    axiom: "X",
    rules: "X -> F[+X]F[-X]+X\nF -> FF",
    angle: 25,
    iterations: 5
}
```

### Bush
```javascript
{
    axiom: "F",
    rules: "F -> FF+[+F-F-F]-[-F+F+F]",
    angle: 22,
    iterations: 4
}
```

### Colored Tree
```javascript
{
    axiom: "F{color:brown}",
    rules: "F{color:brown} -> F{color:bark_brown}[+L{color:leaf_green}][-L{color:leaf_green}]",
    angle: 25,
    iterations: 4
}
```

## Three.js Adapter

### ThreeJSAdapter Methods

```typescript
// Create mesh from L-system configuration
static createMeshFromLSystem(
    config: LSystemConfig,
    geometryParams?: GeometryParameters,
    options?: ThreeJSAdapterOptions
): LSystemMeshGroup

// Create mesh from geometry data
static createMeshFromTreeGeometry(
    treeGeometry: TreeGeometry,
    options?: ThreeJSAdapterOptions
): LSystemMeshGroup

// Fit camera to mesh
static fitCameraToMesh(
    meshGroup: LSystemMeshGroup,
    camera: THREE.PerspectiveCamera,
    controls?: any,
    padding?: number
): void

// Export to OBJ format
static exportToOBJ(meshGroup: LSystemMeshGroup): string

// Clean up resources
static dispose(meshGroup: LSystemMeshGroup): void
```

### Adapter Options
```typescript
interface ThreeJSAdapterOptions {
    materialType?: "standard" | "phong" | "lambert" | "basic";
    branchColor?: string | number;
    leafColor?: string | number;
    castShadow?: boolean;
    receiveShadow?: boolean;
    transparent?: boolean;
    opacity?: number;
    roughness?: number;
    metalness?: number;
    shininess?: number;
}
```

## Performance Notes

- Geometry data is generated once and cached
- Use `dispose()` methods to clean up WebGL resources
- For real-time applications, generate geometry off the main thread
- Large iteration counts (>6) can generate very complex geometry

## Browser Support

- Modern browsers with WebGL support
- ES2018+ features required
- TypeScript 4.0+ for development

## License

MIT License - see LICENSE file for details