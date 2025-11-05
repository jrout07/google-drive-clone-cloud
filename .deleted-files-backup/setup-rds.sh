#!/bin/bash

# AWS RDS Setup Script for Google Drive Clone
echo "🗄️ Setting up AWS RDS PostgreSQL Database"
echo "=========================================="

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first"
    exit 1
fi

echo "✅ AWS CLI configured"

# Set variables
DB_INSTANCE_ID="gdrive-clone-db"
DB_USERNAME="postgres"
DB_PASSWORD="GDriveClone2024!"
REGION="us-west-2"

echo ""
echo "📋 Database Configuration:"
echo "   Instance ID: $DB_INSTANCE_ID"
echo "   Username: $DB_USERNAME"
echo "   Password: $DB_PASSWORD"
echo "   Region: $REGION"
echo ""

# Check if RDS instance already exists
echo "🔍 Checking if RDS instance already exists..."
if aws rds describe-db-instances --db-instance-identifier $DB_INSTANCE_ID --region $REGION &> /dev/null; then
    echo "⚠️  RDS instance '$DB_INSTANCE_ID' already exists!"
    
    # Get existing endpoint
    DB_ENDPOINT=$(aws rds describe-db-instances \
        --db-instance-identifier $DB_INSTANCE_ID \
        --region $REGION \
        --query 'DBInstances[0].Endpoint.Address' \
        --output text)
    
    echo "   Endpoint: $DB_ENDPOINT"
    echo ""
    echo "Skip to Step 3 to update your .env file with this endpoint."
    exit 0
fi

echo "✅ No existing RDS instance found. Creating new one..."

# Step 1: Create Security Group
echo ""
echo "🔐 Step 1: Creating Security Group..."

# Get default VPC
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text --region $REGION)
if [ "$VPC_ID" = "None" ] || [ -z "$VPC_ID" ]; then
    echo "❌ No default VPC found. Please create a VPC first or use AWS Console."
    exit 1
fi

echo "   Using VPC: $VPC_ID"

# Check if security group already exists
SG_NAME="gdrive-rds-sg"
if aws ec2 describe-security-groups --filters "Name=group-name,Values=$SG_NAME" --region $REGION &> /dev/null; then
    echo "   Security group '$SG_NAME' already exists"
    SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$SG_NAME" --query 'SecurityGroups[0].GroupId' --output text --region $REGION)
else
    # Create security group
    SG_ID=$(aws ec2 create-security-group \
        --group-name $SG_NAME \
        --description "Security group for Google Drive Clone RDS database" \
        --vpc-id $VPC_ID \
        --region $REGION \
        --query 'GroupId' \
        --output text)
    
    if [ $? -eq 0 ]; then
        echo "✅ Security group created: $SG_ID"
    else
        echo "❌ Failed to create security group"
        exit 1
    fi

    # Allow PostgreSQL access (port 5432)
    aws ec2 authorize-security-group-ingress \
        --group-id $SG_ID \
        --protocol tcp \
        --port 5432 \
        --cidr 0.0.0.0/0 \
        --region $REGION

    if [ $? -eq 0 ]; then
        echo "✅ Security group rules configured"
    else
        echo "❌ Failed to configure security group rules"
    fi
fi

# Step 2: Create RDS Instance
echo ""
echo "🗄️ Step 2: Creating RDS PostgreSQL Instance..."
echo "   This will take 5-10 minutes..."

aws rds create-db-instance \
    --db-instance-identifier $DB_INSTANCE_ID \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 15.4 \
    --master-username $DB_USERNAME \
    --master-user-password $DB_PASSWORD \
    --allocated-storage 20 \
    --storage-type gp2 \
    --vpc-security-group-ids $SG_ID \
    --backup-retention-period 7 \
    --storage-encrypted \
    --deletion-protection false \
    --publicly-accessible true \
    --port 5432 \
    --region $REGION \
    --tags Key=Environment,Value=development Key=Project,Value=gdrive-clone \
    --no-auto-minor-version-upgrade

if [ $? -eq 0 ]; then
    echo "✅ RDS instance creation initiated!"
else
    echo "❌ Failed to create RDS instance"
    exit 1
fi

# Step 3: Wait for database to be available
echo ""
echo "⏳ Step 3: Waiting for database to become available..."
echo "   This may take 5-10 minutes. Please wait..."

aws rds wait db-instance-available \
    --db-instance-identifier $DB_INSTANCE_ID \
    --region $REGION

