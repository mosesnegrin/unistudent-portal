# Admin Setup Guide

## First University

Add a university directly in Supabase first:

1. Table Editor
2. `universities`
3. Insert:
   - `name`: real university name
   - `allowed_email_domain`: for example `lbs.ac.at`
   - `is_active`: `true`

The allowed domain is the part after `@` in the student email address. The app also accepts an admin-style version of the same domain.

Example:

- `allowed_email_domain`: `lbs.ac.at`
- Accepted student email: `name@lbs.ac.at`
- Accepted admin-style email: `name@admin.lbs.ac.at`

Admin-style emails do not automatically get admin permissions. They are only allowed to sign up and log in. You still assign admin permissions manually through `user_roles`.

## Email and Password Auth

The app uses normal Supabase email + password authentication.

For instant login after signup:

1. Open Supabase.
2. Go to Authentication.
3. Go to Providers.
4. Open Email.
5. Turn Confirm email OFF.
6. Save.

If Confirm email is ON, users must confirm their email before they can log in.

## First Super Admin

1. Sign up once through the app with your university email and password.
2. Confirm your email if Supabase email confirmation is enabled.
3. Open Supabase Table Editor.
4. Open `profiles` and copy your profile `id`.
5. Open `roles` and find the row where `name` is `super_admin`.
6. Copy that role `id`.
7. Open `user_roles`.
8. Insert:
   - `user_id`: your profile id
   - `role_id`: the super admin role id

Log in again. You should now see the admin dashboard.

## Add More Admins

Use `/admin/users`:

1. Find the user.
2. Choose `university_admin` or another role.
3. Click Add role.

Use `university_admin` for admins who should manage only their university. Use `super_admin` only for people who can manage all universities.

## Delete Users

Only `super_admin` users can delete users in `/admin/users`. University admins do not see the delete button.

Deletion uses `SUPABASE_SERVICE_ROLE_KEY` on the server to remove the Supabase Auth user. The key must be added to `.env.local` and Vercel environment variables, but it must never be imported into client components or exposed in browser code.

A super admin cannot delete their own account from the dashboard. The delete button opens a confirmation modal before deletion.

When a user is deleted:

- Their Supabase Auth user is removed.
- Their profile and user roles are removed.
- Join records such as RSVPs and interests cascade.
- Approved listings keep their content, but provider references become empty when needed.

## Add Content

Use the admin dashboard:

- Add universities in `/admin/universities`
- Add guide pages in `/admin/universities`
- Add offers in `/admin/offers`
- Add announcements in `/admin/announcements`
- Review reported content in `/admin/reports`
- Approve student submissions in moderation pages

Students will only see approved content for their own university, plus Austria-wide offers and global announcements/guide pages.

Creation permissions:

- Events: `event_creator`, `university_admin`, `super_admin`
- Private lessons: `tutor`, `university_admin`, `super_admin`
- Notes/materials: `notes_seller`, `university_admin`, `super_admin`
- Marketplace items: `student`, `university_admin`, `super_admin`
- Offers/partnerships: `partner`, `university_admin`, `super_admin`

Approved listings show provider/contact information. Users can add an optional phone number in `/profile`; phone is shown publicly only when completed. Admin-created listings show `Official / Admin` with the admin email when available.
