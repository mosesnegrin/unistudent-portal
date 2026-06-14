# UniStudent Portal

UniStudent Portal is a production-ready Next.js student platform for university communities. It uses Supabase for authentication, database, roles, moderation, and storage, and is ready to deploy on Vercel.

The app intentionally ships with no fake universities, users, events, offers, notes, or marketplace posts. After setup, you add real records yourself through Supabase and the admin dashboard.

## Features

- University-first login with Supabase OTP magic links
- Email domain validation per university
- Private app access only after login
- Roles: student, tutor, notes seller, event creator, partner, university admin, super admin
- Admin dashboard with user, role, moderation, reports, offers, announcements, guide, and university management
- Student dashboard with events, announcements, lessons, notes, marketplace, offers, guide, and community
- Pending/approved/rejected/flagged moderation flow
- Supabase Storage buckets for materials and marketplace assets
- Row Level Security policies for student, university admin, and super admin access

## Local Setup

1. Install Node.js 22 or newer.
2. Create a Supabase project at [supabase.com](https://supabase.com).
3. Copy `.env.example` to `.env.local`.
4. In Supabase, open Project Settings, then API.
5. Copy your Project URL into `NEXT_PUBLIC_SUPABASE_URL`.
6. Copy your anon public key into `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
7. Keep `NEXT_PUBLIC_APP_URL=http://localhost:3000` for local development.
8. Install packages:

```bash
npm install
```

9. Start the app:

```bash
npm run dev
```

10. Open `http://localhost:3000`.

## Run the Supabase Migration

1. Open your Supabase project.
2. Go to SQL Editor.
3. Open [supabase/migrations/001_initial_schema.sql](/Users/mosesnegrin/Documents/UniStudent%20Portal/supabase/migrations/001_initial_schema.sql).
4. Copy the full SQL file.
5. Paste it into Supabase SQL Editor.
6. Click Run.

This creates all tables, roles, RLS policies, triggers, indexes, and storage buckets.

## Create Your First University

Before anyone can log in, add a real university:

1. In Supabase, go to Table Editor.
2. Open `universities`.
3. Insert a row:
   - `name`: your university name
   - `allowed_email_domain`: for example `lbs.ac.at`
   - `is_active`: `true`
4. Save.

The login dropdown now shows this university. Students must use an email ending in that domain.

## Create the First Super Admin

1. Go to the app login page.
2. Select the university you created.
3. Enter your full name and matching university email.
4. Click the login link from your email.
5. In Supabase, open Table Editor.
6. Open `profiles` and find your user row.
7. Open `roles` and copy the `id` for `super_admin`.
8. Open `user_roles`.
9. Insert a row:
   - `user_id`: your profile `id`
   - `role_id`: the `super_admin` role id
10. Refresh the app. You should now land in `/admin`.

After that, use `/admin/users` to assign roles to other users.

## Create a GitHub Repository and Push

1. Go to [github.com](https://github.com).
2. Click New repository.
3. Name it `unistudent-portal`.
4. Keep it empty. Do not add a README from GitHub.
5. In this project folder, run:

```bash
git init
git add .
git commit -m "Initial UniStudent Portal app"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/unistudent-portal.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username.

## Deploy on Vercel

1. Go to [vercel.com](https://vercel.com).
2. Sign in with GitHub.
3. Click Add New Project.
4. Import your `unistudent-portal` repository.
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` with your Vercel URL, for example `https://unistudent-portal.vercel.app`
6. Click Deploy.

## Configure Supabase Auth URLs

In Supabase:

1. Open Authentication.
2. Open URL Configuration.
3. Set Site URL to your Vercel URL.
4. Add Redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://YOUR-VERCEL-DOMAIN.vercel.app/auth/callback`
5. Save.

## Test Login

1. Make sure your university exists and is active.
2. Open `/login`.
3. Select your university.
4. Enter a full name.
5. Enter an email ending in the allowed domain.
6. Click Send login link.
7. Open the email and click the link.
8. Confirm you reach `/dashboard` or `/admin` if your account has an admin role.

## Using the Admin Dashboard

- `/admin`: statistics and shortcuts
- `/admin/users`: user list, university filter, role assignment, role removal
- `/admin/events`: approve, reject, or flag events
- `/admin/materials`: moderate notes and uploaded materials
- `/admin/lessons`: moderate lesson listings
- `/admin/marketplace`: moderate buy/sell posts
- `/admin/offers`: add partner offers and discounts
- `/admin/announcements`: publish official announcements
- `/admin/reports`: review reports and flagged content
- `/admin/universities`: add universities and guide pages

## Adding Real Content

Students can submit events, lessons, notes/materials, and marketplace posts. These start as `pending`. Admins approve them before they appear publicly.

Admins can add:

- Universities and allowed domains
- Offers and partner discounts
- Official announcements
- New to Vienna guide pages
- User roles and permissions

## Important Security Notes

- Do not expose your Supabase service role key in this app.
- The app uses only the anon public key, protected by Supabase RLS.
- Keep RLS enabled.
- Add real content only. The project does not seed demo records.
