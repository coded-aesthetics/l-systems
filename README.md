# L-Systems Plant Generator

A 3D interactive L-Systems plant generator with WebGL rendering, featuring real-time parameter adjustment, leaf generation, and comprehensive save/load functionality.

## Architecture

This project has been refactored into a clean, modular architecture for better maintainability and extensibility:

### Core Modules (`src/core/`)
- **`LSystemState.ts`** - Core types and interfaces
- **`LSystemEngine.ts`** - Pure L-System string generation engine
- **`RuleProcessor.ts`** - Rule parsing and processing logic

### Parsing Utilities (`src/parsing/`)
- **`ParameterParser.ts`** - Symbol parameter extraction
- **`ColorParser.ts`** - Color parsing with named colors support  
- **`SymbolParser.ts`** - Combined symbol parsing orchestrator

### Utilities (`src/utils/`)
- **`mathUtils.ts`** - 3D math operations and vector utilities
- **`validationUtils.ts`** - Comprehensive input validation

### Main Application
- **`LSystemApp.ts`** - Main application orchestrator
- **`LSystem.ts`** - Backward-compatible wrapper (maintains original API)

## Features

### Core L-Systems
- Interactive L-System rule editing with real-time preview
- Support for all standard turtle graphics commands (F, f, +, -, [, ], etc.)
- **Parameterized color syntax** for per-symbol color control
- 3D rendering with pitch, yaw, and roll rotations
- Configurable iterations, angles, and geometric parameters

### 3D Rendering
- WebGL-based 3D rendering with realistic lighting
- Multiple color modes (height gradient, branch depth, uniform, autumn, **parameterized colors**)
- Dedicated UI section for parameterized color controls with examples and templates
- Parameterized color support with per-symbol RGBA color specification
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

### Using Parameterized Colors
1. **Enable the feature**: Set Color Mode to "Parameterized Colors" in the UI
2. **Basic colored symbols**: Use `{color:colorname}` syntax
   - `L{color:green}` for green leaves
   - `F{color:brown}` for brown branches
3. **In rules**: Apply colors to generated symbols
   - `F -> F{color:bark_brown}[+L{color:leaf_green}][-L{color:autumn_red}]`
4. **Color formats supported**:
   - Named colors: `green`, `brown`, `leaf_green`, `autumn_red`
   - Hex RGB: `#8B4513` or `8B4513`
   - Hex RGBA: `FABC34E4` (includes transparency)
5. **UI helpers**:
   - Click "📖 Color Examples" for comprehensive syntax guide
   - Click "➕ Insert Template" to add example colored rules
   - Use the new colored preset plants for inspiration

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

## Parameterized Colors

Symbols can now include color parameters using the syntax `{parameter:value}`:

### Basic Syntax
- `L{color:green}` - Green leaf using named color
- `F{color:#8B4513}` - Brown branch using hex color (RGB)
- `L{color:FABC34E4}` - Leaf with RGBA hex color (includes transparency)

### Named Colors Available
- `red`, `green`, `blue`, `brown`
- `leaf_green`, `bark_brown`, `dark_green`
- `autumn_red`, `autumn_orange`, `autumn_yellow`

### Color Examples
```
F -> F{color:bark_brown}[+L{color:leaf_green}][-L{color:autumn_red}]
L{color:green} -> L{color:autumn_orange}[+L{color:autumn_yellow}]
```

### Advanced Usage
- **Mix with existing features**: Colors work with all L-system commands
  - `F{color:brown}[&+L{color:red}][^-L{color:blue}]`
- **Gradual color changes**: Use different colors in rule expansion
  - `F -> F{color:dark_green}F{color:green}F{color:leaf_green}`
- **Seasonal effects**: Combine with multiple rules for variation
  - `L -> L{color:autumn_red}` (80% probability)
  - `L -> L{color:autumn_orange}` (20% probability)

## Example Plants

The system includes several preset plants:
- **Tree**: Classic branching tree with `F -> F[+F]F[-F]F`
- **Fern**: Delicate fern pattern
- **3D Tree**: Complex 3D branching structure
- **Bush with Leaves**: Dense foliage with leaf generation
- **Autumn Tree**: Seasonal coloring with varied leaf colors

**New Parameterized Color Presets:**
- **🎨 Colored Tree**: Brown branches with green leaves using parameterized colors
- **🍂 Autumn Colors**: Multi-colored autumn foliage demonstration
- **🌿 Colored Fern**: Gradient green fern with color variations
- **🌈 Rainbow Bush**: Multi-colored branching showcase

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

### Running Demos

#### Main Application
```bash
npm start
```
Open http://localhost:8080 to view the main L-Systems application.

#### Three.js Library Demo
```bash
npm run start:threejs
```
Open http://localhost:8080 to view the Three.js integration example.

#### Babylon.js Library Demo
```bash
npm run start:babylonjs
```
Open http://localhost:8080 to view the Babylon.js integration example.

Both library demos feature:
- Complete L-System parameter controls
- Real-time 3D rendering with WebGL
- Advanced parameters (angle/length variation, leaf probability)
- Material controls (PBR/Standard/Basic materials)
- Export functionality (OBJ format)
- Performance monitoring (FPS, vertices, triangles)

### File Structure
```
src/
  ├── index.ts          # Main application logic
  ├── LSystem.ts        # L-System string generation & color parsing
  ├── Renderer.ts       # WebGL 3D rendering with color support
  └── shaders/          # GLSL vertex/fragment shaders
```

### Implementation Summary

#### Parameterized Color Feature
The parameterized color system was implemented with these key components:

1. **Parser (`ParameterizedSymbolParser`)**: 
   - Tokenizes L-system strings into symbols with parameters
   - Supports `{key:value}` syntax with color parameter extraction
   - Handles named colors, RGB hex, and RGBA hex formats

2. **Color Processing**:
   - Named color library (red, green, leaf_green, autumn_red, etc.)
   - Hex color parsing for RGB (#FF0000) and RGBA (FABC34E4) formats
   - Automatic fallback to system colors for invalid inputs

3. **Rendering Pipeline**:
   - Extended WebGL shaders with vertex color attributes
   - Per-vertex RGBA color support for branches and leaves
   - Conditional activation via Color Mode 4 ("Parameterized Colors")

4. **User Interface Integration**:
   - Dedicated "🎨 Parameterized Colors" control section
   - Interactive color examples and template insertion
   - Visual named color reference with color swatches
   - New gradient-styled preset buttons for colored plants

5. **Backward Compatibility**:
   - All existing L-systems work unchanged
   - Non-parameterized symbols use system default colors
   - Progressive enhancement approach

### Adding New Features
The save/load system is designed to be extensible:
1. Add new parameters to the `SavedPlant` interface
2. Update `getCurrentState()` and `applyState()` methods
3. Add validation in `isValidPlantData()`

### Testing
- Open `color-test.html` for comprehensive color feature testing
- Use "📖 Color Examples" button in main app for syntax reference and auto-enable color mode
- Try "➕ Insert Template" to add example colored rules to your L-system
- Test with the new colored preset plants (🎨 Colored Tree, 🍂 Autumn Colors, etc.)
- Check browser console for parsing validation results

## License

This project is open source. Feel free to modify and share!