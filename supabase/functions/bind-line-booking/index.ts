import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";

const LINE_PUSH_ENDPOINT = "https://api.line.me/v2/bot/message/push";
const LINE_PROFILE_URL = "https://lin.ee/8S6eDLR";
const LINE_FRIEND_DISCOUNT = 500;

// LINE 身分由後端拿 LIFF 存取憑證向 LINE 查詢，不再信任客戶端自報的 line_user_id。
const LINE_PROFILE_API = "https://api.line.me/v2/profile";
const LINE_VERIFY_API = "https://api.line.me/oauth2/v2.1/verify";
// 只允許綁定最近建立的訂單，避免拿舊訂單編號來改綁
const MAX_BOOKING_AGE_MS = 72 * 60 * 60 * 1000;

const BodySchema = z.object({
  booking_id: z.string().uuid(),
  access_token: z.string().min(20).max(4000),
});

const propertyLabels: Record<string, string> = { newbuild: "新成屋", resale: "中古屋" };
const inspectionLabels: Record<string, string> = {
  newfirst: "新成屋初驗",
  newfirst_recheck: "新成屋初驗 + 複驗方案",
  resale: "中古屋驗屋",
};

const fmt = (n: number) => `$NT ${n.toLocaleString("en-US")}`;

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
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const { booking_id, access_token } = parsed.data;

    // 向 LINE 驗證憑證並取得真正的使用者身分
    const expectedChannelId = Deno.env.get("LINE_LOGIN_CHANNEL_ID");
    if (expectedChannelId) {
      const vr = await fetch(`${LINE_VERIFY_API}?access_token=${encodeURIComponent(access_token)}`);
      const vj = vr.ok ? await vr.json() : null;
      if (!vj || String(vj.client_id) !== expectedChannelId) return json({ error: "invalid_line_token" }, 401);
    }
    const pr = await fetch(LINE_PROFILE_API, { headers: { Authorization: `Bearer ${access_token}` } });
    if (!pr.ok) return json({ error: "invalid_line_token" }, 401);
    const lineProfile = await pr.json();
    const line_user_id: string = lineProfile?.userId;
    const line_display_name: string | null = lineProfile?.displayName ?? null;
    if (!line_user_id) return json({ error: "invalid_line_token" }, 401);

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
    // 已被其他 LINE 帳號綁定的訂單不可改綁（同一人重複綁定則照常處理）
    if (booking.line_user_id && booking.line_user_id !== line_user_id) {
      return json({ error: "already_bound" }, 409);
    }

    // 已綁定過就不重複折價；若表單已預算 discounted_price 則直接使用
    const alreadyBound = Boolean(booking.line_user_id);
    const discounted = alreadyBound
      ? booking.discounted_price ?? booking.price
      : booking.discounted_price ?? Math.max(0, (booking.price ?? 0) - LINE_FRIEND_DISCOUNT);

    const { error: updateError } = await supabase
      .from("booking_requests")
      .update({
        line_user_id,
        line_display_name: line_display_name ?? booking.line_display_name,
        price: discounted,
      })
      .eq("id", booking_id);

    if (updateError) throw updateError;

    const token = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");
    if (!token) return json({ success: true, bound: true, push: "skipped_no_token", price: discounted });

    const rows: [string, string][] = [
      ["預約編號", `#${String(booking.id).slice(0, 8).toUpperCase()}`],
      ["預約姓名", booking.name || "未提供"],
      ["檢測項目", inspectionLabels[booking.inspection_type] || booking.inspection_type],
      ["房屋類型", propertyLabels[booking.property_type] || booking.property_type],
      ["房屋坪數", booking.ping ? `${booking.ping} 坪` : "未提供"],
      ["預約日期", booking.preferred_date],
      ["預約時段", booking.time_slot || "待確認"],
      ["檢測地址", booking.address || "未提供"],
    ];

    const message = {
      type: "flex",
      altText: "✅ 診斷室驗屋｜預約成功確認憑證",
      contents: {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            { type: "text", text: "診斷室驗屋", weight: "bold", size: "sm", color: "#0F766E" },
            { type: "text", text: "✅ 預約成功確認憑證", weight: "bold", size: "lg", wrap: true },
            {
              type: "box",
              layout: "vertical",
              margin: "md",
              backgroundColor: "#06C755",
              cornerRadius: "md",
              paddingAll: "8px",
              contents: [
                {
                  type: "text",
                  text: `🎁 已套用 LINE 好友折價 ${fmt(LINE_FRIEND_DISCOUNT)} 優惠`,
                  size: "sm",
                  color: "#FFFFFF",
                  weight: "bold",
                  wrap: true,
                },
              ],
            },
            { type: "separator", margin: "md" },
            ...rows.map(([label, value]) => ({
              type: "box",
              layout: "baseline",
              spacing: "sm",
              margin: "md",
              contents: [
                { type: "text", text: label, size: "sm", color: "#888888", flex: 2 },
                { type: "text", text: String(value), size: "sm", wrap: true, flex: 5 },
              ],
            })),
            { type: "separator", margin: "md" },
            {
              type: "box",
              layout: "baseline",
              margin: "md",
              contents: [
                { type: "text", text: "折抵後預估", size: "sm", color: "#888888", flex: 2 },
                { type: "text", text: fmt(discounted ?? 0), size: "md", weight: "bold", flex: 5 },
              ],
            },
            {
              type: "text",
              text: "溫馨提醒：請於驗屋當天準備建商圖面與相關交屋文件，如有任何變更請提前與我們聯繫。",
              size: "xs",
              color: "#999999",
              wrap: true,
              margin: "md",
            },
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "button",
              style: "primary",
              color: "#0F766E",
              action: { type: "uri", label: "聯繫客服（官方 LINE）", uri: LINE_PROFILE_URL },
            },
          ],
        },
      },
    };

    const res = await fetch(LINE_PUSH_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ to: line_user_id, messages: [message] }),
    });

    if (!res.ok) {
      console.error("LINE push failed", res.status, await res.text());
      return json({ success: true, bound: true, push: "failed", price: discounted });
    }

    return json({ success: true, bound: true, push: "sent", price: discounted, discount_applied: !alreadyBound });
  } catch (e) {
    console.error("bind-line-booking error", e);
    return json({ error: "internal_error" }, 500);
  }
});
