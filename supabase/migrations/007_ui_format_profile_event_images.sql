alter table public.events
  add column if not exists image_url text;

insert into storage.buckets (id, name, public)
values ('event-assets', 'event-assets', true)
on conflict (id) do update set public = true;

drop policy if exists "authenticated users read event assets" on storage.objects;
create policy "authenticated users read event assets"
on storage.objects
for select
to authenticated
using (bucket_id = 'event-assets');

drop policy if exists "authorized users upload event assets" on storage.objects;
create policy "authorized users upload event assets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'event-assets'
  and (
    public.has_role('event_creator')
    or public.has_role('university_admin')
    or public.is_super_admin()
  )
);

drop policy if exists "authorized users update event assets" on storage.objects;
create policy "authorized users update event assets"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'event-assets'
  and (
    public.has_role('event_creator')
    or public.has_role('university_admin')
    or public.is_super_admin()
  )
)
with check (
  bucket_id = 'event-assets'
  and (
    public.has_role('event_creator')
    or public.has_role('university_admin')
    or public.is_super_admin()
  )
);
