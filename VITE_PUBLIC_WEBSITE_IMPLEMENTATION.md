# Vite Public Website Implementation Guide

**Repository:** SK-Web-V3 (Your public-facing website)
**Framework:** Vite + React
**Current Issue:** Uses hardcoded scripts, not reading from structured settings

---

## 🎯 Goal

Update your public website to:
1. Read Analytics Settings from Supabase
2. Inject GTM/GA-4/Meta Pixel dynamically
3. Read SEO Settings from Supabase
4. Apply meta tags dynamically

---

## 📁 Files to Create/Update in SK-Web-V3

### Step 1: Create Settings Helper

**File:** `src/lib/settings.ts`

```typescript
// src/lib/settings.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Cache to avoid repeated database calls
const settingsCache = new Map<string, any>();

async function getSettingsGroup(key: string, defaultValue: any = {}) {
  // Check cache
  if (settingsCache.has(key)) {
    return settingsCache.get(key);
  }

  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error || !data?.value) {
      return defaultValue;
    }

    const parsed = JSON.parse(data.value);
    settingsCache.set(key, parsed);
    return parsed;
  } catch (error) {
    console.error(`Failed to fetch ${key}:`, error);
    return defaultValue;
  }
}

export async function getAnalyticsSettings() {
  return getSettingsGroup('settings_analytics', {
    google_analytics_id: '',
    google_tag_manager_id: '',
    meta_pixel_id: '',
    tiktok_pixel_id: '',
    hotjar_id: '',
  });
}

export async function getSeoSettings() {
  return getSettingsGroup('settings_seo', {
    meta_title: 'Supermal Karawaci',
    meta_description: '',
    meta_keywords: '',
    og_title: '',
    og_description: '',
    og_image_url: '',
    canonical_url: 'https://supermalkarawaci.co.id',
    robots: 'index, follow',
  });
}

export function clearCache() {
  settingsCache.clear();
}
```

---

### Step 2: Create Analytics Component

**File:** `src/components/Analytics.tsx`

```typescript
// src/components/Analytics.tsx
import { useEffect, useState } from 'react';
import { getAnalyticsSettings } from '@/lib/settings';

export function Analytics() {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    getAnalyticsSettings().then(setSettings);
  }, []);

  useEffect(() => {
    if (!settings) return;

    // Google Tag Manager
    if (settings.google_tag_manager_id) {
      injectGTM(settings.google_tag_manager_id);
    }

    // Google Analytics 4
    if (settings.google_analytics_id) {
      injectGA4(settings.google_analytics_id);
    }

    // Meta Pixel
    if (settings.meta_pixel_id) {
      injectMetaPixel(settings.meta_pixel_id);
    }
  }, [settings]);

  return null; // This component doesn't render anything
}

function injectGTM(gtmId: string) {
  // GTM Head Script
  const scriptTag = document.createElement('script');
  scriptTag.innerHTML = `
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${gtmId}');
  `;
  document.head.appendChild(scriptTag);

  // GTM Body Noscript
  const noscript = document.createElement('noscript');
  noscript.innerHTML = `
    <iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}"
    height="0" width="0" style="display:none;visibility:hidden"></iframe>
  `;
  document.body.insertBefore(noscript, document.body.firstChild);
}

function injectGA4(gaId: string) {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);

  const inlineScript = document.createElement('script');
  inlineScript.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${gaId}');
  `;
  document.head.appendChild(inlineScript);
}

function injectMetaPixel(pixelId: string) {
  const script = document.createElement('script');
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(script);
}
```

---

### Step 3: Create SEO Component

**File:** `src/components/SEO.tsx`

```typescript
// src/components/SEO.tsx
import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { getSeoSettings } from '@/lib/settings';

export function SEO() {
  const [seo, setSeo] = useState<any>(null);

  useEffect(() => {
    getSeoSettings().then(setSeo);
  }, []);

  if (!seo) return null;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{seo.meta_title}</title>
      <meta name="description" content={seo.meta_description} />
      {seo.meta_keywords && <meta name="keywords" content={seo.meta_keywords} />}

      {/* Canonical URL */}
      {seo.canonical_url && <link rel="canonical" href={seo.canonical_url} />}

      {/* Robots */}
      <meta name="robots" content={seo.robots} />

      {/* Open Graph */}
      <meta property="og:title" content={seo.og_title || seo.meta_title} />
      <meta property="og:description" content={seo.og_description || seo.meta_description} />
      {seo.og_image_url && <meta property="og:image" content={seo.og_image_url} />}
      <meta property="og:type" content={seo.og_type || 'website'} />

      {/* Twitter Card */}
      <meta name="twitter:card" content={seo.twitter_card || 'summary_large_image'} />
      {seo.twitter_site && <meta name="twitter:site" content={seo.twitter_site} />}
      {seo.twitter_creator && <meta name="twitter:creator" content={seo.twitter_creator} />}
    </Helmet>
  );
}
```

---

### Step 4: Update App Component

**File:** `src/App.tsx` (or wherever your root component is)

```typescript
// src/App.tsx
import { HelmetProvider } from 'react-helmet-async';
import { Analytics } from './components/Analytics';
import { SEO } from './components/SEO';

function App() {
  return (
    <HelmetProvider>
      {/* Analytics - injects tracking scripts */}
      <Analytics />

      {/* SEO - updates meta tags */}
      <SEO />

      {/* Your app content */}
      <div className="app">
        {/* ... your existing components ... */}
      </div>
    </HelmetProvider>
  );
}

export default App;
```

---

### Step 5: Verify Environment Variables

**File:** `.env` (in SK-Web-V3 root)

```bash
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Make sure these match your Supabase project!

---

## 🧪 Testing

### Test Analytics
1. Run the app: `npm run dev`
2. Open DevTools → Network tab
3. Look for:
   - `googletagmanager.com/gtm.js?id=GTM-KFSPGVKK`
   - `google-analytics.com/...`
4. ✅ If you see these requests, GTM/GA are working

### Test SEO
1. Visit the homepage
2. View page source (Ctrl+U)
3. Look for:
   - `<title>Supermal Karawaci - Shopping</title>`
   - `<meta name="description" content="Discover the best...">`
   - `<meta property="og:image" content="...">`
4. ✅ If you see these tags, SEO is working

---

## 🚀 Deployment

1. Commit changes to SK-Web-V3
2. Push to GitHub
3. Deploy (Vercel/Netlify auto-deploys)
4. Test on production: https://supermalkarawaci.co.id

---

## ✅ After Implementation

**ONLY AFTER the public website is using structured settings:**

1. Go back to admin dashboard
2. Run the cleanup SQL to delete:
   - `google_tag_manager` (redundant)
   - `gtm_body` (redundant)
   - `site_title` (redundant)
   - `site_description` (redundant)
   - `og_image` (redundant)
3. Keep:
   - `schema_org` (custom)
   - `settings_seo` (structured)
   - `settings_analytics` (structured)
   - `settings_general` (structured)

---

## 📝 Summary

**Before:** Public website fetches individual scripts (gtm_body, site_title, etc.)
**After:** Public website fetches structured settings (settings_analytics, settings_seo)

This makes it:
- ✅ Easier to manage (one place for all analytics IDs)
- ✅ Cleaner admin dashboard (no redundant scripts)
- ✅ More maintainable (structured data instead of raw HTML)

