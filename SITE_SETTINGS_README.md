# Site Settings Documentation Package

**Generated:** January 14, 2026
**Purpose:** Cross-repository integration guide for Site Settings feature
**Repositories:** SK-Web-Admin-Dashboard ↔ SK-Web-V3

---

## 📦 What's Included

This documentation package contains everything you need to understand, implement, and verify Site Settings across both repositories.

### Documentation Files:

| File | Purpose | For Who |
|------|---------|---------|
| **[QUICK_START.md](QUICK_START.md)** | Start here! Quick overview and action items | Everyone |
| **[SITE_SETTINGS_HANDOFF.md](SITE_SETTINGS_HANDOFF.md)** | Complete technical documentation | Developers, AI assistants |
| **[VERIFICATION_CHECKLIST.md](VERIFICATION_CHECKLIST.md)** | Step-by-step testing guide | QA, Developers |
| **[PUBLIC_WEBSITE_IMPLEMENTATION.md](PUBLIC_WEBSITE_IMPLEMENTATION.md)** | Ready-to-use code for SK-Web-V3 | Developers implementing public site |

---

## 🎯 The Problem

You have two separate repositories:

1. **Admin Dashboard** (this repo) - Where settings are managed
2. **Public Website** (SK-Web-V3) - Where settings should be displayed

**Current Status:**
- ✅ Admin Dashboard saves settings to Supabase
- ❌ Public Website doesn't fetch or use these settings

**What You Need:**
- Integration code for the public website to fetch and apply settings

---

## 🚀 Quick Start

### 1️⃣ Start Here

Read **[QUICK_START.md](QUICK_START.md)** first (5 min read)

### 2️⃣ Verify Current Status

Use **[VERIFICATION_CHECKLIST.md](VERIFICATION_CHECKLIST.md)** to test:
- ✅ Admin Dashboard (should pass all tests)
- ❓ Public Website (might fail - needs implementation)

### 3️⃣ Implement on Public Website

Follow **[PUBLIC_WEBSITE_IMPLEMENTATION.md](PUBLIC_WEBSITE_IMPLEMENTATION.md)**:
- Copy code snippets to SK-Web-V3 repo
- Create required files
- Update root layout
- Deploy and test

### 4️⃣ Verify Everything Works

Use **[VERIFICATION_CHECKLIST.md](VERIFICATION_CHECKLIST.md)** again:
- ✅ All tests should pass now

---

## 📖 Reading Order

**For Quick Understanding:**
```
QUICK_START.md → VERIFICATION_CHECKLIST.md → Done
```

**For Implementation:**
```
QUICK_START.md → PUBLIC_WEBSITE_IMPLEMENTATION.md → VERIFICATION_CHECKLIST.md
```

**For Deep Understanding:**
```
SITE_SETTINGS_HANDOFF.md → PUBLIC_WEBSITE_IMPLEMENTATION.md → VERIFICATION_CHECKLIST.md
```

**For AI Assistant Handoff:**
```
Share: SITE_SETTINGS_HANDOFF.md + PUBLIC_WEBSITE_IMPLEMENTATION.md
Prompt: "Implement the site settings integration as documented"
```

---

## 🔧 What Settings Are Available

### SEO Settings
- Meta title, description, keywords
- Open Graph tags (Facebook, LinkedIn)
- Twitter Card tags
- Canonical URL
- Robots directive
- Google/Bing site verification

### Analytics Settings
- Google Analytics 4 (GA-4)
- Google Tag Manager (GTM)
- Meta (Facebook) Pixel
- TikTok Pixel
- Hotjar

### Custom Scripts
- Any HTML/JavaScript code
- Multiple injection points (head_start, head_end, body_start, body_end)
- Support for JSON-LD structured data
- Custom meta tags, link tags

### General Settings
- Site name, tagline, description
- Logo URLs (light/dark mode)
- Favicon
- Language and timezone

### Contact Settings
- Address, phone, email
- Google Maps integration
- Coordinates

### Social Settings
- Facebook, Instagram, Twitter, YouTube, TikTok, LinkedIn
- WhatsApp number

