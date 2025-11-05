-- Migration to update shares table for new sharing functionality
-- Add new columns for resource-based sharing

-- Enable pgcrypto extension for gen_random_bytes function
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- First, let's add the new columns (already done, but keeping for completeness)
ALTER TABLE shares ADD COLUMN IF NOT EXISTS resource_id UUID;
ALTER TABLE shares ADD COLUMN IF NOT EXISTS resource_type VARCHAR(20);
ALTER TABLE shares ADD COLUMN IF NOT EXISTS shared_by UUID;
ALTER TABLE shares ADD COLUMN IF NOT EXISTS share_token VARCHAR(255);
ALTER TABLE shares ADD COLUMN IF NOT EXISTS permissions VARCHAR(20) DEFAULT 'read';
ALTER TABLE shares ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Create index for the new columns (already done, but keeping for completeness)
CREATE INDEX IF NOT EXISTS idx_shares_resource_id ON shares(resource_id);
CREATE INDEX IF NOT EXISTS idx_shares_resource_type ON shares(resource_type);
CREATE INDEX IF NOT EXISTS idx_shares_shared_by ON shares(shared_by);
CREATE INDEX IF NOT EXISTS idx_shares_share_token ON shares(share_token);

-- Update existing data to use new structure (if any exists)
-- For files: set resource_id = file_id, resource_type = 'file'
UPDATE shares SET 
    resource_id = file_id,
    resource_type = 'file',
    shared_by = owner_id,
    share_token = COALESCE(public_token, encode(gen_random_bytes(32), 'hex')),
    permissions = CASE 
        WHEN permission = 'read' THEN 'read'
        WHEN permission = 'write' THEN 'write'
        WHEN permission = 'admin' THEN 'write'
        ELSE 'read'
    END
WHERE file_id IS NOT NULL AND (resource_id IS NULL OR resource_type IS NULL);

-- For folders: set resource_id = folder_id, resource_type = 'folder'
UPDATE shares SET 
    resource_id = folder_id,
    resource_type = 'folder',
    shared_by = owner_id,
    share_token = COALESCE(public_token, encode(gen_random_bytes(32), 'hex')),
    permissions = CASE 
        WHEN permission = 'read' THEN 'read'
        WHEN permission = 'write' THEN 'write'
        WHEN permission = 'admin' THEN 'write'
        ELSE 'read'
    END
WHERE folder_id IS NOT NULL AND (resource_id IS NULL OR resource_type IS NULL);

-- Add foreign key constraint for shared_by (if not already added)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_shares_shared_by' 
        AND table_name = 'shares'
    ) THEN
        ALTER TABLE shares ADD CONSTRAINT fk_shares_shared_by 
        FOREIGN KEY (shared_by) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Make share_token unique (if not already)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'shares_share_token_key' 
        AND table_name = 'shares'
    ) THEN
        ALTER TABLE shares ADD CONSTRAINT shares_share_token_key UNIQUE (share_token);
    END IF;
END $$;

-- Add check constraint for resource_type (if not already added)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_resource_type' 
        AND table_name = 'shares'
    ) THEN
        ALTER TABLE shares ADD CONSTRAINT chk_resource_type 
        CHECK (resource_type IN ('file', 'folder'));
    END IF;
END $$;
