-- Fix non-compliant script keys in site_settings table
-- Run this in Supabase SQL Editor

-- Update "GTM Body" to "gtm_body"
UPDATE site_settings
SET key = 'gtm_body'
WHERE key = 'GTM Body';

-- Update any other non-compliant keys
-- Replace spaces with underscores and convert to lowercase
UPDATE site_settings
SET key = LOWER(REPLACE(key, ' ', '_'))
WHERE key NOT LIKE 'settings_%'  -- Don't touch system settings
  AND key ~ '[A-Z ]';              -- Only update keys with uppercase or spaces

-- Verify the changes
SELECT key, display_name, setting_type, is_active
FROM site_settings
WHERE key NOT LIKE 'settings_%'
ORDER BY key;
