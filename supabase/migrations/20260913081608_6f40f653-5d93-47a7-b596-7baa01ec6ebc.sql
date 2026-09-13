create table public.time_slots (
    id uuid primary key default gen_random_uuid(),
    value text not null unique,
    label text not null,
    default_max_slots integer not null default 3,
    is_active boolean not null default true,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

insert into public.time_slots (value, label, default_max_slots) values
    ('09:00', '09:00 上午場', 3),
    ('14:00', '14:00 下午場', 3);

grant select on public.time_slots to anon;
grant select on public.time_slots to authenticated;
grant all on public.time_slots to service_role;

alter table public.time_slots enable row level security;

create policy "Public can view time slots"
    on public.time_slots
    for select
    to anon, authenticated
    using (true);

create policy "Admins can manage time slots"
    on public.time_slots
    for all
    to authenticated
    using (public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'admin'));

create table public.time_slot_availability (
    date date not null,
    time_slot_id uuid not null references public.time_slots(id) on delete cascade,
    max_slots integer not null default 3,
    updated_at timestamp with time zone not null default now(),
    primary key (date, time_slot_id)
);

grant select on public.time_slot_availability to anon;
grant select on public.time_slot_availability to authenticated;
grant insert, update, delete on public.time_slot_availability to authenticated;
grant all on public.time_slot_availability to service_role;

alter table public.time_slot_availability enable row level security;

create policy "Public can view time slot availability"
    on public.time_slot_availability
    for select
    to anon, authenticated
    using (true);

create policy "Admins can manage time slot availability"
    on public.time_slot_availability
    for all
    to authenticated
    using (public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'admin'));

create trigger update_time_slots_updated_at
    before update on public.time_slots
    for each row execute function public.update_updated_at_column();

create trigger update_time_slot_availability_updated_at
    before update on public.time_slot_availability
    for each row execute function public.update_updated_at_column();
