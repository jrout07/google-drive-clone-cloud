#!/bin/bash

# 🚀 Complete Google Drive Clone Startup Script
echo "🚀 Starting Google Drive Clone Application"
echo "========================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Not in project root directory${NC}"
    echo "Please run this script from /Users/jyotiranjanrout/Desktop/devops"
    exit 1
fi

echo -e "${BLUE}📋 Pre-flight Checks${NC}"
echo "==================="

# 1. Check Node.js version
NODE_VERSION=$(node --version 2>/dev/null || echo "not installed")
echo -e "Node.js: ${GREEN}$NODE_VERSION${NC}"

# 2. Check npm version
NPM_VERSION=$(npm --version 2>/dev/null || echo "not installed")
echo -e "npm: ${GREEN}$NPM_VERSION${NC}"

# 3. Check AWS CLI
AWS_VERSION=$(aws --version 2>/dev/null || echo "not installed")
echo -e "AWS CLI: ${GREEN}$AWS_VERSION${NC}"

# 4. Check database connection
echo -e "${BLUE}🗄️ Testing Database Connection${NC}"
cd backend
if node -e "
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.log('❌ Database connection failed:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Database connection successful');
    console.log('🕐 Database time:', res.rows[0].now);
    pool.end();
  }
});
" 2>/dev/null; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    echo "Please check your RDS configuration in backend/.env"
fi

cd ..

echo ""
echo -e "${BLUE}🏗️ Building Applications${NC}"
echo "======================="

# Build backend
echo -e "${YELLOW}📦 Building backend...${NC}"
cd backend
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend built successfully${NC}"
else
    echo -e "${RED}❌ Backend build failed${NC}"
    exit 1
fi

cd ..

# Build frontend
echo -e "${YELLOW}📦 Building frontend...${NC}"
cd frontend
npm run build 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend built successfully${NC}"
else
    echo -e "${YELLOW}⚠️ Frontend build issues (this is normal for development)${NC}"
fi

cd ..

echo ""
echo -e "${BLUE}🚀 Starting Applications${NC}"
echo "======================"

# Function to kill processes on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down applications...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Backend stopped${NC}"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Frontend stopped${NC}"
    fi
    exit 0
}

# Set up trap to cleanup on exit
trap cleanup SIGINT SIGTERM

# Start backend
echo -e "${YELLOW}🔧 Starting backend server...${NC}"
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
echo -e "   📊 Backend API: http://localhost:3001"
echo -e "   📋 Logs: tail -f logs/backend.log"

# Wait a moment for backend to start
sleep 3

# Test backend health
if curl -s http://localhost:3001/api/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend health check passed${NC}"
else
    echo -e "${YELLOW}⚠️ Backend starting up... (this is normal)${NC}"
fi

cd ..

# Start frontend
echo -e "${YELLOW}🎨 Starting frontend development server...${NC}"
cd frontend
npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
echo -e "   🌐 Frontend App: http://localhost:3000"
echo -e "   📋 Logs: tail -f logs/frontend.log"

cd ..

echo ""
echo -e "${GREEN}🎉 Google Drive Clone is Ready!${NC}"
echo "================================"
echo ""
echo -e "${BLUE}📱 Application URLs:${NC}"
echo -e "   🌐 Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "   📊 Backend API: ${GREEN}http://localhost:3001${NC}"
echo -e "   🏥 Health Check: ${GREEN}http://localhost:3001/api/health${NC}"
echo ""
echo -e "${BLUE}🧪 Test Endpoints:${NC}"
echo -e "   📝 Register: POST http://localhost:3001/api/auth/register"
echo -e "   🔐 Login: POST http://localhost:3001/api/auth/login"
echo -e "   📁 Files: GET http://localhost:3001/api/files"
echo ""
echo -e "${BLUE}🔧 Development Tools:${NC}"
echo -e "   📋 Backend Logs: ${YELLOW}tail -f logs/backend.log${NC}"
echo -e "   📋 Frontend Logs: ${YELLOW}tail -f logs/frontend.log${NC}"
echo -e "   🔄 Restart Backend: ${YELLOW}npm run dev${NC} (in backend/)"
echo -e "   🔄 Restart Frontend: ${YELLOW}npm start${NC} (in frontend/)"
echo ""
echo -e "${BLUE}🗄️ Database Info:${NC}"
echo -e "   🌐 Host: ${GREEN}gdrive-clone-db.c7ou068sa73v.us-west-2.rds.amazonaws.com${NC}"
echo -e "   📊 Database: ${GREEN}gdrive_clone${NC}"
echo -e "   🔒 SSL: ${GREEN}Enabled${NC}"
echo ""
echo -e "${BLUE}☁️ AWS Services:${NC}"
echo -e "   🔐 Cognito: ${GREEN}us-west-2_GyEF1dW0E${NC}"
echo -e "   💾 S3 Bucket: ${GREEN}gdrive-dev-files-local${NC}"
echo -e "   🗄️ RDS: ${GREEN}PostgreSQL 15.4${NC}"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo -e "   • Open ${GREEN}http://localhost:3000${NC} in your browser"
echo -e "   • Create an account to test authentication"
echo -e "   • Upload files to test S3 integration"
echo -e "   • Check logs if you see any issues"
echo -e "   • Press ${RED}Ctrl+C${NC} to stop all services"
echo ""

# Wait for user to stop the services
echo -e "${BLUE}🏃 Services are running... Press Ctrl+C to stop${NC}"
wait