if [ $? -eq 0 ]; then
    echo "✅ Database is now available!"
else
    echo "❌ Timeout waiting for database. Check AWS Console for status."
    exit 1
fi

# Step 4: Get database endpoint
echo ""
echo "📊 Step 4: Getting database connection details..."

DB_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier $DB_INSTANCE_ID \
    --region $REGION \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)

if [ -n "$DB_ENDPOINT" ]; then
    echo "✅ Database endpoint retrieved: $DB_ENDPOINT"
else
    echo "❌ Failed to get database endpoint"
    exit 1
fi

# Step 5: Update .env file
echo ""
echo "📝 Step 5: Updating backend/.env file..."

ENV_FILE="/Users/jyotiranjanrout/Desktop/devops/backend/.env"

if [ -f "$ENV_FILE" ]; then
    # Backup original .env
    cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✅ Backup created: $ENV_FILE.backup.*"
    
    # Update database configuration
    sed -i '' "s|DB_HOST=.*|DB_HOST=$DB_ENDPOINT|g" "$ENV_FILE"
    sed -i '' "s|DB_PORT=.*|DB_PORT=5432|g" "$ENV_FILE"
    sed -i '' "s|DB_NAME=.*|DB_NAME=postgres|g" "$ENV_FILE"
    sed -i '' "s|DB_USERNAME=.*|DB_USERNAME=$DB_USERNAME|g" "$ENV_FILE"
    sed -i '' "s|DB_PASSWORD=.*|DB_PASSWORD=$DB_PASSWORD|g" "$ENV_FILE"
    
    # Add SSL configuration if not present
    if ! grep -q "DB_SSL" "$ENV_FILE"; then
        echo "" >> "$ENV_FILE"
        echo "# RDS SSL Configuration" >> "$ENV_FILE"
        echo "DB_SSL=true" >> "$ENV_FILE"
    fi
    
    echo "✅ Environment file updated"
else
    echo "❌ Environment file not found: $ENV_FILE"
fi

# Step 6: Create database schema
echo ""
echo "🏗️ Step 6: Setting up database schema..."

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL client not found. Installing..."
    brew install postgresql
fi

# Create database and schema
echo "Creating database schema..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_ENDPOINT -U $DB_USERNAME -d postgres -p 5432 << EOF
-- Create the application database
CREATE DATABASE gdrive_dev;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Application database created"
else
    echo "⚠️  Database might already exist, continuing..."
fi

# Run schema creation
MIGRATION_FILE="/Users/jyotiranjanrout/Desktop/devops/backend/src/migrations/001_initial_schema.sql"
if [ -f "$MIGRATION_FILE" ]; then
    echo "Running database migrations..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_ENDPOINT -U $DB_USERNAME -d gdrive_dev -p 5432 -f "$MIGRATION_FILE"
    
    if [ $? -eq 0 ]; then
        echo "✅ Database schema created successfully"
    else
        echo "⚠️  Some migrations may have failed. Check manually if needed."
    fi
else
    echo "⚠️  Migration file not found: $MIGRATION_FILE"
    echo "   You'll need to create the database schema manually."
fi

# Final summary
echo ""
echo "🎉 RDS Setup Complete!"
echo "====================="
echo ""
echo "📊 Database Information:"
echo "   Endpoint: $DB_ENDPOINT"
echo "   Port: 5432"
echo "   Database: gdrive_dev"
echo "   Username: $DB_USERNAME"
echo "   Password: $DB_PASSWORD"
echo ""
echo "✅ Next Steps:"
echo "   1. Your .env file has been updated"
echo "   2. Database schema has been created"
echo "   3. Start your backend: cd backend && npm start"
echo "   4. Test connection: curl http://localhost:3001/api/health"
echo ""
echo "💰 Cost: ~$15-18/month (eligible for AWS Free Tier)"
echo ""
echo "🔧 Management Commands:"
echo "   # Connect to database:"
echo "   PGPASSWORD=$DB_PASSWORD psql -h $DB_ENDPOINT -U $DB_USERNAME -d gdrive_dev -p 5432"
echo ""
echo "   # Delete database (when no longer needed):"
echo "   aws rds delete-db-instance --db-instance-identifier $DB_INSTANCE_ID --skip-final-snapshot --region $REGION"
echo ""
echo "🚀 Your Google Drive Clone now uses AWS RDS!"
