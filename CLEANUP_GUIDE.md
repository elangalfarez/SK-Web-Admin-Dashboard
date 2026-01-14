# Site Settings Cleanup Guide

**Goal:** Remove redundant scripts and keep admin dashboard clean and functional

---

## 🎯 What We're Doing

**Before Cleanup:**
```
Scripts Section:
├── Site Title ❌ (redundant - use SEO Settings)
├── Meta Title ❌ (redundant - use SEO Settings)
├── Site Description ❌ (redundant - use SEO Settings)
├── Open Graph Image ❌ (redundant - use SEO Settings)
├── GTM Body ❌ (redundant - use Analytics Settings)
├── GA 4 ❌ (redundant - use Analytics Settings)
├── Meta Pixel ❌ (redundant - use Analytics Settings)
└── Schema.org JSON-LD ✅ (keep - custom structured data)

SEO Settings:
✅ Meta Title, Description, OG Tags, etc.

Analytics Settings:
✅ GA-4 ID, GTM ID, Meta Pixel ID, etc.
```

**After Cleanup:**
```
Scripts Section:
└── Schema.org JSON-LD ✅ (custom structured data only)

SEO Settings:
✅ Meta Title, Description, OG Tags, etc.

Analytics Settings:
✅ GA-4 ID, GTM ID, Meta Pixel ID, etc.
```

---

## 📋 Step-by-Step Cleanup

### Method 1: Using Admin UI (Recommended for Small Cleanups)

**Step 1: Open Scripts Manager**
1. Login to admin dashboard
2. Go to `/settings/scripts`
3. You'll see a list of all custom scripts

**Step 2: Identify Scripts to Delete**

For each script, ask: **"Is this covered by SEO or Analytics settings?"**

**❌ DELETE if it's:**
- Site Title / Meta Title → Use SEO Settings instead
- Site Description / Meta Description → Use SEO Settings instead
- Open Graph Image / OG Image → Use SEO Settings instead
- Open Graph Title → Use SEO Settings instead
- Google Tag Manager / GTM → Use Analytics Settings instead
- Google Analytics / GA-4 → Use Analytics Settings instead
- Meta Pixel / Facebook Pixel → Use Analytics Settings instead

**✅ KEEP if it's:**
- Schema.org JSON-LD structured data
- Custom widgets or integrations
- Third-party tracking not in Analytics Settings
- Custom CSS/JS code
- Anything truly custom

**Step 3: Delete Each Redundant Script**
1. Click the delete icon (trash can) next to the script
2. Confirm deletion
3. Repeat for each redundant script

**Step 4: Verify**
1. Check `/settings/seo` - all SEO fields should be filled
2. Check `/settings/analytics` - all tracking IDs should be filled
3. Visit public website - verify everything still works

---

### Method 2: Using SQL (Recommended for Bulk Cleanup)

**Step 1: Backup First!**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run this to see what will be deleted:

```sql
-- See all custom scripts
SELECT
  id,
  key,
  display_name,
  setting_type,
  LEFT(value, 100) as preview
FROM site_settings
WHERE key NOT LIKE 'settings_%'
ORDER BY display_name;
```

4. **Save this output somewhere safe!**

**Step 2: Backup to JSON**

Run this and **save the JSON output**:

```sql
SELECT json_agg(row_to_json(t))
FROM (
  SELECT *
  FROM site_settings
  WHERE key NOT LIKE 'settings_%'
) t;
```

**Step 3: Review What Will Be Deleted**

