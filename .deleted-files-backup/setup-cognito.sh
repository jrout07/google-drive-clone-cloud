#!/bin/bash

# AWS Cognito Setup Script for Google Drive Clone
echo "🔐 Setting up AWS Cognito User Pool for Google Drive Clone"
echo "=========================================================="

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &>/dev/null; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI configured"

# Configuration variables
REGION="us-west-2"
USER_POOL_NAME="gdrive-clone-users"
CLIENT_NAME="gdrive-clone-client"

echo ""
echo "📝 Creating Cognito User Pool..."

# Create User Pool with recommended settings
USER_POOL_RESPONSE=$(aws cognito-idp create-user-pool \
    --pool-name "$USER_POOL_NAME" \
    --region "$REGION" \
    --policies '{
        "PasswordPolicy": {
            "MinimumLength": 8,
            "RequireUppercase": true,
            "RequireLowercase": true,
            "RequireNumbers": true,
            "RequireSymbols": false,
            "TemporaryPasswordValidityDays": 7
        }
    }' \
    --username-attributes email \
    --alias-attributes email \
    --auto-verified-attributes email \
    --verification-message-template '{
        "DefaultEmailOption": "CONFIRM_WITH_CODE",
        "DefaultEmailSubject": "Verify your Google Drive Clone account",
        "DefaultEmailMessage": "Welcome to Google Drive Clone! Your verification code is {####}. Please enter this code to complete your registration."
    }' \
    --admin-create-user-config '{
        "AllowAdminCreateUserOnly": false,
        "UnusedAccountValidityDays": 7,
        "InviteMessageAction": "SUPPRESS"
    }' \
    --user-pool-tags '{
        "Environment": "development",
        "Project": "gdrive-clone",
        "ManagedBy": "terraform"
    }' \
    --output json)

if [ $? -eq 0 ]; then
    USER_POOL_ID=$(echo "$USER_POOL_RESPONSE" | jq -r '.UserPool.Id')
    echo "✅ User Pool created successfully!"
    echo "   User Pool ID: $USER_POOL_ID"
else
    echo "❌ Failed to create User Pool"
    exit 1
fi

echo ""
echo "📱 Creating User Pool Client..."

# Create User Pool Client
CLIENT_RESPONSE=$(aws cognito-idp create-user-pool-client \
    --user-pool-id "$USER_POOL_ID" \
    --client-name "$CLIENT_NAME" \
    --region "$REGION" \
    --explicit-auth-flows ADMIN_NO_SRP_AUTH ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_PASSWORD_AUTH \
    --supported-identity-providers COGNITO \
    --read-attributes email given_name family_name picture \
    --write-attributes email given_name family_name picture \
    --prevent-user-existence-errors ENABLED \
    --token-validity-units '{
        "AccessToken": "hours",
        "IdToken": "hours", 
        "RefreshToken": "days"
    }' \
    --access-token-validity 24 \
    --id-token-validity 24 \
    --refresh-token-validity 30 \
    --output json)

if [ $? -eq 0 ]; then
    CLIENT_ID=$(echo "$CLIENT_RESPONSE" | jq -r '.UserPoolClient.ClientId')
    echo "✅ User Pool Client created successfully!"
    echo "   Client ID: $CLIENT_ID"
else
    echo "❌ Failed to create User Pool Client"
    exit 1
fi

echo ""
echo "🔧 Configuration Summary"
echo "========================"
echo "Region: $REGION"
echo "User Pool ID: $USER_POOL_ID"
echo "Client ID: $CLIENT_ID"
echo ""

echo "📝 Updating environment files..."

# Update backend .env file
BACKEND_ENV_FILE="./backend/.env"
if [ -f "$BACKEND_ENV_FILE" ]; then
    # Create backup
    cp "$BACKEND_ENV_FILE" "$BACKEND_ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Update Cognito configuration
    sed -i.tmp "s/COGNITO_USER_POOL_ID=.*/COGNITO_USER_POOL_ID=$USER_POOL_ID/" "$BACKEND_ENV_FILE"
    sed -i.tmp "s/COGNITO_CLIENT_ID=.*/COGNITO_CLIENT_ID=$CLIENT_ID/" "$BACKEND_ENV_FILE"
    sed -i.tmp "s/COGNITO_REGION=.*/COGNITO_REGION=$REGION/" "$BACKEND_ENV_FILE"
    rm "$BACKEND_ENV_FILE.tmp"
    
    echo "✅ Updated backend/.env with Cognito configuration"
