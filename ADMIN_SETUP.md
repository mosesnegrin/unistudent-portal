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

`/admin/users` visibility:

- Super admin: sees all users from all universities.
- University admin: sees only users from their own university.

The user table shows full name, email, university, phone, roles, created date, and actions.

The user table is loaded with separate server-side queries for profiles, user role assignments, and role names. This avoids Supabase relationship ambiguity between `profiles` and `user_roles`.

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
- Manage guide material in `/admin/guide`
- Manage guide material in `/admin/guide`
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

## Moderation Workflow

Admin moderation pages are table-based:

- Pending items show Approve and Reject.
- Approved items stay visible with a green approved badge.
- Rejected items stay visible with a red rejected badge.
- Delete is available on pending, approved, and rejected items after confirmation.

Super admins see submitted content from every university. University admins see submitted content only from their own university.

In `/admin/events`, each event row shows an RSVP count. Expanding it shows participant full name, email, phone when available, and registration date/time.

Migration `005` fixes event visibility policies so dashboard events and `/events` use the same approved/university event logic.

## User Page Tabs

Students and partners see tabs on the content pages:

- Events: All future events, My registered events, Create event when allowed
- Lessons: All lessons, My lesson requests, Offer lesson when allowed
- Materials: All materials, My material requests/downloads, Upload material when allowed
- Marketplace: All items, My marketplace posts, Sell item when allowed
- Offers: All offers, My offers/partner posts, Add offer when allowed

Create/upload tabs are hidden unless the user has the correct role.

Event registration types:

- Internal RSVP: Register and Cancel registration happen in the portal.
- External link: Register externally opens the provided URL.
- Contact organizer: shows organizer email/phone.
- None: no registration button appears.

Button meanings:

- Register: internal event RSVP.
- Register externally: event registration happens outside the portal.
- Contact seller: paid material or marketplace contact.
- Contact tutor: paid lesson contact.
- Request lesson/material: free request-based content.
- Open offer: opens the partner offer link.
- Contact provider: shows offer provider contact details.

## Uploads

Announcements, offers, and guide pages support optional image and document uploads. The app uses Supabase Storage buckets `announcement-assets`, `offer-assets`, and `guide-assets`.

Images display inside cards/pages. Documents appear as Download document buttons.

## App Settings

Admins can access `/admin/settings` to edit app settings such as `community_button_label` and `community_button_url`.

The internal Community tab has been removed. The dashboard external button appears for normal users only when `community_button_url` has a value.

The app footer reads: `Made by Moysis Negrin. 2026`.

## Auto-Delete Deadlines

Admin-managed content can have an optional `auto_delete_at` deadline. Once the deadline is in the past, the content is hidden from user-facing pages. Admins can still review and delete it from admin pages.

## RLS Troubleshooting

If content does not show:

1. Confirm the latest migration was run.
2. Confirm the content has `moderation_status = approved`.
3. Confirm the user profile has the correct `university_id`.
4. Confirm the admin has `super_admin` or `university_admin` in `user_roles`.
5. Confirm `SUPABASE_SERVICE_ROLE_KEY` is set for admin management pages.
