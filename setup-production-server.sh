#!/bin/bash

# 🔧 Production Environment Setup Script
# Run this script on your EC2 instance after connecting

set -e

# Colors for output
RED='\033[0;31m'
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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo -e "${BLUE}🔧 Google Drive Clone - Production Setup${NC}"
echo "=========================================="

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
print_status "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_status "Node.js installed: $NODE_VERSION"
print_status "npm installed: $NPM_VERSION"

# Install PM2 globally
print_status "Installing PM2 process manager..."
sudo npm install -g pm2

# Install Nginx
print_status "Installing Nginx..."
sudo apt install nginx -y

# Install Git
print_status "Installing Git..."
sudo apt install git -y

# Install PostgreSQL client
print_status "Installing PostgreSQL client..."
sudo apt install postgresql-client -y

# Install additional utilities
print_status "Installing additional utilities..."
sudo apt install htop curl wget unzip build-essential -y

# Create necessary directories
print_status "Creating application directories..."
mkdir -p /home/ubuntu/logs
mkdir -p /home/ubuntu/backups

# Configure Git (optional)
print_status "Configuring Git..."
git config --global user.name "Production Server"
git config --global user.email "production@gdrive.local"

# Install AWS CLI
print_status "Installing AWS CLI..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm -rf aws awscliv2.zip

# Set up UFW firewall (optional security enhancement)
print_status "Configuring UFW firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 3000
sudo ufw allow 3001
sudo ufw status

# Optimize system for Node.js
print_status "Optimizing system for Node.js..."

# Increase file descriptor limits
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# Configure kernel parameters
echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf
echo "net.core.somaxconn=1024" | sudo tee -a /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog=1024" | sudo tee -a /etc/sysctl.conf

# Apply sysctl changes
sudo sysctl -p

# Configure PM2 startup
print_status "Configuring PM2 startup..."
pm2 startup | tail -1 | sudo bash

# Create log rotation for application logs
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/gdrive << EOF
/home/ubuntu/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

# Configure Nginx for better performance
print_status "Optimizing Nginx configuration..."
sudo tee -a /etc/nginx/nginx.conf << EOF

# Performance optimizations
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
keepalive_requests 100;

# Enable gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

# Security headers (global)
add_header X-Frame-Options SAMEORIGIN always;
add_header X-Content-Type-Options nosniff always;
add_header X-XSS-Protection "1; mode=block" always;
EOF

# Create health check endpoint
print_status "Creating health check script..."
cat > /home/ubuntu/health-check.sh << 'EOF'
#!/bin/bash

# Health check script for monitoring
echo "🔍 System Health Check - $(date)"
echo "=================================="

# Check PM2 processes
echo "📊 PM2 Processes:"
pm2 list

# Check Nginx status
echo "🌐 Nginx Status:"
sudo systemctl is-active nginx

# Check disk usage
echo "💾 Disk Usage:"
df -h | grep -E "^/dev"

# Check memory usage
echo "🧠 Memory Usage:"
free -h

# Check system load
echo "⚡ System Load:"
uptime

# Check last few log entries
echo "📝 Recent Application Logs:"
pm2 logs --lines 5 --nostream

echo "=================================="
EOF

chmod +x /home/ubuntu/health-check.sh

# Create backup script
print_status "Creating backup script..."
cat > /home/ubuntu/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "📦 Creating backup - $DATE"

# Create backup directory for this session
mkdir -p "$BACKUP_DIR/$DATE"

# Backup application files
echo "📁 Backing up application files..."
tar -czf "$BACKUP_DIR/$DATE/gdrive-application.tar.gz" -C /home/ubuntu gdrive-clone

# Backup logs
echo "📄 Backing up logs..."
tar -czf "$BACKUP_DIR/$DATE/logs.tar.gz" -C /home/ubuntu logs

# Backup PM2 configuration
echo "⚙️ Backing up PM2 configuration..."
pm2 save
cp ~/.pm2/dump.pm2 "$BACKUP_DIR/$DATE/"

