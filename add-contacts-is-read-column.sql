-- Add is_read column to contacts table if it doesn't exist
-- This column tracks whether a contact inquiry has been read by an admin

-- Add the column if it doesn't exist (PostgreSQL 9.6+)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'contacts'
        AND column_name = 'is_read'
    ) THEN
        ALTER TABLE contacts
        ADD COLUMN is_read BOOLEAN DEFAULT false NOT NULL;

        -- Add a comment to document the column
        COMMENT ON COLUMN contacts.is_read IS 'Indicates whether the contact inquiry has been read by an admin';

        RAISE NOTICE 'Column is_read added to contacts table';
    ELSE
        RAISE NOTICE 'Column is_read already exists in contacts table';
    END IF;
END $$;

-- Create an index on is_read for better query performance
CREATE INDEX IF NOT EXISTS idx_contacts_is_read ON contacts(is_read);
