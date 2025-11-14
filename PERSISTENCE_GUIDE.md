# L-Systems Persistence Functionality Guide

This guide explains how to use the new plant configuration persistence functionality added to both the Three.js and Babylon.js examples.

## Overview

The L-Systems examples now include full CRUD (Create, Read, Update, Delete) functionality for saving and managing plant configurations using the Flask API backend. This allows you to:

- **Save** new L-system configurations to the database
- **Load** existing configurations from the database
- **Update** existing configurations with new parameters
- **Delete** configurations you no longer need

## Getting Started

### 1. Start the API Server

First, make sure the API server is running:

```bash
cd l-systems/api
python app.py
```

The server will start on `http://localhost:5001`

### 2. Open an Example

Open either:
- `example-threejs.html` - Three.js-based L-system renderer
- `example-babylonjs.html` - Babylon.js-based L-system renderer

## Using the Persistence Features

### Saving a New Plant Configuration

1. **Design your L-system**: Adjust all the parameters (axiom, rules, iterations, angle, etc.) to create your desired plant
2. **Enter a name**: Type a unique name in the "Plant Name" field
3. **Click "💾 Save Plant"**: This will save the current configuration to the database

**Example workflow:**
- Set axiom: `F`
- Set rules: `F -> F[+F][-F]F`
- Set iterations: `4`
- Set angle: `25`
- Enter name: "My Beautiful Tree"
- Click "💾 Save Plant"

### Loading an Existing Configuration

1. **Click "🔄 Refresh List"** to ensure you have the latest saved plants
2. **Select a plant** from the "Load from Database" dropdown
3. **Click "📂 Load Plant"** to load the configuration into the UI

The system will:
- Load all parameters into the UI controls
- Update the value displays
- Generate the L-system automatically
- Set the plant name in the name field

### Updating an Existing Configuration

You can update a configuration in two ways:

#### Method 1: Update Selected Plant
1. **Load a plant** from the dropdown (as described above)
2. **Modify parameters** as desired
3. **Click "✏️ Update Plant"** - this will update the loaded plant with your changes

#### Method 2: Update by Name
1. **Enter the plant name** you want to update in the "Plant Name" field
2. **Set the parameters** you want to change
3. **Click "✏️ Update Plant"** - this will find the plant by name and update it

### Deleting a Plant Configuration

1. **Select a plant** from the "Load from Database" dropdown
2. **Click "🗑️ Delete Selected Plant"**
3. **Confirm deletion** in the dialog that appears

⚠️ **Warning**: Deletion is permanent and cannot be undone!

## UI Elements Explained

### Plant Name Field
- **Purpose**: Enter names for saving new plants or updating existing ones
- **Auto-populated**: When you load a plant, this field is automatically filled
- **Renaming**: You can change this field before updating to rename a plant

### Load from Database Dropdown
- **Content**: Shows all saved plants with their save timestamps
- **Sorting**: Plants are sorted by newest first
- **Format**: "Plant Name (MM/DD/YYYY, HH:MM:SS AM/PM)"

### Action Buttons

| Button | Function | Requirements |
|--------|----------|-------------|
| 💾 Save Plant | Save current config as new plant | Plant name must be entered |
| ✏️ Update Plant | Update existing plant | Plant selected OR name entered |
| 📂 Load Plant | Load selected plant config | Plant must be selected |
| 🔄 Refresh List | Reload the plants dropdown | None |
| 🗑️ Delete Selected Plant | Delete the selected plant | Plant must be selected |

## Data Conversion Notes

The system automatically handles conversion between UI values and API values:

- **Length Variation**: UI shows 0-0.5, API stores 0-100
- **Length Tapering**: UI shows percentage (95%), API stores decimal (0.95)
- **Leaf Probability**: UI shows 0-1, API stores 0-100 percentage
- **Angle Variation**: Direct mapping (degrees)

## Error Handling

The system includes comprehensive error handling:

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Please enter a plant name" | Empty name field when saving | Enter a unique plant name |
| "Plant not found" | Trying to update non-existent plant | Check the plant name or refresh list |
| "API not available" | API server not running | Start the API server |
| "Connection failed" | Network or server issues | Check API server status |

### Troubleshooting

1. **API Server Issues**
   ```bash
   # Check if server is running
   curl http://localhost:5001/api/health
   
   # Start the server if not running
   cd l-systems/api
   python app.py
   ```

2. **Empty Plant List**
   - Click "🔄 Refresh List" button
   - Check browser console for error messages
   - Verify API server is accessible

3. **Save/Update Failures**
   - Check that all required fields are filled
   - Ensure plant name is unique (for saves)
   - Verify API server is running

## Advanced Usage

### Batch Operations

While not directly supported in the UI, you can use the API directly for batch operations:

```javascript
// Save multiple plants programmatically
const plants = [
    { name: "Tree1", axiom: "F", rules: "F -> F[+F][-F]", iterations: 3, angle: 25 },
    { name: "Tree2", axiom: "F", rules: "F -> FF[+F][-F]", iterations: 4, angle: 30 }
];

for (const plant of plants) {
    await fetch('http://localhost:5001/api/plants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plant)
    });
}
```

### Data Export/Import

You can export all your plants:

```javascript
// Get all plants
const response = await fetch('http://localhost:5001/api/plants');
const plants = await response.json();

// Save to file
const dataStr = JSON.stringify(plants, null, 2);
const blob = new Blob([dataStr], { type: 'application/json' });
const url = URL.createObjectURL(blob);
// ... download logic
```

## Best Practices

1. **Descriptive Names**: Use clear, descriptive names for your plants
   - Good: "Autumn Maple Tree", "Tropical Fern", "Winter Pine"
   - Bad: "Test1", "Plant", "Untitled"

2. **Regular Backups**: The plants are stored in `api/plants.db` - back this file up regularly

3. **Version Control**: Consider saving different versions of the same plant:
   - "Oak Tree v1", "Oak Tree v2", etc.

4. **Documentation**: Use the plant name to describe key features:
   - "Dense Foliage Tree", "Sparse Branch Pattern", "High Angle Variation"

## Integration with Existing Workflows

The persistence functionality integrates seamlessly with existing features:

- **Presets**: You can still use the built-in presets, then save them with modifications
- **Export**: The 3D model export functionality works with loaded plants
- **Parameters**: All existing parameter controls work with saved/loaded plants
- **Real-time Updates**: Changes are immediately reflected in the 3D view

## API Reference

For developers who want to integrate with the API directly:

### Endpoints
- `GET /api/plants` - List all plants
- `GET /api/plants/{id}` - Get plant by ID
- `GET /api/plants/{name}` - Get plant by name
- `POST /api/plants` - Create new plant
- `PUT /api/plants/{id}` - Update plant by ID
- `DELETE /api/plants/{id}` - Delete plant by ID

### Plant Object Structure
```json
{
  "id": 1,
  "name": "My Tree",
  "timestamp": 1703123456789,
  "axiom": "F",
  "rules": "F -> F[+F][-F]F",
  "iterations": 4,
  "angle": 25.0,
  "angleVariation": 5.0,
  "lengthVariation": 15.0,
  "lengthTapering": 0.95,
  "leafProbability": 70.0,
  "leafGenerationThreshold": 2,
  "length": 1.0,
  "thickness": 0.1,
  "tapering": 0.8
}
```

## Conclusion

The persistence functionality transforms the L-Systems examples from simple demonstrations into powerful plant design tools. You can now:

- Build a library of plant configurations
- Iterate on designs over multiple sessions
- Share configurations with others
- Maintain a collection of your best creations

Start experimenting with different L-system parameters and build your own botanical database!