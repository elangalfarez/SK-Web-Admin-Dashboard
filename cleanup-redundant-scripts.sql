-- ============================================================================
-- CLEANUP REDUNDANT SCRIPTS
-- ============================================================================
-- Purpose: Remove scripts that duplicate functionality in SEO/Analytics settings
-- Date: January 14, 2026
-- IMPORTANT: Review the backup queries first before executing deletions!
-- ============================================================================

-- ============================================================================
-- STEP 1: BACKUP - See what will be deleted
-- ============================================================================

-- View all custom scripts (NOT system settings)
SELECT
  id,
  key,
  display_name,
  setting_type,
  injection_point,
  is_active,
  created_at,
  LEFT(value, 200) as value_preview
FROM site_settings
WHERE key NOT LIKE 'settings_%'
ORDER BY display_name;

-- ============================================================================
-- STEP 2: IDENTIFY REDUNDANT SCRIPTS
-- ============================================================================

-- These scripts are redundant because they duplicate SEO Settings functionality:
-- ❌ Site Title / Meta Title → Use SEO Settings: meta_title
-- ❌ Site Description / Meta Description → Use SEO Settings: meta_description
-- ❌ Open Graph Image / OG Image → Use SEO Settings: og_image_url
-- ❌ Open Graph Title → Use SEO Settings: og_title
-- ❌ Open Graph Description → Use SEO Settings: og_description

-- These scripts are redundant because they duplicate Analytics Settings functionality:
-- ❌ Google Tag Manager / GTM → Use Analytics Settings: google_tag_manager_id
-- ❌ Google Analytics / GA-4 → Use Analytics Settings: google_analytics_id
-- ❌ Meta Pixel / Facebook Pixel → Use Analytics Settings: meta_pixel_id
-- ❌ GTM Body (if it just installs GTM) → Use Analytics Settings

-- ============================================================================
-- STEP 3: REVIEW SCRIPTS THAT WILL BE DELETED
-- ============================================================================

-- Check scripts that match common redundant patterns
SELECT
  id,
  key,
  display_name,
  setting_type,
  injection_point,
  is_active,
  LEFT(value, 150) as value_preview
FROM site_settings
WHERE key NOT LIKE 'settings_%'
  AND (
    -- SEO-related duplicates
    key ILIKE '%title%' OR
    key ILIKE '%description%' OR
    key ILIKE '%og_%' OR
    key ILIKE '%open_graph%' OR
    display_name ILIKE '%title%' OR
    display_name ILIKE '%description%' OR
    display_name ILIKE '%open graph%' OR

    -- Analytics-related duplicates
    key ILIKE '%gtm%' OR
    key ILIKE '%tag_manager%' OR
    key ILIKE '%google_analytics%' OR
    key ILIKE '%ga4%' OR
    key ILIKE '%ga_4%' OR
    key ILIKE '%meta_pixel%' OR
    key ILIKE '%facebook_pixel%' OR
    key ILIKE '%fb_pixel%' OR
    display_name ILIKE '%google tag manager%' OR
    display_name ILIKE '%gtm%' OR
    display_name ILIKE '%google analytics%' OR
    display_name ILIKE '%ga-4%' OR
    display_name ILIKE '%meta pixel%' OR
    display_name ILIKE '%facebook pixel%'
  )
ORDER BY display_name;

-- ============================================================================
-- STEP 4: BACKUP TO JSON (OPTIONAL - Run this first!)
-- ============================================================================

-- Export redundant scripts to JSON for backup
-- Copy this output and save it somewhere safe before deleting!
SELECT json_agg(row_to_json(t))
FROM (
  SELECT *
  FROM site_settings
  WHERE key NOT LIKE 'settings_%'
    AND (
      key ILIKE '%title%' OR
      key ILIKE '%description%' OR
      key ILIKE '%og_%' OR
      key ILIKE '%gtm%' OR
      key ILIKE '%tag_manager%' OR
      key ILIKE '%google_analytics%' OR
      key ILIKE '%ga4%' OR
      key ILIKE '%meta_pixel%' OR
      key ILIKE '%facebook_pixel%' OR
      display_name ILIKE '%title%' OR
      display_name ILIKE '%description%' OR
      display_name ILIKE '%open graph%' OR
      display_name ILIKE '%google tag manager%' OR
      display_name ILIKE '%gtm%' OR
      display_name ILIKE '%google analytics%' OR
      display_name ILIKE '%meta pixel%' OR
      display_name ILIKE '%facebook pixel%'
    )
) t;

-- ============================================================================
-- STEP 5: DELETE REDUNDANT SCRIPTS (CAREFUL!)
-- ============================================================================

-- IMPORTANT: Review the output from STEP 3 before running these DELETEs!
-- Make sure you're not deleting custom scripts you want to keep!

