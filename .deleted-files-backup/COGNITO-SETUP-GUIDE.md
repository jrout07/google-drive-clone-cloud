# 🔐 AWS Cognito Configuration Guide for Google Drive Clone

## Quick Answer to Your Cognito Setup Question

Based on your Google Drive Clone requirements, here are the **recommended sign-in identifier settings**:

### ✅ **Recommended Configuration:**

| Setting | Choice | Reason |
|---------|--------|--------|
| **Email** | ✅ **Enable** | Essential for file sharing notifications and password recovery |
| **Username** | ✅ **Enable** | Gives users flexibility - they can choose a memorable username |
| **Phone Number** | ❌ **Skip** | Adds complexity and SMS costs without significant benefit for file storage |

### 🎯 **Why This Configuration is Optimal:**

1. **Email**: Required for your file sharing features
2. **Username**: User-friendly alternative to email
3. **Phone**: Not critical for file storage apps, save costs

---

## 🚀 Complete Setup Instructions

### Option 1: AWS Console Setup (Recommended for Beginners)

1. **Go to AWS Cognito Console**
2. **Create User Pool**
3. **Configure Sign-in Options:**
   ```
   ✅ Email
   ✅ Username  
   ❌ Phone number
   ```
4. **Set Password Policy:**
   ```
   Minimum length: 8 characters
   Require uppercase: Yes
   Require lowercase: Yes
   Require numbers: Yes
   Require symbols: No
   ```
5. **Configure MFA:** Optional (for production)
6. **Email Configuration:** Use Cognito (for development)

### Option 2: AWS CLI Setup (Automated)

Run the setup script we created:

```bash
# Make script executable
chmod +x setup-cognito.sh

# Run the setup (requires AWS CLI configured)
./setup-cognito.sh
```

This script will:
- Create User Pool with optimal settings
- Create User Pool Client
- Update your .env files automatically
- Save configuration for reference

### Option 3: Use Current Placeholder Configuration

Your current setup works perfectly for development:

```bash
# Already in your backend/.env
COGNITO_USER_POOL_ID=us-west-2_EXAMPLE123
COGNITO_CLIENT_ID=123456789abcdef123456789ab
```

---

## 📁 Files Updated for Cognito Integration

### 1. **Enhanced Cognito Service** 
`backend/src/services/cognito.ts` - Full AWS SDK integration

### 2. **Updated Auth Controller**
`backend/src/controllers/auth.ts` - Supports email/username login

### 3. **Environment Configuration**
- `backend/.env` - Cognito credentials
- `frontend/.env` - React app Cognito config

### 4. **Setup Scripts**
- `setup-cognito.sh` - Automated AWS setup
- Updated AWS setup guide

---

## 🧪 Test Your Setup

### Test User Registration:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Test User Login (Email):
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "test@example.com",
    "password": "Password123"
  }'
```

### Test User Login (Username):
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "testuser", 
    "password": "Password123"
  }'
```

---

## 🎯 What Happens Next

After configuring Cognito:

1. **Users can register** with email + optional username
2. **Users can login** with either email OR username
3. **Email verification** ensures valid accounts
4. **Strong password policy** protects accounts
5. **JWT tokens** secure your API endpoints

---

## 🚨 Important Notes

### For Development (Current):
- ✅ Mock authentication works perfectly
- ✅ No AWS costs
- ✅ Fast development iteration

### For Production:
- Set up real Cognito User Pool
- Update environment variables
- Configure proper email sending (SES)
- Enable monitoring and logging

---

## 🔧 Quick Commands Reference

```bash
# Check current Cognito configuration
aws cognito-idp describe-user-pool --user-pool-id YOUR_POOL_ID

# List users in pool
aws cognito-idp list-users --user-pool-id YOUR_POOL_ID

# Test authentication flow
aws cognito-idp admin-initiate-auth \
  --user-pool-id YOUR_POOL_ID \
  --client-id YOUR_CLIENT_ID \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=test@example.com,PASSWORD=Password123
```

---

## 📊 Next Steps

1. **✅ Configure Cognito** with email + username sign-in
2. **🧪 Test** registration and login flows  
3. **🚀 Deploy** to production when ready
4. **📧 Set up SES** for production email sending
5. **🔐 Enable MFA** for enhanced security

Your Google Drive Clone now supports flexible user authentication! 🎉
