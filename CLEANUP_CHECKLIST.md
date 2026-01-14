# Site Settings Cleanup - Quick Checklist

Print this and check off as you go! ✓

---

## 🔍 STEP 1: Backup (5 minutes)

**In Supabase Dashboard → SQL Editor:**

```sql
-- Copy and save this output!
SELECT json_agg(row_to_json(t))
FROM (SELECT * FROM site_settings WHERE key NOT LIKE 'settings_%') t;
```

- [ ] Ran the backup query
- [ ] Saved the JSON output to a file
- [ ] Saved as: `site_settings_backup_2026-01-14.json`

---

## 🗑️ STEP 2: Delete Redundant Scripts

**Choose ONE method:**

### Method A: Admin UI (Manual)
- [ ] Go to `/settings/scripts`
- [ ] For each script, ask: "Is this in SEO or Analytics settings?"
- [ ] Delete if YES (it's a duplicate)
- [ ] Keep if NO (it's custom code)

### Method B: SQL (Bulk)
- [ ] Open Supabase SQL Editor
- [ ] Run the script: [cleanup-redundant-scripts.sql](cleanup-redundant-scripts.sql)
- [ ] Review what will be deleted (STEP 3)
- [ ] Execute the DELETE statements (STEP 5)

---

## ✅ STEP 3: Verify Admin Dashboard

**Check Scripts Section:**
- [ ] Go to `/settings/scripts`
- [ ] Should only see custom scripts (Schema.org, widgets, etc.)
- [ ] NO entries for: Title, Description, OG Image, GTM, GA-4, Pixel

**Check SEO Settings:**
- [ ] Go to `/settings/seo`
- [ ] All fields are filled:
  - [ ] Meta Title
  - [ ] Meta Description
  - [ ] OG Title
  - [ ] OG Description
  - [ ] OG Image
  - [ ] Canonical URL
  - [ ] Robots Directive

**Check Analytics Settings:**
- [ ] Go to `/settings/analytics`
- [ ] All tracking IDs are filled:
  - [ ] Google Analytics 4 ID (`G-XXXXXXXXXX`)
  - [ ] Google Tag Manager ID (`GTM-XXXXXXX`)
  - [ ] Meta Pixel ID
  - [ ] (Optional) TikTok Pixel ID
  - [ ] (Optional) Hotjar ID

---

## 🌐 STEP 4: Verify Public Website

**Visit:** https://supermalkarawaci.co.id

**Check SEO Meta Tags:**
- [ ] Right-click → View Page Source (Ctrl+U)
- [ ] Search for your Meta Title
  - [ ] ✅ Found in `<title>` tag
- [ ] Search for your Meta Description
  - [ ] ✅ Found in `<meta name="description">`
- [ ] Check Open Graph tags
  - [ ] ✅ `<meta property="og:title">` exists
  - [ ] ✅ `<meta property="og:image">` exists

**Check Analytics Tracking:**
- [ ] Open DevTools (F12) → Network tab
- [ ] Reload the page
- [ ] Filter by: `gtag` or `google`
  - [ ] ✅ See request to `googletagmanager.com/gtag/js?id=G-...`
- [ ] Filter by: `facebook` or `fbevents`
  - [ ] ✅ See request to `facebook.net/fbevents.js` (if using Meta Pixel)

**Check Google Analytics Real-Time:**
- [ ] Go to Google Analytics dashboard
- [ ] Navigate to Reports → Real-time
- [ ] Visit the website in another tab
- [ ] ✅ See yourself in real-time users (within 30 seconds)

**Check Custom Scripts:**
- [ ] View page source
- [ ] Search for custom scripts (Schema.org, etc.)
  - [ ] ✅ Custom scripts are present

---

## 📊 Expected Results

### Scripts Section Should Have:
```
Total: 1-3 scripts maximum
✅ Schema.org JSON-LD (if you have one)
✅ Custom widgets (if any)
✅ Third-party integrations (if any)

❌ NO Title/Description scripts
❌ NO GTM/GA-4 scripts
❌ NO Meta Pixel scripts
❌ NO Open Graph scripts
```

### SEO Settings Should Have:
```
✅ Meta Title: [Your site title]
✅ Meta Description: [Your description]
✅ OG Title: [Your OG title]
✅ OG Image: [Image URL]
✅ Canonical URL: https://supermalkarawaci.co.id
✅ Robots: index, follow
```

### Analytics Settings Should Have:
```
✅ GA-4 ID: G-XXXXXXXXXX
✅ GTM ID: GTM-XXXXXXX
✅ Meta Pixel ID: [Your pixel ID]
```

---

## 🚨 Troubleshooting

### If something doesn't work after cleanup:

**Analytics Not Tracking:**
1. [ ] Verify Analytics Settings are filled
2. [ ] Check if public website code fetches from `settings_analytics`
3. [ ] Check browser console for errors
4. [ ] Disable ad blockers and test in incognito mode

**SEO Tags Missing:**
1. [ ] Verify SEO Settings are filled
2. [ ] Check if public website code fetches from `settings_seo`
3. [ ] Clear browser cache and hard reload (Ctrl+Shift+R)

**Need to Restore:**
1. [ ] Find your backup JSON file
2. [ ] Manually recreate the script in admin UI
3. [ ] Or contact support

---

## 📝 Final Count

**Before Cleanup:**
- Scripts section had: _____ total scripts
- Redundant: _____ scripts
- Custom: _____ scripts

**After Cleanup:**
- Scripts section has: _____ total scripts
- All redundancies removed: ✅ / ❌
- Clean admin dashboard: ✅ / ❌
- Public website working: ✅ / ❌

---

## ✅ Cleanup Complete!

- [ ] Redundant scripts deleted
- [ ] Admin dashboard is clean
- [ ] SEO Settings verified
- [ ] Analytics Settings verified
- [ ] Public website tested
- [ ] Everything works correctly

**Date completed:** ______________

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

**Keep this checklist for your records!**
