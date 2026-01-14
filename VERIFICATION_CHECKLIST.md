# Site Settings Verification Checklist

**Purpose:** Use this checklist to verify Site Settings are working correctly across both repositories.

---

## Phase 1: Admin Dashboard Verification ✓

### ✅ Settings Can Be Saved

**SEO Settings** (`/settings/seo`)
- [ ] Open SEO settings page
- [ ] Change "Meta Title" to: `TEST-SEO-TITLE-12345`
- [ ] Change "Meta Description" to: `This is a test description for verification purposes.`
- [ ] Click "Save Changes"
- [ ] Success message appears
- [ ] Refresh the page
- [ ] ✅ Values persist after refresh

**Analytics Settings** (`/settings/analytics`)
- [ ] Open Analytics settings page
- [ ] Set "Google Analytics ID" to: `G-TEST999999`
- [ ] Set "Google Tag Manager ID" to: `GTM-TEST123`
- [ ] Click "Save Changes"
- [ ] Success message appears
- [ ] Refresh the page
- [ ] ✅ Values persist after refresh

**Custom Scripts** (`/settings/scripts`)
- [ ] Open Scripts manager page
- [ ] Click "Create Script" or similar button
- [ ] Fill in:
  - Display Name: `Verification Test Script`
  - Key: `test_verification_script`
  - Type: `Script`
  - Injection Point: `Body End`
  - Value: `<script>console.log('✅ Custom scripts working!');</script>`
  - Active: YES (checked)
- [ ] Save the script
- [ ] ✅ Script appears in the list
- [ ] ✅ Script shows as "Active"

---

## Phase 2: Database Verification ✓

### ✅ Data Is Stored in Supabase

**Option A: Using Supabase Dashboard**
1. [ ] Go to Supabase Dashboard
2. [ ] Navigate to Table Editor
3. [ ] Open table: `site_settings`
4. [ ] Find row where `key = 'settings_seo'`
5. [ ] Click on the `value` column
6. [ ] ✅ Should see JSON containing `TEST-SEO-TITLE-12345`
7. [ ] Find row where `key = 'settings_analytics'`
8. [ ] ✅ Should see JSON containing `G-TEST999999`
9. [ ] Find row where `key = 'test_verification_script'`
10. [ ] ✅ Should exist and `is_active = true`

**Option B: Using SQL Query**
```sql
-- Run this in Supabase SQL Editor

-- Check SEO settings
SELECT key, value, updated_at
FROM site_settings
WHERE key = 'settings_seo';

-- Check Analytics settings
SELECT key, value, updated_at
FROM site_settings
WHERE key = 'settings_analytics';

-- Check test script
SELECT key, display_name, is_active, setting_type, injection_point
FROM site_settings
WHERE key = 'test_verification_script';
```

- [ ] Run the queries
- [ ] ✅ SEO settings row exists with correct data
- [ ] ✅ Analytics settings row exists with correct data
- [ ] ✅ Test script row exists and is active

---

## Phase 3: Public Website Verification 🔍

**Repository:** SK-Web-V3
**URL:** https://supermalkarawaci.co.id

### ✅ Supabase Connection Works

**Check Environment Variables:**
- [ ] Open the SK-Web-V3 repository
- [ ] Check `.env.local` or `.env` file
- [ ] Verify these exist:
  - `NEXT_PUBLIC_SUPABASE_URL=...`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
- [ ] ✅ Variables are set correctly

**Check Supabase Client:**
- [ ] Look for file: `lib/supabase.ts` or `utils/supabase.ts` or similar
- [ ] ✅ File exists and can create Supabase client
- [ ] Check if file is 2000+ lines (as mentioned)
- [ ] Note: This might include auto-generated types

### ✅ Settings Fetching Functions Exist

**Look for these functions in the public website:**
- [ ] Search codebase for: `getSeoSettings` or similar
- [ ] Search codebase for: `getAnalyticsSettings` or similar
- [ ] Search codebase for: `site_settings` (table name)
- [ ] ✅ Functions exist to fetch settings from database

