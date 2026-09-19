-- send-line-notification 改成「只接受訂單編號、內容由資料庫組成」，
-- 用這個欄位記錄該訂單是否已發送過內部群組通知，確保每筆訂單只通知一次。
alter table public.booking_requests
    add column admin_notified_at timestamp with time zone;
