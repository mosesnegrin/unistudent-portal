# Deployment Guide

## 1. Prepare Supabase

Create a Supabase project, then run the SQL migrations in order:

1. [supabase/migrations/001_initial_schema.sql](/Users/mosesnegrin/Documents/UniStudent%20Portal/supabase/migrations/001_initial_schema.sql)
2. [supabase/migrations/002_auth_permissions_provider_info.sql](/Users/mosesnegrin/Documents/UniStudent%20Portal/supabase/migrations/002_auth_permissions_provider_info.sql)
3. [supabase/migrations/003_fix_admin_queries_and_content_visibility.sql](/Users/mosesnegrin/Documents/UniStudent%20Portal/supabase/migrations/003_fix_admin_queries_and_content_visibility.sql)
4. [supabase/migrations/004_fix_visibility_users_rsvp_actions.sql](/Users/mosesnegrin/Documents/UniStudent%20Portal/supabase/migrations/004_fix_visibility_users_rsvp_actions.sql)

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
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL`
6. Deploy.

`SUPABASE_SERVICE_ROLE_KEY` is used only on the server for super admin user deletion from Supabase Auth. Never expose it in browser code.

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

## 6. Roles and Listings

Creation permissions are role-based:

- Events: `event_creator`, `university_admin`, `super_admin`
- Lessons: `tutor`, `university_admin`, `super_admin`
- Notes/materials: `notes_seller`, `university_admin`, `super_admin`
- Marketplace: `student`, `university_admin`, `super_admin`
- Offers: `partner`, `university_admin`, `super_admin`

Approved listings show who posted or offered them. Name and email are shown, and phone appears only when the user added it in `/profile`. Admin-created listings show `Official / Admin`.

## 7. Admin Workflow

`/admin/users` shows all users for super admins and only same-university users for university admins. Role changes and super-admin-only deletion happen from that table.

Moderation pages show pending, approved, and rejected content in one table. Pending rows can be approved or rejected. Any row can be deleted after confirmation. Approved content stays visible to admins after approval.

`/admin/users` avoids ambiguous joins by loading profiles, user role assignments, and roles separately on the server. `/admin/events` includes RSVP counts and expandable participant lists.

Events can use internal RSVP, external registration links, organizer contact details, or no registration button.

If users or approved content do not appear, verify:

- `SUPABASE_SERVICE_ROLE_KEY` exists in Vercel.
- The latest SQL migration has been run.
- Public content has `moderation_status = approved`.
- The viewer profile has the correct `university_id`.
- Event pages show current/future approved events; check event dates if a past event is not visible in the default event tab.

## 8. Test Production

1. Visit your Vercel URL.
2. Confirm it redirects to `/login`.
3. Select a real active university.
4. Create an account with a matching email domain and password.
5. Confirm the email if Supabase asks for confirmation.
6. Log in with the same email and password.
7. Confirm the app opens `/dashboard` or `/admin` depending on assigned roles.
8. Confirm content tabs appear on user pages, and create/upload tabs appear only for users with the correct roles.
9. Confirm event RSVP lists appear for admins in `/admin/events`.