# Backup Nginx configuration
echo "🌐 Backing up Nginx configuration..."
sudo cp -r /etc/nginx/sites-available "$BACKUP_DIR/$DATE/"

# Remove backups older than 7 days
echo "🗑️ Cleaning old backups..."
find "$BACKUP_DIR" -type d -mtime +7 -exec rm -rf {} +

echo "✅ Backup completed: $BACKUP_DIR/$DATE"
EOF

chmod +x /home/ubuntu/backup.sh

# Create deployment script for updates
print_status "Creating deployment update script..."
cat > /home/ubuntu/deploy-update.sh << 'EOF'
#!/bin/bash

set -e

echo "🚀 Deploying application update..."

# Navigate to application directory
cd /home/ubuntu/gdrive-clone

# Create backup before update
echo "📦 Creating backup..."
/home/ubuntu/backup.sh

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Update backend
echo "🔧 Updating backend..."
cd backend
npm install --production
npm run build

# Update frontend
echo "🎨 Updating frontend..."
cd ../frontend
npm install --production
npm run build

# Restart application
echo "🔄 Restarting application..."
cd ..
pm2 restart all

# Reload Nginx
echo "🌐 Reloading Nginx..."
sudo systemctl reload nginx

# Health check
echo "🔍 Running health check..."
sleep 5
curl -f http://localhost:3001/api/health || {
    echo "❌ Health check failed!"
    exit 1
}

echo "✅ Deployment update completed successfully!"
EOF

chmod +x /home/ubuntu/deploy-update.sh

# Create monitoring script
print_status "Creating monitoring script..."
cat > /home/ubuntu/monitor.sh << 'EOF'
#!/bin/bash

# Simple monitoring script
while true; do
    # Check if backend is responding
    if ! curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "$(date): Backend health check failed, restarting..." >> /home/ubuntu/logs/monitor.log
        pm2 restart gdrive-backend
    fi
    
    # Check Nginx status
    if ! sudo systemctl is-active nginx > /dev/null 2>&1; then
        echo "$(date): Nginx is down, restarting..." >> /home/ubuntu/logs/monitor.log
        sudo systemctl restart nginx
    fi
    
    # Sleep for 30 seconds
    sleep 30
done
EOF

chmod +x /home/ubuntu/monitor.sh

# Set up cron jobs
print_status "Setting up cron jobs..."
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/backup.sh") | crontab -
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/ubuntu/health-check.sh >> /home/ubuntu/logs/health-check.log 2>&1") | crontab -

print_status "Displaying current crontab:"
crontab -l

# Display system information
print_status "System Information:"
echo "  OS: $(lsb_release -d | cut -f2)"
echo "  Kernel: $(uname -r)"
echo "  CPU: $(nproc) cores"
echo "  Memory: $(free -h | awk '/^Mem:/ {print $2}')"
echo "  Disk: $(df -h / | awk 'NR==2 {print $2 " (" $4 " available)"}')"

# Display installed versions
print_status "Installed Software Versions:"
echo "  Node.js: $(node --version)"
echo "  npm: $(npm --version)"
echo "  PM2: $(pm2 --version)"
echo "  Nginx: $(nginx -v 2>&1 | cut -d'/' -f2)"
echo "  Git: $(git --version | cut -d' ' -f3)"
echo "  AWS CLI: $(aws --version | cut -d'/' -f2 | cut -d' ' -f1)"

echo
print_status "🎉 Production environment setup completed!"
echo
echo "📋 Next steps:"
echo "   1. Clone your application repository"
echo "   2. Configure environment variables"
echo "   3. Set up AWS services (RDS, S3)"
echo "   4. Deploy your application"
echo "   5. Configure domain and SSL"
echo
echo "📁 Available scripts:"
echo "   • /home/ubuntu/health-check.sh - System health check"
echo "   • /home/ubuntu/backup.sh - Create application backup"
echo "   • /home/ubuntu/deploy-update.sh - Deploy updates"
echo "   • /home/ubuntu/monitor.sh - Continuous monitoring"
echo