```sql
-- Preview scripts that will be deleted
SELECT
  key,
  display_name,
  setting_type,
  injection_point
FROM site_settings
WHERE key NOT LIKE 'settings_%'
  AND (
    -- SEO duplicates
    key IN ('site_title', 'meta_title', 'site_description', 'meta_description', 'og_image', 'og_title')
    OR display_name ILIKE '%site title%'
    OR display_name ILIKE '%meta title%'
    OR display_name ILIKE '%site description%'
    OR display_name ILIKE '%open graph%'

    -- Analytics duplicates
    OR key IN ('gtm', 'gtm_body', 'google_tag_manager', 'ga4', 'meta_pixel', 'facebook_pixel')
    OR display_name ILIKE '%google tag manager%'
    OR display_name ILIKE '%gtm%'
    OR display_name ILIKE '%google analytics%'
    OR display_name ILIKE '%meta pixel%'
  )
ORDER BY display_name;
```

**Step 4: Execute Cleanup**

Use the full SQL script: [cleanup-redundant-scripts.sql](cleanup-redundant-scripts.sql)

Or run manually:

```sql
-- Delete SEO duplicates
DELETE FROM site_settings
WHERE key NOT LIKE 'settings_%'
  AND (
    key IN ('site_title', 'meta_title', 'site_description', 'meta_description', 'og_image', 'og_title', 'og_description')
    OR (display_name ILIKE '%site title%' AND setting_type = 'meta_tag')
    OR (display_name ILIKE '%meta title%' AND setting_type = 'meta_tag')
    OR (display_name ILIKE '%site description%' AND setting_type = 'meta_tag')
    OR (display_name ILIKE '%open graph image%' AND setting_type = 'meta_tag')
  );

-- Delete Analytics duplicates
DELETE FROM site_settings
WHERE key NOT LIKE 'settings_%'
  AND (
    key IN ('gtm', 'gtm_body', 'google_tag_manager', 'google_analytics', 'ga4', 'meta_pixel', 'facebook_pixel')
    OR (display_name ILIKE '%google tag manager%' AND setting_type IN ('script', 'custom_html'))
    OR (display_name ILIKE '%google analytics%' AND setting_type IN ('script', 'custom_html'))
    OR (display_name ILIKE '%meta pixel%' AND setting_type IN ('script', 'custom_html'))
  );
```

**Step 5: Verify Cleanup**

```sql
-- Should only show custom scripts (like Schema.org JSON-LD)
SELECT
  key,
  display_name,
  setting_type,
  is_active
FROM site_settings
WHERE key NOT LIKE 'settings_%'
ORDER BY display_name;

-- Verify SEO Settings exist
SELECT key, display_name FROM site_settings WHERE key = 'settings_seo';

-- Verify Analytics Settings exist
SELECT key, display_name FROM site_settings WHERE key = 'settings_analytics';
```

---

## ✅ Verification Checklist

After cleanup, verify everything still works:

### Admin Dashboard
- [ ] Visit `/settings/scripts`
- [ ] Should only see truly custom scripts (Schema.org, custom widgets, etc.)
- [ ] NO duplicate SEO or Analytics entries
- [ ] Visit `/settings/seo`
- [ ] All SEO fields should be filled (Meta Title, Description, OG tags, etc.)
- [ ] Visit `/settings/analytics`
- [ ] All tracking IDs should be filled (GA-4, GTM, Meta Pixel, etc.)

### Public Website
- [ ] Visit https://supermalkarawaci.co.id
- [ ] **Check SEO:** View page source (Ctrl+U)
  - [ ] Verify `<title>` tag has correct value from SEO Settings
  - [ ] Verify `<meta name="description">` has correct value
  - [ ] Verify Open Graph tags exist
- [ ] **Check Analytics:** Open DevTools → Network tab
  - [ ] Reload page
  - [ ] Search for `gtag` or `googletagmanager`
  - [ ] Should see GA-4 and GTM tracking requests
  - [ ] Search for `facebook.net` or `fbevents`
  - [ ] Should see Meta Pixel tracking
- [ ] **Check Google Analytics:**
  - [ ] Go to Google Analytics dashboard
  - [ ] Check Real-time reports
  - [ ] Visit the website in another tab
  - [ ] Should see yourself in real-time users
- [ ] **Check Custom Scripts:**
  - [ ] Open DevTools → Console
  - [ ] Verify Schema.org JSON-LD is in page source (if you have it)

