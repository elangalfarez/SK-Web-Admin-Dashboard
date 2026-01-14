# Site Settings - Quick Start Guide

**TL;DR:** Your admin dashboard saves settings correctly, but your public website needs to fetch and apply them.

---

## 📁 Documents Created

1. **[SITE_SETTINGS_HANDOFF.md](SITE_SETTINGS_HANDOFF.md)**
   - Complete technical documentation
   - Database schema
   - Architecture overview
   - How everything works

2. **[VERIFICATION_CHECKLIST.md](VERIFICATION_CHECKLIST.md)**
   - Step-by-step testing guide
   - Use this to verify if settings are working
   - Covers both admin and public website

3. **[PUBLIC_WEBSITE_IMPLEMENTATION.md](PUBLIC_WEBSITE_IMPLEMENTATION.md)**
   - Ready-to-use code for public website
   - Copy-paste implementation
   - Complete with all components

4. **[QUICK_START.md](QUICK_START.md)** (this file)
   - Quick reference
   - What to do next

---

## 🎯 What's the Issue?

### Current State:
```
Admin Dashboard (Next.js)
  ↓ Saves to
Supabase Database ✅
  ↓ NOT fetching from
Public Website ❌
```

### What's Working:
- ✅ Admin dashboard saves SEO settings
- ✅ Admin dashboard saves Analytics settings (GA-4, GTM, Meta Pixel)
- ✅ Admin dashboard can create custom scripts
- ✅ All data stored correctly in Supabase

### What's NOT Working:
- ❌ Public website doesn't fetch settings from database
- ❌ Meta tags are hardcoded (not dynamic)
- ❌ Analytics tracking codes are not injected
- ❌ Custom scripts are not rendered

---

## 🚀 Quick Fix (5 Steps)

### Step 1: Test Admin Dashboard (2 minutes)

Open this repo in VS Code:
1. Visit `/settings/seo`
2. Change title to: `TEST-123-SUPERMAL`
3. Save
4. Refresh page
5. ✅ If title persists = Admin working

### Step 2: Open Public Website Repo (1 minute)

```bash
# In Google Antigravity IDE or VS Code
git clone https://github.com/Supermal-Karawaci/SK-Web-V3.git
cd SK-Web-V3
```

### Step 3: Copy Implementation Files (5 minutes)

From this repo's documentation, copy code to public website:

Create these files in SK-Web-V3:
- `lib/settings.ts` (from PUBLIC_WEBSITE_IMPLEMENTATION.md)
- `components/analytics.tsx` (from PUBLIC_WEBSITE_IMPLEMENTATION.md)
- `components/scripts-injector.tsx` (from PUBLIC_WEBSITE_IMPLEMENTATION.md)

Update this file in SK-Web-V3:
- `app/layout.tsx` (replace with version from PUBLIC_WEBSITE_IMPLEMENTATION.md)

### Step 4: Deploy (10 minutes)

```bash
# In SK-Web-V3 repo
git add .
git commit -m "Add site settings integration"
git push

# Wait for deployment (Vercel auto-deploys)
```

### Step 5: Verify (5 minutes)

1. Visit https://supermalkarawaci.co.id
2. Right-click → View Source
3. Search for `TEST-123-SUPERMAL`
4. ✅ Found = Settings working!
5. ❌ Not found = Check VERIFICATION_CHECKLIST.md

---

## 📋 Workflow Going Forward

### When You Update Settings:

**Admin Dashboard (VS Code):**
1. Open `/settings/seo` or `/settings/analytics`
2. Make changes
3. Click "Save"
4. ✅ Saved to database

**Public Website (Automatic):**
1. Wait ~5 minutes (cache clears automatically)
2. Or call revalidation endpoint (instant)
3. ✅ Settings appear on live site

### Recommended Workflow:

```
1. Update settings in Admin Dashboard
   ↓
2. (Optional) Call revalidation API for instant update
   ↓
3. Verify on public website
   ↓
4. Check Google Analytics if needed
```

---

## 🔍 How to Verify Right Now

### Quick Test (No Code Changes):

1. **Check Database:**
   - Go to Supabase Dashboard
   - Open `site_settings` table
   - Look for row with `key = 'settings_seo'`
   - ✅ If exists = Admin saving correctly

2. **Check Public Website:**
   - Visit https://supermalkarawaci.co.id
   - View page source (Ctrl+U)
   - Look for the test title you set
   - ❌ If not found = Public website NOT using settings

### Expected Result:

**Before Fix:**
```html
<!-- Public website has hardcoded values -->
<title>Supermal Karawaci</title>
<meta name="description" content="Shopping Mall">
<!-- No GA tracking -->
```

**After Fix:**
```html
<!-- Public website uses settings from database -->
<title>TEST-123-SUPERMAL</title>
<meta name="description" content="This is a test...">
<!-- GA tracking present -->
<script src="https://www.googletagmanager.com/gtag/js?id=G-..."></script>
```

---

## 🆘 Troubleshooting

### "I don't see the settings on public website"

**Possible Causes:**
1. Public website code not implemented yet
2. Cache not cleared
3. Deployment failed
4. Supabase connection issue

**Solution:**
1. Follow PUBLIC_WEBSITE_IMPLEMENTATION.md
2. Wait 5 minutes or call revalidation API
3. Check deployment logs
4. Verify environment variables

### "Analytics not tracking"

