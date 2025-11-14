#!/bin/bash

# L-Systems API Server Startup Script
# This script starts the Flask API server for plant configuration management

echo "🌱 Starting L-Systems Plant Configuration API Server..."

# Check if Python is available
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python is not installed or not in PATH"
    echo "Please install Python 3.7+ and try again"
    exit 1
fi

# Use python3 if available, otherwise python
PYTHON_CMD="python"
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
fi

echo "🔍 Using Python: $($PYTHON_CMD --version)"

# Check if we're in the correct directory
if [ ! -f "app.py" ]; then
    echo "❌ Error: app.py not found in current directory"
    echo "Please run this script from the l-systems/api directory"
    exit 1
fi

# Check if requirements.txt exists
if [ ! -f "requirements.txt" ]; then
    echo "❌ Error: requirements.txt not found"
    exit 1
fi

# Install dependencies if they're not already installed
echo "📦 Checking dependencies..."
$PYTHON_CMD -c "import flask, flask_cors" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "📥 Installing required dependencies..."
    if command -v pip3 &> /dev/null; then
        pip3 install -r requirements.txt
    elif command -v pip &> /dev/null; then
        pip install -r requirements.txt
    else
        echo "❌ Error: pip is not installed"
        echo "Please install pip and try again"
        exit 1
    fi

    # Verify installation
    $PYTHON_CMD -c "import flask, flask_cors" 2>/dev/null
    if [ $? -ne 0 ]; then
        echo "❌ Error: Failed to install dependencies"
        exit 1
    fi
fi

echo "✅ Dependencies verified"

# Check if port 5000 is already in use
if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Warning: Port 5001 is already in use"
    echo "The API server may fail to start, or another instance may be running"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Startup cancelled"
        exit 1
    fi
fi

# Start the server
echo ""
echo "🚀 Starting Flask API server..."
echo "📍 Server will be available at: http://localhost:5001"
echo "📊 API endpoints:"
echo "   GET    /api/health           - Health check"
echo "   GET    /api/plants           - List all plants"
echo "   POST   /api/plants           - Create/update plant"
echo "   DELETE /api/plants/{id}      - Delete plant by ID"
echo "   POST   /api/plants/migrate   - Migrate from localStorage"
echo ""
echo "💡 Press Ctrl+C to stop the server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Set environment variables for Flask
export FLASK_APP=app.py
export FLASK_ENV=development

# Start the Flask server
$PYTHON_CMD app.py