### Operating Hours
- Business hours by day of week
- Holiday hours
- Special notes

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│         Admin Dashboard (Next.js)           │
│              This Repository                │
│                                             │
│  - SEO Settings Form                        │
│  - Analytics Settings Form                  │
│  - Custom Scripts Manager                   │
│  - General/Contact/Social Settings          │
│                                             │
│  Admin saves settings ↓                     │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         Supabase PostgreSQL Database        │
│                                             │
│  Table: site_settings                       │
│  - SEO settings (JSON)                      │
│  - Analytics settings (JSON)                │
│  - Custom scripts (individual rows)         │
│  - General settings (JSON)                  │
│                                             │
│  Public website fetches ↓                   │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│    Public Website (Next.js - SK-Web-V3)     │
│                                             │
│  - generateMetadata() → SEO tags            │
│  - <Analytics /> → Tracking scripts         │
│  - <ScriptsInjector /> → Custom scripts     │
│                                             │
│  Renders: https://supermalkarawaci.co.id    │
└─────────────────────────────────────────────┘
```

---

## ✅ Implementation Checklist

### Admin Dashboard (This Repo)
- [x] SEO settings page created
- [x] Analytics settings page created
- [x] Custom scripts manager created
- [x] Server actions for CRUD operations
- [x] Validation schemas
- [x] Database integration working
- [x] Settings persist correctly

### Public Website (SK-Web-V3)
- [ ] Settings helper functions (`lib/settings.ts`)
- [ ] Analytics component (`components/analytics.tsx`)
- [ ] Scripts injector component (`components/scripts-injector.tsx`)
- [ ] Updated root layout (`app/layout.tsx`)
- [ ] Meta tags generated dynamically
- [ ] Analytics tracking injected
- [ ] Custom scripts rendered
- [ ] Cache revalidation endpoint (optional)

---

## 🧪 Testing Strategy

### Phase 1: Admin Dashboard
1. Test forms can save data
2. Verify data persists after refresh
3. Check database has correct values

### Phase 2: Database
1. Query Supabase directly
2. Verify JSON structure is correct
3. Check all settings groups exist

### Phase 3: Public Website
1. Test settings are fetched from database
2. Verify meta tags appear in page source
3. Check analytics tracking in DevTools
4. Verify custom scripts execute
5. Test with real GA-4 in real-time reports

**Full checklist:** [VERIFICATION_CHECKLIST.md](VERIFICATION_CHECKLIST.md)

---

## 🔄 Workflow Examples

### Scenario 1: Update Meta Title

**Admin Dashboard:**
```
1. Open /settings/seo
2. Change "Meta Title" to "New Title"
3. Click "Save Changes"
✅ Saved to Supabase
```

**Public Website (After Implementation):**
```
1. Wait 5 minutes (cache expires)
   OR call /api/revalidate-settings
2. Visit https://supermalkarawaci.co.id
3. View source
✅ <title>New Title</title>
```

### Scenario 2: Add Google Analytics

**Admin Dashboard:**
```
1. Open /settings/analytics
2. Enter GA-4 ID: "G-ABC123XYZ"
3. Click "Save Changes"
✅ Saved to Supabase
```

**Public Website (After Implementation):**
```
1. Revalidate cache
2. Visit site
3. Open DevTools → Network
✅ See requests to googletagmanager.com
✅ Track visits in Google Analytics
```

### Scenario 3: Add Custom Script

**Admin Dashboard:**
```
1. Open /settings/scripts
2. Create new script
3. Add console.log('Hello!')
4. Set injection point: body_end
5. Mark as Active
6. Save
✅ Saved to Supabase
```

**Public Website (After Implementation):**
```
1. Revalidate cache
2. Visit site
3. Open Console
✅ See "Hello!" in console
```

---

## 🛠️ File Structure

### Admin Dashboard (This Repo)

```
src/
├── actions/
│   └── settings.ts                    # Server actions
├── app/
│   └── (dashboard)/
│       └── settings/
│           ├── page.tsx               # General settings
│           ├── seo/page.tsx           # SEO settings page
│           ├── analytics/page.tsx     # Analytics settings page
│           ├── scripts/page.tsx       # Scripts manager page
│           ├── contact/page.tsx       # Contact settings
│           └── social/page.tsx        # Social settings
├── components/settings/
│   ├── seo-settings-form.tsx          # SEO form
│   ├── analytics-settings-form.tsx    # Analytics form
│   ├── general-settings-form.tsx      # General form
│   └── scripts-manager.tsx            # Scripts manager
├── lib/validations/
│   └── settings.ts                    # Zod schemas
└── types/
    └── database.ts                    # TypeScript types
```

### Public Website (SK-Web-V3) - To Be Created

```
lib/
└── settings.ts                        # NEW: Settings helpers

components/
├── analytics.tsx                      # NEW: Analytics component
└── scripts-injector.tsx               # NEW: Scripts injector

app/
├── layout.tsx                         # MODIFIED: Add settings integration
└── api/
    └── revalidate-settings/
        └── route.ts                   # NEW: Cache revalidation
