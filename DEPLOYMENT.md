# Deployment Guide

## 1. Prepare Supabase

Create a Supabase project, then run the SQL migration from:

[supabase/migrations/001_initial_schema.sql](/Users/mosesnegrin/Documents/UniStudent%20Portal/supabase/migrations/001_initial_schema.sql)

After the migration, add your first university in the `universities` table.

## 2. Prepare GitHub

Create a new empty GitHub repository and push this project:

```bash
git init
git add .
git commit -m "Initial UniStudent Portal app"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/unistudent-portal.git
git push -u origin main
```

## 3. Connect Vercel

1. Open Vercel.
2. Click Add New Project.
3. Import the GitHub repository.
4. Keep the framework as Next.js.
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL`
6. Deploy.

## 4. Update Supabase Auth

In Supabase Authentication URL Configuration:

- Site URL: your Vercel URL
- Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://YOUR-VERCEL-DOMAIN.vercel.app/auth/callback`

## 5. Test Production

1. Visit your Vercel URL.
2. Confirm it redirects to `/login`.
3. Select a real active university.
4. Use a matching email domain.
5. Confirm the login email returns you to the deployed app.
