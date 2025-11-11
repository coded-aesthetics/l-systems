# L-Systems Plant Generator

A 3D interactive L-Systems plant generator with WebGL rendering, featuring real-time parameter adjustment, leaf generation, and comprehensive save/load functionality.

## Features

### Core L-Systems
- Interactive L-System rule editing with real-time preview
- Support for all standard turtle graphics commands (F, f, +, -, [, ], etc.)
- 3D rendering with pitch, yaw, and roll rotations
- Configurable iterations, angles, and geometric parameters

### 3D Rendering
- WebGL-based 3D rendering with realistic lighting
- Multiple color modes (height gradient, branch depth, uniform, autumn)
- Cylindrical branch geometry with configurable segments
- Smooth camera controls with zoom, rotation, and panning

### Leaf System
- Procedural leaf generation on branch endpoints
- Customizable leaf probability and generation thresholds
- Color picker with preset leaf colors
- 3D leaf geometry with proper normals and lighting

### Save & Load System
- **Local Storage**: Automatic persistence in browser storage
- **Complete State Saving**: Preserves all parameters including:
  - L-System rules and axiom
  - All geometry parameters (length, thickness, tapering)
  - Leaf settings (color, probability, threshold)
  - Camera position and zoom level
  - Rendering options
- **Export/Import**: JSON-based backup and sharing system
- **Validation**: Robust error handling and data validation

## Usage

### Basic L-System Creation
1. Enter an axiom (starting string) like `F`
2. Define rules like `F -> F[+F]F[-F]F`
3. Adjust iterations (1-8) to control complexity
4. Modify angle and other geometric parameters
5. Generate to see your 3D plant

### Save & Load Plants
1. **Saving**: Enter a name and click "Save Current Plant" or press `Ctrl+S`
2. **Loading**: Select from dropdown and click "Load" or press `Ctrl+O`
3. **Export**: Click "Export All" or press `Ctrl+E` to download JSON backup
4. **Import**: Click "Import" and select a JSON file to restore plants

### Camera Controls
- **Mouse Wheel**: Zoom in/out
- **Click + Drag**: Rotate camera
- **Alt + Drag**: Pan camera
- **Reset Button**: Return to default position

### Keyboard Shortcuts
- `Ctrl+S`: Save current plant
- `Ctrl+O`: Quick load first saved plant
- `Ctrl+E`: Export all plants
- `Ctrl+Enter`: Generate L-System (when in text areas)
- `Escape`: Clear inputs or close dropdowns

## L-System Symbols

| Symbol | Action | Description |
|--------|--------|-------------|
| `F` | Move Forward & Draw | Draw a branch segment |
| `f` | Move Forward (No Draw) | Move without drawing |
| `+` | Turn Right | Rotate around Y-axis (yaw) |
| `-` | Turn Left | Rotate around Y-axis (yaw) |
| `&` | Pitch Down | Rotate around X-axis |
| `^` | Pitch Up | Rotate around X-axis |
| `\` | Roll Left | Rotate around Z-axis |
| `/` | Roll Right | Rotate around Z-axis |
| `[` | Push State | Save current position/orientation |
| `]` | Pop State | Restore saved position/orientation |
| `L` | Draw Leaf | Generate a leaf at current position |

## Example Plants

The system includes several preset plants:
- **Tree**: Classic branching tree with `F -> F[+F]F[-F]F`
- **Fern**: Delicate fern pattern
- **3D Tree**: Complex 3D branching structure
- **Bush with Leaves**: Dense foliage with leaf generation
- **Autumn Tree**: Seasonal coloring with varied leaf colors

## Technical Details

### File Format
Saved plants use JSON format with the following structure:
```json
{
  "name": "Plant Name",
  "timestamp": 1234567890,
  "axiom": "F",
  "rules": "F -> F[+F]F[-F]F",
  "iterations": 4,
  "angle": 25,
  "leafColor": "#2ecc40",
  "zoom": 5.0,
  ...
}
```

### Browser Compatibility
- Requires WebGL support
- Tested on Chrome, Firefox, Safari, Edge
- Local storage for plant persistence
- File API for import/export functionality

### Performance Considerations
- Automatic string length limiting prevents browser freezing
- Optimized rendering with WebGL buffers
- Configurable geometry detail (segments parameter)
- Efficient camera matrix calculations

## Development

### Building
```bash
npm install
npm run build
```

### File Structure
```
src/
  ├── index.ts          # Main application logic
  ├── LSystem.ts        # L-System string generation
  ├── Renderer.ts       # WebGL 3D rendering
  └── shaders/          # GLSL shader files
```

### Adding New Features
The save/load system is designed to be extensible:
1. Add new parameters to the `SavedPlant` interface
2. Update `getCurrentState()` and `applyState()` methods
3. Add validation in `isValidPlantData()`

## License

This project is open source. Feel free to modify and share!