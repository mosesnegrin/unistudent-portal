alter table public.profiles
  add column if not exists phone text;

alter table public.events
  drop constraint if exists events_created_by_fkey,
  alter column created_by drop not null,
  add constraint events_created_by_fkey
    foreign key (created_by) references public.profiles(id) on delete set null;

alter table public.lessons
  drop constraint if exists lessons_created_by_fkey,
  alter column created_by drop not null,
  add constraint lessons_created_by_fkey
    foreign key (created_by) references public.profiles(id) on delete set null;

alter table public.materials
  drop constraint if exists materials_created_by_fkey,
  alter column created_by drop not null,
  add constraint materials_created_by_fkey
    foreign key (created_by) references public.profiles(id) on delete set null;

alter table public.marketplace_items
  drop constraint if exists marketplace_items_seller_id_fkey,
  alter column seller_id drop not null,
  add constraint marketplace_items_seller_id_fkey
    foreign key (seller_id) references public.profiles(id) on delete set null;

alter table public.reports
  drop constraint if exists reports_reporter_id_fkey,
  alter column reporter_id drop not null,
  add constraint reports_reporter_id_fkey
    foreign key (reporter_id) references public.profiles(id) on delete set null;

alter table public.offers
  add column if not exists created_by uuid references public.profiles(id) on delete set null;

create index if not exists offers_created_by_idx on public.offers (created_by);

drop policy if exists "students create pending events" on public.events;
create policy "authorized users create pending events"
on public.events
for insert
with check (
  created_by = auth.uid()
  and public.same_university(university_id)
  and moderation_status = 'pending'
  and (
    public.has_role('event_creator')
    or public.has_role('university_admin')
    or public.has_role('super_admin')
  )
);

drop policy if exists "students create pending lessons" on public.lessons;
create policy "authorized users create pending lessons"
on public.lessons
for insert
with check (
  created_by = auth.uid()
  and public.same_university(university_id)
  and moderation_status = 'pending'
  and (
    public.has_role('tutor')
    or public.has_role('university_admin')
    or public.has_role('super_admin')
  )
);

drop policy if exists "students create pending materials" on public.materials;
create policy "authorized users create pending materials"
on public.materials
for insert
with check (
  created_by = auth.uid()
  and public.same_university(university_id)
  and moderation_status = 'pending'
  and (
    public.has_role('notes_seller')
    or public.has_role('university_admin')
    or public.has_role('super_admin')
  )
);

drop policy if exists "students create pending marketplace items" on public.marketplace_items;
create policy "authorized users create pending marketplace items"
on public.marketplace_items
for insert
with check (
  seller_id = auth.uid()
  and public.same_university(university_id)
  and moderation_status = 'pending'
  and (
    public.has_role('student')
    or public.has_role('university_admin')
    or public.has_role('super_admin')
  )
);

create policy "authorized users create offers"
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
    )
    or public.can_admin_university(university_id)
    or (
      public.is_super_admin()
      and is_austria_wide = true
    )
  )
);

drop policy if exists "users upload own material files" on storage.objects;
create policy "authorized users upload own material files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'materials'
  and owner = auth.uid()
  and (
    public.has_role('notes_seller')
    or public.has_role('university_admin')
    or public.has_role('super_admin')
  )
);
