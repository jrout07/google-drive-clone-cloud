#!/bin/bash

echo "🚀 Starting Google Drive Clone Backend..."

cd /Users/jyotiranjanrout/Desktop/devops/backend

# Kill any existing process on port 3001
echo "Checking for existing processes on port 3001..."
PID=$(lsof -ti:3001)
if [ ! -z "$PID" ]; then
    echo "Killing existing process $PID"
    kill -9 $PID
    sleep 2
fi

# Start the backend
echo "Starting backend server..."
node dist/index.js &
BACKEND_PID=$!

echo "Backend started with PID: $BACKEND_PID"
echo "Waiting for server to start..."
sleep 3

# Test if backend is running
echo "Testing backend health..."
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend is running successfully!"
    echo "🌐 Backend URL: http://localhost:3001"
    echo "🏥 Health check: http://localhost:3001/health"
    echo ""
    echo "🎯 Available endpoints:"
    echo "  GET  /health         - Health check"
    echo "  POST /api/auth/login - Login (placeholder)"
    echo "  GET  /api/files      - Get files (placeholder)"
    echo "  GET  /api/users      - Get users (placeholder)"
    echo ""
    echo "Backend is running in background with PID: $BACKEND_PID"
    echo "To stop: kill $BACKEND_PID"
else
    echo "❌ Backend failed to start"
    echo "Check logs:"
    echo "  tail -f /Users/jyotiranjanrout/Desktop/devops/backend/backend.log"
fi
