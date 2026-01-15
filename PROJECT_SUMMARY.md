# Project Summary - Supermal Karawaci Admin Dashboard

> **Note**: For AI assistant guidance, see [CLAUDE.md](CLAUDE.md) which contains architecture patterns and development guidelines.

## 📊 Project Statistics

| Metric | Value |
|--------|-------|
| **Total Files** | 177 TypeScript/TSX files |
| **Total Lines of Code** | 37,441 lines |
| **Components** | 82 React components |
| **Server Actions** | 12 action files (8,879 lines) |
| **Pages/Routes** | 40 pages (39 dashboard + 1 auth) |
| **Library Files** | 29 utilities + 11 validation schemas |
| **Framework** | Next.js 15 (App Router) |
| **Development Time** | 15 AI-assisted sessions |

## 🏗 Architecture Overview

### Frontend Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 15 App Router                     │
├─────────────────────────────────────────────────────────────┤
│  (auth)                    │  (dashboard)                   │
│  └── login/               │  ├── events/                   │
│      └── page.tsx         │  ├── tenants/                  │
│                           │  ├── blog/                     │
│                           │  ├── promotions/               │
│                           │  ├── homepage/                 │
│                           │  ├── contacts/                 │
│                           │  ├── vip/                      │
│                           │  ├── users/                    │
│                           │  ├── activity/                 │
│                           │  └── settings/                 │
├─────────────────────────────────────────────────────────────┤
│                    Components Layer                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │   UI    │ │ Shared  │ │ Layout  │ │Features │           │
│  │Primitives│ │Utils   │ │ Header  │ │ Events  │           │
│  │ Button  │ │ Image   │ │ Sidebar │ │ Tenants │           │
│  │ Card    │ │ Upload  │ │ Footer  │ │ Blog    │           │
│  │ Dialog  │ │ Editor  │ │         │ │ etc...  │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
├─────────────────────────────────────────────────────────────┤
│                    Server Actions                            │
│  auth.ts │ events.ts │ tenants.ts │ blog.ts │ etc...       │
├─────────────────────────────────────────────────────────────┤
│                    Supabase Client                           │
│  PostgreSQL │ Storage │ Auth │ Real-time (optional)        │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow
```
User Action → Server Action → Supabase → Response → UI Update
                    ↓
            Activity Logging
```

## 📁 Complete File Structure

### Actions (`src/actions/`)
| File | Lines | Description |
|------|-------|-------------|
| `auth.ts` | 267 | Authentication (login, logout, session) |
| `auth-user.ts` | 82 | User authentication helpers |
| `analytics.ts` | 544 | Dashboard stats, activity logs |
| `blog.ts` | 967 | Blog CRUD, categories |
| `contacts.ts` | 616 | Contact submissions |
| `events.ts` | 647 | Events CRUD |
| `homepage.ts` | 1,305 | What's On, Featured Restaurants |
| `promotions.ts` | 605 | Promotions CRUD |
| `settings.ts` | 770 | Site settings management |
| `tenants.ts` | 1,022 | Tenants CRUD, categories |
| `users.ts` | 1,207 | Users, roles, permissions |
| `vip.ts` | 847 | VIP tiers, benefits |
| **Total** | **8,879 lines** | **12 server action files** |

### Components (`src/components/`)

**Total: 82 component files across 14 feature categories**

| Category | Files | Description |
|----------|-------|-------------|
| **UI Primitives** | 16 | Radix-based components (button, dialog, input, etc.) |
| **Activity** | 7 | Activity logs and audit trail components |
| **Blog** | 5 | Blog/post management components |
| **Contacts** | 4 | Contact form submission components |
| **Events** | 4 | Event management components |
| **Homepage** | 4 | Homepage content management |
| **Layout** | 3 | Sidebar, header, page layouts |
| **Promotions** | 4 | Promotion management components |
| **Providers** | 3 | Context providers (theme, etc.) |
| **Settings** | 8 | Site settings components |
| **Shared** | 4 | Reusable widgets (uploader, editor, etc.) |
| **Tenants** | 6 | Tenant directory components |
| **Users** | 8 | User & permission management |
| **VIP** | 6 | VIP card system components |

#### Key Shared Widgets
- `image-uploader.tsx` - Drag-drop image upload
- `rich-text-editor.tsx` - TipTap WYSIWYG editor
- `data-table.tsx` - Reusable table with sorting/filtering
- `confirm-dialog.tsx` - Confirmation modals

### Pages (`src/app/`)

**Total: 40 pages (39 dashboard + 1 auth)**

#### Auth Routes (1 page)
| Route | Description |
|-------|-------------|
| `/login` | Admin login page |

