# Deployment Guide

## 1. Prepare Supabase

Create a Supabase project, then run the SQL migration from:

[supabase/migrations/001_initial_schema.sql](/Users/mosesnegrin/Documents/UniStudent%20Portal/supabase/migrations/001_initial_schema.sql)

After the migration, add your first university in the `universities` table.

The app uses Supabase email + password authentication. If you want instant login after signup, open Supabase, then Authentication, Providers, Email, and turn Confirm email OFF. If Confirm email stays ON, users must confirm their email before logging in.

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

The callback URL is used when Supabase email confirmation is enabled.

## 5. Email Domains

Each active university has one normal domain in `universities.allowed_email_domain`.

If the domain is `lbs.ac.at`, the app accepts:

- `name@lbs.ac.at`
- `name@admin.lbs.ac.at`

The `admin.` domain only allows authentication. It does not grant admin permissions. Admin permissions must still be assigned in Supabase through `user_roles`.

## 6. Test Production

1. Visit your Vercel URL.
2. Confirm it redirects to `/login`.
3. Select a real active university.
4. Create an account with a matching email domain and password.
5. Confirm the email if Supabase asks for confirmation.
6. Log in with the same email and password.
7. Confirm the app opens `/dashboard` or `/admin` depending on assigned roles.
