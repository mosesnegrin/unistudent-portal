alter table public.offers
  add column if not exists moderation_status public.moderation_status not null default 'approved',
  add column if not exists moderation_notes text,
  add column if not exists flag_count integer not null default 0;

create index if not exists offers_public_status_idx
  on public.offers (university_id, is_austria_wide, moderation_status, created_at desc);

drop policy if exists "students view relevant offers" on public.offers;
create policy "students view relevant approved offers"
on public.offers
for select
using (
  (
    moderation_status = 'approved'
    and (is_austria_wide = true or public.same_university(university_id))
  )
  or created_by = auth.uid()
  or public.can_admin_university(university_id)
  or public.is_super_admin()
);

drop policy if exists "admins manage offers" on public.offers;
create policy "admins manage offers"
on public.offers
for all
using (
  public.is_super_admin()
  or public.can_admin_university(university_id)
)
with check (
  public.is_super_admin()
  or public.can_admin_university(university_id)
);

drop policy if exists "authorized users create offers" on public.offers;
create policy "authorized users create pending offers"
on public.offers
for insert
with check (
  created_by = auth.uid()
  and (
    (
      public.has_role('partner')
      and university_id is not null
      and public.same_university(university_id)
      and is_austria_wide = false
      and moderation_status = 'pending'
    )
    or (
      public.has_role('university_admin')
      and public.can_admin_university(university_id)
    )
    or public.is_super_admin()
  )
);

drop policy if exists "students view approved events" on public.events;
create policy "users view relevant events"
on public.events
for select
using (
  (moderation_status = 'approved' and public.same_university(university_id))
  or created_by = auth.uid()
  or public.can_admin_university(university_id)
  or public.is_super_admin()
);

drop policy if exists "students view approved lessons" on public.lessons;
create policy "users view relevant lessons"
on public.lessons
for select
using (
  (moderation_status = 'approved' and public.same_university(university_id))
  or created_by = auth.uid()
  or public.can_admin_university(university_id)
  or public.is_super_admin()
);

drop policy if exists "students view approved materials" on public.materials;
create policy "users view relevant materials"
on public.materials
for select
using (
  (moderation_status = 'approved' and public.same_university(university_id))
  or created_by = auth.uid()
  or public.can_admin_university(university_id)
  or public.is_super_admin()
);

drop policy if exists "students view approved marketplace items" on public.marketplace_items;
create policy "users view relevant marketplace items"
on public.marketplace_items
for select
using (
  (moderation_status = 'approved' and public.same_university(university_id))
  or seller_id = auth.uid()
  or public.can_admin_university(university_id)
  or public.is_super_admin()
);

drop policy if exists "users view own and university profiles" on public.profiles;
create policy "users view own university and admin profiles"
on public.profiles
for select
using (
  id = auth.uid()
  or public.same_university(university_id)
  or public.can_admin_university(university_id)
  or public.is_super_admin()
);

drop policy if exists "users view relevant role assignments" on public.user_roles;
create policy "users view relevant role assignments"
on public.user_roles
for select
using (
  user_id = auth.uid()
  or public.is_super_admin()
  or public.can_admin_university((select p.university_id from public.profiles p where p.id = user_id))
);
