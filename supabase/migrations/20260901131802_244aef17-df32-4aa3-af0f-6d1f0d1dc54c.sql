revoke execute on function public.list_admins() from public, anon;
revoke execute on function public.add_admin_by_email(text) from public, anon;
revoke execute on function public.remove_admin(uuid) from public, anon;
revoke execute on function public.bootstrap_first_admin() from public, anon;

grant execute on function public.list_admins() to authenticated;
grant execute on function public.add_admin_by_email(text) to authenticated;
grant execute on function public.remove_admin(uuid) to authenticated;
grant execute on function public.bootstrap_first_admin() to authenticated;