import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";

const ADMIN_URL = "https://hushed-haven-stays.lovable.app/admin";
const LINE_PUSH_ENDPOINT = "https://api.line.me/v2/bot/message/push";
const LINE_PROFILE_URL = "https://lin.ee/8S6eDLR";

const BodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().min(1).max(50).optional(),
  email: z.string().max(200).optional(),
  project_name: z.string().max(200).optional().nullable(),
  address: z.string().max(300).optional(),
  inspection_type: z.string().max(100).optional(),
  property_type: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  date: z.string().min(1).max(50),
  time_slot: z.string().max(100).optional().nullable(),
  user_line_id: z.string().max(100).optional().nullable(),
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
    const groupId = Deno.env.get("LINE_ADMIN_GROUP_ID");
    const adminId = Deno.env.get("ADMIN_LINE_USER_ID");
    const adminTarget = groupId || adminId;
    if (!token) return json({ error: "LINE_CHANNEL_ACCESS_TOKEN 未設定" }, 500);

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: parsed.error.flatten().fieldErrors }, 400);
    }
    const b = parsed.data;
    const slot = b.time_slot || "待確認";
    const project = b.project_name || "未提供";

    const results: Record<string, string> = {};

    // 【管理員團隊群組通知】Flex Message 卡片
    if (adminTarget) {
      const adminMessage = {
        type: "flex",
        altText: "🔔 收到新的驗屋預約！",
        contents: {
          type: "bubble",
          body: {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              { type: "text", text: "🔔 收到新的驗屋預約！", weight: "bold", size: "lg", wrap: true },
              { type: "separator", margin: "md" },
              ...[
                ["預約姓名", b.name || "未提供"],
                ["聯絡電話", b.phone || "未提供"],
                ["電子信箱", b.email || "未提供"],
                ["建案名稱", project],
                ["預約日期", b.date],
                ["預約時段", slot],
                ["檢測類型", b.inspection_type || "未提供"],
                ["房屋類型", b.property_type || "未提供"],
                ["房屋地區", b.region || "未提供"],
                ["檢測地址", b.address || "未提供"],
              ].map(([label, value]) => ({
                type: "box",
                layout: "baseline",
                spacing: "sm",
                margin: "md",
                contents: [
                  { type: "text", text: label, size: "sm", color: "#888888", flex: 2 },
                  { type: "text", text: String(value), size: "sm", wrap: true, flex: 5 },
                ],
              })),
            ],
          },
          footer: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                style: "primary",
                color: "#0F172A",
                action: { type: "uri", label: "開啟後台預約詳情", uri: ADMIN_URL },
              },
            ],
          },
        },
      };

      try {
        await pushMessage(token, adminTarget, [adminMessage]);
        results.admin = "sent";
      } catch (e) {
        console.error("admin group push error", e);
        results.admin = "failed";
      }
    } else {
      results.admin = "skipped_no_admin_target";
    }

    // 【客戶預約成功確認憑證】1對1 推播
    if (b.user_line_id) {
      const customerMessage = {
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
                type: "text",
                text: "感謝您的預約！以下為您的預約確認資料，我們將於 24 小時內與您聯繫確認細節。",
                size: "sm",
                color: "#666666",
                wrap: true,
                margin: "md",
              },
              { type: "separator", margin: "md" },
              ...[
                ["預約姓名", b.name || "未提供"],
                ["檢測項目", b.inspection_type || "未提供"],
                ["預約日期", b.date],
                ["預約時段", slot],
                ["檢測地址", b.address || "未提供"],
              ].map(([label, value]) => ({
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

      try {
        await pushMessage(token, b.user_line_id, [customerMessage]);
        results.customer = "sent";
      } catch (e) {
        console.error("customer push error", e);
        results.customer = "failed";
      }
    } else {
      results.customer = "skipped_no_line_id";
    }

    return json({ success: results.admin !== "failed", results });
  } catch (e) {
    console.error("send-line-notification error", e);
    return json({ error: e instanceof Error ? e.message : "unknown_error" }, 500);
  }
});
