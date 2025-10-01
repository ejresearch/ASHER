#!/bin/bash

# ASHER Startup Script
# Starts the backend server and opens the frontend

echo "🧪 Starting ASHER - AI Testing Lab"
echo ""

# Check if virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo "📦 Creating virtual environment..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    echo "📥 Installing dependencies..."
    pip install -r requirements.txt
    cd ..
else
    echo "✅ Virtual environment found"
    cd backend
    source venv/bin/activate
    cd ..
fi

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo ""
    echo "⚠️  Warning: No .env file found!"
    echo "📝 Please create backend/.env with your API keys"
    echo "   You can copy backend/.env.example as a template"
    echo ""
    read -p "Press Enter to continue anyway (providers without keys will be unavailable)..."
fi

echo ""
echo "🚀 Starting ASHER backend server on http://localhost:8001"
echo ""

# Start the backend server in the background
cd backend
python server.py &
BACKEND_PID=$!
cd ..

# Wait for server to start
sleep 2

# Open the frontend in default browser
echo "🌐 Opening ASHER frontend..."
open index.html

echo ""
echo "✅ ASHER is running!"
echo ""
echo "📡 Backend API: http://localhost:8001"
echo "🌐 Frontend: file://$(pwd)/index.html"
echo "📚 API Docs: http://localhost:8001/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Wait for the backend process
wait $BACKEND_PID
