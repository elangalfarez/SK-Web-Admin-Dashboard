# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Supermal Karawaci Admin Dashboard - A production Next.js 15 admin dashboard for managing a shopping mall's website content (events, tenants, blog, promotions, VIP cards, and site settings). Built with TypeScript, Tailwind CSS, and Supabase.

## Development Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack
npm run build            # Production build
npm start                # Start production server

# Quality
npm run typecheck        # Run TypeScript compiler without emitting files
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
```

## Architecture Patterns

### Server Actions Pattern

All CRUD operations use Next.js Server Actions located in `src/actions/`:
- Each module has its own action file (e.g., `events.ts`, `blog.ts`, `tenants.ts`)
- Server actions MUST:
  1. Be marked with `"use server"` directive
  2. Check user authentication via `getCurrentSession()`
  3. Check user permissions via `checkUserPermission(userId, module, action)`
  4. Log activities via `logActivity()` for audit trail
  5. Return `ActionResult<T>` type using `successResponse()` or `errorResponse()`
  6. Call `revalidatePath()` after mutations to update cached data

Example pattern from `src/actions/events.ts`:
```typescript
export async function createEvent(data: CreateEventInput): Promise<ActionResult<Event>> {
  const session = await getCurrentSession();
  if (!session) return errorResponse("Unauthorized");

  const hasPermission = await checkUserPermission(session.userId, "events", "create");
  if (!hasPermission) return errorResponse("Forbidden");

  // ... perform operation ...

  await logActivity({
    userId: session.userId,
    action: "create",
    module: "events",
    // ...
  });

  revalidatePath("/events");
  return successResponse(result);
}
```

### Supabase Client Selection

**CRITICAL**: Always use the correct Supabase client for the context:

1. **Server Components & Server Actions**: Use `createClient()` from `@/lib/supabase/server`
   - Respects Row Level Security (RLS)
   - Handles cookies for session management

2. **Client Components**: Use `createClient()` from `@/lib/supabase/client`
   - For real-time subscriptions and client-side data fetching

3. **Admin Operations**: Use `createAdminClient()` from `@/lib/supabase/server`
   - **WARNING**: Bypasses RLS! Only use for:
     - Permission checks that need to query across all roles/permissions
     - System-level operations that require elevated privileges
     - Password hashing/verification in auth operations

### Permission System

The app uses a granular role-based permission system:
- **Super Admin**: Bypasses all permission checks (role name: `super_admin`)
- **Permissions**: Defined by `module` (e.g., "events", "blog") and `action` (e.g., "view", "create", "edit", "delete")
- **Permission Checks**: Required in every Server Action before operations
- Use `checkUserPermission(userId, module, action)` from `@/lib/supabase/permission-check`

### Authentication

Custom authentication system (NOT Supabase Auth):
- Password-based login with bcrypt hashing stored in `admin_users` table
- Session tokens stored in HTTP-only cookies
- Middleware protects routes (see `middleware.ts`)
- Auth state managed via `getCurrentSession()` from `src/actions/auth.ts`

### Activity Logging

All CRUD operations MUST log activity for audit trail:
```typescript
await logActivity({
  userId: session.userId,
  action: "create" | "update" | "delete" | "view",
  module: "events" | "blog" | "tenants" | etc.,
  resourceType: "event",
  resourceId: event.id,
  resourceName: event.title,
  oldValues: {...},  // For updates/deletes
  newValues: {...},  // For creates/updates
});
```

### Route Groups

- `(auth)`: Public authentication routes (`/login`)
- `(dashboard)`: Protected admin routes (all others)
- Route protection enforced by `middleware.ts`

## Key Directories

```
src/
├── actions/           # Server Actions (ALL mutations go here)
├── app/
│   ├── (auth)/       # Login page
│   ├── (dashboard)/  # Protected admin pages
│   └── api/          # API routes
├── components/       # Organized by feature/domain
│   ├── [feature]/   # Feature-specific components
│   ├── shared/      # Cross-feature shared components
│   └── ui/          # Radix UI primitives (button, dialog, etc)
├── lib/
│   ├── constants/   # App-wide constants
│   ├── supabase/    # Supabase clients and helpers
│   ├── utils/       # Utility functions
│   └── validations/ # Zod schemas for form validation
└── types/
    └── database.ts  # TypeScript types for all DB tables
```

## Theming & Styling

**CRITICAL**: Never use hardcoded colors. Always use semantic design tokens:

```tsx
// ✅ CORRECT
<div className="bg-primary text-foreground border-border">

// ❌ WRONG
<div className="bg-yellow-500 text-gray-900 border-gray-300">
```

Theme tokens are defined in `src/app/globals.css` as CSS variables and work with both light/dark themes. The primary color is gold (`hsl(45 93% 47%)`).

## Form Validation

All forms use React Hook Form + Zod:
1. Define Zod schema in `src/lib/validations/[module].ts`
2. Use `@hookform/resolvers/zod` for validation
3. Server Actions receive validated data, but should still validate again (never trust client)

## Database Types

All TypeScript types for database tables are in `src/types/database.ts`:
- Keep in sync with Supabase schema
- JSONB fields like `Event.images` are typed as arrays with specific shapes
- Use these types in Server Actions return values and component props

## Image Handling

Images are stored in Supabase Storage:
- Upload via `uploadFile()` from `@/lib/supabase/storage`
- Returns public URL to store in database
- Next.js Image component configured for Supabase domains in `next.config.js`
- Event/blog images support both string URLs (legacy) and structured objects with url/alt/caption

## Common Gotchas

1. **Admin Client Usage**: Only use `createAdminClient()` when absolutely necessary (permission checks, auth operations). Default to `createClient()`.

2. **Revalidation**: Always call `revalidatePath()` after mutations to update Next.js cache.

3. **Permission Checks**: Every Server Action (except auth actions) MUST check permissions before proceeding.

4. **Activity Logging**: All CRUD operations should log activity for audit compliance.

5. **Session Validation**: Always validate session exists before accessing `session.userId`.

6. **JSONB Arrays**: Database JSONB arrays (like `Event.tags`, `Event.images`) need normalization when read from DB.

7. **Slug Generation**: Use `generateSlug()` from `@/lib/utils/slug` for URL-friendly slugs.

## Environment Variables

Required in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Windows Development

This project is developed on Windows. When running bash-style commands:
- Git commands work as expected
- Use Windows-compatible paths (backslashes or forward slashes both work)
- Node.js and npm work natively