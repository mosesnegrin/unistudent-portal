alter table public.announcements
  add column if not exists image_url text,
  add column if not exists document_url text,
  add column if not exists document_name text;

alter table public.offers
  add column if not exists image_url text,
  add column if not exists document_url text,
  add column if not exists document_name text;

alter table public.guide_pages
  add column if not exists image_url text,
  add column if not exists document_url text,
  add column if not exists document_name text;

create table if not exists public.site_terms (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text not null default '',
  description text,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_site_terms_updated_at on public.site_terms;
create trigger set_site_terms_updated_at
before update on public.site_terms
for each row execute function public.set_updated_at();

alter table public.site_terms enable row level security;

drop policy if exists "authenticated users read site terms" on public.site_terms;
create policy "authenticated users read site terms"
on public.site_terms
for select
to authenticated
using (true);

drop policy if exists "super admins manage site terms" on public.site_terms;
create policy "super admins manage site terms"
on public.site_terms
for all
using (public.is_super_admin())
with check (public.is_super_admin());

insert into public.site_terms (key, value, description, category) values
  ('home_external_button_label', 'Community', 'Dashboard external button label', 'home'),
  ('home_external_button_url', '', 'Dashboard external button URL', 'home'),
  ('role_tutor_label', 'Tutor', 'Display label for tutor role', 'roles'),
  ('role_event_creator_label', 'Event Creator', 'Display label for event creator role', 'roles'),
  ('role_notes_seller_label', 'Notes Seller', 'Display label for notes seller role', 'roles'),
  ('role_partner_label', 'Partner', 'Display label for partner role', 'roles'),
  ('guide_required_documents_label', 'Required Documents', 'Guide category label', 'guide')
on conflict (key) do nothing;

insert into storage.buckets (id, name, public)
values
  ('announcement-assets', 'announcement-assets', true),
  ('offer-assets', 'offer-assets', true),
  ('guide-assets', 'guide-assets', true)
on conflict (id) do update set public = true;

drop policy if exists "authenticated users read announcement assets" on storage.objects;
create policy "authenticated users read announcement assets"
on storage.objects
for select
to authenticated
using (bucket_id = 'announcement-assets');

drop policy if exists "authenticated users read offer assets" on storage.objects;
create policy "authenticated users read offer assets"
on storage.objects
for select
to authenticated
using (bucket_id = 'offer-assets');

drop policy if exists "authenticated users read guide assets" on storage.objects;
create policy "authenticated users read guide assets"
on storage.objects
for select
to authenticated
using (bucket_id = 'guide-assets');

drop policy if exists "admins upload announcement assets" on storage.objects;
create policy "admins upload announcement assets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'announcement-assets'
  and (public.has_role('university_admin') or public.is_super_admin())
);

drop policy if exists "admins upload offer assets" on storage.objects;
create policy "admins upload offer assets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'offer-assets'
  and (public.has_role('partner') or public.has_role('university_admin') or public.is_super_admin())
);

drop policy if exists "admins upload guide assets" on storage.objects;
create policy "admins upload guide assets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'guide-assets'
  and (public.has_role('university_admin') or public.is_super_admin())
);

drop policy if exists "admins update announcement assets" on storage.objects;
create policy "admins update announcement assets"
on storage.objects
for update
to authenticated
using (bucket_id = 'announcement-assets' and (public.has_role('university_admin') or public.is_super_admin()))
with check (bucket_id = 'announcement-assets' and (public.has_role('university_admin') or public.is_super_admin()));

drop policy if exists "admins update offer assets" on storage.objects;
create policy "admins update offer assets"
on storage.objects
for update
to authenticated
using (bucket_id = 'offer-assets' and (public.has_role('partner') or public.has_role('university_admin') or public.is_super_admin()))
with check (bucket_id = 'offer-assets' and (public.has_role('partner') or public.has_role('university_admin') or public.is_super_admin()));

drop policy if exists "admins update guide assets" on storage.objects;
create policy "admins update guide assets"
on storage.objects
for update
to authenticated
using (bucket_id = 'guide-assets' and (public.has_role('university_admin') or public.is_super_admin()))
with check (bucket_id = 'guide-assets' and (public.has_role('university_admin') or public.is_super_admin()));

drop policy if exists "users view relevant events" on public.events;
create policy "users view relevant events"
on public.events
for select
using (
  (moderation_status = 'approved' and (public.same_university(university_id) or public.is_super_admin()))
  or created_by = auth.uid()
  or public.can_admin_university(university_id)
  or public.is_super_admin()
);
