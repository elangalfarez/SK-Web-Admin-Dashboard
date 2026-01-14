# Public Website Implementation Guide

**Repository:** SK-Web-V3 (https://github.com/Supermal-Karawaci/SK-Web-V3)
**Purpose:** Implement Site Settings integration on the public-facing website

---

## Prerequisites

1. ✅ Admin Dashboard is saving settings correctly
2. ✅ Settings are stored in Supabase `site_settings` table
3. ✅ Public website has Supabase connection configured
4. ✅ Environment variables are set correctly

---

## Step 1: Create Settings Helper Functions

Create a new file to handle settings fetching.

### File: `lib/settings.ts`

```typescript
// lib/settings.ts
// Site settings helpers for fetching from Supabase

import { createClient } from '@/lib/supabase/client';

// Types
export interface SeoSettings {
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  og_title: string;
  og_description: string;
  og_image_url: string;
  og_type: 'website' | 'business.business' | 'place';
  twitter_card: 'summary' | 'summary_large_image';
  twitter_site: string;
  twitter_creator: string;
  canonical_url: string;
  robots: string;
  google_site_verification: string;
  bing_site_verification: string;
}

export interface AnalyticsSettings {
  google_analytics_id: string;
  google_tag_manager_id: string;
  meta_pixel_id: string;
  tiktok_pixel_id: string;
  hotjar_id: string;
}

export interface GeneralSettings {
  site_name: string;
  site_tagline: string;
  site_description: string;
  logo_url: string;
  logo_dark_url: string;
  favicon_url: string;
  default_language: string;
  timezone: string;
}

export interface SiteSetting {
  id: string;
  key: string;
  display_name: string;
  description: string | null;
  value: string;
  setting_type: 'meta_tag' | 'script' | 'link' | 'json_ld' | 'custom_html';
  injection_point: 'head_start' | 'head_end' | 'body_start' | 'body_end';
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Cache settings for 5 minutes to reduce database calls
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const settingsCache = new Map<string, { data: any; timestamp: number }>();

function getCached<T>(key: string): T | null {
  const cached = settingsCache.get(key);
  if (!cached) return null;

  const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
  if (isExpired) {
    settingsCache.delete(key);
    return null;
  }

  return cached.data as T;
}

function setCache(key: string, data: any): void {
  settingsCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Fetch a settings group from the database
 */
async function getSettingsGroup<T>(
  groupKey: string,
  defaultValues: T
): Promise<T> {
  // Check cache first
  const cached = getCached<T>(groupKey);
  if (cached) return cached;

  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', groupKey)
      .single();

    if (error || !data?.value) {
      return defaultValues;
    }

    const parsed = JSON.parse(data.value);
    const result = { ...defaultValues, ...parsed };

    // Cache the result
    setCache(groupKey, result);

    return result;
  } catch (error) {
    console.error(`Failed to fetch ${groupKey}:`, error);
    return defaultValues;
  }
}

/**
 * Get SEO settings
 */
export async function getSeoSettings(): Promise<SeoSettings> {
  const defaults: SeoSettings = {
    meta_title: 'Supermal Karawaci',
    meta_description: 'Shopping Mall in Tangerang',
    meta_keywords: '',
    og_title: '',
    og_description: '',
    og_image_url: '',
    og_type: 'website',
    twitter_card: 'summary_large_image',
    twitter_site: '',
    twitter_creator: '',
    canonical_url: 'https://supermalkarawaci.co.id',
    robots: 'index, follow',
    google_site_verification: '',
    bing_site_verification: '',
  };

  return getSettingsGroup('settings_seo', defaults);
}

/**
 * Get Analytics settings
 */
export async function getAnalyticsSettings(): Promise<AnalyticsSettings> {
  const defaults: AnalyticsSettings = {
    google_analytics_id: '',
    google_tag_manager_id: '',
    meta_pixel_id: '',
    tiktok_pixel_id: '',
    hotjar_id: '',
  };

  return getSettingsGroup('settings_analytics', defaults);
}

/**
 * Get General settings
 */
export async function getGeneralSettings(): Promise<GeneralSettings> {
  const defaults: GeneralSettings = {
    site_name: 'Supermal Karawaci',
    site_tagline: '',
    site_description: '',
    logo_url: '',
    logo_dark_url: '',
    favicon_url: '',
    default_language: 'id',
    timezone: 'Asia/Jakarta',
  };

  return getSettingsGroup('settings_general', defaults);
}

/**
 * Get active custom scripts for a specific injection point
 */
export async function getActiveScripts(
  injectionPoint: 'head_start' | 'head_end' | 'body_start' | 'body_end'
): Promise<SiteSetting[]> {
  // Check cache
  const cacheKey = `scripts_${injectionPoint}`;
  const cached = getCached<SiteSetting[]>(cacheKey);
  if (cached) return cached;

  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('injection_point', injectionPoint)
      .eq('is_active', true)
      .not('key', 'like', 'settings_%')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch scripts:', error);
      return [];
    }

    const scripts = data || [];
    setCache(cacheKey, scripts);

    return scripts;
  } catch (error) {
    console.error('Failed to fetch scripts:', error);
    return [];
  }
}

/**
 * Clear settings cache (useful after updates)
 */
export function clearSettingsCache(): void {
  settingsCache.clear();
}
```

---

## Step 2: Create Scripts Injection Component

Create a component to inject custom scripts into the HTML.

### File: `components/scripts-injector.tsx`

```typescript
// components/scripts-injector.tsx
// Component for injecting custom scripts from site settings

import { getActiveScripts } from '@/lib/settings';

export async function ScriptsInjector({
  injectionPoint,
}: {
  injectionPoint: 'head_start' | 'head_end' | 'body_start' | 'body_end';
}) {
  const scripts = await getActiveScripts(injectionPoint);

  if (!scripts || scripts.length === 0) {
    return null;
  }

  return (
    <>
      {scripts.map((script) => {
        // Script tags
        if (script.setting_type === 'script') {
          return (
            <script
              key={script.id}
              dangerouslySetInnerHTML={{ __html: script.value }}
            />
          );
        }

        // JSON-LD structured data
        if (script.setting_type === 'json_ld') {
          return (
            <script
              key={script.id}
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: script.value }}
            />
          );
        }

        // Meta tags
        if (script.setting_type === 'meta_tag') {
          return (
            <div
              key={script.id}
              dangerouslySetInnerHTML={{ __html: script.value }}
            />
          );
        }

        // Link tags
        if (script.setting_type === 'link') {
          return (
            <div
              key={script.id}
              dangerouslySetInnerHTML={{ __html: script.value }}
            />
          );
        }

        // Custom HTML
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

---

## Step 3: Create Analytics Component

Create a component specifically for analytics tracking codes.

### File: `components/analytics.tsx`

```typescript
// components/analytics.tsx
// Analytics tracking scripts

import { getAnalyticsSettings } from '@/lib/settings';

export async function Analytics() {
  const analytics = await getAnalyticsSettings();

  return (
    <>
      {/* Google Analytics 4 */}
      {analytics.google_analytics_id && (
        <>
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${analytics.google_analytics_id}`}
          />
          <script
            id="google-analytics"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${analytics.google_analytics_id}', {
                  page_path: window.location.pathname,
                });
              `,
            }}
          />
        </>
      )}

      {/* Google Tag Manager */}
      {analytics.google_tag_manager_id && (
        <script
          id="google-tag-manager"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtag/js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${analytics.google_tag_manager_id}');
            `,
          }}
        />
      )}

      {/* Meta (Facebook) Pixel */}
      {analytics.meta_pixel_id && (
        <>
          <script
            id="meta-pixel"
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
                fbq('init', '${analytics.meta_pixel_id}');
                fbq('track', 'PageView');
              `,
            }}
          />
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${analytics.meta_pixel_id}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}

      {/* TikTok Pixel */}
      {analytics.tiktok_pixel_id && (
        <script
          id="tiktok-pixel"
          dangerouslySetInnerHTML={{
            __html: `
              !function (w, d, t) {
                w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
                ttq.load('${analytics.tiktok_pixel_id}');
                ttq.page();
              }(window, document, 'ttq');
            `,
          }}
        />
      )}

      {/* Hotjar */}
      {analytics.hotjar_id && (
        <script
          id="hotjar"
          dangerouslySetInnerHTML={{
            __html: `
              (function(h,o,t,j,a,r){
                h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                h._hjSettings={hjid:${analytics.hotjar_id},hjsv:6};
                a=o.getElementsByTagName('head')[0];
                r=o.createElement('script');r.async=1;
                r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                a.appendChild(r);
              })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
            `,
          }}
        />
      )}
    </>
  );
}
```

---

## Step 4: Update Root Layout

Now update your root layout to use the settings.

### File: `app/layout.tsx`

```typescript
// app/layout.tsx
import type { Metadata } from 'next';
import { getSeoSettings } from '@/lib/settings';
import { Analytics } from '@/components/analytics';
import { ScriptsInjector } from '@/components/scripts-injector';
import './globals.css';

