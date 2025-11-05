#!/bin/bash

echo "🎨 Starting Google Drive Clone Frontend..."

cd /Users/jyotiranjanrout/Desktop/devops/frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo "Starting frontend development server..."
echo "📱 Frontend will be available at: http://localhost:3000"
echo "🔧 Make sure backend is running on: http://localhost:3001"
echo ""

# Start the frontend
npm start
