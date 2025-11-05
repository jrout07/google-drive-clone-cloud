#!/bin/bash

# 🚀 Quick EC2 Deployment Script for Google Drive Clone
# This script provides a streamlined deployment process

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo -e "${BLUE}🚀 Google Drive Clone - Quick EC2 Deployment${NC}"
echo "=============================================="

# Make scripts executable
chmod +x deploy-to-ec2.sh
chmod +x setup-production-server.sh

print_status "Available deployment options:"
echo
echo "1. 🖥️  Automated EC2 Instance Creation"
echo "   Run: ./deploy-to-ec2.sh"
echo "   - Creates EC2 instance with security groups"
echo "   - Generates all configuration files"
echo "   - Provides step-by-step instructions"
echo
echo "2. 🔧 Production Server Setup (run on EC2)"
echo "   Run: ./setup-production-server.sh"
echo "   - Installs all required software"
echo "   - Configures system optimizations"
echo "   - Sets up monitoring and backup scripts"
echo
echo "3. 📖 Manual Deployment Guide"
echo "   Read: EC2-DEPLOYMENT-GUIDE.md"
echo "   - Complete step-by-step guide"
echo "   - Security configuration"
echo "   - SSL setup with Let's Encrypt"
echo

# Check if AWS CLI is available
if command -v aws &> /dev/null; then
    print_status "AWS CLI detected ✓"
    
    # Check if configured
    if aws sts get-caller-identity &> /dev/null 2>&1; then
        print_status "AWS CLI is configured ✓"
        echo
        echo "🚀 Ready to deploy! Choose an option:"
        echo
        read -p "Start automated EC2 deployment? (y/N): " choice
        if [[ $choice =~ ^[Yy]$ ]]; then
            ./deploy-to-ec2.sh
        else
            print_warning "Skipping automated deployment."
        fi
    else
        print_warning "AWS CLI is not configured. Please run 'aws configure' first."
    fi
else
    print_warning "AWS CLI not found. Please install it first."
fi

echo
print_status "📚 Documentation available:"
echo "   • EC2-DEPLOYMENT-GUIDE.md - Complete deployment guide"
echo "   • PROJECT-REPORT.md - Full project documentation"
echo "   • README.md - Project overview"
echo

print_status "🔗 Useful AWS Resources:"
echo "   • EC2 Console: https://console.aws.amazon.com/ec2/"
echo "   • RDS Console: https://console.aws.amazon.com/rds/"
echo "   • S3 Console: https://console.aws.amazon.com/s3/"
echo "   • CloudWatch: https://console.aws.amazon.com/cloudwatch/"

echo
print_status "📋 Pre-deployment Checklist:"
echo "   □ AWS account created and configured"
echo "   □ EC2 key pair created"
echo "   □ Domain name ready (optional)"
echo "   □ GitHub repository accessible"
echo "   □ Environment variables prepared"

echo
print_status "💰 Estimated AWS Costs (per month):"
echo "   • EC2 t3.medium: ~$30"
echo "   • RDS db.t3.micro: ~$15"
echo "   • S3 storage: ~$1-5 (depending on usage)"
echo "   • Data transfer: ~$1-10"
echo "   • Total: ~$50-60/month"

echo
print_status "🎯 After deployment, you'll have:"
echo "   ✅ Fully functional Google Drive clone"
echo "   ✅ Production-ready infrastructure"
echo "   ✅ Automated monitoring and backups"
echo "   ✅ SSL-enabled secure access"
echo "   ✅ Scalable cloud architecture"

echo
echo "🚀 Happy deploying!"
