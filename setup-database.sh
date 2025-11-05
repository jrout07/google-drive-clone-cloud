#!/bin/bash

# 🗄️ Database Setup Script for Google Drive Clone
echo "🗄️ Setting up Database Schema"
echo "============================"

cd /Users/jyotiranjanrout/Desktop/devops/backend

# Load environment variables
export $(cat .env | xargs)

echo "📡 Connecting to RDS database..."
echo "Host: $DB_HOST"
echo "Database: $DB_NAME"

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL client (psql) not found"
    echo "Installing via Homebrew..."
    brew install postgresql
fi

# Test connection first
echo "🧪 Testing database connection..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USERNAME -d $DB_NAME -p $DB_PORT -c "SELECT version();" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful"
    
    echo "🏗️ Running database migrations..."
    # Run the schema migration
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USERNAME -d $DB_NAME -p $DB_PORT -f src/migrations/001_initial_schema.sql
    
    if [ $? -eq 0 ]; then
        echo "✅ Database schema created successfully"
        
        # Test tables were created
        echo "🔍 Verifying tables..."
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USERNAME -d $DB_NAME -p $DB_PORT -c "\dt"
        
        echo ""
        echo "🎉 Database setup complete!"
        echo "Your Google Drive Clone database is ready to use."
    else
        echo "❌ Database migration failed"
        echo "This might be normal if tables already exist"
    fi
else
    echo "❌ Cannot connect to database"
    echo "Please check your RDS configuration in .env file"
    echo ""
    echo "Current configuration:"
    echo "DB_HOST=$DB_HOST"
    echo "DB_NAME=$DB_NAME"
    echo "DB_USERNAME=$DB_USERNAME"
    echo "DB_PORT=$DB_PORT"
fi
