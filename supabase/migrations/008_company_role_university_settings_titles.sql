alter type public.app_role add value if not exists 'company';

alter table public.universities
  add column if not exists is_active boolean not null default true,
  add column if not exists community_button_label text not null default 'Community',
  add column if not exists community_button_url text;

insert into public.roles (name, description)
values ('company', 'Internal UniStudents platform admin')
on conflict (name) do update set description = excluded.description;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('super_admin') or public.has_role('company');
$$;

drop policy if exists "active universities are visible for login" on public.universities;
create policy "active universities are visible for login"
on public.universities
for select
using (is_active = true or public.is_super_admin() or public.has_role('company'));

drop policy if exists "super admins manage universities" on public.universities;
create policy "super admins manage universities"
on public.universities
for all
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "authenticated users read university community settings" on public.universities;
create policy "authenticated users read university community settings"
on public.universities
for select
to authenticated
using (
  is_active = true
  or public.same_university(id)
  or public.is_super_admin()
);
