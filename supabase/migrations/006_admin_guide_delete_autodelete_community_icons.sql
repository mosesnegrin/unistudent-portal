alter table public.events add column if not exists auto_delete_at timestamptz;
alter table public.offers add column if not exists auto_delete_at timestamptz;
alter table public.announcements add column if not exists auto_delete_at timestamptz;
alter table public.guide_pages add column if not exists auto_delete_at timestamptz;
alter table public.materials add column if not exists auto_delete_at timestamptz;
alter table public.lessons add column if not exists auto_delete_at timestamptz;
alter table public.marketplace_items add column if not exists auto_delete_at timestamptz;

create table if not exists public.app_settings (
  key text primary key,
  value text not null default '',
  description text,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_app_settings_updated_at on public.app_settings;
create trigger set_app_settings_updated_at
before update on public.app_settings
for each row execute function public.set_updated_at();

alter table public.app_settings enable row level security;

drop policy if exists "authenticated users read app settings" on public.app_settings;
create policy "authenticated users read app settings"
on public.app_settings
for select
to authenticated
using (true);

drop policy if exists "admins manage app settings" on public.app_settings;
create policy "admins manage app settings"
on public.app_settings
for all
using (public.has_role('university_admin') or public.is_super_admin())
with check (public.has_role('university_admin') or public.is_super_admin());

insert into public.app_settings (key, value, description) values
  ('community_button_label', 'Community', 'Dashboard external community button label'),
  ('community_button_url', '', 'Dashboard external community button URL')
on conflict (key) do nothing;

drop policy if exists "users view relevant events" on public.events;
create policy "users view relevant events"
on public.events
for select
using (
  (
    moderation_status = 'approved'
    and (auto_delete_at is null or auto_delete_at > now())
    and public.same_university(university_id)
  )
  or created_by = auth.uid()
  or public.can_admin_university(university_id)
  or public.is_super_admin()
);

drop policy if exists "users view relevant lessons" on public.lessons;
create policy "users view relevant lessons"
on public.lessons
for select
using (
  (
    moderation_status = 'approved'
    and (auto_delete_at is null or auto_delete_at > now())
    and public.same_university(university_id)
  )
  or created_by = auth.uid()
  or public.can_admin_university(university_id)
  or public.is_super_admin()
);

drop policy if exists "users view relevant materials" on public.materials;
create policy "users view relevant materials"
on public.materials
for select
using (
  (
    moderation_status = 'approved'
    and (auto_delete_at is null or auto_delete_at > now())
    and public.same_university(university_id)
  )
  or created_by = auth.uid()
  or public.can_admin_university(university_id)
  or public.is_super_admin()
);

drop policy if exists "users view relevant marketplace items" on public.marketplace_items;
create policy "users view relevant marketplace items"
on public.marketplace_items
for select
using (
  (
    moderation_status = 'approved'
    and (auto_delete_at is null or auto_delete_at > now())
    and public.same_university(university_id)
  )
  or seller_id = auth.uid()
  or public.can_admin_university(university_id)
  or public.is_super_admin()
);

drop policy if exists "students view relevant approved offers" on public.offers;
create policy "students view relevant approved offers"
on public.offers
for select
using (
  (
    moderation_status = 'approved'
    and (auto_delete_at is null or auto_delete_at > now())
    and (is_austria_wide = true or public.same_university(university_id))
  )
  or created_by = auth.uid()
  or public.can_admin_university(university_id)
  or public.is_super_admin()
);

drop policy if exists "students view published guide pages" on public.guide_pages;
create policy "students view published guide pages"
on public.guide_pages
for select
using (
  (
    is_published = true
    and (auto_delete_at is null or auto_delete_at > now())
    and (university_id is null or public.same_university(university_id))
  )
  or public.can_admin_university(university_id)
  or (university_id is null and public.is_super_admin())
);

drop policy if exists "students view published announcements" on public.announcements;
create policy "students view published announcements"
on public.announcements
for select
using (
  (
    is_published = true
    and (auto_delete_at is null or auto_delete_at > now())
    and (university_id is null or public.same_university(university_id))
  )
  or public.can_admin_university(university_id)
  or (university_id is null and public.is_super_admin())
);
