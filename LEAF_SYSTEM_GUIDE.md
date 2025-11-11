# 🍃 L-System Leaf Generation Guide

## Overview

The L-System now supports procedural leaf generation using enhanced grammar rules. Leaves are rendered as highly translucent 3D spheres with customizable colors, glass-like appearance, realistic lighting, fresnel effects, and synchronized wind animation that moves with the branches.

## How It Works

### 1. Grammar-Based Generation
Leaves are generated through L-System rules using the `L` symbol:

```
// Basic leaf rule
L -> L                    // Leaves stay as leaves

// Compound leaves
L -> LL[+L][-L]          // Branch into multiple leaflets

// Mixed branching and leaves
A -> F[&+A][&-A][^+A][^-A]    // Growth rule
A -> F[&+L][&-L][^+L][^-L]    // Leaf generation rule (stochastic)
```

### 2. Stochastic Rule Selection
When multiple rules exist for the same symbol, the system randomly selects one during each iteration. This creates natural variation in branching vs. leaf generation.

## Quick Start Examples

### Simple Leaf Test
```
Axiom: FLLLFLLLFLL
Rules: L -> L
Iterations: 0
```
This directly places leaves along a branch for immediate visibility.

### Tree with Leaves
```
Axiom: T
Rules: 
T -> F[&+T][&-T][^+T][^-T]     // 50% chance: continue growing
T -> F[&+L][&-L][^+L][^-L]     // 50% chance: generate leaves
F -> FF
L -> LL[+L][-L]                // Compound leaves
```

### Bush with Dense Foliage
```
Axiom: A
Rules:
A -> F[&+A][&-A][^+A][^-A]     // Growth
A -> F[&+L][&-L][^+L][^-L]     // Leaves
F -> FF
L -> LLL[++L][--L][&&L][^^L]   // Dense leaf clusters
```

## Control Parameters

### Leaf Probability (0-100%)
Controls the likelihood of generating leaves vs. continuing branch growth.
- **0%**: No probabilistic leaf generation
- **50%**: Balanced growth and leaves
- **100%**: Maximum leaf generation

### Leaf Generation Threshold (0-6)
Minimum iteration depth before probabilistic leaf generation begins.
- **0**: Leaves can appear from iteration 1
- **2**: Leaves appear after 2 growth iterations (default)
- **4+**: Leaves only at branch tips

### Leaf Color
Interactive color picker with preset colors for easy customization.
- **Color Picker**: Full spectrum color selection
- **Preset Colors**: Green, Red, Orange, Yellow, Purple, Blue, Teal, Pink
- **Real-time Updates**: Colors change immediately without regenerating geometry

## Advanced Grammar Patterns

### Seasonal Variation
```
// Spring (growth phase)
S -> F[&+S][&-S][^+S][^-S]
F -> FF

// Summer (full foliage)
S -> F[&+S][&-S][^+S][^-S]
S -> F[&+L][&-L][^+L][^-L]
F -> FF
L -> LL[+L][-L][&L][^L]

// Fall (sparse leaves)
S -> F[&+S][&-S][^+S][^-S]
S -> F[&+L][&-L]
F -> FF
L -> L
```

### Leaf Types
```
// Simple leaves
L -> L

// Compound leaves (fern-like)
L -> L[+l][-l][&l][^l]
l -> l

// Dense clusters
L -> LLL[+++L][---L][&&&L][^^^L]

// Sparse distribution
L -> L[++L][--L]
```

## Technical Details

### Rendering Features
- **3D Sphere Geometry**: Leaves are rendered as highly translucent spheres with 8 segments and 6 rings
- **Size Variation**: Each sphere is 80-120% of base radius for natural variation
- **Custom Colors**: User-selectable leaf colors with preset options
- **Glass-like Translucency**: Enhanced alpha blending (15-70% opacity) with fresnel effects
- **Rim Lighting**: Glass-like edge glow for realistic translucent appearance
- **Dynamic Coloring**: Advanced light/dark color mixing with view-dependent effects
- **Depth-aware Transparency**: Proper alpha blending with depth buffer management
- **Synchronized Wind Animation**: Leaves sway in harmony with branch movement
- **Multi-axis Movement**: Wind affects X, Y, Z positions for natural floating motion
- **Realistic Lighting**: Advanced shader with ambient, diffuse, and rim lighting

### Performance Notes
- Leaves are rendered separately from branches using dedicated shaders
- Each sphere leaf uses 54 vertices and 96 triangles (8 segments × 6 rings)
- Significantly higher vertex count than quad leaves - monitor performance on lower-end hardware

## Troubleshooting

