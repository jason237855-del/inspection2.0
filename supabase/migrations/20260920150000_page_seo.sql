-- 各頁 SEO 覆寫（標題／說明），後台「SEO 設定」編輯。
-- 沒有對應列的頁面沿用程式裡的預設值（src/config/seoPages.ts）。
-- 任何人可讀（前端要用來輸出 <title>／<meta>），只有管理員可寫。

create table if not exists public.page_seo (
    path text primary key check (path like '/%' and char_length(path) <= 200),
    title text not null check (char_length(title) between 1 and 70),
    description text not null check (char_length(description) between 1 and 200),
    updated_at timestamptz not null default now()
);

alter table public.page_seo enable row level security;

revoke all on public.page_seo from anon, authenticated;
grant select on public.page_seo to anon, authenticated;
grant insert, update, delete on public.page_seo to authenticated;
grant all on public.page_seo to service_role;

create policy "Public can read page seo"
    on public.page_seo for select
    to anon, authenticated
    using (true);

create policy "Admins can insert page seo"
    on public.page_seo for insert
    to authenticated
    with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update page seo"
    on public.page_seo for update
    to authenticated
    using (public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete page seo"
    on public.page_seo for delete
    to authenticated
    using (public.has_role(auth.uid(), 'admin'));

create trigger update_page_seo_updated_at
    before update on public.page_seo
    for each row execute function public.update_updated_at_column();
