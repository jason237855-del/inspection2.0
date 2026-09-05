create or replace function public.list_admins()
returns table(user_id uuid, email text, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select ur.user_id, u.email::text, ur.created_at
  from public.user_roles ur
  join auth.users u on u.id = ur.user_id
  where ur.role = 'admin'
    and public.has_role(auth.uid(), 'admin')
  order by ur.created_at asc
$$;

create or replace function public.add_admin_by_email(_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'not_authorized';
  end if;

  select u.id into target
  from auth.users u
  where lower(u.email) = lower(trim(_email))
  limit 1;

  if target is null then
    raise exception 'user_not_found';
  end if;

  insert into public.user_roles (user_id, role)
  values (target, 'admin')
  on conflict (user_id, role) do nothing;

  return target;
end;
$$;

create or replace function public.remove_admin(_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'not_authorized';
  end if;

  if _user_id = auth.uid() then
    raise exception 'cannot_remove_self';
  end if;

  delete from public.user_roles
  where user_id = _user_id and role = 'admin';

  return true;
end;
$$;