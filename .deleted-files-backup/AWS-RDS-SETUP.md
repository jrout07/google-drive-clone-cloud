# 🗄️ AWS RDS Setup Guide for Google Drive Clone

## 🎯 **Current Status:**
- ✅ Cognito User Pool: `us-west-2_GyEF1dW0E`
- ✅ S3 Configuration: Ready
- ❌ **RDS Database: NEEDS SETUP** ← You are here

## 🚀 **AWS RDS Setup Steps:**

### Step 1: Create RDS PostgreSQL Instance

```bash
# Create RDS PostgreSQL database
aws rds create-db-instance \
    --db-instance-identifier gdrive-clone-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 15.4 \
    --master-username postgres \
    --master-user-password GDriveClone2024! \
    --allocated-storage 20 \
    --storage-type gp2 \
    --vpc-security-group-ids sg-default \
    --db-subnet-group-name default \
    --backup-retention-period 7 \
    --storage-encrypted \
    --deletion-protection false \
    --publicly-accessible true \
    --port 5432 \
    --region us-west-2 \
    --tags Key=Environment,Value=development Key=Project,Value=gdrive-clone
```

### Step 2: Create Security Group for RDS Access

```bash
# Get your VPC ID
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text --region us-west-2)

# Create security group for RDS
aws ec2 create-security-group \
    --group-name gdrive-rds-sg \
    --description "Security group for Google Drive Clone RDS database" \
    --vpc-id $VPC_ID \
    --region us-west-2

# Get the security group ID
SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=gdrive-rds-sg" --query 'SecurityGroups[0].GroupId' --output text --region us-west-2)

# Allow PostgreSQL access from anywhere (for development)
aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 5432 \
    --cidr 0.0.0.0/0 \
    --region us-west-2

echo "Security Group ID: $SG_ID"
```

### Step 3: Alternative - Simple RDS Creation (Easier)

```bash
# Simple one-command RDS creation with default VPC
aws rds create-db-instance \
    --db-instance-identifier gdrive-clone-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --master-username postgres \
    --master-user-password GDriveClone2024! \
    --allocated-storage 20 \
    --publicly-accessible true \
    --region us-west-2
```

### Step 4: Wait for Database to be Available

```bash
# Check database status
aws rds describe-db-instances \
    --db-instance-identifier gdrive-clone-db \
    --region us-west-2 \
    --query 'DBInstances[0].DBInstanceStatus'

# Wait for it to show "available" (takes 5-10 minutes)
aws rds wait db-instance-available \
    --db-instance-identifier gdrive-clone-db \
    --region us-west-2

echo "✅ Database is ready!"
```

### Step 5: Get Database Connection Details

```bash
# Get the RDS endpoint
DB_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier gdrive-clone-db \
    --region us-west-2 \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)

echo "Database Endpoint: $DB_ENDPOINT"
echo "Database Port: 5432"
echo "Database Name: postgres"
echo "Username: postgres"
echo "Password: GDriveClone2024!"
```

---

## 🔧 **Update Your Configuration:**

### Update `backend/.env`:

Replace your current database configuration with:

```bash
# Database Configuration - AWS RDS
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_PORT=5432
DB_NAME=postgres
DB_USERNAME=postgres
DB_PASSWORD=GDriveClone2024!
DB_SSL=true
```

### Example Updated `.env`:

