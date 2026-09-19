-- 建案團報：客戶加入同建案團報，滿門檻戶數後全團享折扣（含先報的戶）。
-- 每戶仍各自建立一筆 booking_requests（照常佔用每日／時段名額），
-- 以 group_project_id 關聯到 group_projects。

create table public.group_projects (
    id uuid primary key default gen_random_uuid(),
    name text not null check (char_length(name) between 1 and 100),
    region text not null check (char_length(region) between 1 and 100),
    -- pending：客戶提出、待後台審核；active：開放加入；closed：停止加入
    status text not null default 'pending' check (status in ('pending', 'active', 'closed')),
    min_units integer not null default 3 check (min_units >= 2),
    discount_rate numeric(4, 3) not null default 0.900 check (discount_rate > 0 and discount_rate <= 1),
    proposer_name text check (char_length(proposer_name) <= 50),
    proposer_phone text check (char_length(proposer_phone) <= 30),
    sort_order integer not null default 0,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

grant select, insert on public.group_projects to anon;
grant select, insert on public.group_projects to authenticated;
grant update, delete on public.group_projects to authenticated;
grant all on public.group_projects to service_role;

alter table public.group_projects enable row level security;

create policy "Public can view active group projects"
    on public.group_projects
    for select
    to anon, authenticated
    using (status = 'active');

-- 客戶只能提出「待審核」的新建案，折扣條件一律用預設值
create policy "Public can propose group projects"
    on public.group_projects
    for insert
    to anon, authenticated
    with check (status = 'pending' and min_units = 3 and discount_rate = 0.900 and sort_order = 0);

create policy "Admins can manage group projects"
    on public.group_projects
    for all
    to authenticated
    using (public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'admin'));

create trigger update_group_projects_updated_at
    before update on public.group_projects
    for each row execute function public.update_updated_at_column();

alter table public.booking_requests
    add column group_project_id uuid references public.group_projects(id) on delete set null;

create index booking_requests_group_project_id_idx on public.booking_requests (group_project_id);

-- 依團內未取消的戶數，重算該團所有未取消訂單的價格：
-- 達門檻 → original_price × discount_rate；未達 → 原價。
create or replace function public.recalc_group_pricing(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_min integer;
    v_rate numeric;
    v_count integer;
    v_factor numeric;
begin
    if p_group_id is null then
        return;
    end if;

    select min_units, discount_rate into v_min, v_rate
    from public.group_projects where id = p_group_id;
    if not found then
        return;
    end if;

    select count(*) into v_count
    from public.booking_requests
    where group_project_id = p_group_id and status <> 'cancelled';

    v_factor := case when v_count >= v_min then v_rate else 1 end;

    update public.booking_requests
    set discounted_price = round(original_price * v_factor),
        price = round(original_price * v_factor)
    where group_project_id = p_group_id
      and status <> 'cancelled'
      and original_price is not null
      and (discounted_price is distinct from round(original_price * v_factor)
           or price is distinct from round(original_price * v_factor));
end;
$$;

revoke all on function public.recalc_group_pricing(uuid) from public, anon, authenticated;

create or replace function public.booking_group_pricing_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if tg_op = 'INSERT' then
        perform public.recalc_group_pricing(new.group_project_id);
    elsif tg_op = 'DELETE' then
        perform public.recalc_group_pricing(old.group_project_id);
    else
        perform public.recalc_group_pricing(new.group_project_id);
        if old.group_project_id is distinct from new.group_project_id then
            perform public.recalc_group_pricing(old.group_project_id);
        end if;
    end if;
    return null;
end;
$$;

revoke all on function public.booking_group_pricing_trigger() from public, anon, authenticated;

create trigger booking_group_pricing
    after insert or delete or update of status, group_project_id on public.booking_requests
    for each row execute function public.booking_group_pricing_trigger();

create or replace function public.group_project_pricing_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    perform public.recalc_group_pricing(new.id);
    return null;
end;
$$;

revoke all on function public.group_project_pricing_trigger() from public, anon, authenticated;

create trigger group_project_pricing
    after update of min_units, discount_rate on public.group_projects
    for each row execute function public.group_project_pricing_trigger();

-- 匿名訪客沒有 booking_requests 的 SELECT 權限，
-- 用這個函式只公開「開放中建案目前的戶數」。
create or replace function public.get_group_project_counts()
returns table (group_project_id uuid, unit_count integer)
language sql
stable
security definer
set search_path = public
as $$
    select b.group_project_id, count(*)::integer
    from public.booking_requests b
    join public.group_projects g on g.id = b.group_project_id
    where g.status = 'active' and b.status <> 'cancelled'
    group by b.group_project_id
$$;

grant execute on function public.get_group_project_counts() to anon, authenticated;