**If functions DON'T exist:**
- ❌ Settings are NOT being fetched
- 📝 Note: You'll need to implement them (see implementation guide)

### ✅ Meta Tags Are Applied

**Test in Browser:**
1. [ ] Visit: https://supermalkarawaci.co.id
2. [ ] Right-click → "View Page Source" (or Ctrl+U)
3. [ ] Search for: `TEST-SEO-TITLE-12345`
4. [ ] ✅ PASS: Found in `<title>` tag
5. [ ] ❌ FAIL: Not found → Settings not applied
6. [ ] Search for: `This is a test description for verification`
7. [ ] ✅ PASS: Found in `<meta name="description">`
8. [ ] ❌ FAIL: Not found → Settings not applied

**Check Open Graph Tags:**
- [ ] In page source, search for: `<meta property="og:title"`
- [ ] ✅ Tag exists with value from settings
- [ ] Search for: `<meta property="og:description"`
- [ ] ✅ Tag exists with value from settings
- [ ] Search for: `<meta property="og:image"`
- [ ] ✅ Tag exists with image URL from settings

**Check Twitter Card Tags:**
- [ ] Search for: `<meta name="twitter:card"`
- [ ] ✅ Tag exists with correct card type
- [ ] Search for: `<meta name="twitter:site"`
- [ ] ✅ Tag exists with Twitter handle

### ✅ Analytics Tracking Is Active

**Test GA-4 Tracking:**
1. [ ] Visit: https://supermalkarawaci.co.id
2. [ ] Open DevTools (F12)
3. [ ] Go to "Network" tab
4. [ ] Reload the page (Ctrl+R)
5. [ ] In filter, type: `gtag` or `google-analytics`
6. [ ] ✅ PASS: See request to `googletagmanager.com/gtag/js?id=G-TEST999999`
7. [ ] ❌ FAIL: No request → Analytics not injected

**Alternative: Check Page Source:**
1. [ ] View page source (Ctrl+U)
2. [ ] Search for: `G-TEST999999`
3. [ ] ✅ PASS: Found in a `<script>` tag
4. [ ] ❌ FAIL: Not found → Analytics not injected

**Test in Google Analytics (If using real GA-4 ID):**
1. [ ] Go to Google Analytics dashboard
2. [ ] Navigate to: Reports → Real-time
3. [ ] Visit the website in another tab
4. [ ] ✅ PASS: See yourself in real-time users
5. [ ] ❌ FAIL: No users shown → Tracking not working

**Test GTM (If applicable):**
1. [ ] View page source
2. [ ] Search for: `GTM-TEST123`
3. [ ] ✅ PASS: Found in Google Tag Manager script
4. [ ] ❌ FAIL: Not found → GTM not injected

### ✅ Custom Scripts Are Injected

**Test Custom Script:**
1. [ ] Visit: https://supermalkarawaci.co.id
2. [ ] Open DevTools (F12)
3. [ ] Go to "Console" tab
4. [ ] Look for message: `✅ Custom scripts working!`
5. [ ] ✅ PASS: Message appears
6. [ ] ❌ FAIL: No message → Custom scripts not injected

**Alternative: Check Page Source:**
1. [ ] View page source (Ctrl+U)
2. [ ] Search for: `Custom scripts working`
3. [ ] ✅ PASS: Found in page HTML
4. [ ] ❌ FAIL: Not found → Scripts not injected

---

## Phase 4: End-to-End Testing 🎯

### ✅ Complete Settings Flow

**Test 1: Change Title and Verify**
1. [ ] Admin Dashboard: Change meta title to something unique
2. [ ] Save changes
3. [ ] Wait 30 seconds (for cache to clear if any)
4. [ ] Public Website: Visit homepage
5. [ ] View source
6. [ ] ✅ New title appears in HTML

