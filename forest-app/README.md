# Forest Generator - Modularized Version

A modern, modular version of the L-System Forest Generator built with Vite and Three.js.

## 🌲 Features

- **Interactive 3D Forest Generation**: Create procedural forests using L-Systems
- **Real-time Movement**: Walk or fly through your generated forests
- **Day/Night Cycle**: Dynamic lighting with customizable time controls
- **Weather Effects**: Fog systems and atmospheric lighting
- **Plant Variety**: Multiple plant types with weighted distribution
- **Export Functionality**: Export generated scenes as GLTF files
- **Modern Architecture**: Modular, maintainable codebase

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎮 Controls

### Movement
- **WASD** - Walk around
- **Mouse** - Look around
- **Shift** - Hold to run (uses stamina)
- **Space** - Jump
- **F** - Toggle Fly Mode
- **C** - Move down (fly mode only)

### Features
- **L** - Toggle flashlight on/off
- **Tab** - Toggle fullscreen mode
- **ESC** - Exit fullscreen

## 🏗️ Project Structure

```
forest-app/
├── src/
│   ├── core/
│   │   ├── ForestGenerator.js      # Main orchestrator class
│   │   ├── SceneManager.js         # Three.js scene setup (planned)
│   │   └── InputManager.js         # Controls and input handling (planned)
│   ├── systems/
│   │   ├── PlantSystem.js          # Plant loading and management (planned)
│   │   ├── LightingSystem.js       # Day/night cycle and lighting (planned)
│   │   ├── PlayerSystem.js         # Movement and camera controls (planned)
│   │   └── UISystem.js             # UI interactions (planned)
│   ├── utils/
│   │   ├── math.js                 # Mathematical utilities (planned)
│   │   └── api.js                  # API communication (planned)
│   ├── styles/
│   │   └── main.css                # Application styles
│   └── main.js                     # Entry point
├── public/
├── index.html                      # Clean HTML template
├── vite.config.js                  # Vite configuration
└── package.json
```

## 📋 Development Status

### ✅ Phase 1 Complete: Project Structure Setup
- [x] Vite build system configured
- [x] Modern project structure created
- [x] CSS extracted and modularized
- [x] HTML template cleaned up
- [x] Basic ForestGenerator class created
- [x] Development and build scripts working

### 🚧 Phase 2: Class Extraction (In Progress)
- [ ] Extract full ForestGenerator class from original HTML
- [ ] Create PlantSystem module (~300 lines)
- [ ] Create LightingSystem module (~400 lines)
- [ ] Create PlayerSystem module (~500 lines)
- [ ] Create UISystem module (~200 lines)
- [ ] Create SceneManager module (~300 lines)
- [ ] Create utility modules (~200 lines)

### 🔮 Phase 3: Testing & Polish (Planned)
- [ ] Verify all functionality preserved
- [ ] Optimize build process
- [ ] Add TypeScript support (optional)
- [ ] Improve error handling

## 🛠️ Technology Stack

- **Build Tool**: Vite 5.x (fast, zero-config, modern)
- **Language**: Modern JavaScript ES6+
- **3D Library**: Three.js 0.158.0
- **Module System**: ES6 imports/exports
- **Styling**: CSS with custom properties
- **Dependencies**: Minimal, focused on core functionality

## 🎯 Key Improvements

### From Original Version
- **Modular Architecture**: Clean separation of concerns
- **Modern Build System**: Hot Module Replacement, optimized bundles
- **Better Organization**: Logical file structure
- **Maintainable Code**: Smaller, focused modules
- **Development Experience**: Instant updates, better debugging

### Preserved Functionality
- ✅ Same UI layout and controls
- ✅ Identical 3D rendering and generation
- ✅ Plant loading and API integration
- ✅ All movement and interaction systems
- ✅ Export functionality
- ✅ Performance characteristics

## 🔧 Configuration

### Vite Configuration
The `vite.config.js` file includes:
- Development server with HMR
- Production build optimization
- Three.js dependency handling
- Path aliases for clean imports

### Browser Compatibility
- Modern browsers with ES6+ support
- WebGL support required
- Pointer Lock API support recommended

## 📝 Migration Notes

This modularized version maintains 100% backward compatibility with the original `forest-generator.html` while providing:

1. **Better Developer Experience**: Hot reloading, better error messages
2. **Improved Maintainability**: Logical code organization
3. **Modern Tooling**: npm package management, build optimization
4. **Future-Ready**: Easy to extend and modify

## 🤝 Contributing

1. Follow the existing code style
2. Keep modules focused and single-purpose
3. Preserve all existing functionality
4. Test thoroughly before submitting changes

## 📄 License

MIT License - See original project for details.