else
    echo "⚠️  Backend .env file not found at $BACKEND_ENV_FILE"
fi

# Update frontend .env file
FRONTEND_ENV_FILE="./frontend/.env"
if [ -f "$FRONTEND_ENV_FILE" ]; then
    # Create backup
    cp "$FRONTEND_ENV_FILE" "$FRONTEND_ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Update Cognito configuration
    sed -i.tmp "s/REACT_APP_COGNITO_USER_POOL_ID=.*/REACT_APP_COGNITO_USER_POOL_ID=$USER_POOL_ID/" "$FRONTEND_ENV_FILE"
    sed -i.tmp "s/REACT_APP_COGNITO_CLIENT_ID=.*/REACT_APP_COGNITO_CLIENT_ID=$CLIENT_ID/" "$FRONTEND_ENV_FILE"
    sed -i.tmp "s/REACT_APP_COGNITO_REGION=.*/REACT_APP_COGNITO_REGION=$REGION/" "$FRONTEND_ENV_FILE"
    rm "$FRONTEND_ENV_FILE.tmp"
    
    echo "✅ Updated frontend/.env with Cognito configuration"
else
    echo "⚠️  Frontend .env file not found at $FRONTEND_ENV_FILE"
fi

echo ""
echo "🎉 Cognito Setup Complete!"
echo "=========================="
echo ""
echo "✅ What was created:"
echo "   - Cognito User Pool with email/username sign-in"
echo "   - User Pool Client with proper authentication flows"
echo "   - Password policy (8+ chars, upper, lower, numbers)"
echo "   - Email verification enabled"
echo ""
echo "🔐 Sign-in Options Configured:"
echo "   ✅ Email address (primary)"
echo "   ✅ Username (alternative)"
echo "   ❌ Phone number (skipped for simplicity)"
echo ""
echo "📝 Environment Variables Updated:"
echo "   Backend:  COGNITO_USER_POOL_ID=$USER_POOL_ID"
echo "   Backend:  COGNITO_CLIENT_ID=$CLIENT_ID"
echo "   Frontend: REACT_APP_COGNITO_USER_POOL_ID=$USER_POOL_ID"
echo "   Frontend: REACT_APP_COGNITO_CLIENT_ID=$CLIENT_ID"
echo ""
echo "🚀 Next Steps:"
echo "   1. Restart your backend server: npm run dev"
echo "   2. Restart your frontend app: npm start"
echo "   3. Test user registration and login"
echo ""
echo "🧪 Test Commands:"
echo "   # Create a test user (optional)"
echo "   aws cognito-idp admin-create-user --user-pool-id $USER_POOL_ID --username testuser --user-attributes Name=email,Value=test@example.com --region $REGION"
echo ""
echo "📊 Monitor Usage:"
echo "   aws cognito-idp describe-user-pool --user-pool-id $USER_POOL_ID --region $REGION"
echo ""

# Save configuration to file for reference
cat > cognito-config.json << EOF
{
  "userPoolId": "$USER_POOL_ID",
  "clientId": "$CLIENT_ID",
  "region": "$REGION",
  "createdAt": "$(date -Iseconds)",
  "signInMethods": ["email", "username"],
  "passwordPolicy": {
    "minimumLength": 8,
    "requireUppercase": true,
    "requireLowercase": true,
    "requireNumbers": true,
    "requireSymbols": false
  }
}
EOF

echo "💾 Configuration saved to: cognito-config.json"
echo ""
echo "🔒 Security Notes:"
echo "   - User pool allows both email and username sign-in"
echo "   - Email verification is required for new users"
echo "   - Password policy enforces strong passwords"
echo "   - Refresh tokens valid for 30 days"
echo "   - Access/ID tokens valid for 24 hours"
echo ""
