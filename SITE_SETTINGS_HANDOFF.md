# Site Settings Implementation - Handoff Document

**Date:** January 14, 2026
**Admin Dashboard Repo:** SK-Web-Admin-Dashboard
**Public Website Repo:** SK-Web-V3
**Author:** System Documentation

---

## Overview

This document explains how Site Settings work across the **Admin Dashboard** and **Public Website** repositories. The admin dashboard is where settings are managed, and the public website is where they are applied.

### Architecture

```
┌─────────────────────────────┐
│   Admin Dashboard (Next.js) │
│   - Manage SEO settings     │
│   - Configure analytics     │
│   - Create custom scripts   │
└──────────┬──────────────────┘
           │
           │ Saves to
           ↓
┌─────────────────────────────┐
│   Supabase PostgreSQL DB    │
│   Table: site_settings      │
└──────────┬──────────────────┘
           │
           │ Fetches from
           ↓
┌─────────────────────────────┐
│   Public Website            │
│   - Displays meta tags      │
│   - Injects GA-4 tracking   │
│   - Renders custom scripts  │
└─────────────────────────────┘
```

---

## Database Schema

### Table: `site_settings`

Located in Supabase PostgreSQL database.

#### Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `key` | TEXT | Unique identifier for the setting |
| `display_name` | TEXT | Human-readable name |
| `description` | TEXT | Setting description |
| `value` | TEXT | JSON string containing the actual settings |
| `setting_type` | ENUM | Type: `meta_tag`, `script`, `link`, `json_ld`, `custom_html` |
| `injection_point` | ENUM | Where to inject: `head_start`, `head_end`, `body_start`, `body_end` |
| `is_active` | BOOLEAN | Whether the setting is enabled |
| `sort_order` | INTEGER | Order for injection |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |
| `created_by` | UUID | User who created the setting |

#### Important Setting Keys

The following special keys store grouped settings as JSON:

| Key | Display Name | Description |
|-----|--------------|-------------|
| `settings_general` | General Settings | Site name, logo, favicon, timezone |
| `settings_contact` | Contact Settings | Address, phone, email, maps |
| `settings_social` | Social Settings | Social media URLs |
| `settings_seo` | SEO Settings | Meta tags, OG tags, robots directive |
| `settings_analytics` | Analytics Settings | GA-4, GTM, Meta Pixel, etc. |
| `settings_operating_hours` | Operating Hours | Business hours by day |

---

## Admin Dashboard Implementation

### File Structure

```
src/
├── actions/
│   └── settings.ts              # Server actions for CRUD operations
├── components/settings/
│   ├── seo-settings-form.tsx    # SEO form UI
│   ├── analytics-settings-form.tsx  # Analytics form UI
│   ├── general-settings-form.tsx    # General settings UI
│   └── scripts-manager.tsx      # Custom scripts manager UI
├── lib/validations/
│   └── settings.ts              # Zod schemas for validation
└── types/
    └── database.ts              # TypeScript types
```

### Key Functions (Admin Dashboard)

Located in `src/actions/settings.ts`:

#### Get Settings
```typescript
// Get SEO settings
const result = await getSeoSettings();
// Returns: { success: true, data: { meta_title: "...", meta_description: "...", ... } }

// Get Analytics settings
const result = await getAnalyticsSettings();
// Returns: { success: true, data: { google_analytics_id: "G-...", ... } }

// Get active custom scripts by injection point
const result = await getActiveScripts("head_end");
// Returns: { success: true, data: [{ key: "...", value: "...", setting_type: "script" }] }
```

#### Save Settings
```typescript
// Save SEO settings
const result = await saveSeoSettings({
  meta_title: "Supermal Karawaci - Shopping Mall",
  meta_description: "...",
  canonical_url: "https://supermalkarawaci.co.id",
  robots: "index, follow",
  // ... other fields
});

// Save Analytics settings
const result = await saveAnalyticsSettings({
  google_analytics_id: "G-XXXXXXXXXX",
  google_tag_manager_id: "GTM-XXXXXXX",
  // ... other fields
});
```

