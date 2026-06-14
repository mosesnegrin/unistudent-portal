# UniStudent Portal

UniStudent Portal is a production-ready Next.js student platform for university communities. It uses Supabase for authentication, database, roles, moderation, and storage, and is ready to deploy on Vercel.

The app intentionally ships with no fake universities, users, events, offers, notes, or marketplace posts. After setup, you add real records yourself through Supabase and the admin dashboard.

## Features

- University-first email and password authentication
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
7. Copy your service role key into `SUPABASE_SERVICE_ROLE_KEY`.
8. Keep `NEXT_PUBLIC_APP_URL=http://localhost:3000` for local development.
9. Install packages:

```bash
npm install
```

10. Start the app:

```bash
npm run dev
```

11. Open `http://localhost:3000`.

## Run the Supabase Migration

1. Open your Supabase project.
2. Go to SQL Editor.
3. Run [supabase/migrations/001_initial_schema.sql](/Users/mosesnegrin/Documents/UniStudent%20Portal/supabase/migrations/001_initial_schema.sql) first if this is a new database.
4. Run [supabase/migrations/002_auth_permissions_provider_info.sql](/Users/mosesnegrin/Documents/UniStudent%20Portal/supabase/migrations/002_auth_permissions_provider_info.sql) after the first migration.
5. Run [supabase/migrations/003_fix_admin_queries_and_content_visibility.sql](/Users/mosesnegrin/Documents/UniStudent%20Portal/supabase/migrations/003_fix_admin_queries_and_content_visibility.sql) after the second migration.
6. Run [supabase/migrations/004_fix_visibility_users_rsvp_actions.sql](/Users/mosesnegrin/Documents/UniStudent%20Portal/supabase/migrations/004_fix_visibility_users_rsvp_actions.sql) after the third migration.
7. Run [supabase/migrations/005_events_uploads_terms_footer.sql](/Users/mosesnegrin/Documents/UniStudent%20Portal/supabase/migrations/005_events_uploads_terms_footer.sql) after the fourth migration.

These migrations create and update all tables, roles, RLS policies, triggers, indexes, storage buckets, phone support, provider references, and role-based insert permissions.

## Create Your First University

Before anyone can log in, add a real university:

1. In Supabase, go to Table Editor.
2. Open `universities`.
3. Insert a row:
   - `name`: your university name
   - `allowed_email_domain`: for example `lbs.ac.at`
   - `is_active`: `true`
4. Save.

The login and signup dropdown now shows this university. Users must use an email ending in that domain or the matching admin-style domain.

Example:

- `allowed_email_domain`: `lbs.ac.at`
- Student email accepted: `name@lbs.ac.at`
- Admin-style email accepted: `name@admin.lbs.ac.at`

Admin-style emails do not automatically receive admin permissions. They only pass the email-domain check. Admin roles still need to be assigned manually through `user_roles` or `/admin/users`.

## Supabase Email Confirmation

The app uses Supabase email + password authentication.

If you want users to log in immediately after signup:

1. Open Supabase.
2. Go to Authentication.
3. Go to Providers.
4. Open Email.
5. Turn Confirm email OFF.
6. Save.

If Confirm email is ON, users may need to confirm their email before they receive a session and can log in.

## Create the First Super Admin

1. Go to the app login page.
2. Select the university you created.
3. Open the Sign up tab.
4. Enter your full name, matching university email, and password.
5. Create the account.
6. If email confirmation is enabled, confirm the email before continuing.
7. In Supabase, open Table Editor.
8. Open `profiles` and find your user row.
9. Open `roles` and copy the `id` for `super_admin`.
10. Open `user_roles`.
11. Insert a row:
   - `user_id`: your profile `id`
   - `role_id`: the `super_admin` role id
12. Log in again. You should now land in `/admin`.

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
   - `SUPABASE_SERVICE_ROLE_KEY`
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
3. Use the Sign up tab to create an account with a valid university email and password.
4. If Supabase email confirmation is enabled, confirm the email.
5. Use the Log in tab with the same university, email, and password.
6. Confirm you reach `/dashboard` or `/admin` if your account has an admin role.

## Using the Admin Dashboard

