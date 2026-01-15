# Supermal Karawaci Admin Dashboard

A production-ready, world-class admin dashboard for Supermal Karawaci mall website built with Next.js 15, TypeScript, Tailwind CSS, and Supabase.

> **For AI Assistants**: See [CLAUDE.md](CLAUDE.md) for architecture patterns, development guidelines, and codebase guidance.

## 🚀 Features

### Content Management
- **Events Management**: Create, edit, publish events with rich text editor, image uploads, tags, and SEO metadata
- **Blog/News**: Full blog CMS with categories, featured posts, and scheduled publishing
- **Promotions**: Tenant promotions with validity periods, discount types, and status management
- **Tenants Directory**: Complete tenant management with categories, floor mapping, and featured listings

### Homepage Management
- **What's On Feed**: Dynamic content feed with 5 content types (events, tenants, posts, promotions, custom)
- **Featured Restaurants**: Highlight F&B tenants with custom descriptions and images
- **Drag-to-reorder**: Easy content prioritization

### VIP Cards System
- **Tier Management**: 10-level VIP tiers with custom colors, spend requirements
- **Benefits Library**: Reusable benefits with category grouping
- **Card Preview**: Real-time card design preview

### Administration
- **Admin Users**: Full user CRUD with role assignment and password management
- **Roles & Permissions**: Granular permission control by module and action
- **Activity Logs**: Complete audit trail with filtering and search
- **Profile Settings**: Self-service profile and password management

### Site Settings
- **General Settings**: Site identity, branding, regional settings
- **Contact Info**: Address, phones, emails, map integration
- **Social Media**: Links to 7 social platforms
- **SEO Management**: Meta tags, Open Graph, Twitter Cards, site verification
- **Analytics**: Google Analytics 4, GTM, Meta Pixel, TikTok Pixel
- **Custom Scripts**: Code injection with 5 types and 4 injection points

### Technical Features
- 🌓 **Dark/Light/System Theme**: Full theme support with semantic tokens
- 📱 **Mobile-First**: Responsive design optimized for all devices
- ♿ **Accessible**: WCAG compliant with proper ARIA labels
- 🔐 **Secure Auth**: Password + Magic Link authentication
- 🎨 **Design Tokens**: No hardcoded colors, fully themeable
- ⚡ **Optimized**: Server Components, streaming, Suspense boundaries

## 📁 Project Structure

```
supermal-admin/
├── src/
│   ├── actions/           # Server Actions (CRUD operations)
│   │   ├── auth.ts
│   │   ├── analytics.ts
│   │   ├── blog.ts
│   │   ├── contacts.ts
│   │   ├── events.ts
│   │   ├── homepage.ts
│   │   ├── promotions.ts
│   │   ├── settings.ts
│   │   ├── tenants.ts
│   │   ├── users.ts
│   │   └── vip.ts
│   ├── app/
│   │   ├── (auth)/        # Auth routes (login)
│   │   ├── (dashboard)/   # Protected dashboard routes
│   │   └── api/           # API routes
│   ├── components/
│   │   ├── activity/      # Activity logs components
│   │   ├── blog/          # Blog management
│   │   ├── contacts/      # Contact submissions
│   │   ├── events/        # Events management
│   │   ├── homepage/      # Homepage content
│   │   ├── layout/        # Layout components
│   │   ├── promotions/    # Promotions management
│   │   ├── providers/     # Context providers
│   │   ├── settings/      # Site settings
│   │   ├── shared/        # Shared components
│   │   ├── tenants/       # Tenants management
│   │   ├── ui/            # UI primitives
│   │   ├── users/         # User management
│   │   └── vip/           # VIP cards system
│   ├── lib/
│   │   ├── constants/     # App constants
│   │   ├── supabase/      # Supabase client & helpers
│   │   ├── utils/         # Utility functions
│   │   └── validations/   # Zod schemas
│   └── types/
│       └── database.ts    # TypeScript types
├── middleware.ts          # Auth middleware
├── tailwind.config.ts     # Tailwind with theme tokens
└── next.config.js         # Next.js config
```

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with CSS Variables
- **Database**: Supabase (PostgreSQL)
- **Auth**: Custom password + magic link
- **Forms**: React Hook Form + Zod
- **Rich Text**: TipTap Editor
- **Icons**: Lucide React
- **Toasts**: Sonner

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- Supabase project

### Setup

1. **Clone and install dependencies**:
```bash
git clone <repository-url>
cd supermal-admin
npm install
```

