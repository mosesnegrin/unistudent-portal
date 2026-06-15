create or replace function public.is_company()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('company');
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('super_admin');
$$;

create or replace function public.is_university_admin(university uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.university_id = university
      and (
        public.has_role('university_admin')
        or public.has_role('super_admin')
      )
  );
$$;

create or replace function public.can_admin_university(university uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_company() or public.is_university_admin(university);
$$;

update public.profiles p
set university_id = null
where split_part(lower(coalesce(p.email, '')), '@', 2) like 'unistudents%'
   or exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = p.id
      and r.name = 'company'
   );

drop policy if exists "active universities are visible for login" on public.universities;
create policy "active universities are visible for login"
on public.universities
for select
using (
  is_active = true
  or public.same_university(id)
  or public.is_company()
);

drop policy if exists "authenticated users read university community settings" on public.universities;
create policy "authenticated users read university community settings"
on public.universities
for select
to authenticated
using (
  is_active = true
  or public.same_university(id)
  or public.is_company()
);

drop policy if exists "super admins manage universities" on public.universities;
drop policy if exists "admins manage scoped universities" on public.universities;
create policy "admins manage scoped universities"
on public.universities
for all
using (
  public.is_company()
  or public.is_university_admin(id)
)
with check (
  public.is_company()
  or public.is_university_admin(id)
);

drop policy if exists "users view own and university profiles" on public.profiles;
create policy "users view own and university profiles"
on public.profiles
for select
using (
  id = auth.uid()
  or public.can_admin_university(university_id)
);

drop policy if exists "admins update university profiles" on public.profiles;
create policy "admins update university profiles"
on public.profiles
for update
using (
  id = auth.uid()
  or public.can_admin_university(university_id)
)
with check (
  id = auth.uid()
  or public.can_admin_university(university_id)
);

drop policy if exists "users view relevant role assignments" on public.user_roles;
create policy "users view relevant role assignments"
on public.user_roles
for select
using (
  user_id = auth.uid()
  or public.can_admin_university((select p.university_id from public.profiles p where p.id = user_id))
);

drop policy if exists "admins assign roles" on public.user_roles;
create policy "admins assign roles"
on public.user_roles
for insert
with check (
  public.can_admin_university((select p.university_id from public.profiles p where p.id = user_id))
);

drop policy if exists "admins remove roles" on public.user_roles;
create policy "admins remove roles"
on public.user_roles
for delete
using (
  public.can_admin_university((select p.university_id from public.profiles p where p.id = user_id))
);

drop policy if exists "users view relevant events" on public.events;
drop policy if exists "students view approved events" on public.events;
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
);

drop policy if exists "users view relevant lessons" on public.lessons;
drop policy if exists "students view approved lessons" on public.lessons;
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
);

drop policy if exists "users view relevant materials" on public.materials;
drop policy if exists "students view approved materials" on public.materials;
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
);

drop policy if exists "users view relevant marketplace items" on public.marketplace_items;
drop policy if exists "students view approved marketplace items" on public.marketplace_items;
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
);

drop policy if exists "students view relevant approved offers" on public.offers;
drop policy if exists "students view relevant offers" on public.offers;
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
  or (university_id is null and public.is_company())
);

drop policy if exists "admins manage guide pages" on public.guide_pages;
create policy "admins manage guide pages"
on public.guide_pages
for all
using (
  public.can_admin_university(university_id)
  or (university_id is null and public.is_company())
)
with check (
  public.can_admin_university(university_id)
  or (university_id is null and public.is_company())
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
  or (university_id is null and public.is_company())
);

drop policy if exists "admins manage announcements" on public.announcements;
create policy "admins manage announcements"
on public.announcements
for all
using (
  public.can_admin_university(university_id)
  or (university_id is null and public.is_company())
)
with check (
  public.can_admin_university(university_id)
  or (university_id is null and public.is_company())
);

drop policy if exists "admins manage offers" on public.offers;
create policy "admins manage offers"
on public.offers
for all
using (
  public.can_admin_university(university_id)
  or (is_austria_wide = true and public.is_company())
)
with check (
  public.can_admin_university(university_id)
  or (is_austria_wide = true and public.is_company())
);

drop policy if exists "users view own and admin rsvps" on public.event_rsvps;
drop policy if exists "admins view rsvps" on public.event_rsvps;
create policy "users view own and admin rsvps"
on public.event_rsvps
for select
using (
  user_id = auth.uid()
  or public.can_admin_university((select e.university_id from public.events e where e.id = event_id))
);

drop policy if exists "admins read storage objects" on storage.objects;
create policy "admins read storage objects"
on storage.objects
for select
to authenticated
using (
  bucket_id in ('materials', 'marketplace')
  and (
    public.is_company()
    or public.is_super_admin()
    or public.has_role('university_admin')
  )
);

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
    or public.is_company()
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
    or public.is_company()
  )
)
with check (
  bucket_id = 'event-assets'
  and (
    public.has_role('event_creator')
    or public.has_role('university_admin')
    or public.is_super_admin()
    or public.is_company()
  )
);

drop policy if exists "admins upload announcement assets" on storage.objects;
create policy "admins upload announcement assets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'announcement-assets'
  and (
    public.has_role('university_admin')
    or public.is_super_admin()
    or public.is_company()
  )
);

drop policy if exists "admins upload offer assets" on storage.objects;
create policy "admins upload offer assets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'offer-assets'
  and (
    public.has_role('partner')
    or public.has_role('university_admin')
    or public.is_super_admin()
    or public.is_company()
  )
);

drop policy if exists "admins upload guide assets" on storage.objects;
create policy "admins upload guide assets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'guide-assets'
  and (
    public.has_role('university_admin')
    or public.is_super_admin()
    or public.is_company()
  )
);

drop policy if exists "admins update announcement assets" on storage.objects;
create policy "admins update announcement assets"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'announcement-assets'
  and (
    public.has_role('university_admin')
    or public.is_super_admin()
    or public.is_company()
  )
)
with check (
  bucket_id = 'announcement-assets'
  and (
    public.has_role('university_admin')
    or public.is_super_admin()
    or public.is_company()
  )
);

drop policy if exists "admins update offer assets" on storage.objects;
create policy "admins update offer assets"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'offer-assets'
  and (
    public.has_role('partner')
    or public.has_role('university_admin')
    or public.is_super_admin()
    or public.is_company()
  )
)
with check (
  bucket_id = 'offer-assets'
  and (
    public.has_role('partner')
    or public.has_role('university_admin')
    or public.is_super_admin()
    or public.is_company()
  )
);

drop policy if exists "admins update guide assets" on storage.objects;
create policy "admins update guide assets"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'guide-assets'
  and (
    public.has_role('university_admin')
    or public.is_super_admin()
    or public.is_company()
  )
)
with check (
  bucket_id = 'guide-assets'
  and (
    public.has_role('university_admin')
    or public.is_super_admin()
    or public.is_company()
  )
);
