-- 團報建案專屬頁面 /group/<slug> 用的網址代稱。
-- 保留中文與英數（方便閱讀與搜尋），只把空白與 / \ ? # % & + 換成 "-"。

create or replace function public.slugify_group_name(p_name text)
returns text
language sql
immutable
as $$
    select nullif(
        trim(both '-' from regexp_replace(
            regexp_replace(lower(trim(p_name)), '[\s/\\?#%&+]+', '-', 'g'),
            '-{2,}', '-', 'g'
        )),
        ''
    )
$$;

alter table public.group_projects add column slug text;

-- 回填既有建案；名稱撞名時在後面加 -2、-3…
with base as (
    select id, public.slugify_group_name(name) as s, created_at
    from public.group_projects
),
ranked as (
    select id, s, row_number() over (partition by s order by created_at, id) as rn
    from base
)
update public.group_projects g
set slug = case when r.rn = 1 then coalesce(r.s, g.id::text) else coalesce(r.s, 'group') || '-' || r.rn end
from ranked r
where r.id = g.id;

alter table public.group_projects alter column slug set not null;
create unique index group_projects_slug_key on public.group_projects (slug);

-- 新增時自動產生 slug（撞名加序號）。訪客（客戶提案）一律由系統產生、不能自訂；
-- 管理員與後端可以自行指定。
create or replace function public.set_group_project_slug()
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
    v_base text;
    v_slug text;
    v_n integer := 1;
begin
    if new.slug is not null and new.slug <> '' and not v_restricted then
        return new;
    end if;

    v_base := coalesce(public.slugify_group_name(new.name), 'group');
    v_slug := v_base;
    while exists (select 1 from public.group_projects where slug = v_slug) loop
        v_n := v_n + 1;
        v_slug := v_base || '-' || v_n;
    end loop;
    new.slug := v_slug;
    return new;
end;
$$;

revoke all on function public.set_group_project_slug() from public, anon, authenticated;

create trigger set_group_project_slug
    before insert on public.group_projects
    for each row execute function public.set_group_project_slug();