---

## Settings Data Structures

### 1. SEO Settings (`settings_seo`)

**Stored as JSON in `value` column:**

```json
{
  "meta_title": "Supermal Karawaci - Shopping Mall Tangerang",
  "meta_description": "Discover the best shopping mall in Tangerang with various tenants and kids-friendly events",
  "meta_keywords": "shopping mall, tangerang, karawaci, retail, entertainment",
  "og_title": "Supermal Karawaci",
  "og_description": "Premier shopping destination in Tangerang",
  "og_image_url": "https://...cdn.supabase.co/.../og-image.jpg",
  "og_type": "business.business",
  "twitter_card": "summary_large_image",
  "twitter_site": "@supermalkarawaci",
  "twitter_creator": "@supermalkarawaci",
  "canonical_url": "https://supermalkarawaci.co.id",
  "robots": "index, follow",
  "google_site_verification": "abc123...",
  "bing_site_verification": "xyz789..."
}
```

**TypeScript Type:**
```typescript
interface SeoSettings {
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  og_title: string;
  og_description: string;
  og_image_url: string;
  og_type: "website" | "business.business" | "place";
  twitter_card: "summary" | "summary_large_image";
  twitter_site: string;
  twitter_creator: string;
  canonical_url: string;
  robots: string;
  google_site_verification: string;
  bing_site_verification: string;
}
```

### 2. Analytics Settings (`settings_analytics`)

**Stored as JSON in `value` column:**

```json
{
  "google_analytics_id": "G-XXXXXXXXXX",
  "google_tag_manager_id": "GTM-XXXXXXX",
  "meta_pixel_id": "1234567890",
  "tiktok_pixel_id": "ABC123XYZ",
  "hotjar_id": "9876543"
}
```

**TypeScript Type:**
```typescript
interface AnalyticsSettings {
  google_analytics_id: string;
  google_tag_manager_id: string;
  meta_pixel_id: string;
  tiktok_pixel_id: string;
  hotjar_id: string;
}
```

### 3. General Settings (`settings_general`)

```json
{
  "site_name": "Supermal Karawaci",
  "site_tagline": "Premier Shopping Destination",
  "site_description": "...",
  "logo_url": "https://...cdn.supabase.co/.../logo.png",
  "logo_dark_url": "https://...cdn.supabase.co/.../logo-dark.png",
  "favicon_url": "https://...cdn.supabase.co/.../favicon.ico",
  "default_language": "id",
  "timezone": "Asia/Jakarta"
}
```

### 4. Custom Scripts

Custom scripts are stored as **individual rows** (not grouped as JSON):

**Example Row:**
```
id: "uuid-123"
key: "google_analytics_script"
display_name: "Google Analytics 4"
value: "<script async src='https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX'></script>..."
setting_type: "script"
injection_point: "head_end"
is_active: true
sort_order: 1
```

---

## Public Website Integration

### Required Implementation

The public website (SK-Web-V3) needs to:

1. **Fetch settings from Supabase**
2. **Apply meta tags to pages**
3. **Inject analytics tracking codes**
4. **Render custom scripts**

### Method 1: Direct Supabase Query (Recommended)

**Fetch SEO Settings:**

```typescript
// lib/settings.ts
import { createClient } from '@/lib/supabase/client';

export async function getSeoSettings() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'settings_seo')
    .single();

  if (error || !data?.value) {
    return null;
  }

  return JSON.parse(data.value);
}

export async function getAnalyticsSettings() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'settings_analytics')
    .single();

  if (error || !data?.value) {
    return null;
  }

  return JSON.parse(data.value);
}

export async function getActiveScripts(injectionPoint: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('injection_point', injectionPoint)
    .eq('is_active', true)
    .not('key', 'like', 'settings_%')
    .order('sort_order', { ascending: true });

  if (error) {
    return [];
  }

  return data || [];
}
```

