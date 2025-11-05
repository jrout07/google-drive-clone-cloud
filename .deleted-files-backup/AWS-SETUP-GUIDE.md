# AWS Configuration Guide for Google Drive Clone

## Option 1: Local Development (Current Setup) ✅

Your current configuration uses placeholder values that work for local testing:

```bash
# Already configured in your .env file
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
S3_BUCKET_NAME=gdrive-dev-files-local
COGNITO_USER_POOL_ID=us-west-2_EXAMPLE123
COGNITO_CLIENT_ID=123456789abcdef123456789ab
```

## Option 2: Real AWS Setup

### Step 1: Install AWS CLI

```bash
# Install AWS CLI on macOS
brew install awscli

# Verify installation
aws --version
```

### Step 2: Create AWS Account and Get Credentials

1. Go to https://aws.amazon.com and create an account
2. Go to IAM Console → Users → Create User
3. Attach policies: AmazonS3FullAccess, AmazonCognitoPowerUser, AmazonEKSClusterPolicy
4. Create Access Key → Download credentials

### Step 3: Configure AWS CLI

```bash
aws configure
```

Enter your:
- AWS Access Key ID: AKIA...
- AWS Secret Access Key: ...
- Default region: us-west-2
- Default output format: json

### Step 4: Create AWS Resources

#### Create S3 Bucket:
```bash
aws s3 mb s3://your-gdrive-clone-bucket --region us-west-2
```

#### Create Cognito User Pool:
```bash
aws cognito-idp create-user-pool \
    --pool-name gdrive-clone-users \
    --region us-west-2 \
    --policies '{
        "PasswordPolicy": {
            "MinimumLength": 8,
            "RequireUppercase": true,
            "RequireLowercase": true,
            "RequireNumbers": true,
            "RequireSymbols": false
        }
    }' \
    --username-attributes email \
    --alias-attributes email \
    --auto-verified-attributes email \
    --verification-message-template '{
        "DefaultEmailOption": "CONFIRM_WITH_CODE",
        "DefaultEmailSubject": "Verify your Google Drive Clone account",
        "DefaultEmailMessage": "Your verification code is {####}"
    }' \
    --admin-create-user-config '{
        "AllowAdminCreateUserOnly": false,
        "UnusedAccountValidityDays": 7
    }'
```

**Note:** Save the UserPool ID from the response - you'll need it for the next step.

#### Create Cognito User Pool Client:
```bash
aws cognito-idp create-user-pool-client \
    --user-pool-id us-west-2_YourPoolId \
    --client-name gdrive-clone-client \
    --region us-west-2 \
    --explicit-auth-flows ADMIN_NO_SRP_AUTH ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH \
    --supported-identity-providers COGNITO \
    --read-attributes email given_name family_name \
    --write-attributes email given_name family_name \
    --prevent-user-existence-errors ENABLED
```

#### 🎯 **Recommended Cognito Configuration in AWS Console:**

When setting up through AWS Console, use these settings:

**Sign-in Identifiers:**
- ✅ **Email** - Primary method for file sharing
- ✅ **Username** - Alternative sign-in option  
- ❌ **Phone number** - Skip for now

**Required Attributes:**
- ✅ **Email** - Required
- ❌ **Phone number** - Optional

**Password Policy:**
- Minimum length: 8 characters
- Require uppercase letters: Yes
- Require lowercase letters: Yes  
- Require numbers: Yes
- Require symbols: No (keep it user-friendly)

**Multi-factor Authentication:**
- MFA enforcement: Optional (recommended for production)
- MFA methods: SMS (if you added phone numbers)

**Email Configuration:**
- Send emails with Cognito (for development)
- Or configure SES for production

### Step 5: Update Environment Variables

Replace placeholder values in your `.env` files with real AWS values:

#### Backend `.env`:
```bash
AWS_ACCESS_KEY_ID=AKIA...your-real-key
AWS_SECRET_ACCESS_KEY=your-real-secret-key
S3_BUCKET_NAME=your-gdrive-clone-bucket
COGNITO_USER_POOL_ID=us-west-2_YourRealPoolId
COGNITO_CLIENT_ID=YourRealClientId
```

#### Frontend `.env`:
```bash
REACT_APP_COGNITO_USER_POOL_ID=us-west-2_YourRealPoolId
REACT_APP_COGNITO_CLIENT_ID=YourRealClientId
```

## Option 3: Deploy Infrastructure with Terraform

Use the included Terraform configurations:

```bash
cd infrastructure

# Initialize Terraform
terraform init

# Plan deployment
terraform plan -var-file="environments/dev/terraform.tfvars"

# Apply infrastructure
terraform apply -var-file="environments/dev/terraform.tfvars"
```

## Option 4: Use LocalStack (AWS Local Emulation)

For advanced local development with AWS service emulation:

```bash
# Install LocalStack
pip install localstack

# Start LocalStack
localstack start

# Update .env for LocalStack
AWS_ENDPOINT_URL=http://localhost:4566
```

## Current Recommendation

**For immediate testing**: Keep your current configuration - it's perfect for development!

**For production**: Follow Option 2 or 3 to set up real AWS resources.

## Security Best Practices

1. Never commit real AWS credentials to git
2. Use AWS IAM roles in production
3. Enable MFA on your AWS account
4. Use least-privilege access policies
5. Rotate access keys regularly