```bash
# Environment Configuration
NODE_ENV=development
PORT=3001

# Database Configuration - AWS RDS PostgreSQL
DB_HOST=gdrive-clone-db.cluster-xyz.us-west-2.rds.amazonaws.com
DB_PORT=5432
DB_NAME=postgres
DB_USERNAME=postgres
DB_PASSWORD=GDriveClone2024!
DB_SSL=true

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-for-development
JWT_EXPIRES_IN=7d

# AWS Configuration
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=AKIAYEXXUOP7EOJDGKEA
AWS_SECRET_ACCESS_KEY=Xva+A83gMUHYmE8QQlCAfkyZUctvns2GgQO86JWt
S3_BUCKET_NAME=gdrive-dev-files-local
S3_REGION=us-west-2

# Cognito Configuration
COGNITO_USER_POOL_ID=us-west-2_GyEF1dW0E
COGNITO_CLIENT_ID=75jjtldus9ru2pqjq8mt6jqgc3
COGNITO_REGION=us-west-2
COGNITO_ISSUER_URL=https://cognito-idp.us-west-2.amazonaws.com/us-west-2_GyEF1dW0E
USE_MOCK_AUTH=false

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Logging Configuration
LOG_LEVEL=debug
ENABLE_FILE_LOGGING=false

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# File Upload Configuration
MAX_FILE_SIZE=104857600
UPLOAD_TEMP_DIR=/tmp/uploads
```

---

## 🗄️ **Database Schema Setup:**

### Step 1: Connect to Your RDS Database

```bash
# Install PostgreSQL client (if not already installed)
brew install postgresql

# Connect to your RDS database
psql -h your-rds-endpoint.rds.amazonaws.com -U postgres -d postgres -p 5432
```

### Step 2: Create Your Database

```sql
-- Create the application database
CREATE DATABASE gdrive_dev;

-- Connect to the new database
\c gdrive_dev;

-- Create tables (your existing schema)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    cognito_user_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE folders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    size BIGINT,
    s3_key VARCHAR(500) NOT NULL,
    folder_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shares (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
    shared_with_email VARCHAR(255) NOT NULL,
    permission VARCHAR(20) DEFAULT 'read',
    shared_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_folder_id ON files(folder_id);
CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_shares_file_id ON shares(file_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_cognito_id ON users(cognito_user_id);
```

---

## 📊 **RDS Instance Options:**

### Development (Recommended):
```bash
--db-instance-class db.t3.micro     # 2 vCPU, 1 GB RAM - Free tier eligible
--allocated-storage 20              # 20 GB storage
--storage-type gp2                  # General Purpose SSD
```

### Production:
```bash
--db-instance-class db.t3.small     # 2 vCPU, 2 GB RAM
--allocated-storage 100             # 100 GB storage
--storage-type gp3                  # Latest generation SSD
--multi-az                          # High availability
```

---

## 💰 **Cost Estimation:**

### Development Setup:
- **RDS db.t3.micro**: ~$13-15/month
- **Storage (20 GB)**: ~$2-3/month
- **Total**: ~$15-18/month

### Free Tier Benefits:
- 750 hours/month of db.t3.micro (enough for 24/7)
- 20 GB of storage
- 20 GB of backup storage

---

## 🧪 **Testing Your RDS Setup:**

### Test Connection:
```bash
# Test connection from your local machine
psql -h your-rds-endpoint.rds.amazonaws.com -U postgres -d gdrive_dev -p 5432 -c "SELECT version();"
```

### Test Application:
```bash
# Start your backend with RDS configuration
cd /Users/jyotiranjanrout/Desktop/devops/backend
npm start

# Test database connection through your API
curl http://localhost:3001/api/health
```

---

## 🔒 **Security Best Practices:**

### 1. **Restrict Database Access:**
```bash
# Get your current IP
MY_IP=$(curl -s https://checkip.amazonaws.com)/32

# Update security group to only allow your IP
aws ec2 revoke-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 5432 \
    --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 5432 \
    --cidr $MY_IP
```

### 2. **Use Environment Variables:**
- Never commit database passwords to git
- Use AWS Secrets Manager for production
- Rotate passwords regularly

### 3. **Enable SSL:**
```bash
# Your connection should use SSL
psql "sslmode=require host=your-rds-endpoint.rds.amazonaws.com dbname=gdrive_dev user=postgres"
```

---

## 🎯 **Next Steps After RDS Setup:**

1. ✅ **Create RDS Instance**
2. ✅ **Update .env configuration**
3. ✅ **Run database migrations**
4. ✅ **Test connection**
5. ✅ **Start your application**

Your Google Drive Clone will now use AWS RDS for production-ready database hosting! 🚀
