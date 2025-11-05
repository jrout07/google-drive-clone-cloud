-- Migration to update shares table for new sharing functionality
-- Add new columns for resource-based sharing

-- First, let's add the new columns
ALTER TABLE shares ADD COLUMN IF NOT EXISTS resource_id UUID;
ALTER TABLE shares ADD COLUMN IF NOT EXISTS resource_type VARCHAR(20);
ALTER TABLE shares ADD COLUMN IF NOT EXISTS shared_by UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE shares ADD COLUMN IF NOT EXISTS share_token VARCHAR(255) UNIQUE;
ALTER TABLE shares ADD COLUMN IF NOT EXISTS permissions VARCHAR(20) DEFAULT 'read';
ALTER TABLE shares ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Create index for the new columns
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
WHERE file_id IS NOT NULL;

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
WHERE folder_id IS NOT NULL;

-- Make the new columns NOT NULL after data migration
ALTER TABLE shares ALTER COLUMN resource_id SET NOT NULL;
ALTER TABLE shares ALTER COLUMN resource_type SET NOT NULL;
ALTER TABLE shares ALTER COLUMN shared_by SET NOT NULL;
ALTER TABLE shares ALTER COLUMN share_token SET NOT NULL;

-- Add check constraint for resource_type
ALTER TABLE shares ADD CONSTRAINT chk_resource_type 
CHECK (resource_type IN ('file', 'folder'));

-- Add foreign key constraints for resource_id based on resource_type
-- Note: PostgreSQL doesn't support conditional foreign keys directly
-- We'll handle this in application logic for now

-- Optional: Clean up old columns (uncomment if you want to remove them)
-- ALTER TABLE shares DROP COLUMN IF EXISTS file_id;
-- ALTER TABLE shares DROP COLUMN IF EXISTS folder_id;
-- ALTER TABLE shares DROP COLUMN IF EXISTS owner_id;
-- ALTER TABLE shares DROP COLUMN IF EXISTS shared_with_id;
-- ALTER TABLE shares DROP COLUMN IF EXISTS shared_with_email;
-- ALTER TABLE shares DROP COLUMN IF EXISTS permission;
-- ALTER TABLE shares DROP COLUMN IF EXISTS is_public;
-- ALTER TABLE shares DROP COLUMN IF EXISTS public_token;