### No Leaves Visible
1. **Check L symbols**: Open browser console and verify "L-System string contains X L symbols" > 0
2. **Increase leaf probability**: Set to 80-100% for testing
3. **Lower generation threshold**: Set to 0-1 for early leaf generation
4. **Try Simple Leaf Test**: Use the dedicated test preset

### Leaves Too Small
1. **Increase thickness parameter**: Leaves are scaled relative to branch thickness
2. **Modify size multiplier**: Currently set to 3x branch thickness for spheres
3. **Add more iterations**: Thicker branches at higher generations

### Performance Issues
1. **Reduce iterations**: Each iteration exponentially increases complexity
2. **Lower leaf probability**: Reduces total leaf count
3. **Simplify leaf rules**: Use `L -> L` instead of compound patterns

## Best Practices

### Rule Design
1. **Start simple**: Begin with basic `L -> L` rules
2. **Test incrementally**: Add complexity gradually
3. **Balance growth/leaves**: Use 50-80% leaf probability for natural look
4. **Layer generations**: Use threshold to control when leaves appear

### Parameter Tuning
1. **Thickness**: 0.05-0.2 for visible leaves
2. **Length**: 1.0-2.0 for good leaf positioning
3. **Angle**: 20-35° for natural branching
4. **Iterations**: 3-5 for complex structures with leaves

### Performance Optimization
1. **Monitor triangle count**: Aim for <100k triangles total
2. **Use threshold wisely**: Prevent early leaf generation
3. **Optimize rules**: Avoid excessive leaf multiplication

## Example Presets

The following presets demonstrate different leaf generation techniques:

- **Minimal Leaf**: Single translucent sphere
- **Simple Leaf Test**: Branch with sphere leaf
- **Sphere Leaves**: Multiple spherical leaves on branches
- **Windy Leaves**: Showcases synchronized wind animation and translucency
- **Autumn Tree**: Perfect for testing different leaf colors (try orange/red)
- **Tree with Leaves**: Stochastic branching with sphere leaves
- **Bush with Leaves**: Dense sphere foliage structure

## Grammar Reference

### Symbols
- `L`: Generate leaf geometry
- `F`: Forward draw (branch segment)
- `f`: Forward move (no draw)
- `+/-`: Turn right/left (yaw)
- `&/^`: Pitch down/up
- `\//`: Roll left/right
- `[/]`: Push/pop turtle state

### Leaf-Specific Patterns
```
L -> L                    // Static leaf
L -> LL                   // Double leaf
L -> L[+L][-L]           // Branched leaflets
L -> LLL[&L][^L][/L][\L] // 3D leaf cluster
```

## Color Customization

### Using the Color Picker
1. **Main Picker**: Click the color square to open full spectrum picker
2. **Preset Buttons**: Click colored circles for quick color changes
3. **Seasonal Effects**: 
   - Green: Spring/summer foliage
   - Orange/Red: Autumn leaves
   - Purple/Blue: Fantasy/alien vegetation
   - Yellow: Desert or dying foliage

### Color Mixing
The shader automatically creates depth by mixing your chosen color:
- **Center**: 70% of selected color (darker)
- **Edges**: 130% of selected color (brighter)
- **Fresnel Effect**: Enhances edge brightness for translucency

## Wind Animation

### Synchronized Movement
- **Branch Harmony**: Leaves move in sync with branch wind patterns
- **Height Sensitivity**: Higher leaves are more affected by wind
- **Multi-frequency Motion**: Combines multiple sine waves for natural movement
- **Floating Effect**: Subtle vertical bobbing creates organic motion

### Animation Parameters
- **Wind Strength**: 3x stronger than branch movement for sphere visibility
- **Speed Synchronization**: Matches branch animation timing (2.0x time factor)
- **Directional Variance**: X/Z movement with gentle Y floating
- **Natural Variation**: Position-based offsets prevent uniform movement

## Translucency Effects

### Glass-like Appearance
- **Base Opacity**: 20% transparent foundation
- **Fresnel Enhancement**: Edges can reach up to 65% opacity
- **View-dependent**: Transparency changes based on viewing angle
- **Rim Lighting**: Edge glow enhances glass-like quality

### Rendering Optimizations
- **Depth Buffer Management**: Transparent objects don't write to depth
- **Blend Mode**: SRC_ALPHA, ONE_MINUS_SRC_ALPHA for proper mixing
- **Back-face Visibility**: Spheres visible from all angles
- **Color Preservation**: Maintains custom colors through transparency

This leaf system brings your L-Systems to life with natural, procedurally generated foliage in any color you desire, featuring realistic wind animation and glass-like translucency that follows the same recursive principles as the underlying branching structure!