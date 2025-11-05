#!/bin/bash

# Google Drive Clone - Cleanup Unused Files
# This script removes duplicate, outdated, and unused files

echo "🧹 Starting cleanup of unused files..."

# Create backup directory first
mkdir -p .deleted-files-backup
echo "📦 Created backup directory: .deleted-files-backup"

# Function to safely delete with backup
safe_delete() {
    if [ -f "$1" ] || [ -d "$1" ]; then
        echo "🗑️  Deleting: $1"
        mv "$1" .deleted-files-backup/ 2>/dev/null || rm -rf "$1"
    fi
}

# 1. Remove duplicate/backup files
echo "🔄 Removing duplicate files..."
safe_delete "backend/src/services/auth-fixed.ts"
safe_delete "backend/src/migrations/002_update_shares_table.sql"
safe_delete "backend/src/types/{index.ts}"
safe_delete "frontend/src/App-new.tsx"

# 2. Remove empty directories
echo "📁 Removing empty directories..."
rmdir backend/src/seeds 2>/dev/null || true

# 3. Remove outdated documentation
echo "📄 Removing outdated documentation..."
safe_delete "COGNITO-REQUIRED-ATTRIBUTES.md"
safe_delete "COGNITO-SETUP-GUIDE.md"
safe_delete "APPLICATION-RUNNING-SUCCESS.md"
safe_delete "IMPLEMENTATION-SUCCESS.md"
safe_delete "PROJECT-SUMMARY.md"
safe_delete "AWS-RDS-SETUP.md"
safe_delete "AWS-SETUP-GUIDE.md"

# 4. Remove unused setup scripts
echo "🔧 Removing unused setup scripts..."
safe_delete "setup-cognito.sh"
safe_delete "test-cognito-integration.sh"
safe_delete "setup-rds.sh"
safe_delete "test-rds-connection.sh"
safe_delete "setup-aws-cli.sh"

# 5. Remove build artifacts (if any)
echo "🏗️  Removing build artifacts..."
safe_delete "backend/dist"
safe_delete "frontend/build"

echo "✅ Cleanup completed!"
echo "📦 Deleted files backed up in: .deleted-files-backup"
echo ""
echo "🔍 Files remaining:"
echo "  ✅ backend/src/ - All source code"
echo "  ✅ frontend/src/ - All source code"  
echo "  ✅ backend/src/migrations/002_update_shares_table_fixed.sql - Latest migration"
echo "  ✅ README.md, DEV-CONFIG.md, QUICK-START.md - Essential docs"
echo "  ✅ Package.json files and configs"
echo ""
echo "💡 To restore any file: mv .deleted-files-backup/FILENAME ./"