---

## 🚨 What If Something Breaks?

### If Analytics Stops Working

**Check Analytics Settings:**
1. Go to `/settings/analytics`
2. Verify GA-4 ID is filled (format: `G-XXXXXXXXXX`)
3. Verify GTM ID is filled (format: `GTM-XXXXXXX`)
4. Verify Meta Pixel ID is filled

**Check Public Website Code:**
Your public website (SK-Web-V3) should have code that:
- Fetches Analytics Settings from database
- Injects tracking scripts into HTML

If analytics settings are filled but tracking doesn't work:
→ **The public website isn't reading from Analytics Settings yet**
→ You'll need to implement the Analytics component

### If SEO Meta Tags Disappear

**Check SEO Settings:**
1. Go to `/settings/seo`
2. Verify all fields are filled
3. Save again if needed

**Check Public Website Code:**
Your public website should:
- Fetch SEO Settings from database
- Apply to `<title>` and `<meta>` tags
- Use React Helmet Async (for Vite) or `generateMetadata()` (for Next.js)

If SEO settings are filled but tags don't appear:
→ **The public website isn't reading from SEO Settings yet**
→ You'll need to implement SEO meta tag injection

### If You Deleted Something You Need

**Restore from backup:**
1. Find the JSON backup from STEP 2
2. Restore the specific script manually using admin UI
3. Or restore using SQL INSERT statements

---

## 📊 Expected Results

### Before Cleanup
```
Total Scripts: ~10-15
├── Redundant: 8-12 (SEO/Analytics duplicates)
└── Custom: 2-3 (Schema.org, etc.)
```

### After Cleanup
```
Total Scripts: 1-3
└── Custom only: Schema.org JSON-LD, custom widgets, etc.
```

### Settings Structure
```
SEO Settings (settings_seo)
├── meta_title ✅
├── meta_description ✅
├── meta_keywords ✅
├── og_title ✅
├── og_description ✅
├── og_image_url ✅
├── canonical_url ✅
└── robots ✅

Analytics Settings (settings_analytics)
├── google_analytics_id ✅
├── google_tag_manager_id ✅
├── meta_pixel_id ✅
├── tiktok_pixel_id ✅
└── hotjar_id ✅

Custom Scripts (individual rows)
└── Schema.org JSON-LD ✅
└── [Your custom scripts] ✅
```

---

## 🎓 Best Practices Going Forward

### When to Use Scripts Section:
✅ Schema.org structured data (JSON-LD)
✅ Third-party widgets (chat widgets, review platforms, etc.)
✅ Custom tracking not supported by Analytics Settings
✅ A/B testing scripts (Optimizely, VWO, etc.)
✅ Custom CSS/JS for specific features

### When to Use SEO Settings:
✅ Meta title, description, keywords
✅ Open Graph tags (Facebook, LinkedIn)
✅ Twitter Card tags
✅ Canonical URLs
✅ Robots directives
✅ Site verification codes

### When to Use Analytics Settings:
✅ Google Analytics 4
✅ Google Tag Manager
✅ Meta (Facebook) Pixel
✅ TikTok Pixel
✅ Hotjar
✅ Any platform that just needs an ID

---

## 📞 Need Help?

If you're unsure whether to delete a script:

**Ask these questions:**
1. Is this just a tracking ID? → Use Analytics Settings
2. Is this a meta tag? → Use SEO Settings
3. Is this custom code that doesn't fit elsewhere? → Keep in Scripts

**Still unsure?** Check the script's content:
- If it's just `<meta name="title" content="...">` → DELETE (use SEO Settings)
- If it's just `gtag('config', 'G-XXX')` → DELETE (use Analytics Settings)
- If it's complex JSON-LD or custom widget → KEEP in Scripts

---

**Ready to clean up? Start with Method 1 (Admin UI) for small cleanups, or Method 2 (SQL) for bulk cleanup!**
