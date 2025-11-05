# Google Drive Clone - Development Configuration

This file contains all the keys and configuration needed to run the application locally.

## Required Environment Variables

### Backend (.env in /backend folder)

```bash
# Environment
NODE_ENV=development
PORT=3001

# Database (PostgreSQL - optional for development)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gdrive_dev
DB_USERNAME=postgres
DB_PASSWORD=password

# JWT (for authentication)
JWT_SECRET=your-super-secret-jwt-key-for-development-make-this-long-and-random
JWT_EXPIRES_IN=7d

# AWS Configuration (Development placeholders - app will work without real AWS)
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
S3_BUCKET_NAME=gdrive-dev-files-local
S3_REGION=us-west-2

# AWS Cognito (Development placeholders)
COGNITO_USER_POOL_ID=us-west-2_EXAMPLE123
COGNITO_CLIENT_ID=123456789abcdef123456789ab
COGNITO_REGION=us-west-2

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Development settings
LOG_LEVEL=debug
ENABLE_FILE_LOGGING=false
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=1000
MAX_FILE_SIZE=104857600
```

### Frontend (.env in /frontend folder)

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:3001
REACT_APP_AWS_REGION=us-west-2

# AWS Cognito Configuration
REACT_APP_COGNITO_USER_POOL_ID=us-west-2_EXAMPLE123
REACT_APP_COGNITO_CLIENT_ID=123456789abcdef123456789ab
REACT_APP_COGNITO_REGION=us-west-2

# App Configuration
REACT_APP_APP_NAME=Google Drive Clone
REACT_APP_VERSION=1.0.0

# Development
GENERATE_SOURCEMAP=true
ESLINT_NO_DEV_ERRORS=true
TSC_COMPILE_ON_ERROR=true
```

## GitHub Secrets (for CI/CD)

When you're ready to deploy, add these secrets to your GitHub repository:

1. Go to your repository on GitHub
2. Click Settings → Secrets and variables → Actions
3. Add these secrets:

```bash
AWS_ACCESS_KEY_ID          # Your real AWS access key
AWS_SECRET_ACCESS_KEY      # Your real AWS secret key
AWS_ACCOUNT_ID             # Your AWS account ID (12 digits)
S3_FRONTEND_BUCKET         # S3 bucket name for frontend hosting
CLOUDFRONT_DISTRIBUTION_ID # CloudFront distribution ID
```

## Quick Setup Commands

1. **Copy environment files:**
```bash
# Copy backend environment
cp backend/.env.example backend/.env

# Copy frontend environment  
cp frontend/.env.example frontend/.env
```

2. **Install dependencies:**
```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

3. **Start development servers:**
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm start
```

## Notes

- The application works in demo mode without real AWS services
- Database is optional for development (app will show warnings but continue)
- Real AWS configuration is only needed for production deployment
- The frontend login form accepts any email/password in demo mode