- `/admin`: statistics and shortcuts
- `/admin/users`: user list, university filter, role assignment, role removal
- Super admins can delete users from `/admin/users`; university admins cannot see or use deletion.
- `/admin/events`: approve, reject, or flag events
- `/admin/materials`: moderate notes and uploaded materials
- `/admin/lessons`: moderate lesson listings
- `/admin/marketplace`: moderate buy/sell posts
- `/admin/offers`: add partner offers and discounts
- `/admin/announcements`: publish official announcements
- `/admin/reports`: review reports and flagged content
- `/admin/universities`: add universities and guide pages
- `/admin/terms`: super-admin-only site terms, labels, and dashboard external button settings

Super admins see users and submitted content across all universities. University admins see only users and submitted content for their own university.

Admin moderation pages use table views. Pending rows show Approve and Reject actions. Approved rows remain visible with a green approved badge. Rejected rows remain visible with a red rejected badge. Delete is available for pending, approved, and rejected content with a confirmation dialog.

If `/admin/users` or admin tables are empty when data exists, check that `SUPABASE_SERVICE_ROLE_KEY` is present in `.env.local` and Vercel. Admin management reads use that key server-side only so RLS cannot hide legitimate admin data.

`/admin/users` loads profiles, role assignments, and role names with separate server-side queries to avoid ambiguous Supabase relationship embeds.

`/admin/events` shows RSVP counts for each event. Admins can expand the RSVP section to see participant name, email, phone, and registration time. Super admins see all event RSVPs; university admins see RSVPs only for their university events.

Migration `005` fixes event visibility policies and keeps event page queries aligned with the dashboard’s approved/university event logic.

## Adding Real Content

Content creation is role-based:

- Events: `event_creator`, `university_admin`, `super_admin`
- Private lessons: `tutor`, `university_admin`, `super_admin`
- Notes/materials: `notes_seller`, `university_admin`, `super_admin`
- Marketplace: `student`, `university_admin`, `super_admin`
- Offers/partnerships: `partner`, `university_admin`, `super_admin`

Normal user-created content starts as `pending`. Admins approve it before it appears publicly.

Approved listings show provider information on the right side. The app shows name, email, and phone when the profile has a phone number. If an admin created the listing, it displays `Official / Admin` with the admin email when available.

Users can add an optional phone number in `/profile`.

User-side content pages have tabs:

- Events: All future events, My registered events, Create event when allowed
- Lessons: All lessons, My lesson requests, Offer lesson when allowed
- Materials: All materials, My material requests/downloads, Upload material when allowed
- Marketplace: All items, My marketplace posts, Sell item when allowed
- Offers: All offers, My offers/partner posts when allowed, Add offer when allowed

Create/upload tabs are hidden unless the user has the correct role. If approved content does not show on user pages, confirm the item has `moderation_status = approved`, the user belongs to the same `university_id`, and the latest RLS migration has been run.

Event registration types:

- `internal_rsvp`: students register inside the portal and can cancel registration.
- `external_link`: students use Register externally, which opens the external URL.
- `contact_organizer`: students see Contact organizer with email/phone.
- `none`: no registration button is shown.

Action buttons:

- Materials: Download for free files, Request material for request-based free materials, Contact seller for paid materials.
- Marketplace: Contact seller.
- Lessons: Request lesson for free lessons, Contact tutor for paid lessons.
- Offers: Open offer when a link exists, Contact provider when only contact details exist.

Announcements, offers, and guide pages support optional image and document uploads through Supabase Storage buckets `announcement-assets`, `offer-assets`, and `guide-assets`. Images display in cards/pages, and documents show a Download document button.

The internal Community tab has been removed. The dashboard can show a customizable external-link button controlled by `/admin/terms` keys `home_external_button_label` and `home_external_button_url`. If the URL is empty, the button is hidden.

All student and admin pages include the footer: `Made by Moysis Negrin. 2026`.

Admins can add:

- Universities and allowed domains
- Offers and partner discounts
- Official announcements
- New to Vienna guide pages
- User roles and permissions

## Important Security Notes

- Do not expose your Supabase service role key in this app.
- `SUPABASE_SERVICE_ROLE_KEY` is required only for secure server-side user deletion from Supabase Auth.
- Never import or use `SUPABASE_SERVICE_ROLE_KEY` in client components.
- Browser-facing app code uses only the anon public key, protected by Supabase RLS.
- Keep RLS enabled.
- Add real content only. The project does not seed demo records.