-- Delete SEO-related duplicates (that should be in SEO Settings)
DELETE FROM site_settings
WHERE key NOT LIKE 'settings_%'
  AND (
    -- Common SEO script keys
    key IN (
      'site_title',
      'meta_title',
      'site_description',
      'meta_description',
      'og_image',
      'open_graph_image',
      'og_title',
      'og_description'
    )
    OR
    -- Match by display name patterns
    (display_name ILIKE '%site title%' AND setting_type = 'meta_tag')
    OR
    (display_name ILIKE '%meta title%' AND setting_type = 'meta_tag')
    OR
    (display_name ILIKE '%site description%' AND setting_type = 'meta_tag')
    OR
    (display_name ILIKE '%meta description%' AND setting_type = 'meta_tag')
    OR
    (display_name ILIKE '%open graph image%' AND setting_type = 'meta_tag')
  );

-- Delete Analytics-related duplicates (that should be in Analytics Settings)
DELETE FROM site_settings
WHERE key NOT LIKE 'settings_%'
  AND (
    -- Common analytics script keys
    key IN (
      'gtm',
      'gtm_body',
      'gtm_head',
      'google_tag_manager',
      'google_analytics',
      'ga4',
      'ga_4',
      'meta_pixel',
      'facebook_pixel',
      'fb_pixel'
    )
    OR
    -- Match by display name patterns
    (display_name ILIKE '%google tag manager%' AND setting_type IN ('script', 'custom_html'))
    OR
    (display_name ILIKE '%gtm body%' AND setting_type IN ('script', 'custom_html'))
    OR
    (display_name ILIKE '%gtm head%' AND setting_type IN ('script', 'custom_html'))
    OR
    (display_name ILIKE '%google analytics 4%' AND setting_type IN ('script', 'custom_html'))
    OR
    (display_name ILIKE '%ga-4%' AND setting_type IN ('script', 'custom_html'))
    OR
    (display_name ILIKE '%meta pixel%' AND setting_type IN ('script', 'custom_html'))
    OR
    (display_name ILIKE '%facebook pixel%' AND setting_type IN ('script', 'custom_html'))
  );

-- ============================================================================
-- STEP 6: VERIFY CLEANUP
-- ============================================================================

-- Check remaining custom scripts (should only be truly custom ones)
SELECT
  id,
  key,
  display_name,
  setting_type,
  injection_point,
  is_active,
  created_at
FROM site_settings
WHERE key NOT LIKE 'settings_%'
ORDER BY display_name;

-- Verify SEO Settings still exist
SELECT 'SEO Settings' as setting_group, key, display_name
FROM site_settings
WHERE key = 'settings_seo';

-- Verify Analytics Settings still exist
SELECT 'Analytics Settings' as setting_group, key, display_name
FROM site_settings
WHERE key = 'settings_analytics';

-- ============================================================================
-- STEP 7: WHAT TO KEEP
-- ============================================================================

-- Scripts that SHOULD remain (these are NOT redundant):
-- ✅ Schema.org JSON-LD structured data
-- ✅ Custom widgets or third-party integrations
-- ✅ Special tracking scripts not covered by Analytics Settings
-- ✅ Custom CSS/JS modifications
-- ✅ Hreflang tags (if multi-language)
-- ✅ Custom canonical overrides (if needed)

-- Examples of scripts to KEEP:
SELECT
  key,
  display_name,
  setting_type
FROM site_settings
WHERE key NOT LIKE 'settings_%'
  AND (
    key ILIKE '%schema%' OR
    key ILIKE '%json_ld%' OR
    key ILIKE '%structured_data%' OR
    display_name ILIKE '%schema%' OR
    display_name ILIKE '%json-ld%' OR
    display_name ILIKE '%structured data%' OR
    setting_type = 'json_ld'
  )
ORDER BY display_name;

-- ============================================================================
-- EXECUTION CHECKLIST
-- ============================================================================

-- [ ] 1. Run STEP 1 - See all current scripts
-- [ ] 2. Run STEP 3 - Review what will be deleted
-- [ ] 3. Run STEP 4 - Backup to JSON (IMPORTANT!)
-- [ ] 4. Confirm GA-4, GTM, Meta Pixel are in Analytics Settings
-- [ ] 5. Confirm Meta Title, Description, OG tags are in SEO Settings
-- [ ] 6. Run STEP 5 - DELETE redundant scripts (one DELETE at a time!)
-- [ ] 7. Run STEP 6 - Verify cleanup was successful
-- [ ] 8. Test admin dashboard - check /settings/scripts page
-- [ ] 9. Test public website - verify tracking still works
-- [ ] 10. Test public website - verify SEO meta tags still work

-- ============================================================================
-- ROLLBACK PLAN
-- ============================================================================

-- If something goes wrong, you can restore from the JSON backup (STEP 4)
-- Or use Supabase's Time Travel feature to revert to a previous state

-- ============================================================================
