alter table public.events
  add column if not exists registration_type text not null default 'internal_rsvp'
    check (registration_type in ('internal_rsvp', 'external_link', 'contact_organizer', 'none')),
  add column if not exists external_registration_url text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text;

update public.events
set registration_type = 'internal_rsvp'
where registration_type is null;

drop policy if exists "users manage own rsvps" on public.event_rsvps;
create policy "users manage own rsvps"
on public.event_rsvps
for all
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.events e
    where e.id = event_id
      and e.registration_type = 'internal_rsvp'
      and e.moderation_status = 'approved'
      and public.same_university(e.university_id)
  )
);

drop policy if exists "admins view rsvps" on public.event_rsvps;
create policy "admins view event rsvps"
on public.event_rsvps
for select
using (
  public.is_super_admin()
  or public.can_admin_university((select e.university_id from public.events e where e.id = event_id))
);

drop policy if exists "users view relevant events" on public.events;
create policy "users view relevant events"
on public.events
for select
using (
  (moderation_status = 'approved' and public.same_university(university_id))
  or created_by = auth.uid()
  or public.can_admin_university(university_id)
  or public.is_super_admin()
);
