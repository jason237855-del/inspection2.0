-- 團報建案的封面照片（選填）：後台上傳後，卡片／建案頁／LINE 分享圖改用這張照片；
-- 沒有上傳時前端自動產生設計圖卡。

alter table public.group_projects add column cover_image_url text;

-- 客戶提出的新建案提案（訪客可新增）不得帶封面網址，避免被拿來嵌入任意外部圖片
drop policy if exists "Public can propose group projects" on public.group_projects;
create policy "Public can propose group projects"
    on public.group_projects
    for insert
    to anon, authenticated
    with check (
        status = 'pending'
        and min_units = 3
        and discount_rate = 0.900
        and sort_order = 0
        and cover_image_url is null
    );

-- 封面照片儲存：公開讀取、只有管理員可上傳／更新／刪除；只收圖片、每張最大 2 MB
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('group-covers', 'group-covers', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Public can view group covers"
    on storage.objects
    for select
    to anon, authenticated
    using (bucket_id = 'group-covers');

create policy "Admins can upload group covers"
    on storage.objects
    for insert
    to authenticated
    with check (bucket_id = 'group-covers' and public.has_role(auth.uid(), 'admin'));

create policy "Admins can update group covers"
    on storage.objects
    for update
    to authenticated
    using (bucket_id = 'group-covers' and public.has_role(auth.uid(), 'admin'))
    with check (bucket_id = 'group-covers' and public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete group covers"
    on storage.objects
    for delete
    to authenticated
    using (bucket_id = 'group-covers' and public.has_role(auth.uid(), 'admin'));