**Test 2: Add Real GA-4 Tracking**
1. [ ] Get real GA-4 ID from Google Analytics
2. [ ] Admin Dashboard: Enter real GA-4 ID in analytics settings
3. [ ] Save changes
4. [ ] Public Website: Visit homepage
5. [ ] Google Analytics: Check real-time reports
6. [ ] ✅ Visit is tracked in real-time

**Test 3: Add Structured Data Script**
1. [ ] Admin Dashboard: Go to Scripts manager
2. [ ] Create new script:
   - Type: `JSON-LD`
   - Injection Point: `Head End`
   - Value:
   ```json
   {
     "@context": "https://schema.org",
     "@type": "ShoppingCenter",
     "name": "Supermal Karawaci",
     "address": {
       "@type": "PostalAddress",
       "addressLocality": "Tangerang",
       "addressCountry": "ID"
     }
   }
   ```
3. [ ] Save and activate
4. [ ] Public Website: View source
5. [ ] Search for: `ShoppingCenter`
6. [ ] ✅ Structured data appears in HTML

---

## Results Summary

### ✅ Everything Working
If ALL tests pass:
- ✅ Admin Dashboard is saving settings correctly
- ✅ Database is storing settings properly
- ✅ Public Website is fetching settings from database
- ✅ Meta tags are being applied dynamically
- ✅ Analytics tracking is active
- ✅ Custom scripts are being injected

**Status:** 🟢 FULLY FUNCTIONAL

---

### ⚠️ Partial Implementation
If Admin & Database tests pass, but Public Website tests fail:
- ✅ Admin Dashboard works
- ✅ Database storage works
- ❌ Public Website is NOT using the settings

**Status:** 🟡 NEEDS PUBLIC WEBSITE IMPLEMENTATION

**Next Steps:**
1. Check if public website has settings fetching code
2. Implement meta tag injection (see implementation guide)
3. Implement analytics injection
4. Implement custom scripts injection

---

### ❌ Not Working
If tests fail at different stages:

**Admin Dashboard Saving Fails:**
- Check browser console for errors
- Check network tab for failed requests
- Verify Supabase connection in admin dashboard
- Check authentication/permissions

**Database Storage Fails:**
- Check Supabase table exists: `site_settings`
- Check RLS (Row Level Security) policies
- Check user has INSERT/UPDATE permissions
- Verify database schema matches expected structure

**Public Website Connection Fails:**
- Check environment variables in .env file
- Verify Supabase URL and anon key are correct
- Check if public website can connect to Supabase
- Test with a simple query in console

---

## Quick Debug Commands

### Check Settings in Browser Console (Public Website)

```javascript
// Open browser console on public website and run:

// Test Supabase connection
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
);

// Fetch SEO settings
const { data, error } = await supabase
  .from('site_settings')
  .select('*')
  .eq('key', 'settings_seo')
  .single();

console.log('SEO Settings:', data);
console.log('Error:', error);

// Fetch analytics settings
const { data: analytics } = await supabase
  .from('site_settings')
  .select('*')
  .eq('key', 'settings_analytics')
  .single();

console.log('Analytics:', analytics);
```

### Check if Meta Tags Exist

```javascript
// In browser console:
console.log('Title:', document.title);
console.log('Description:', document.querySelector('meta[name="description"]')?.content);
console.log('OG Title:', document.querySelector('meta[property="og:title"]')?.content);
console.log('OG Image:', document.querySelector('meta[property="og:image"]')?.content);
```

### Check if Analytics is Loaded

```javascript
// In browser console:
console.log('GA loaded:', typeof gtag !== 'undefined');
console.log('GTM loaded:', typeof google_tag_manager !== 'undefined');
console.log('DataLayer:', window.dataLayer);
```

---

## Support & Next Steps

**If tests PASS:** ✅ Everything is working correctly!

**If tests FAIL:** See the "IMPLEMENTATION_GUIDE.md" document for code examples to fix issues.

**Need help?** Compare your implementation with the examples in SITE_SETTINGS_HANDOFF.md

---

**Last Updated:** January 14, 2026
