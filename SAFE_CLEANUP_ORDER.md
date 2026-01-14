# SAFE Cleanup Order - DO NOT SKIP STEPS!

**IMPORTANT:** Follow these steps IN ORDER. Skipping steps will break your public website!

---

## 📊 Current Situation

**Admin Dashboard (SK-Web-Admin-Dashboard):**
- ✅ Has SEO Settings page
- ✅ Has Analytics Settings page
- ✅ Has Scripts Manager
- ✅ Saves to Supabase

**Supabase Database:**
- ✅ Has `settings_seo` (SEO structured data)
- ✅ Has `settings_general` (General structured data)
- ❌ **MISSING `settings_analytics`** (Analytics structured data)
- ✅ Has custom scripts: `gtm_body`, `google_tag_manager`, `site_title`, etc.

**Public Website (SK-Web-V3):**
- ❓ Unknown if it reads from structured settings
- ❓ Probably reads from custom scripts
- ⚠️ If we delete custom scripts, tracking WILL BREAK

---

## ✅ SAFE ORDER OF OPERATIONS

### Phase 1: Create Analytics Settings (Admin Dashboard)

**Time:** 5 minutes
**Risk:** None
**Repository:** SK-Web-Admin-Dashboard

1. [ ] Open admin dashboard
2. [ ] Go to `/settings/analytics`
3. [ ] Enter your GTM ID: `GTM-KFSPGVKK`
4. [ ] Enter GA-4 ID (if you have one)
5. [ ] Enter Meta Pixel ID (if you have one)
6. [ ] Click "Save"
7. [ ] Verify in Supabase: `settings_analytics` row should now exist

**Result:** Now you have structured Analytics Settings in the database ✅

---

### Phase 2: Update Public Website (SK-Web-V3)

**Time:** 30-60 minutes
**Risk:** Low (you're adding new code, not removing old)
**Repository:** SK-Web-V3

**Follow:** [VITE_PUBLIC_WEBSITE_IMPLEMENTATION.md](VITE_PUBLIC_WEBSITE_IMPLEMENTATION.md)

1. [ ] Create `src/lib/settings.ts`
2. [ ] Create `src/components/Analytics.tsx`
3. [ ] Create `src/components/SEO.tsx`
4. [ ] Update `src/App.tsx`
5. [ ] Verify environment variables
6. [ ] Test locally (`npm run dev`)
7. [ ] Commit and push to GitHub
8. [ ] Deploy to production
9. [ ] Test on live site

**Result:** Public website now reads from structured settings ✅

---

### Phase 3: Verify Everything Works

**Time:** 10 minutes
**Risk:** None (just testing)
**Location:** Public website

**Analytics Test:**
1. [ ] Visit https://supermalkarawaci.co.id
2. [ ] Open DevTools → Network tab
3. [ ] Look for `googletagmanager.com/gtm.js?id=GTM-KFSPGVKK`
4. [ ] ✅ GTM is loading

**SEO Test:**
1. [ ] View page source (Ctrl+U)
2. [ ] Search for "Supermal Karawaci - Shopping"
3. [ ] ✅ Title from SEO Settings appears

**Google Analytics Test:**
1. [ ] Go to Google Analytics dashboard
2. [ ] Open Real-time reports
3. [ ] Visit the website
4. [ ] ✅ See yourself in real-time users

**Result:** Structured settings are working on public website ✅

---

### Phase 4: Clean Up Redundant Scripts

**Time:** 10 minutes
**Risk:** LOW (public website is using structured settings now)
**Repository:** SK-Web-Admin-Dashboard

**NOW it's safe to delete redundant scripts!**

**Option A - Admin UI:**
1. [ ] Go to `/settings/scripts`
2. [ ] Delete `google_tag_manager`
3. [ ] Delete `gtm_body`
4. [ ] Delete `site_title`
5. [ ] Delete `site_description`
6. [ ] Delete `og_image`
7. [ ] Delete `google_analytics` (value is null anyway)
8. [ ] Delete `meta_pixel` (value is null anyway)

**Option B - SQL (faster):**
```sql
-- Delete redundant scripts
DELETE FROM site_settings
WHERE key IN (
  'google_tag_manager',
  'gtm_body',
  'site_title',
  'site_description',
  'og_image',
  'google_analytics',
  'meta_pixel'
);
```

**Keep:**
- ✅ `schema_org` (custom structured data)
- ✅ `settings_seo` (SEO structured settings)
- ✅ `settings_general` (General structured settings)
- ✅ `settings_analytics` (Analytics structured settings)

**Result:** Admin dashboard is clean and organized ✅

---

### Phase 5: Final Verification

**Time:** 5 minutes
**Risk:** None
**Location:** Both admin and public website

**Admin Dashboard:**
1. [ ] Go to `/settings/scripts`
2. [ ] Should only see `schema_org`
3. [ ] Go to `/settings/seo`
4. [ ] All fields filled
5. [ ] Go to `/settings/analytics`
6. [ ] All tracking IDs filled

**Public Website:**
1. [ ] Visit https://supermalkarawaci.co.id
2. [ ] Open DevTools → Network
3. [ ] ✅ GTM still loading (from structured settings)
4. [ ] View page source
5. [ ] ✅ Meta tags still correct (from structured settings)

**Result:** Everything works perfectly with clean admin dashboard ✅

---

## ⚠️ IMPORTANT WARNINGS

### ❌ DO NOT Delete Scripts Before Phase 2!

**Bad order:**
```
1. Delete custom scripts ❌
2. Update public website
→ Result: Tracking broken during implementation!
```

**Good order:**
```
1. Update public website ✅
2. Verify it works
3. Then delete custom scripts
→ Result: No downtime, smooth transition!
```

### ❌ DO NOT Skip Phase 1!

If you skip creating `settings_analytics`:
- Public website has no Analytics Settings to read from
- GTM/GA won't work
- You'll have to add them later

### ❌ DO NOT Skip Phase 3!

Always verify before deleting:
- Test that structured settings work
- Test that tracking is active
- Test that SEO is correct

---

## 🎯 Summary

**The key concept:**

```
Old Way (Current):
Public Website → Reads → Custom Scripts (gtm_body, site_title, etc.)

New Way (After Phase 2):
Public Website → Reads → Structured Settings (settings_analytics, settings_seo)

Cleanup (Phase 4):
Delete → Custom Scripts (no longer needed)
```

**Order matters:**
1. ✅ Create structured settings (Phase 1)
2. ✅ Update public website to use them (Phase 2)
3. ✅ Verify everything works (Phase 3)
4. ✅ Then delete old scripts (Phase 4)

**Don't do it backwards!**

---

## 📞 Quick Reference

**Files you created:**
- [VITE_PUBLIC_WEBSITE_IMPLEMENTATION.md](VITE_PUBLIC_WEBSITE_IMPLEMENTATION.md) - How to update SK-Web-V3
- [cleanup-redundant-scripts.sql](cleanup-redundant-scripts.sql) - SQL for Phase 4
- [CLEANUP_CHECKLIST.md](CLEANUP_CHECKLIST.md) - Testing checklist
- This file - Safe order of operations

**Current status:**
- [ ] Phase 1: Create Analytics Settings
- [ ] Phase 2: Update Public Website
- [ ] Phase 3: Verify Everything Works
- [ ] Phase 4: Clean Up Scripts
- [ ] Phase 5: Final Verification

**Start with Phase 1, then move to Phase 2!**

