#!/bin/bash

# AWS CLI Installation and Configuration Script
echo "🚀 AWS CLI Setup for Google Drive Clone"
echo "======================================"

# Check if AWS CLI is installed
if command -v aws &> /dev/null; then
    echo "✅ AWS CLI is already installed: $(aws --version)"
else
    echo "❌ AWS CLI not found. Installing..."
    
    # Try to install with Homebrew first
    if command -v brew &> /dev/null; then
        echo "📦 Installing AWS CLI with Homebrew..."
        brew install awscli
    else
        echo "📦 Homebrew not found. Installing AWS CLI with pip..."
        pip3 install awscli --user
        
        # Add to PATH if needed
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
        export PATH="$HOME/.local/bin:$PATH"
    fi
fi

# Verify installation
echo ""
echo "🔍 Verifying AWS CLI installation..."
if command -v aws &> /dev/null; then
    echo "✅ AWS CLI installed: $(aws --version)"
else
    echo "❌ AWS CLI installation failed. Please install manually."
    echo "Download from: https://aws.amazon.com/cli/"
    exit 1
fi

echo ""
echo "🔧 AWS Configuration Options:"
echo "1. Configure with real AWS credentials"
echo "2. Configure with development/testing placeholder values"
echo "3. Skip configuration (use existing or configure later)"

read -p "Choose option (1-3): " choice

case $choice in
    1)
        echo "🔐 Configuring with real AWS credentials..."
        echo "You'll need:"
        echo "- AWS Access Key ID (from AWS Console → IAM → Users → Security credentials)"
        echo "- AWS Secret Access Key (shown only once when creating)"
        echo ""
        aws configure
        ;;
    2)
        echo "🧪 Configuring with development placeholder values..."
        aws configure set aws_access_key_id AKIAIOSFODNN7EXAMPLE
        aws configure set aws_secret_access_key wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
        aws configure set default.region us-west-2
        aws configure set default.output json
        echo "✅ Development configuration applied"
        ;;
    3)
        echo "⏭️  Skipping AWS configuration"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "📋 Current AWS Configuration:"
aws configure list

echo ""
echo "✅ AWS CLI setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Start your application: ./start-app.sh"
echo "2. For real AWS resources, update your .env files with actual values"
echo "3. For production deployment, run: ./configure-aws.sh"
