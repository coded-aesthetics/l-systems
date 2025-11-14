# L-Systems Plant Configuration API

A lightweight Flask API server for storing and managing L-system plant configurations with SQLite database backend.

## Overview

This API replaces localStorage-based plant configuration storage with a persistent SQLite database, enabling:
- Centralized storage of plant configurations
- Cross-device access to saved plants
- Better data management and backup capabilities
- API access for multiple frontend applications

## Features

- **CRUD Operations**: Create, Read, Update, Delete plant configurations
- **SQLite Database**: Lightweight, file-based database storage
- **CORS Enabled**: Ready for frontend integration
- **Migration Support**: Easy migration from localStorage data
- **Parameter Validation**: Ensures data integrity
- **Health Check**: Monitor API status

## Installation

### Prerequisites

- Python 3.7+
- pip

### Setup

1. Navigate to the api directory:
```bash
cd l-systems/api
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Start the server:
```bash
python app.py
```

The API will be available at `http://localhost:5001`

## API Endpoints

### Plant Management

#### Get All Plants
```
GET /api/plants
```
Returns array of all plant configurations.

#### Get Plant by ID
```
GET /api/plants/{id}
```
Returns specific plant configuration by ID.

#### Get Plant by Name
```
GET /api/plants/{name}
```
Returns specific plant configuration by name.

#### Create Plant
```
POST /api/plants
Content-Type: application/json

{
  "name": "My Tree",
  "axiom": "F",
  "rules": "F -> F[+F]F[-F]F",
  "iterations": 4,
  "angle": 25,
  "angleVariation": 0,
  "lengthVariation": 0,
  "lengthTapering": 1.0,
  "leafProbability": 0,
  "leafGenerationThreshold": 0,
  "length": 1.0,
  "thickness": 0.1,
  "tapering": 0.8
}
```

#### Update Plant
```
PUT /api/plants/{id}
Content-Type: application/json

{
  "name": "Updated Tree",
  "angle": 30
  // ... other fields to update
}
```

#### Delete Plant by ID
```
DELETE /api/plants/{id}
```

#### Delete Plant by Name
```
DELETE /api/plants/name/{name}
```

### Migration

#### Migrate from localStorage
```
POST /api/plants/migrate
Content-Type: application/json

{
  "plants": [
    // Array of localStorage plant objects
  ]
}
```

### Health Check
```
GET /api/health
```

## Plant Configuration Schema

### Required Fields
- `name` (string): Plant configuration name
- `axiom` (string): L-system starting symbol(s)
- `rules` (string): L-system production rules
- `iterations` (integer): Number of L-system generations
- `angle` (number): Base turn angle in degrees

### Optional Fields
- `angleVariation` (number, default: 0): Random angle variation
- `lengthVariation` (number, default: 0): Random length variation  
- `lengthTapering` (number, default: 1.0): Length reduction per generation
- `leafProbability` (number, default: 0): Probability of leaf generation
- `leafGenerationThreshold` (integer, default: 0): Minimum depth for leaves
- `length` (number, default: 1.0): Base segment length
- `thickness` (number, default: 0.1): Base segment thickness
- `tapering` (number, default: 0.8): Thickness reduction factor

### Response Format
```json
{
  "id": 1,
  "name": "Tree",
  "timestamp": 1703123456789,
  "axiom": "F",
  "rules": "F -> F[+F]F[-F]F",
  "iterations": 4,
  "angle": 25,
  "angleVariation": 0,
  "lengthVariation": 0,
  "lengthTapering": 1.0,
  "leafProbability": 0,
  "leafGenerationThreshold": 0,
  "length": 1.0,
  "thickness": 0.1,
  "tapering": 0.8
}
```

## Migration from localStorage

### Option 1: Using the Migration Script

1. Export your localStorage data:
   - Open browser developer console (F12)
   - Navigate to your L-system app
   - Run: `localStorage.getItem('lsystem-saved-plants')`
   - Copy the JSON output

2. Run the migration script:
```bash
python migrate.py
```
Follow the interactive prompts to paste your JSON data.

### Option 2: File-based Migration

1. Save your localStorage JSON to a file (e.g., `plants.json`)
2. Run:
```bash
python migrate.py plants.json
```

### Option 3: API Migration

Use the `/api/plants/migrate` endpoint to send your localStorage data directly.

## Database Schema

The SQLite database contains a single `plants` table:

```sql
CREATE TABLE plants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    axiom TEXT NOT NULL,
    rules TEXT NOT NULL,
    iterations INTEGER NOT NULL,
    angle REAL NOT NULL,
    angle_variation REAL DEFAULT 0,
    length_variation REAL DEFAULT 0,
    length_tapering REAL DEFAULT 1.0,
    leaf_probability REAL DEFAULT 0,
    leaf_generation_threshold INTEGER DEFAULT 0,
    length REAL DEFAULT 1.0,
    thickness REAL DEFAULT 0.1,
    tapering REAL DEFAULT 0.8,
    UNIQUE(name)
);
```

## Error Handling

The API returns appropriate HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `500`: Internal Server Error

Error responses include a JSON object with an `error` field:
```json
{
  "error": "Plant not found"
}
```

## Development

### Running in Debug Mode
The server runs in debug mode by default when started with `python app.py`.

### Database Location
The SQLite database file `plants.db` is created in the same directory as `app.py`.

### CORS Configuration
CORS is enabled for all origins. For production, consider restricting to specific domains.

## Example Usage

### JavaScript Frontend Integration

```javascript
// Get all plants
const response = await fetch('http://localhost:5001/api/plants');
const plants = await response.json();

// Create a new plant
const newPlant = {
    name: 'My Custom Tree',
    axiom: 'F',
    rules: 'F -> FF[+F][-F]',
    iterations: 5,
    angle: 30
};

const createResponse = await fetch('http://localhost:5001/api/plants', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(newPlant)
});

const createdPlant = await createResponse.json();
```

## Production Considerations

- Use a production WSGI server (e.g., Gunicorn) instead of Flask's development server
- Configure proper CORS origins for security
- Set up database backups
- Add authentication if needed
- Use environment variables for configuration
- Add logging and monitoring

## Troubleshooting

### Common Issues

1. **Port 5001 already in use**: Change the port in `app.py` or kill the process using port 5001
2. **CORS errors**: Ensure the API server is running and accessible
3. **Database locked**: Close any existing database connections or restart the server
4. **Migration errors**: Check JSON format and ensure all required fields are present

### Logs
Check the console output where you started the Flask server for error messages and request logs.