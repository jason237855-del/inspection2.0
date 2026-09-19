-- 收緊訪客（anon）新增預約訂單的規則。
-- 原本 "Public can create booking requests" 的 with check 是 true，任何人拿公開的 anon key
-- 都能直接寫入任意內容（價格、狀態、團報 id…），前端的防機器人擋不住直接打 API。
--
-- 1. RLS：訪客只能寫「待確認」「web」來源的訂單，不能帶 LINE 欄位／備註，日期不得為過去，
--    欄位長度有上限，加入團報時建案必須是開放中。
-- 2. BEFORE INSERT trigger：訪客送來的價格一律忽略，由資料庫依房屋類型／坪數／複驗自行計算，
--    並在伺服器端檢查日期是否封鎖、時段是否存在且未額滿，以及頻率限制。
--    管理員、service_role（Edge Function）與直接連資料庫的操作不受此 trigger 影響。
--
-- !! 價格公式在前端 BookingForm.tsx（BASE_PRICE／REINSPECTION_PRICE／每坪 $400／LINE 折 $500）
-- !! 與這裡各有一份，調整價格時兩邊都要改，否則客戶看到的價格與實際儲存的會不一致。

drop policy if exists "Public can create booking requests" on public.booking_requests;

create policy "Public can create booking requests"
    on public.booking_requests
    for insert
    to anon, authenticated
    with check (
        status = 'pending'
        and source = 'web'
        and line_user_id is null
        and line_display_name is null
        and notes is null
        and preferred_date >= current_date
        and (name is null or char_length(name) <= 100)
        and (phone is null or char_length(phone) <= 50)
        and (email is null or char_length(email) <= 200)
        and (address is null or char_length(address) <= 300)
        and (project_name is null or char_length(project_name) <= 200)
        and (project_region is null or char_length(project_region) <= 100)
        and (floor_unit is null or char_length(floor_unit) <= 100)
        and (
            group_project_id is null
            or exists (
                select 1 from public.group_projects g
                where g.id = group_project_id and g.status = 'active'
            )
        )
    );

create or replace function public.enforce_public_booking_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_role text := auth.role();
    v_base integer;
    v_ping integer;
    v_original integer;
    v_slot_id uuid;
    v_slot_default integer;
    v_max integer;
    v_count integer;
begin
    -- 只約束訪客與一般（非管理員）登入者
    -- v_role 為 null（直接連資料庫的維運操作）時 coalesce 成 false，同樣直接放行
    if not coalesce(
        v_role = 'anon'
        or (v_role = 'authenticated' and not coalesce(public.has_role(auth.uid(), 'admin'), false)),
        false
    ) then
        return new;
    end if;

    -- 價格：忽略客戶端送來的數字，自行計算
    if new.property_type = 'newbuild' then
        v_base := 7777;
    elsif new.property_type = 'resale' then
        v_base := 10000;
    else
        raise exception '房屋類型不正確';
    end if;

    v_ping := coalesce(new.ping, 20);
    if v_ping < 1 or v_ping > 500 then
        raise exception '房屋坪數不正確';
    end if;

    v_original := v_base
        + case when new.needs_reinspection then 3000 else 0 end
        + greatest(0, v_ping - 20) * 400;

    new.ping := v_ping;
    new.original_price := v_original;
    -- 一般預約：LINE 好友價折 $500；團報不與 LINE 折扣並用，成團折扣由 booking_group_pricing 處理
    new.discounted_price := case
        when new.group_project_id is null then greatest(0, v_original - 500)
        else v_original
    end;
    new.price := new.discounted_price;

    -- 日期／時段
    if exists (
        select 1 from public.booking_availability
        where date = new.preferred_date and is_blocked
    ) then
        raise exception '所選日期目前不開放預約，請選擇其他日期';
    end if;

    if new.time_slot is null then
        raise exception '請選擇預約時段';
    end if;

    select id, default_max_slots into v_slot_id, v_slot_default
    from public.time_slots
    where value = new.time_slot and is_active;
    if not found then
        raise exception '所選時段不存在或已停用';
    end if;

    -- 同一日期＋時段的並行送出排隊，避免同時搶最後一個名額而超收
    perform pg_advisory_xact_lock(hashtext(new.preferred_date::text || '|' || new.time_slot));

    select coalesce(
        (select max_slots from public.time_slot_availability
         where date = new.preferred_date and time_slot_id = v_slot_id),
        v_slot_default
    ) into v_max;

    select count(*) into v_count
    from public.booking_requests
    where preferred_date = new.preferred_date
      and time_slot = new.time_slot
      and status in ('pending', 'confirmed');

    if v_count >= v_max then
        raise exception '所選時段已額滿，請選擇其他時段';
    end if;

    -- 頻率限制
    if new.phone is not null and (
        select count(*) from public.booking_requests
        where phone = new.phone and created_at > now() - interval '1 hour'
    ) >= 5 then
        raise exception '此電話號碼短時間內預約次數過多，請稍後再試或聯繫客服';
    end if;

    if (
        select count(*) from public.booking_requests
        where source = 'web' and created_at > now() - interval '10 minutes'
    ) >= 60 then
        raise exception '目前預約人數較多，請稍後再試';
    end if;

    return new;
end;
$$;

revoke all on function public.enforce_public_booking_rules() from public, anon, authenticated;

create trigger enforce_public_booking_rules
    before insert on public.booking_requests
    for each row execute function public.enforce_public_booking_rules();

-- 客戶提出的新建案提案：待審核數量上限，避免被灌爆後台
create or replace function public.limit_pending_group_proposals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_role text := auth.role();
begin
    -- v_role 為 null（直接連資料庫的維運操作）時 coalesce 成 false，同樣直接放行
    if not coalesce(
        v_role = 'anon'
        or (v_role = 'authenticated' and not coalesce(public.has_role(auth.uid(), 'admin'), false)),
        false
    ) then
        return new;
    end if;

    if (select count(*) from public.group_projects where status = 'pending') >= 30 then
        raise exception '目前待審核的團報提案過多，請稍後再試或聯繫客服';
    end if;

    return new;
end;
$$;

revoke all on function public.limit_pending_group_proposals() from public, anon, authenticated;

create trigger limit_pending_group_proposals
    before insert on public.group_projects
    for each row execute function public.limit_pending_group_proposals();
