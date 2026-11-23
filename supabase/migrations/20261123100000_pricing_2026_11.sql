-- 2026-11 調價（只影響之後新增的預約，既有訂單金額不變；套用時正式庫沒有任何團報訂單）：
--   • 新成屋初驗基本費 $7,777 → $6,666（20 坪內）
--   • 複驗加購 $3,000 → $2,000（新成屋、中古屋）
--   • 團報基本費 $8,000 → $6,666、團報複驗（不打折）$2,500 → $2,000
--   • 超出 20 坪每坪加價 $400 → $200（全部方案）
--   • 一般預約 LINE 好友折抵 $500 → $666
--   • 中古屋基本費 $10,000 不變
--
-- !! 價格另外寫在前端 BookingForm.tsx（BASE_PRICE／REINSPECTION_PRICE／GROUP_*／PER_PING_SURCHARGE／LINE_FRIEND_DISCOUNT）
-- !! 與 Edge Function bind-line-booking（LINE_FRIEND_DISCOUNT），調整價格時要一起改。

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
    v_reins integer;
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
    -- 團報：僅限新成屋；原價基本費 $6,666、複驗加購固定 $2,000；成團折扣由 booking_group_pricing 處理
    -- 一般：新成屋 $6,666／中古屋 $10,000、複驗加購 $2,000，LINE 好友折 $666；超出 20 坪每坪 $200
    if new.group_project_id is not null then
        if new.property_type <> 'newbuild' then
            raise exception '團報僅適用新成屋';
        end if;
        v_base := 6666;
        v_reins := 2000;
    elsif new.property_type = 'newbuild' then
        v_base := 6666;
        v_reins := 2000;
    elsif new.property_type = 'resale' then
        v_base := 10000;
        v_reins := 2000;
    else
        raise exception '房屋類型不正確';
    end if;

    v_ping := coalesce(new.ping, 20);
    if v_ping < 1 or v_ping > 500 then
        raise exception '房屋坪數不正確';
    end if;

    v_original := v_base
        + case when new.needs_reinspection then v_reins else 0 end
        + greatest(0, v_ping - 20) * 200;

    new.ping := v_ping;
    new.original_price := v_original;
    -- 一般預約：LINE 好友價折 $666；團報不與 LINE 折扣並用，先以原價計，成團折扣由 booking_group_pricing 處理
    new.discounted_price := case
        when new.group_project_id is null then greatest(0, v_original - 666)
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

    -- 複驗 $2,000 固定不打折：只有（原價 − 複驗）乘以折數
    update public.booking_requests b
    set discounted_price = t.p, price = t.p
    from (
        select id,
               round((original_price - case when needs_reinspection then 2000 else 0 end) * v_factor)
                   + case when needs_reinspection then 2000 else 0 end as p
        from public.booking_requests
        where group_project_id = p_group_id
          and status <> 'cancelled'
          and original_price is not null
    ) t
    where b.id = t.id
      and (b.discounted_price is distinct from t.p or b.price is distinct from t.p);
end;
$$;

revoke all on function public.recalc_group_pricing(uuid) from public, anon, authenticated;