```

---

## 💡 Tips for Cross-Repo Work

### Using VS Code for Admin Dashboard
```bash
# This repo
code .
npm run dev
# Visit: http://localhost:3000/settings
```

### Using Antigravity IDE for Public Website
```bash
# SK-Web-V3 repo
git clone https://github.com/Supermal-Karawaci/SK-Web-V3.git
cd SK-Web-V3
# Open in Antigravity IDE
```

### Sharing Context with AI
When working in the public website repo, share these files:
1. SITE_SETTINGS_HANDOFF.md
2. PUBLIC_WEBSITE_IMPLEMENTATION.md

Then ask:
> "Please implement the site settings integration as documented. Fetch settings from Supabase and apply them to the layout."

---

## 📊 Database Schema Quick Reference

### Table: `site_settings`

```sql
CREATE TABLE site_settings (
  id UUID PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  value TEXT,                         -- JSON string for grouped settings
  setting_type TEXT,                  -- meta_tag, script, link, json_ld, custom_html
  injection_point TEXT,               -- head_start, head_end, body_start, body_end
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  created_by UUID
);
```

### Special Keys (Grouped Settings)

| Key | Contains |
|-----|----------|
| `settings_seo` | SEO settings as JSON |
| `settings_analytics` | Analytics IDs as JSON |
| `settings_general` | Site info as JSON |
| `settings_contact` | Contact info as JSON |
| `settings_social` | Social media URLs as JSON |
| `settings_operating_hours` | Business hours as JSON |

### Custom Scripts

Stored as individual rows:
- `key`: Unique identifier (e.g., `custom_ga_script`)
- `value`: The actual HTML/JavaScript code
- `setting_type`: Type of content (script, meta_tag, etc.)
- `injection_point`: Where to inject
- `is_active`: Whether to render

---

## 🔍 Common Questions

### Q: Do I need to rebuild after changing settings?
**A:** No! Settings are fetched at runtime. Just clear cache.

### Q: How long does cache last?
**A:** 5 minutes by default. Configurable in `lib/settings.ts`.

### Q: Can I force immediate update?
**A:** Yes! Call the `/api/revalidate-settings` endpoint.

### Q: What if settings don't exist in database?
**A:** Default values are used. No errors.

### Q: Do analytics work in development?
**A:** Yes, but use real GA-4 IDs for production.

### Q: Can I have different settings per page?
**A:** Yes! Fetch settings in page-specific `generateMetadata()`.

### Q: What happens if Supabase is down?
**A:** Cached values used. If no cache, defaults applied.

---

## 🚨 Important Notes

1. **Cache Duration:** Settings are cached for 5 minutes. For instant updates, call revalidation endpoint.

2. **Security:** Never expose sensitive tokens in meta tags or scripts. Use environment variables.

3. **Performance:** Settings are fetched server-side during build/render. No client-side delay.

4. **SEO:** Dynamic meta tags are fully supported by search engines when using `generateMetadata()`.

5. **Testing:** Always test with real GA-4 in production. Development mode may not track correctly.

6. **Deployment:** Settings take effect immediately after deployment (or cache expiry).

---

## 📞 Support Resources

- **Detailed Docs:** [SITE_SETTINGS_HANDOFF.md](SITE_SETTINGS_HANDOFF.md)
- **Implementation:** [PUBLIC_WEBSITE_IMPLEMENTATION.md](PUBLIC_WEBSITE_IMPLEMENTATION.md)
- **Testing Guide:** [VERIFICATION_CHECKLIST.md](VERIFICATION_CHECKLIST.md)
- **Quick Reference:** [QUICK_START.md](QUICK_START.md)

---

## 🎉 Success Criteria

You'll know it's working when:

✅ Admin dashboard saves settings without errors
✅ Database shows correct values in `site_settings` table
✅ Public website displays dynamic meta tags from settings
✅ Google Analytics tracks visits in real-time
✅ Custom scripts execute on the public website
✅ Changes in admin appear on public site (after cache clear)

---

## 📅 Maintenance

### Regular Tasks
- Monitor Google Analytics for tracking issues
- Review custom scripts for performance
- Update SEO settings based on performance
- Check meta tags in search results

### When Updating
1. Test in admin dashboard first
2. Verify in database
3. Clear cache or wait 5 minutes
4. Check public website
5. Verify with real tools (GA, SEO checkers)

---

**Last Updated:** January 14, 2026
**Status:** Documentation Complete
**Next Steps:** Implement on SK-Web-V3 repository

---

