#!/bin/bash

# Google Drive Clone - Complete Startup Guide
echo "🚀 Starting Google Drive Clone Application"

# 1. Start Backend
echo "📦 Starting Backend Server..."
cd /Users/jyotiranjanrout/Desktop/devops/backend
npm install
npm run build
npm start &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# 2. Start Frontend
echo "🌐 Starting Frontend Server..."
cd /Users/jyotiranjanrout/Desktop/devops/frontend
npm install
npm start &
FRONTEND_PID=$!

echo "✅ Application Started Successfully!"
echo "🔗 Frontend: http://localhost:3000"
echo "🔗 Backend API: http://localhost:3001"
echo "🔗 Health Check: http://localhost:3001/health"

echo ""
echo "🔐 Authentication: Real AWS Cognito Integration"
echo "   Register new users or login with existing accounts"

echo ""
echo "🛑 To stop the application:"
echo "   kill $BACKEND_PID $FRONTEND_PID"

# Keep script running
wait
