create type public.app_role as enum ('admin', 'moderator', 'user');

create table public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role public.app_role not null,
    created_at timestamp with time zone not null default now(),
    unique (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create policy "Users can view their own roles"
    on public.user_roles
    for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Admins can manage roles"
    on public.user_roles
    for all
    to authenticated
    using (public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'admin'));

create table public.booking_availability (
    date date primary key not null,
    max_slots integer not null default 3,
    is_blocked boolean not null default false,
    reason text,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

grant select on public.booking_availability to anon;
grant select on public.booking_availability to authenticated;
grant insert, update, delete on public.booking_availability to authenticated;
grant all on public.booking_availability to service_role;

alter table public.booking_availability enable row level security;

create policy "Public can view availability"
    on public.booking_availability
    for select
    to anon, authenticated
    using (true);

create policy "Admins can manage availability"
    on public.booking_availability
    for all
    to authenticated
    using (public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'admin'));

create table public.booking_requests (
    id uuid primary key default gen_random_uuid(),
    preferred_date date not null,
    inspection_type text not null,
    property_type text not null,
    region text not null,
    name text,
    phone text,
    email text,
    address text,
    status text not null default 'pending',
    source text not null default 'line',
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

grant select, insert on public.booking_requests to anon;
grant select, insert on public.booking_requests to authenticated;
grant all on public.booking_requests to service_role;

alter table public.booking_requests enable row level security;

create policy "Public can create booking requests"
    on public.booking_requests
    for insert
    to anon, authenticated
    with check (true);

create policy "Admins can manage booking requests"
    on public.booking_requests
    for all
    to authenticated
    using (public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'admin'));

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger update_booking_availability_updated_at
    before update on public.booking_availability
    for each row execute function public.update_updated_at_column();

create trigger update_booking_requests_updated_at
    before update on public.booking_requests
    for each row execute function public.update_updated_at_column();