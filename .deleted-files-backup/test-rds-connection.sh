#!/bin/bash

# Test AWS RDS Connection for Google Drive Clone
echo "🧪 Testing AWS RDS Database Connection"
echo "======================================="

# Database details
DB_HOST="gdrive-clone-db.c7ou068sa73v.us-west-2.rds.amazonaws.com"
DB_PORT="5432"
DB_USER="postgres"
DB_NAME="gdrive_clone"
DB_PASSWORD="GDriveClone2024!"

echo "📊 Database Details:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Test 1: Check if PostgreSQL client is installed
echo "🔧 Checking PostgreSQL client..."
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL client found"
else
    echo "❌ PostgreSQL client not found. Installing..."
    brew install postgresql
fi

echo ""

# Test 2: Test basic connection
echo "🔗 Testing database connection..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -p "$DB_PORT" -c "SELECT version();" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful!"
else
    echo "❌ Database connection failed!"
    echo ""
    echo "🔧 Troubleshooting steps:"
    echo "1. Check if RDS instance is running:"
    echo "   aws rds describe-db-instances --db-instance-identifier gdrive-clone-db --region us-west-2"
    echo ""
    echo "2. Check security group allows your IP:"
    echo "   aws ec2 describe-security-groups --region us-west-2"
    echo ""
    echo "3. Verify your IP address:"
    echo "   curl https://checkip.amazonaws.com"
    exit 1
fi

echo ""

# Test 3: Check if application tables exist
echo "📋 Checking database schema..."
TABLES=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -p "$DB_PORT" -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public';" 2>/dev/null | grep -v '^$')

if [ -z "$TABLES" ]; then
    echo "⚠️  Database is empty. Need to run migrations."
    echo ""
    echo "🔧 To create tables, run:"
    echo "   cd /Users/jyotiranjanrout/Desktop/devops/backend"
    echo "   npm run migrate"
else
    echo "✅ Database tables found:"
    echo "$TABLES" | sed 's/^/   - /'
fi

echo ""

# Test 4: Test application connection
echo "🚀 Testing backend application connection..."
cd /Users/jyotiranjanrout/Desktop/devops/backend

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Test the application database connection
echo "🧪 Testing application database config..."
node -e "
const { config } = require('./dist/config/config.js');
console.log('Database config:', {
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    username: config.database.username,
    ssl: config.database.ssl
});
" 2>/dev/null || echo "⚠️  Need to compile TypeScript first"

echo ""
echo "🎯 Next Steps:"
echo "==============="
echo "1. ✅ RDS Database is ready"
echo "2. 🔧 Run database migrations:"
echo "   cd /Users/jyotiranjanrout/Desktop/devops/backend"
echo "   npm run build"
echo "   npm run migrate"
echo ""
echo "3. 🚀 Start your application:"
echo "   npm start"
echo ""
echo "4. 🧪 Test the API:"
echo "   curl http://localhost:3001/api/health"
echo ""
echo "Your Google Drive Clone is ready to use AWS RDS! 🎉"