### Method 2: Server-Side Fetch (Next.js App Router)

**Root Layout with Dynamic Metadata:**

```typescript
// app/layout.tsx
import { Metadata } from 'next';
import { getSeoSettings, getAnalyticsSettings } from '@/lib/settings';

export async function generateMetadata(): Promise<Metadata> {
  const seoSettings = await getSeoSettings();

  if (!seoSettings) {
    return {
      title: 'Supermal Karawaci',
      description: 'Shopping Mall in Tangerang',
    };
  }

  return {
    title: seoSettings.meta_title || 'Supermal Karawaci',
    description: seoSettings.meta_description || '',
    keywords: seoSettings.meta_keywords?.split(',').map(k => k.trim()),
    alternates: {
      canonical: seoSettings.canonical_url || 'https://supermalkarawaci.co.id',
    },
    robots: {
      index: seoSettings.robots?.includes('index') ?? true,
      follow: seoSettings.robots?.includes('follow') ?? true,
    },
    openGraph: {
      title: seoSettings.og_title || seoSettings.meta_title,
      description: seoSettings.og_description || seoSettings.meta_description,
      images: seoSettings.og_image_url ? [{ url: seoSettings.og_image_url }] : [],
      type: seoSettings.og_type as any || 'website',
    },
    twitter: {
      card: seoSettings.twitter_card || 'summary_large_image',
      site: seoSettings.twitter_site || '',
      creator: seoSettings.twitter_creator || '',
    },
    verification: {
      google: seoSettings.google_site_verification || undefined,
      other: {
        'msvalidate.01': seoSettings.bing_site_verification || '',
      },
    },
  };
}

export default async function RootLayout({ children }) {
  const analyticsSettings = await getAnalyticsSettings();

  return (
    <html lang="id">
      <head>
        {/* Google Analytics 4 */}
        {analyticsSettings?.google_analytics_id && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${analyticsSettings.google_analytics_id}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${analyticsSettings.google_analytics_id}');
                `,
              }}
            />
          </>
        )}

        {/* Google Tag Manager */}
        {analyticsSettings?.google_tag_manager_id && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtag/js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${analyticsSettings.google_tag_manager_id}');
              `,
            }}
          />
        )}

        {/* Meta Pixel */}
        {analyticsSettings?.meta_pixel_id && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${analyticsSettings.meta_pixel_id}');
                fbq('track', 'PageView');
              `,
            }}
          />
        )}
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
```

### Method 3: Custom Scripts Injection

**Create a ScriptsInjector Component:**

```typescript
// components/scripts-injector.tsx
import { getActiveScripts } from '@/lib/settings';

