create extension if not exists "pgcrypto";

create type public.app_role as enum (
  'student',
  'tutor',
  'notes_seller',
  'event_creator',
  'partner',
  'university_admin',
  'super_admin'
);

create type public.moderation_status as enum ('pending', 'approved', 'rejected', 'flagged');
create type public.event_type as enum ('student_event', 'university_event', 'external_partner_event');
create type public.session_type as enum ('one_time', 'multiple_sessions');
create type public.request_status as enum ('pending', 'accepted', 'rejected', 'cancelled');
create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
create type public.guide_category as enum (
  'bureaucracy',
  'required_documents',
  'living_in_vienna',
  'student_life',
  'discounts_offers'
);

create table public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  allowed_email_domain text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  university_id uuid references public.universities(id) on delete set null,
  full_name text not null,
  email text not null unique,
  bio text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id smallserial primary key,
  name public.app_role not null unique,
  description text
);

insert into public.roles (name, description) values
  ('student', 'Default student access'),
  ('tutor', 'Can offer private lessons'),
  ('notes_seller', 'Can offer notes and materials'),
  ('event_creator', 'Can create events'),
  ('partner', 'Partner account'),
  ('university_admin', 'Admin for one university'),
  ('super_admin', 'Full platform admin')
on conflict (name) do nothing;

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id smallint not null references public.roles(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create table public.guide_pages (
  id uuid primary key default gen_random_uuid(),
  university_id uuid references public.universities(id) on delete cascade,
  title text not null,
  category public.guide_category not null,
  body text not null,
  is_published boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  starts_at timestamptz not null,
  location text not null,
  university_id uuid not null references public.universities(id) on delete cascade,
  event_type public.event_type not null,
  capacity integer check (capacity is null or capacity > 0),
  price_cents integer check (price_cents is null or price_cents >= 0),
  created_by uuid not null references public.profiles(id) on delete cascade,
  moderation_status public.moderation_status not null default 'pending',
  moderation_notes text,
  flag_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_rsvps (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'registered' check (status in ('registered', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  course_name text not null,
  tutor_name text not null,
  grade_background text,
  description text not null,
  price_cents integer check (price_cents is null or price_cents >= 0),
  session_type public.session_type not null,
  availability text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  moderation_status public.moderation_status not null default 'pending',
  moderation_notes text,
  flag_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lesson_requests (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  status public.request_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, requester_id)
);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  course_name text not null,
  title text not null,
  description text not null,
  file_path text,
  is_free boolean not null default true,
  price_cents integer check (price_cents is null or price_cents >= 0),
  created_by uuid not null references public.profiles(id) on delete cascade,
  moderation_status public.moderation_status not null default 'pending',
  moderation_notes text,
  flag_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.material_requests (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  status public.request_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (material_id, requester_id)
);

create table public.marketplace_items (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  title text not null,
  description text not null,
  price_cents integer check (price_cents is null or price_cents >= 0),
  category text not null,
  image_paths text[] not null default '{}',
  seller_id uuid not null references public.profiles(id) on delete cascade,
  moderation_status public.moderation_status not null default 'pending',
  moderation_notes text,
  flag_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  university_id uuid references public.universities(id) on delete cascade,
  title text not null,
  description text not null,
  partner_name text not null,
  discount_details text not null,
  expires_at date,
  link text,
  is_austria_wide boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (is_austria_wide = true or university_id is not null)
);

create table public.interests (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.user_interests (
  user_id uuid not null references public.profiles(id) on delete cascade,
  interest_id uuid not null references public.interests(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, interest_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  subject_type text not null check (subject_type in ('event', 'lesson', 'material', 'marketplace_item', 'profile')),
  subject_id uuid not null,
  reason text not null,
  status public.report_status not null default 'open',
  moderator_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  university_id uuid references public.universities(id) on delete cascade,
  title text not null,
  body text not null,
  created_by uuid references public.profiles(id) on delete set null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index universities_active_idx on public.universities (is_active, name);
create index profiles_university_idx on public.profiles (university_id);
create index user_roles_user_idx on public.user_roles (user_id);
create index events_public_idx on public.events (university_id, moderation_status, starts_at);
create index lessons_public_idx on public.lessons (university_id, moderation_status, created_at desc);
create index materials_public_idx on public.materials (university_id, moderation_status, created_at desc);
create index marketplace_public_idx on public.marketplace_items (university_id, moderation_status, created_at desc);
create index offers_scope_idx on public.offers (university_id, is_austria_wide, expires_at);
create index reports_status_idx on public.reports (status, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_universities_updated_at before update on public.universities for each row execute function public.set_updated_at();
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_guide_pages_updated_at before update on public.guide_pages for each row execute function public.set_updated_at();
create trigger set_events_updated_at before update on public.events for each row execute function public.set_updated_at();
create trigger set_event_rsvps_updated_at before update on public.event_rsvps for each row execute function public.set_updated_at();
create trigger set_lessons_updated_at before update on public.lessons for each row execute function public.set_updated_at();
create trigger set_lesson_requests_updated_at before update on public.lesson_requests for each row execute function public.set_updated_at();
create trigger set_materials_updated_at before update on public.materials for each row execute function public.set_updated_at();
create trigger set_material_requests_updated_at before update on public.material_requests for each row execute function public.set_updated_at();
create trigger set_marketplace_items_updated_at before update on public.marketplace_items for each row execute function public.set_updated_at();
create trigger set_offers_updated_at before update on public.offers for each row execute function public.set_updated_at();
create trigger set_reports_updated_at before update on public.reports for each row execute function public.set_updated_at();
create trigger set_announcements_updated_at before update on public.announcements for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  role_id_value smallint;
begin
  insert into public.profiles (id, university_id, full_name, email)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'university_id', '')::uuid,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    lower(new.email)
  )
  on conflict (id) do update set
    university_id = excluded.university_id,
    full_name = excluded.full_name,
    email = excluded.email;

  select id into role_id_value from public.roles where name = 'student';
  insert into public.user_roles (user_id, role_id) values (new.id, role_id_value)
  on conflict do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.has_role(role_name public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.name = role_name
  );
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
      and public.has_role('university_admin')
  );
$$;

create or replace function public.can_admin_university(university uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin() or public.is_university_admin(university);
$$;

create or replace function public.same_university(university uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.university_id = university
      and p.is_active = true
  );
$$;

create or replace function public.increment_flag_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.subject_type = 'event' then
    update public.events set flag_count = flag_count + 1 where id = new.subject_id;
  elsif new.subject_type = 'lesson' then
    update public.lessons set flag_count = flag_count + 1 where id = new.subject_id;
  elsif new.subject_type = 'material' then
    update public.materials set flag_count = flag_count + 1 where id = new.subject_id;
  elsif new.subject_type = 'marketplace_item' then
    update public.marketplace_items set flag_count = flag_count + 1 where id = new.subject_id;
  end if;
  return new;
end;
$$;

create trigger increment_report_flag_count
after insert on public.reports
for each row execute function public.increment_flag_count();

alter table public.universities enable row level security;
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.guide_pages enable row level security;
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_requests enable row level security;
alter table public.materials enable row level security;
alter table public.material_requests enable row level security;
alter table public.marketplace_items enable row level security;
alter table public.offers enable row level security;
alter table public.interests enable row level security;
alter table public.user_interests enable row level security;
alter table public.reports enable row level security;
alter table public.announcements enable row level security;

create policy "active universities are visible for login" on public.universities for select using (is_active = true or public.is_super_admin());
create policy "super admins manage universities" on public.universities for all using (public.is_super_admin()) with check (public.is_super_admin());

create policy "users view own and university profiles" on public.profiles for select using (id = auth.uid() or public.same_university(university_id) or public.can_admin_university(university_id));
create policy "users update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "admins update university profiles" on public.profiles for update using (public.can_admin_university(university_id)) with check (public.can_admin_university(university_id));

create policy "authenticated users view roles" on public.roles for select to authenticated using (true);
create policy "users view relevant role assignments" on public.user_roles for select using (user_id = auth.uid() or public.can_admin_university((select p.university_id from public.profiles p where p.id = user_id)));
create policy "admins assign roles" on public.user_roles for insert with check (public.can_admin_university((select p.university_id from public.profiles p where p.id = user_id)));
create policy "admins remove roles" on public.user_roles for delete using (public.can_admin_university((select p.university_id from public.profiles p where p.id = user_id)));

create policy "students view published guide pages" on public.guide_pages for select using (is_published = true and (university_id is null or public.same_university(university_id)) or public.can_admin_university(university_id));
create policy "admins manage guide pages" on public.guide_pages for all using (public.can_admin_university(university_id) or (university_id is null and public.is_super_admin())) with check (public.can_admin_university(university_id) or (university_id is null and public.is_super_admin()));

create policy "students view approved events" on public.events for select using ((moderation_status = 'approved' and public.same_university(university_id)) or created_by = auth.uid() or public.can_admin_university(university_id));
create policy "students create pending events" on public.events for insert with check (created_by = auth.uid() and public.same_university(university_id) and moderation_status = 'pending');
create policy "admins manage events" on public.events for all using (public.can_admin_university(university_id)) with check (public.can_admin_university(university_id));

create policy "users manage own rsvps" on public.event_rsvps for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admins view rsvps" on public.event_rsvps for select using (public.can_admin_university((select e.university_id from public.events e where e.id = event_id)));

create policy "students view approved lessons" on public.lessons for select using ((moderation_status = 'approved' and public.same_university(university_id)) or created_by = auth.uid() or public.can_admin_university(university_id));
create policy "students create pending lessons" on public.lessons for insert with check (created_by = auth.uid() and public.same_university(university_id) and moderation_status = 'pending');
create policy "admins manage lessons" on public.lessons for all using (public.can_admin_university(university_id)) with check (public.can_admin_university(university_id));

create policy "requesters and tutors view lesson requests" on public.lesson_requests for select using (requester_id = auth.uid() or exists (select 1 from public.lessons l where l.id = lesson_id and (l.created_by = auth.uid() or public.can_admin_university(l.university_id))));
create policy "students create lesson requests" on public.lesson_requests for insert with check (requester_id = auth.uid());
create policy "requesters cancel lesson requests" on public.lesson_requests for update using (requester_id = auth.uid()) with check (requester_id = auth.uid());

create policy "students view approved materials" on public.materials for select using ((moderation_status = 'approved' and public.same_university(university_id)) or created_by = auth.uid() or public.can_admin_university(university_id));
create policy "students create pending materials" on public.materials for insert with check (created_by = auth.uid() and public.same_university(university_id) and moderation_status = 'pending');
create policy "admins manage materials" on public.materials for all using (public.can_admin_university(university_id)) with check (public.can_admin_university(university_id));

create policy "requesters and creators view material requests" on public.material_requests for select using (requester_id = auth.uid() or exists (select 1 from public.materials m where m.id = material_id and (m.created_by = auth.uid() or public.can_admin_university(m.university_id))));
create policy "students create material requests" on public.material_requests for insert with check (requester_id = auth.uid());
create policy "requesters cancel material requests" on public.material_requests for update using (requester_id = auth.uid()) with check (requester_id = auth.uid());

create policy "students view approved marketplace items" on public.marketplace_items for select using ((moderation_status = 'approved' and public.same_university(university_id)) or seller_id = auth.uid() or public.can_admin_university(university_id));
create policy "students create pending marketplace items" on public.marketplace_items for insert with check (seller_id = auth.uid() and public.same_university(university_id) and moderation_status = 'pending');
create policy "admins manage marketplace items" on public.marketplace_items for all using (public.can_admin_university(university_id)) with check (public.can_admin_university(university_id));

create policy "students view relevant offers" on public.offers for select using (is_austria_wide = true or public.same_university(university_id) or public.can_admin_university(university_id));
create policy "admins manage offers" on public.offers for all using (public.can_admin_university(university_id) or (is_austria_wide = true and public.is_super_admin())) with check (public.can_admin_university(university_id) or (is_austria_wide = true and public.is_super_admin()));

create policy "authenticated users view interests" on public.interests for select to authenticated using (true);
create policy "authenticated users create interests" on public.interests for insert to authenticated with check (true);
create policy "users manage own interests" on public.user_interests for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users view university interests" on public.user_interests for select using (exists (select 1 from public.profiles p where p.id = user_id and public.same_university(p.university_id)));

create policy "users create reports" on public.reports for insert with check (reporter_id = auth.uid());
create policy "users view own reports" on public.reports for select using (reporter_id = auth.uid() or public.is_super_admin() or public.has_role('university_admin'));
create policy "admins update reports" on public.reports for update using (public.is_super_admin() or public.has_role('university_admin')) with check (public.is_super_admin() or public.has_role('university_admin'));

create policy "students view published announcements" on public.announcements for select using (is_published = true and (university_id is null or public.same_university(university_id)) or public.can_admin_university(university_id));
create policy "admins manage announcements" on public.announcements for all using (public.can_admin_university(university_id) or (university_id is null and public.is_super_admin())) with check (public.can_admin_university(university_id) or (university_id is null and public.is_super_admin()));

insert into storage.buckets (id, name, public)
values ('materials', 'materials', false), ('marketplace', 'marketplace', false)
on conflict (id) do nothing;

create policy "users upload own material files" on storage.objects for insert to authenticated
with check (bucket_id = 'materials' and owner = auth.uid());

create policy "users read own material files" on storage.objects for select to authenticated
using (bucket_id = 'materials' and owner = auth.uid());

create policy "admins read storage objects" on storage.objects for select to authenticated
using (bucket_id in ('materials', 'marketplace') and (public.is_super_admin() or public.has_role('university_admin')));

create policy "users upload marketplace images" on storage.objects for insert to authenticated
with check (bucket_id = 'marketplace' and owner = auth.uid());
