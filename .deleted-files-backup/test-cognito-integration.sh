#!/bin/bash

# Test Cognito Integration Script
echo "🧪 Testing AWS Cognito Integration"
echo "=================================="

# Check if backend is running
echo "📡 Checking if backend is running..."
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running. Please start it first:"
    echo "   cd backend && npm start"
    exit 1
fi

echo ""
echo "🔐 Testing Cognito Authentication..."

# Test 1: Registration
echo ""
echo "Test 1: User Registration"
echo "------------------------"
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "username": "testuser",
    "password": "TestPass123",
    "firstName": "Test",
    "lastName": "User"
  }')

echo "Registration Response:"
echo "$REGISTER_RESPONSE" | jq . 2>/dev/null || echo "$REGISTER_RESPONSE"

# Test 2: Login with Email
echo ""
echo "Test 2: Login with Email"
echo "------------------------"
LOGIN_EMAIL_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "testuser@example.com",
    "password": "TestPass123"
  }')

echo "Login (Email) Response:"
echo "$LOGIN_EMAIL_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_EMAIL_RESPONSE"

# Test 3: Login with Username
echo ""
echo "Test 3: Login with Username"
echo "---------------------------"
LOGIN_USERNAME_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "testuser",
    "password": "TestPass123"
  }')

echo "Login (Username) Response:"
echo "$LOGIN_USERNAME_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_USERNAME_RESPONSE"

echo ""
echo "🎯 Test Complete!"
echo ""

# Check if jq is available for better JSON formatting
if ! command -v jq &> /dev/null; then
    echo "💡 Tip: Install 'jq' for better JSON formatting:"
    echo "   brew install jq"
fi

echo ""
echo "📊 Cognito Configuration:"
echo "  User Pool ID: us-west-2_GyEF1dW0E"
echo "  Client ID: 75jjtldus9ru2pqjq8mt6jqgc3"
echo "  Region: us-west-2"
echo ""
echo "🔗 AWS Cognito Console:"
echo "  https://us-west-2.console.aws.amazon.com/cognito/v2/idp/user-pools/us-west-2_GyEF1dW0E"