**Possible Causes:**
1. Wrong GA-4 ID format
2. Analytics component not added to layout
3. Ad blocker blocking requests
4. Script not injected

**Solution:**
1. Use format: `G-XXXXXXXXXX`
2. Add `<Analytics />` to layout
3. Test in incognito mode
4. Check Network tab in DevTools

### "Custom scripts not working"

**Possible Causes:**
1. Script marked as inactive
2. Wrong injection point
3. Invalid script syntax
4. Scripts component not added

**Solution:**
1. Check "Active" checkbox in admin
2. Verify injection point (head_end, body_end, etc.)
3. Validate JavaScript/HTML syntax
4. Add `<ScriptsInjector />` to layout

---

## 📞 Cross-Repo Communication

### Working Across Two Repos:

**Scenario:** You're in admin dashboard, want to verify on public site

1. **Make changes in admin** (VS Code)
2. **Switch to Antigravity IDE** (public website)
3. **Open VERIFICATION_CHECKLIST.md** (from this repo)
4. **Follow the checklist**
5. **Verify changes appear**

### Using AI Assistants Across Repos:

**Handoff to AI in Public Repo:**

> "I'm working on integrating site settings from the admin dashboard. Please read the file `SITE_SETTINGS_HANDOFF.md` and implement the code from `PUBLIC_WEBSITE_IMPLEMENTATION.md`. The admin dashboard is saving settings to Supabase table `site_settings`, and we need to fetch and apply those settings on this public website."

Then share these files:
- SITE_SETTINGS_HANDOFF.md
- PUBLIC_WEBSITE_IMPLEMENTATION.md
- VERIFICATION_CHECKLIST.md

---

## ⚡ Quick Commands

### Admin Dashboard (This Repo)

```bash
# Start dev server
npm run dev

# Open SEO settings
# Visit: http://localhost:3000/settings/seo

# Open Analytics settings
# Visit: http://localhost:3000/settings/analytics

# Check database directly
# Go to Supabase Dashboard → site_settings table
```

### Public Website (SK-Web-V3 Repo)

```bash
# Start dev server
npm run dev

# Test locally
# Visit: http://localhost:3000

# View page source
# Ctrl+U (or Cmd+U on Mac)

# Check for settings
# Search for your test values
```

### Database Queries

```sql
-- Check SEO settings
SELECT * FROM site_settings WHERE key = 'settings_seo';

-- Check Analytics settings
SELECT * FROM site_settings WHERE key = 'settings_analytics';

-- Check all custom scripts
SELECT key, display_name, is_active, injection_point
FROM site_settings
WHERE key NOT LIKE 'settings_%';
```

---

## 📊 Current Status

### ✅ Admin Dashboard (This Repo)
- [x] SEO settings form working
- [x] Analytics settings form working
- [x] Custom scripts manager working
- [x] Database storage working
- [x] Settings persist correctly

### ❓ Public Website (SK-Web-V3 Repo)
- [ ] Check if settings fetching is implemented
- [ ] Check if meta tags are dynamic
- [ ] Check if analytics is injected
- [ ] Check if custom scripts are rendered

**Use VERIFICATION_CHECKLIST.md to determine exact status**

---

## 🎓 What You Learned

1. **Multi-Repo Architecture:**
   - Admin dashboard = management interface
   - Public website = consumer of data
   - Supabase = shared database

2. **Site Settings Flow:**
   - Settings saved in admin → Stored in DB → Fetched by public site → Applied to pages

3. **What's Needed:**
   - Admin: Forms to manage settings ✅
   - Database: Store settings ✅
   - Public: Fetch and apply settings ❌ (needs implementation)

4. **Integration Points:**
   - SEO: `generateMetadata()` function
   - Analytics: Script injection in layout
   - Custom Scripts: Dynamic script rendering

---

## 📚 Next Actions

1. **[ ] Read VERIFICATION_CHECKLIST.md**
   - Test admin dashboard (should pass)
   - Test public website (might fail)
   - Identify what's missing

2. **[ ] Read PUBLIC_WEBSITE_IMPLEMENTATION.md**
   - Copy code to SK-Web-V3 repo
   - Implement missing features
   - Deploy and test

3. **[ ] Verify Everything Works**
   - Follow VERIFICATION_CHECKLIST.md
   - Test SEO settings
   - Test analytics tracking
   - Test custom scripts

4. **[ ] Set Up Automatic Revalidation** (Optional)
   - Add webhook to admin dashboard
   - Clear cache when settings change
   - Get instant updates on public site

---

## 🔗 Links

- **Admin Dashboard:** http://localhost:3000 (dev)
- **Public Website:** https://supermalkarawaci.co.id
- **Public Repo:** https://github.com/Supermal-Karawaci/SK-Web-V3
- **Supabase Dashboard:** [Your Supabase project URL]

---

## ✨ Summary

**In 3 Sentences:**
1. Your admin dashboard successfully saves settings to Supabase
2. Your public website needs to fetch these settings and apply them
3. Use PUBLIC_WEBSITE_IMPLEMENTATION.md to add the missing code

**Time to Fix:** ~30 minutes
**Difficulty:** Medium
**Impact:** High (SEO, Analytics, Custom Scripts all start working)

---

**Questions? Check SITE_SETTINGS_HANDOFF.md for detailed explanations**

**Last Updated:** January 14, 2026
