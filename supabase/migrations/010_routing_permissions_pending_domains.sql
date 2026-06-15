alter table public.universities
  add column if not exists short_code text;

create unique index if not exists universities_short_code_unique
on public.universities (short_code)
where short_code is not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'universities_short_code_url_safe'
  ) then
    alter table public.universities
      add constraint universities_short_code_url_safe
      check (short_code is null or short_code ~ '^[a-z0-9-]+$');
  end if;
end $$;

drop policy if exists "authorized users create pending events" on public.events;
drop policy if exists "students create pending events" on public.events;
create policy "authorized users create events"
on public.events
for insert
with check (
  created_by = auth.uid()
  and (
    public.same_university(university_id)
    or public.can_admin_university(university_id)
  )
  and (
    (
      moderation_status = 'approved'
      and (
        public.has_role('event_creator')
        or public.has_role('university_admin')
        or public.has_role('super_admin')
        or public.has_role('company')
      )
    )
    or moderation_status = 'pending'
  )
);

drop policy if exists "authorized users create pending lessons" on public.lessons;
drop policy if exists "students create pending lessons" on public.lessons;
create policy "authenticated users create lessons"
on public.lessons
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (
    public.same_university(university_id)
    or public.can_admin_university(university_id)
  )
  and (
    moderation_status = 'pending'
    or (
      moderation_status = 'approved'
      and (
        public.has_role('tutor')
        or public.has_role('university_admin')
        or public.has_role('super_admin')
        or public.has_role('company')
      )
    )
  )
);

drop policy if exists "authorized users create pending materials" on public.materials;
drop policy if exists "students create pending materials" on public.materials;
create policy "authorized users create materials"
on public.materials
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (
    public.same_university(university_id)
    or public.can_admin_university(university_id)
  )
  and (
    moderation_status = 'pending'
    or (
      moderation_status = 'approved'
      and (
        public.has_role('notes_seller')
        or public.has_role('university_admin')
        or public.has_role('super_admin')
        or public.has_role('company')
      )
    )
  )
);

drop policy if exists "authorized users create pending marketplace items" on public.marketplace_items;
drop policy if exists "students create pending marketplace items" on public.marketplace_items;
create policy "authenticated users create marketplace items"
on public.marketplace_items
for insert
to authenticated
with check (
  seller_id = auth.uid()
  and moderation_status = 'approved'
  and (
    public.same_university(university_id)
    or public.can_admin_university(university_id)
  )
);

drop policy if exists "authorized users create offers" on public.offers;
create policy "authorized users create offers"
on public.offers
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (
    (
      moderation_status = 'approved'
      and (
        (
          public.has_role('partner')
          and university_id is not null
          and public.same_university(university_id)
          and is_austria_wide = false
        )
        or public.can_admin_university(university_id)
        or (
          public.has_role('company')
          and is_austria_wide = true
        )
      )
    )
    or (
      moderation_status = 'pending'
      and university_id is not null
      and public.same_university(university_id)
    )
  )
);