export async function ScriptsInjector({
  injectionPoint
}: {
  injectionPoint: 'head_start' | 'head_end' | 'body_start' | 'body_end'
}) {
  const scripts = await getActiveScripts(injectionPoint);

  if (!scripts || scripts.length === 0) {
    return null;
  }

  return (
    <>
      {scripts.map((script) => {
        if (script.setting_type === 'script') {
          return (
            <script
              key={script.id}
              dangerouslySetInnerHTML={{ __html: script.value }}
            />
          );
        }

        if (script.setting_type === 'meta_tag') {
          return (
            <div
              key={script.id}
              dangerouslySetInnerHTML={{ __html: script.value }}
            />
          );
        }

        if (script.setting_type === 'json_ld') {
          return (
            <script
              key={script.id}
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: script.value }}
            />
          );
        }

        if (script.setting_type === 'custom_html') {
          return (
            <div
              key={script.id}
              dangerouslySetInnerHTML={{ __html: script.value }}
            />
          );
        }

        return null;
      })}
    </>
  );
}
```

**Use in Layout:**

```typescript
// app/layout.tsx
import { ScriptsInjector } from '@/components/scripts-injector';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <ScriptsInjector injectionPoint="head_start" />
        {/* ... other head elements ... */}
        <ScriptsInjector injectionPoint="head_end" />
      </head>
      <body>
        <ScriptsInjector injectionPoint="body_start" />
        {children}
        <ScriptsInjector injectionPoint="body_end" />
      </body>
    </html>
  );
}
```

---

## Verification Checklist

### Admin Dashboard (This Repo)

- [ ] **SEO Settings Page** - Can save meta title, description, OG tags
  - URL: `/settings/seo`
  - Test: Change title, save, refresh, verify data persists

- [ ] **Analytics Settings Page** - Can save GA-4, GTM, Meta Pixel IDs
  - URL: `/settings/analytics`
  - Test: Add GA-4 ID (e.g., `G-TEST123`), save, verify in database

- [ ] **Custom Scripts Manager** - Can create/edit/delete custom scripts
  - URL: `/settings/scripts`
  - Test: Create a test script, verify it shows in database

- [ ] **Database Verification**
  - Check Supabase Dashboard
  - Table: `site_settings`
  - Look for rows with keys: `settings_seo`, `settings_analytics`
  - Verify `value` column contains JSON data

### Public Website (SK-Web-V3 Repo)

- [ ] **Supabase Connection** - Verify public website can query Supabase
  - Check if `supabase.ts` file exists and is configured
  - Verify environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- [ ] **Meta Tags Applied** - Verify SEO settings appear in page HTML
  - Visit homepage: `https://supermalkarawaci.co.id`
  - View page source (Ctrl+U)
  - Check for:
    ```html
    <title>Your Meta Title from Settings</title>
    <meta name="description" content="Your meta description...">
    <meta property="og:title" content="...">
    <meta property="og:image" content="...">
    ```

- [ ] **Analytics Tracking Active** - Verify GA-4/GTM is loaded
  - Visit homepage
  - Open DevTools → Network tab
  - Filter: `google-analytics` or `googletagmanager`
  - Should see requests to:
    - `https://www.googletagmanager.com/gtag/js?id=G-...`
    - `https://www.google-analytics.com/g/collect?...`

- [ ] **GA-4 Real-Time Reports** - Verify tracking is working
  - Go to Google Analytics → Reports → Real-time
  - Visit the website
  - Should see yourself in real-time users

- [ ] **Custom Scripts Injected** - Verify custom scripts appear in HTML
  - Create a test script in admin: `<!-- TEST SCRIPT -->`
  - Set injection point to `head_end`
  - Mark as active
  - Visit public website
  - View source
  - Search for `TEST SCRIPT` comment

---

## Testing Flow

### 1. Test SEO Settings

**In Admin Dashboard:**
1. Go to `/settings/seo`
2. Set Meta Title: `Supermal Karawaci - Test Title 123`
3. Set Meta Description: `This is a test description to verify settings are working properly. It should appear in the page source code.`
4. Click "Save Changes"

**In Public Website:**
1. Clear browser cache
2. Visit `https://supermalkarawaci.co.id`
3. View page source (Ctrl+U)
4. Search for "Test Title 123"
5. Search for "This is a test description"
6. ✅ If found = Settings are working
7. ❌ If not found = Settings are NOT being applied

### 2. Test Analytics Settings

**In Admin Dashboard:**
1. Go to `/settings/analytics`
2. Set Google Analytics ID: `G-TEST123456`
3. Click "Save Changes"

**In Public Website:**
1. Visit `https://supermalkarawaci.co.id`
2. Open DevTools → Network tab
3. Reload page
4. Search for: `G-TEST123456`
5. ✅ If found in network requests = Analytics working
6. ❌ If not found = Analytics NOT injected

### 3. Test Custom Scripts

**In Admin Dashboard:**
1. Go to `/settings/scripts`
2. Click "Create Script"
3. Fill in:
   - Display Name: `Test Script`
   - Key: `test_script`
   - Type: `Script`
   - Injection Point: `Body End`
   - Value: `<script>console.log('Settings working!');</script>`
   - Active: ✅ Yes
