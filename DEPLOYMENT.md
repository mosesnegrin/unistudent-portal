# Deployment Guide

## 1. Prepare Supabase

Create a Supabase project, then run the SQL migrations in order:

1. [supabase/migrations/001_initial_schema.sql](/Users/mosesnegrin/Documents/UniStudent%20Portal/supabase/migrations/001_initial_schema.sql)
2. [supabase/migrations/002_auth_permissions_provider_info.sql](/Users/mosesnegrin/Documents/UniStudent%20Portal/supabase/migrations/002_auth_permissions_provider_info.sql)
3. [supabase/migrations/003_fix_admin_queries_and_content_visibility.sql](/Users/mosesnegrin/Documents/UniStudent%20Portal/supabase/migrations/003_fix_admin_queries_and_content_visibility.sql)
4. [supabase/migrations/004_fix_visibility_users_rsvp_actions.sql](/Users/mosesnegrin/Documents/UniStudent%20Portal/supabase/migrations/004_fix_visibility_users_rsvp_actions.sql)
5. [supabase/migrations/005_events_uploads_terms_footer.sql](/Users/mosesnegrin/Documents/UniStudent%20Portal/supabase/migrations/005_events_uploads_terms_footer.sql)
6. [supabase/migrations/006_admin_guide_delete_autodelete_community_icons.sql](/Users/mosesnegrin/Documents/UniStudent%20Portal/supabase/migrations/006_admin_guide_delete_autodelete_community_icons.sql)
7. [supabase/migrations/007_ui_format_profile_event_images.sql](/Users/mosesnegrin/Documents/UniStudent%20Portal/supabase/migrations/007_ui_format_profile_event_images.sql)
8. [supabase/migrations/008_company_role_university_settings_titles.sql](/Users/mosesnegrin/Documents/UniStudent%20Portal/supabase/migrations/008_company_role_university_settings_titles.sql)
9. [supabase/migrations/009_auth_without_university_dropdown_company_scope.sql](/Users/mosesnegrin/Documents/UniStudent%20Portal/supabase/migrations/009_auth_without_university_dropdown_company_scope.sql)
10. [supabase/migrations/010_routing_permissions_pending_domains.sql](/Users/mosesnegrin/Documents/UniStudent%20Portal/supabase/migrations/010_routing_permissions_pending_domains.sql)

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

`SUPABASE_SERVICE_ROLE_KEY` is used only on the server for platform-admin operations such as user deletion from Supabase Auth. Never expose it in browser code.

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

Login and signup no longer show a university dropdown. The app detects the matching university from the email domain after submission. Unknown domains show the unregistered-university message with a contact email. Inactive universities show the deactivated-university message.

Emails whose domain starts with `unistudents`, such as `name@unistudents.com`, bypass university-domain validation, automatically receive the `company` role after login/signup, and keep `profiles.university_id = null`. The `company` role is platform-wide. The `super_admin` role is scoped to one university.

## 6. Roles and Listings

Creation permissions are role-based:

- Events: `event_creator`, `university_admin`, `super_admin`
- Lessons: `tutor`, `university_admin`, `super_admin`
- Notes/materials: `notes_seller`, `university_admin`, `super_admin`
- Marketplace: `student`, `university_admin`, `super_admin`
- Offers: `partner`, `university_admin`, `super_admin`

The `company` role can create and manage all content platform-wide. The `super_admin` role can create and manage content for its own university.

Approved listings show who posted or offered them. Name and email are shown, and phone appears only when the user added it in `/profile`. Admin-created listings show `Official / Admin`.

## 7. Admin Workflow

`/admin/users` shows all users for company users and only same-university users for super admins and university admins. Role changes and scoped deletion happen from that table.

Moderation pages show pending, approved, and rejected content in one table. Pending rows can be approved or rejected. Any row can be deleted after confirmation. Approved content stays visible to admins after approval.

`/admin/users` avoids ambiguous joins by loading profiles, user role assignments, and roles separately on the server. `/admin/events` includes RSVP counts and expandable participant lists.

Events can use internal RSVP, external registration links, organizer contact details, or no registration button.

Migration `005` adds upload support for announcements, offers, and guide pages using `announcement-assets`, `offer-assets`, and `guide-assets`. Migration `006` removes Terms usage, adds `/admin/guide`, adds auto-delete fields, and keeps the app footer. Migration `007` adds event image uploads. Migration `008` adds the company role, university deactivation/reactivation support, per-university Community button settings, and company access policies. Migration `009` removes the login/signup university dropdown, makes company accounts university-free, limits super admins to their own university, and removes the Settings tab from the app.

Browser titles are dynamic: normal users see `UniStudents - [University Name] Portal`, university admins and super admins see `UniStudents - [University Name] Admin Dashboard`, company users without a selected university see `UniStudents` or `UniStudents - Admin Dashboard`, and company users with a selected context see that university in the title. The favicon matches the header logo.

The footer includes a contact link: `Made by Moysis Negrin. © 2026 · Contact`, opening `mailto:moysis.negrin@lbs.ac.at`.

Community button URLs are configured per university in `/admin/universities`. A university with an empty URL does not show the dashboard Community button to normal users.

Company users can deactivate or reactivate universities in `/admin/universities`. Deactivated university users, university admins, and super admins are blocked from logging in or continuing sessions; company users can still access admin controls.

If users or approved content do not appear, verify:

- `SUPABASE_SERVICE_ROLE_KEY` exists in Vercel.
- The latest SQL migration has been run.
- Public content has `moderation_status = approved`.
- The viewer profile has the correct `university_id`.
- Event pages show current/future approved events; check event dates if a past event is not visible in the default event tab.
- For uploads, confirm the storage buckets from migration `005` exist.

## 8. Test Production

1. Visit your Vercel URL.
2. Confirm it redirects to `/login`.
3. Create an account with a matching email domain and password.
4. Confirm the email if Supabase asks for confirmation.
5. Log in with the same email and password.
6. Confirm the app opens `/dashboard` or `/admin` depending on assigned roles.
7. Confirm content tabs appear on user pages, and create/upload tabs appear only for users with the correct roles.
8. Confirm event RSVP lists appear for admins in `/admin/events`.

## Latest Deployment Notes

- Run [supabase/migrations/010_routing_permissions_pending_domains.sql](/Users/mosesnegrin/Documents/UniStudent%20Portal/supabase/migrations/010_routing_permissions_pending_domains.sql) after migration `009`.
- The optional university URL structure was skipped for this release to avoid breaking the deployed App Router structure. Continue using `/dashboard`, `/events`, `/materials`, `/admin`, and the existing routes.
- The new `universities.short_code` column is available for future URL-slug work. Add values like `lbs`, `wu`, or `univie` manually in Supabase or from `/admin/universities`.
- Company `/admin/users` filtering now happens only through the header university switcher.
- Only company users can deactivate/reactivate universities.
- Main university domains can be edited in `/admin/universities`; admin domains are generated automatically as `admin.[domain]`.
- If a domain changes, affected users are blocked on the next protected page load unless their email matches the new main/admin domain.
- Waiting for approval, custom event types, announcement/guide draft workflows, and updated approval rules are included in this release.