// Generate dynamic metadata from settings
export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings();

  return {
    title: seo.meta_title || 'Supermal Karawaci',
    description: seo.meta_description || 'Shopping Mall in Tangerang',
    keywords: seo.meta_keywords
      ? seo.meta_keywords.split(',').map(k => k.trim())
      : [],
    alternates: {
      canonical: seo.canonical_url || 'https://supermalkarawaci.co.id',
    },
    robots: {
      index: seo.robots?.includes('index') ?? true,
      follow: seo.robots?.includes('follow') ?? true,
    },
    openGraph: {
      title: seo.og_title || seo.meta_title,
      description: seo.og_description || seo.meta_description,
      images: seo.og_image_url ? [{ url: seo.og_image_url }] : [],
      type: seo.og_type || 'website',
      siteName: 'Supermal Karawaci',
      locale: 'id_ID',
    },
    twitter: {
      card: seo.twitter_card || 'summary_large_image',
      site: seo.twitter_site || '',
      creator: seo.twitter_creator || '',
      title: seo.og_title || seo.meta_title,
      description: seo.og_description || seo.meta_description,
      images: seo.og_image_url ? [seo.og_image_url] : [],
    },
    verification: {
      google: seo.google_site_verification || undefined,
      other: seo.bing_site_verification
        ? {
            'msvalidate.01': seo.bing_site_verification,
          }
        : undefined,
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        {/* Custom scripts - head start */}
        <ScriptsInjector injectionPoint="head_start" />

        {/* Analytics */}
        <Analytics />

        {/* Custom scripts - head end */}
        <ScriptsInjector injectionPoint="head_end" />
      </head>
      <body>
        {/* Custom scripts - body start */}
        <ScriptsInjector injectionPoint="body_start" />

        {children}

        {/* Custom scripts - body end */}
        <ScriptsInjector injectionPoint="body_end" />
      </body>
    </html>
  );
}
```

---

## Step 5: Optional - Cache Revalidation

If you want to automatically revalidate settings cache periodically:

### File: `app/api/revalidate-settings/route.ts`

```typescript
// app/api/revalidate-settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { clearSettingsCache } from '@/lib/settings';

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication check here
    const authHeader = request.headers.get('authorization');
    const secret = process.env.REVALIDATION_SECRET;

    if (secret && authHeader !== `Bearer ${secret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Clear in-memory cache
    clearSettingsCache();

    // Revalidate the root layout
    revalidatePath('/', 'layout');

    return NextResponse.json({
      success: true,
      revalidated: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to revalidate' },
      { status: 500 }
    );
  }
}
```

**Usage:**
```bash
# Call this endpoint after updating settings in admin
curl -X POST https://supermalkarawaci.co.id/api/revalidate-settings \
  -H "Authorization: Bearer YOUR_SECRET"
```

---

## Step 6: Environment Variables

Make sure these are set in your `.env.local` file:

```bash
# .env.local

# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: Revalidation secret for cache clearing
REVALIDATION_SECRET=your-secret-key-here
```

---

## Step 7: Testing

### Test SEO Settings

1. Update meta title in admin dashboard
2. Wait ~5 minutes (cache duration) or call revalidation endpoint
3. Visit public website
4. View source
5. Verify new title appears

### Test Analytics

1. Add GA-4 ID in admin dashboard
2. Revalidate cache
3. Visit public website
4. Open DevTools → Network
5. Look for `gtag` requests
6. Check Google Analytics real-time reports

### Test Custom Scripts

1. Create a test script in admin:
   ```html
   <script>console.log('Settings working!');</script>
   ```
2. Set injection point to `body_end`
3. Mark as active
4. Revalidate cache
5. Visit public website
6. Open DevTools → Console
7. Look for "Settings working!" message

---

## Advanced: Automatic Revalidation

To automatically revalidate when settings change in admin, you can add a webhook to the admin dashboard.

### In Admin Dashboard: `src/actions/settings.ts`

Add this after successful save:

```typescript
// After saving settings
await fetch('https://supermalkarawaci.co.id/api/revalidate-settings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.REVALIDATION_SECRET}`,
  },
});
```

Update the save functions:

```typescript
export async function saveSeoSettings(values: Record<string, any>) {
  const validated = seoSettingsSchema.safeParse(values);
  if (!validated.success) {
    return errorResponse(validated.error.errors[0].message);
  }

  const result = await saveSettingsGroup(SETTINGS_GROUPS.SEO, "SEO Settings", validated.data);

  // Revalidate public website cache
  if (result.success) {
    try {
      await fetch(process.env.NEXT_PUBLIC_SITE_URL + '/api/revalidate-settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REVALIDATION_SECRET}`,
        },
      });
    } catch (error) {
      console.error('Failed to revalidate public site:', error);
      // Don't fail the whole operation if revalidation fails
    }
  }

  return result;
}
```

Add to admin dashboard `.env`:

```bash
NEXT_PUBLIC_SITE_URL=https://supermalkarawaci.co.id
REVALIDATION_SECRET=your-secret-key-here
```

---

## Troubleshooting

### Settings Not Appearing

**Problem:** Meta tags still show default values

**Solutions:**
1. Check cache - wait 5 minutes or call revalidation endpoint
2. Verify Supabase connection works
3. Check browser console for errors
4. Verify settings exist in database
5. Clear browser cache

### Analytics Not Tracking

**Problem:** No tracking requests in Network tab

**Solutions:**
1. Verify analytics ID is saved correctly
2. Check browser console for errors
3. Disable ad blockers
4. Test in incognito mode
5. Verify analytics component is rendered

### Custom Scripts Not Injected

**Problem:** Scripts don't appear in page source

**Solutions:**
1. Verify script is marked as "active" in admin
2. Check injection point is correct
3. Verify script syntax is valid
4. Check for console errors
5. Revalidate cache

---

## Summary

After implementing these files, your public website will:

✅ Fetch SEO settings from Supabase
✅ Apply meta tags dynamically
✅ Inject Google Analytics tracking
✅ Inject GTM, Meta Pixel, TikTok Pixel, Hotjar
✅ Render custom scripts from admin dashboard
✅ Cache settings for performance
✅ Support cache revalidation

**Files Created:**
1. `lib/settings.ts` - Settings helper functions
2. `components/scripts-injector.tsx` - Custom scripts component
3. `components/analytics.tsx` - Analytics tracking component
4. `app/layout.tsx` - Updated root layout
5. `app/api/revalidate-settings/route.ts` - Cache revalidation endpoint

**Next Steps:**
1. Copy these files to SK-Web-V3 repository
2. Test using VERIFICATION_CHECKLIST.md
3. Deploy to production
4. Verify with Google Analytics

---

**Last Updated:** January 14, 2026
