create or replace function public.bootstrap_first_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
    has_admin boolean;
begin
    select exists (
        select 1 from public.user_roles where role = 'admin'
    ) into has_admin;

    if has_admin then
        return false;
    end if;

    insert into public.user_roles (user_id, role)
    values (auth.uid(), 'admin')
    on conflict (user_id, role) do nothing;

    return true;
end;
$$;

revoke all on function public.bootstrap_first_admin() from public;
revoke all on function public.bootstrap_first_admin() from anon;
grant execute on function public.bootstrap_first_admin() to authenticated;
grant execute on function public.bootstrap_first_admin() to service_role;