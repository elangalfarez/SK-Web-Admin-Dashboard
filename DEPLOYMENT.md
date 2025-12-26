# Deployment Guide

## Prerequisites

1. Node.js 18+ installed
2. Supabase project created
3. Git repository (GitHub/GitLab/Bitbucket)

## Database Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down:
   - Project URL
   - Anon Key
   - Service Role Key

### 2. Run Database Migrations

Execute SQL files in Supabase SQL Editor in this order:

1. **Admin System**
   - `SQL_Query_for_admin_users` - Admin users table
   - `SQL_Query_Index_for_admin_and_homepage_content` - Performance indexes
   - `SQL_Query_for_Triggers_and_Functions` - DB functions
   - `SQL_Query_for_Admin_Users_Management_Views` - Admin views
   - `SQL_Query_for_Helper_Functions_Users` - User helpers
   - `SQL_Query_for_Seed_Admin_Roles` - Default roles
   - `SQL_Query_for_Admin_Permissions_Seed_Data` - Permissions
   - `SQL_Query_for_Role_Permissions_Assignments` - Role assignments

2. **Content Tables**
   - `SQL_Query_for_Tenants_Table` - Tenants
   - `SQL_Query_for_Tenant_Categories_Table` - Tenant categories
   - `SQL_Query_for_Mall_Floors_Table` - Mall floors
   - `SQL_Query_for_Events_Table` - Events
   - `SQL_Query_for_Blog_Table` - Blog posts
   - `SQL_Query_for_Promotions_Table` - Promotions
   - `SQL_Query_for_Contacts_Table` - Contact submissions

3. **Homepage Content**
   - `SQL_Query_Homepage_Content_Management_Tables` - Featured restaurants
   - `SQL_Query_for_Homepage_Content_Management_Tables_What_s_On` - What's On
   - `SQL_Query_for_Homepage_Content_Management_Views` - Views

4. **VIP System**
   - `SQL_Query_for_VIP_Tiers_System` - VIP tiers and benefits

5. **Views & Analytics**
   - `SQL_Query_for_Category_Views` - Category views
   - `SQL_Query_for_Tenant_Directory_Views_Table_Updated` - Tenant views
   - `SQL_Query_for_Featured_Tenants_Views` - Featured views
   - `SQL_Query_for_Promotions_Full_Views` - Promotion views
   - `SQL_Query_for_Dashboard_Analytics_Views` - Analytics
   - `SQL_Query_for_Contacts_Admin_Views` - Contact views
   - `SQL_Query_for_What_s_On_Frontend_Views` - What's On views

6. **Seed Data (Optional)**
   - `SQL_Query_for_Sample_Events_Insertion` - Sample events
   - `SQL_Query_for_Sample_Blog_Post_Insertion` - Sample posts
   - `SQL_Query_for_Populating_What_s_On_Feed` - Sample What's On
   - `SQL_Query_for_Inserting_Sample_Featured_Restaurants` - Sample restaurants

### 3. Create Storage Buckets

In Supabase Storage, create these buckets:

1. `events` - Event images
2. `tenants` - Tenant logos/images
3. `posts` - Blog post images
4. `promotions` - Promotion images
5. `homepage` - Homepage content images
6. `avatars` - User avatars

Set appropriate RLS policies for each bucket.

## Local Development

### 1. Clone Repository

```bash
git clone <repository-url>
cd supermal-admin
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Start Development Server

```bash
npm run dev
```

### 5. Access Dashboard

Open `http://localhost:3000` in your browser.

Default login:
- Email: `admin@supermalkarawaci.co.id`
- Password: `Admin123!`

## Production Deployment

### Option 1: Vercel (Recommended)

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select "Next.js" framework preset

3. **Configure Environment Variables**
   - Add all variables from `.env.local`
   - Use production Supabase credentials

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

5. **Custom Domain (Optional)**
   - Add your domain in Project Settings > Domains
   - Update DNS records as instructed

### Option 2: Self-Hosted

1. **Build Production Bundle**
```bash
npm run build
```

2. **Start Production Server**
```bash
npm start
```

3. **Using PM2 (Recommended)**
```bash
npm install -g pm2
pm2 start npm --name "supermal-admin" -- start
pm2 save
pm2 startup
```

4. **Nginx Reverse Proxy**
```nginx
server {
    listen 80;
    server_name admin.supermalkarawaci.co.id;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. **SSL with Certbot**
```bash
sudo certbot --nginx -d admin.supermalkarawaci.co.id
```

### Option 3: Docker

1. **Create Dockerfile**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

2. **Build and Run**
```bash
docker build -t supermal-admin .
docker run -p 3000:3000 --env-file .env.local supermal-admin
```

## Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Test login functionality
- [ ] Test image uploads
- [ ] Verify database connections
- [ ] Check all CRUD operations
- [ ] Test on mobile devices
- [ ] Set up monitoring (optional)
- [ ] Configure backup strategy

## Troubleshooting

### Common Issues

1. **"Unauthorized" errors**
   - Check SUPABASE_SERVICE_ROLE_KEY
   - Verify RLS policies

2. **Image uploads failing**
   - Check storage bucket permissions
   - Verify bucket names match code

3. **Build errors**
   - Run `npm run typecheck`
   - Check for missing dependencies

4. **Database connection issues**
   - Verify Supabase URL and keys
   - Check network/firewall settings

## Support

For issues, contact the development team or create an issue in the repository.
