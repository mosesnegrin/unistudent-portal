# Admin Setup Guide

## First University

Add a university directly in Supabase first:

1. Table Editor
2. `universities`
3. Insert:
   - `name`: real university name
   - `allowed_email_domain`: for example `lbs.ac.at`
   - `is_active`: `true`

The allowed domain is the part after `@` in the student email address.

## First Super Admin

1. Log in once through the app with your university email.
2. Open Supabase Table Editor.
3. Open `profiles` and copy your profile `id`.
4. Open `roles` and find the row where `name` is `super_admin`.
5. Copy that role `id`.
6. Open `user_roles`.
7. Insert:
   - `user_id`: your profile id
   - `role_id`: the super admin role id

Refresh the app. You should now see the admin dashboard.

## Add More Admins

Use `/admin/users`:

1. Find the user.
2. Choose `university_admin` or another role.
3. Click Add role.

Use `university_admin` for admins who should manage only their university. Use `super_admin` only for people who can manage all universities.

## Add Content

Use the admin dashboard:

- Add universities in `/admin/universities`
- Add guide pages in `/admin/universities`
- Add offers in `/admin/offers`
- Add announcements in `/admin/announcements`
- Review reported content in `/admin/reports`
- Approve student submissions in moderation pages

Students will only see approved content for their own university, plus Austria-wide offers and global announcements/guide pages.