2. **Environment variables**:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Run database migrations**:
Execute SQL files from the project knowledge in order in Supabase SQL Editor.

4. **Start development server**:
```bash
npm run dev
```

5. **Open browser**:
Navigate to `http://localhost:3000`

## 🗃 Database Schema

The project uses Supabase PostgreSQL with the following main tables:

### Core Tables
- `admin_users` - Admin user accounts
- `admin_roles` - Role definitions
- `admin_permissions` - Permission definitions
- `admin_user_roles` - User-role assignments
- `admin_role_permissions` - Role-permission assignments
- `admin_activity_logs` - Audit trail

### Content Tables
- `events` - Mall events
- `posts` - Blog posts
- `post_categories` - Blog categories
- `promotions` - Tenant promotions
- `tenants` - Mall tenants
- `tenant_categories` - Tenant categories
- `mall_floors` - Floor definitions
- `contacts` - Contact form submissions

### Homepage Tables
- `whats_on` - Homepage feed items
- `featured_restaurants` - Featured F&B tenants

### VIP Tables
- `vip_tiers` - VIP membership tiers
- `vip_benefits` - Benefit definitions
- `vip_tier_benefits` - Tier-benefit assignments

### Settings Tables
- `site_settings` - Site configuration (key-value)

## 🔐 Authentication

The admin dashboard uses a custom authentication system:

1. **Password Login**: bcrypt-hashed passwords stored in `admin_users`
2. **Magic Link**: Email-based passwordless login (optional)
3. **Session**: JWT tokens stored in HTTP-only cookies
4. **Middleware**: Route protection with permission checks

### Default Admin

After running seed data:
- Email: `admin@supermalkarawaci.co.id`
- Password: `Admin123!`

## 🎨 Theming

The project uses semantic design tokens defined in CSS variables:

```css
/* Light theme */
--background: 0 0% 100%;
--foreground: 222.2 84% 4.9%;
--primary: 45 93% 47%;  /* Gold */

/* Dark theme */
--background: 222.2 84% 4.9%;
--foreground: 210 40% 98%;
--primary: 45 93% 47%;  /* Gold */
```

**Never use hardcoded colors** - always use Tailwind classes like `bg-primary`, `text-foreground`, etc.

## 📱 Routes

| Route | Description |
|-------|-------------|
| `/login` | Admin login page |
| `/` | Dashboard overview |
| `/events` | Events management |
| `/tenants` | Tenants directory |
| `/blog` | Blog/news management |
| `/promotions` | Promotions management |
| `/homepage` | Homepage content |
| `/contacts` | Contact submissions |
| `/vip` | VIP cards system |
| `/users` | Admin users |
| `/activity` | Activity logs |
| `/settings` | Site settings |
| `/settings/profile` | User profile |

## 🧪 Testing Checklist

### Authentication
- [ ] Login with password
- [ ] Login with magic link
- [ ] Logout
- [ ] Session persistence
- [ ] Route protection

### Events
- [ ] List events with pagination
- [ ] Create event with all fields
- [ ] Edit event
- [ ] Delete event
- [ ] Publish/unpublish
- [ ] Image uploads

### Tenants
- [ ] List with filters
- [ ] Create tenant
- [ ] Edit tenant
- [ ] Category management
- [ ] Featured toggle

### Blog
- [ ] List posts
- [ ] Create with rich editor
- [ ] Category management
- [ ] Publish scheduling

### Promotions
- [ ] CRUD operations
- [ ] Status management
- [ ] Date filtering

### VIP
- [ ] Tier management
- [ ] Benefits library
- [ ] Tier-benefit assignment
- [ ] Card preview

### Homepage
- [ ] What's On management
- [ ] Featured Restaurants
- [ ] Reordering

### Users
- [ ] User CRUD
- [ ] Role management
- [ ] Permission assignment
- [ ] Profile update
- [ ] Password change

### Settings
- [ ] All settings sections
- [ ] Save/update settings
- [ ] Custom scripts

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Manual

```bash
npm run build
npm start
```

## 📚 Documentation

- **[README.md](README.md)**: General overview and setup instructions (this file)
- **[CLAUDE.md](CLAUDE.md)**: AI assistant guidance with architecture patterns and development guidelines
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)**: Detailed project statistics, file structure, and technical documentation

## 📝 License

Private - Supermal Karawaci

## 👥 Team

- **Developer**: AI-assisted development
- **Client**: Supermal Karawaci Marketing Team