#### Dashboard Routes (39 pages)
| Module | Pages | Routes |
|--------|-------|--------|
| **Dashboard** | 1 | `/` (overview with stats) |
| **Events** | 4 | List, create, detail `[id]`, edit `[id]/edit` |
| **Tenants** | 5 | List, create, detail `[id]`, edit `[id]/edit`, categories |
| **Blog** | 5 | List, create, detail `[id]`, edit `[id]/edit`, categories |
| **Promotions** | 4 | List, create, detail `[id]`, edit `[id]/edit` |
| **Homepage** | 3 | Overview, What's On, Featured Restaurants |
| **Contacts** | 2 | List, detail `[id]` |
| **VIP** | 5 | Overview, benefits, tier create, detail `[id]`, edit `[id]/edit` |
| **Users** | 2 | List, roles & permissions |
| **Activity** | 1 | Activity logs |
| **Settings** | 7 | General, profile, contact, social, SEO, analytics, scripts |

**Note:** The app includes 4 layout files (main dashboard, homepage section, settings section, users section) for nested layouts.

### Library (`src/lib/`)

**Total: 29 utility files + 11 validation schemas**

#### Supabase (`supabase/`)
- `client.ts` - Browser client for client components
- `server.ts` - Server client for Server Components/Actions
- `middleware.ts` - Middleware client for route protection
- `auth.ts` - Authentication helpers
- `storage.ts` - File upload helpers
- `permission-check.ts` - Permission validation utilities
- `index.ts` - Exports

#### Validations (`validations/`) - 11 Zod schemas
- `activity.ts` - Activity log schemas
- `blog.ts` - Blog/post schemas
- `contact.ts` - Contact form schemas
- `event.ts` - Event schemas
- `homepage.ts` - Homepage content schemas
- `promotion.ts` - Promotion schemas
- `settings.ts` - Site settings schemas
- `tenant.ts` - Tenant schemas
- `user.ts` - User/role/permission schemas
- `vip.ts` - VIP tier/benefit schemas
- `auth.ts` - Authentication schemas

#### Utils (`utils/`)
- API helpers, formatting, slug generation, class name utilities

#### Constants (`constants/`)
- Navigation items, app configuration, enums

### Types (`src/types/`)
- `database.ts` - TypeScript interfaces for all DB tables
- `auth.ts` - Authentication types

## 🎨 Design System

### Theme Tokens
```css
/* Primary Colors */
--primary: 45 93% 47%;        /* Gold */
--primary-foreground: 0 0% 100%;

/* Semantic Colors */
--success: 142 76% 36%;
--warning: 38 92% 50%;
--destructive: 0 84% 60%;

/* Surface Colors */
--background: 0 0% 100%;
--foreground: 222.2 84% 4.9%;
--muted: 210 40% 96%;
--card: 0 0% 100%;

/* Sidebar */
--sidebar-background: 222.2 84% 4.9%;
--sidebar-foreground: 210 40% 98%;
```

### Component Variants
- **Button**: default, destructive, outline, secondary, ghost, link
- **Badge**: default, secondary, success, warning, destructive, inactive
- **Card**: default, interactive (hover states)

## 🔐 Permission System

### Modules
- `events` - Event management
- `tenants` - Tenant directory
- `blog` - Blog management
- `promotions` - Promotions
- `contacts` - Contact submissions
- `vip` - VIP system
- `homepage` - Homepage content
- `settings` - Site settings
- `users` - User management

### Actions per Module
- `read` - View content
- `write` - Create/edit content
- `delete` - Delete content
- `publish` - Publish/unpublish

### Default Roles
1. **Super Admin** - All permissions
2. **Content Manager** - Content CRUD, no user management
3. **Editor** - Read and write, no delete
4. **Viewer** - Read only

## 📱 Responsive Breakpoints

| Breakpoint | Width | Target |
|------------|-------|--------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

## ⚡ Performance Optimizations

1. **Server Components** - Default for all pages
2. **Streaming** - Suspense boundaries for async data
3. **Image Optimization** - Next/Image with lazy loading
4. **Code Splitting** - Automatic route-based splitting
5. **Parallel Data Fetching** - Promise.all for multiple queries
6. **Revalidation** - Path-based cache invalidation

## 🧪 Quality Assurance

### Type Safety
- Strict TypeScript
- Zod validation on all forms
- Database types from schema

### Error Handling
- Try-catch on all server actions
- User-friendly error messages
- Console logging for debugging

### Accessibility
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Focus management
- Color contrast (4.5:1+)

## 📈 Future Enhancements

1. **Email Notifications** - Transactional emails
2. **File Manager** - Media library
3. **Bulk Operations** - Mass actions
4. **Export/Import** - CSV/Excel support
5. **Scheduled Publishing** - Queue system
6. **Real-time Updates** - Supabase subscriptions
7. **Mobile App** - React Native companion
8. **Multi-language** - i18n support

## 📚 Related Documentation

- **[README.md](README.md)** - Setup instructions and quick start guide
- **[CLAUDE.md](CLAUDE.md)** - AI assistant guidance with architecture patterns
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - This file (detailed project overview)

## 🙏 Credits

- **Next.js** - React framework
- **Tailwind CSS** - Utility-first CSS
- **Supabase** - Backend as a service
- **Radix UI** - Headless components
- **Lucide** - Icon library
- **TipTap** - Rich text editor
- **Zod** - Schema validation
- **Sonner** - Toast notifications
