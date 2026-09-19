import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { buildAdminMessage, type NotificationBooking } from "../_shared/booking-notification.ts";

const ADMIN_URL = "https://inspection20.vercel.app/admin";
const LINE_PUSH_ENDPOINT = "https://api.line.me/v2/bot/message/push";

// 只接受「最近才建立」的訂單，且每筆訂單只通知一次，
// 避免有人拿這個公開端點重複轟炸內部群組、消耗 LINE 訊息額度。
const MAX_BOOKING_AGE_MS = 10 * 60 * 1000;

const BodySchema = z.object({
  booking_id: z.string().uuid(),
});

async function pushMessage(token: string, to: string, messages: unknown[]) {
  const res = await fetch(LINE_PUSH_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ to, messages }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LINE push failed (${res.status}): ${text}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const token = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");
    // 管理員團隊群組 ID（優先），相容舊版單一管理員 User ID
    const adminTarget = Deno.env.get("LINE_ADMIN_GROUP_ID") || Deno.env.get("ADMIN_LINE_USER_ID");
    if (!token) return json({ error: "LINE_CHANNEL_ACCESS_TOKEN 未設定" }, 500);
    if (!adminTarget) return json({ success: true, results: { admin: "skipped_no_admin_target" } });

    const parsed = BodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: "invalid_request" }, 400);
    const { booking_id } = parsed.data;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: booking, error: readError } = await supabase
      .from("booking_requests")
      .select("*")
      .eq("id", booking_id)
      .maybeSingle();
    if (readError) throw readError;
    if (!booking) return json({ error: "booking_not_found" }, 404);

    if (Date.now() - new Date(booking.created_at).getTime() > MAX_BOOKING_AGE_MS) {
      return json({ error: "booking_too_old" }, 400);
    }

    // 原子式「認領」：只有第一個把 admin_notified_at 從 null 改成現在時間的請求可以發送
    const { data: claimed, error: claimError } = await supabase
      .from("booking_requests")
      .update({ admin_notified_at: new Date().toISOString() })
      .eq("id", booking_id)
      .is("admin_notified_at", null)
      .select("id");
    if (claimError) throw claimError;
    if (!claimed || claimed.length === 0) {
      return json({ success: true, results: { admin: "already_sent" } });
    }

    let groupName: string | null = null;
    if (booking.group_project_id) {
      const { data: group } = await supabase
        .from("group_projects")
        .select("name")
        .eq("id", booking.group_project_id)
        .maybeSingle();
      groupName = group?.name ?? null;
    }

    try {
      await pushMessage(token, adminTarget, [
        buildAdminMessage(booking as NotificationBooking, groupName, ADMIN_URL),
      ]);
    } catch (e) {
      console.error("admin group push error", e);
      // 發送失敗就放回未通知狀態，讓（10 分鐘內的）重試還有機會補發
      await supabase.from("booking_requests").update({ admin_notified_at: null }).eq("id", booking_id);
      return json({ success: false, results: { admin: "failed" } });
    }

    return json({ success: true, results: { admin: "sent" } });
  } catch (e) {
    console.error("send-line-notification error", e);
    return json({ error: "internal_error" }, 500);
  }
});