4. Save

**In Public Website:**
1. Visit `https://supermalkarawaci.co.id`
2. Open DevTools → Console
3. Look for: `Settings working!`
4. ✅ If found = Custom scripts working
5. ❌ If not found = Custom scripts NOT injected

---

## Database Direct Query

If you want to verify settings directly in Supabase:

```sql
-- Get SEO settings
SELECT value
FROM site_settings
WHERE key = 'settings_seo';

-- Get Analytics settings
SELECT value
FROM site_settings
WHERE key = 'settings_analytics';

-- Get all active custom scripts
SELECT key, display_name, setting_type, injection_point, is_active, value
FROM site_settings
WHERE is_active = true
  AND key NOT LIKE 'settings_%'
ORDER BY sort_order;
```

---

## Common Issues & Troubleshooting

### Issue 1: Settings Save But Don't Apply

**Symptoms:**
- Settings save successfully in admin
- Database shows correct data
- Public website still shows old/default values

**Causes:**
- Public website not fetching settings from database
- Cache not cleared (Next.js cache, browser cache, CDN cache)
- Settings fetching code not implemented in public website

**Solution:**
1. Check if public website has settings fetch functions
2. Clear all caches
3. Verify Supabase connection in public website
4. Check environment variables are correct

### Issue 2: Analytics Not Tracking

**Symptoms:**
- GA-4 ID saved in admin
- No tracking data in Google Analytics
- No network requests to googletagmanager.com

**Causes:**
- Analytics scripts not injected in public website layout
- Wrong GA-4 ID format
- Ad blockers blocking requests

**Solution:**
1. Verify analytics injection code exists in public website
2. Check GA-4 ID format (should be `G-XXXXXXXXXX`)
3. Test in incognito mode (disable ad blockers)
4. Check Google Analytics real-time reports

### Issue 3: Meta Tags Not Appearing

**Symptoms:**
- SEO settings saved
- View source shows default/hardcoded meta tags
- Settings not reflected in HTML

**Causes:**
- Public website using hardcoded metadata
- `generateMetadata()` not implemented
- SSR/SSG not fetching settings at build time

**Solution:**
1. Implement `generateMetadata()` in public website
2. Remove hardcoded metadata
3. Ensure settings are fetched server-side

---

## Next Steps for Public Website (SK-Web-V3)

1. **Check if settings fetching is implemented**
   - Look for functions that query `site_settings` table
   - Check if they're used in layouts/pages

2. **Implement missing functionality**
   - Add `generateMetadata()` to root layout
   - Add analytics scripts injection
   - Add custom scripts injection

3. **Test thoroughly**
   - Use the verification checklist above
   - Test in production environment
   - Verify with actual Google Analytics

4. **Monitor**
   - Check GA-4 real-time reports regularly
   - Verify SEO changes take effect
   - Monitor console for errors

---

## Contact & Support

**Admin Dashboard Repo:** [SK-Web-Admin-Dashboard](current repo)
**Public Website Repo:** [SK-Web-V3](https://github.com/Supermal-Karawaci/SK-Web-V3)
**Database:** Supabase PostgreSQL
**Documentation Date:** January 14, 2026

---

## Quick Reference

### Admin Dashboard URLs
- SEO Settings: `/settings/seo`
- Analytics Settings: `/settings/analytics`
- Custom Scripts: `/settings/scripts`
- General Settings: `/settings`

### Database Table
- Table: `site_settings`
- Location: Supabase PostgreSQL
- Key Settings: `settings_seo`, `settings_analytics`, `settings_general`

### Public Website
- URL: https://supermalkarawaci.co.id
- Repo: https://github.com/Supermal-Karawaci/SK-Web-V3
- Framework: (To be determined - likely Next.js)

---

**End of Handoff Document**
