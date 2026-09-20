-- 團報「預設條件」（成團戶數、折數）集中存在一張單列設定表，後台可調整。
-- 官網上「滿 N 戶享 X 折」的文字、新增建案的預設值、客戶提案的條件都讀這裡。
-- 各建案仍各自保有自己的條件；調整預設不會動到既有建案（後台可選擇同時套用）。

create table public.group_settings (
    id boolean primary key default true check (id),  -- 固定只有一列
    default_min_units integer not null default 3 check (default_min_units >= 2),
    default_discount_rate numeric(4, 3) not null default 0.900 check (default_discount_rate > 0 and default_discount_rate <= 1),
    updated_at timestamp with time zone not null default now()
);

insert into public.group_settings (id) values (true);

grant select on public.group_settings to anon, authenticated;
grant update on public.group_settings to authenticated;
grant all on public.group_settings to service_role;

alter table public.group_settings enable row level security;

create policy "Public can view group settings"
    on public.group_settings
    for select
    to anon, authenticated
    using (true);

create policy "Admins can update group settings"
    on public.group_settings
    for update
    to authenticated
    using (public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'admin'));

create trigger update_group_settings_updated_at
    before update on public.group_settings
    for each row execute function public.update_updated_at_column();

-- 客戶（訪客／非管理員）新增的建案提案，條件一律強制套用「預設條件」，客戶端送什麼都不採用
create or replace function public.apply_group_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_role text := auth.role();
    v_restricted boolean := coalesce(
        v_role = 'anon'
        or (v_role = 'authenticated' and not coalesce(public.has_role(auth.uid(), 'admin'), false)),
        false
    );
begin
    if v_restricted then
        select default_min_units, default_discount_rate
        into new.min_units, new.discount_rate
        from public.group_settings
        limit 1;
    end if;
    return new;
end;
$$;

revoke all on function public.apply_group_defaults() from public, anon, authenticated;

create trigger apply_group_defaults
    before insert on public.group_projects
    for each row execute function public.apply_group_defaults();

-- 提案政策：原本寫死「3 戶、9 折」，改成必須等於目前的預設條件
drop policy if exists "Public can propose group projects" on public.group_projects;
create policy "Public can propose group projects"
    on public.group_projects
    for insert
    to anon, authenticated
    with check (
        status = 'pending'
        and sort_order = 0
        and cover_image_url is null
        and min_units = (select default_min_units from public.group_settings limit 1)
        and discount_rate = (select default_discount_rate from public.group_settings limit 1)
    );
