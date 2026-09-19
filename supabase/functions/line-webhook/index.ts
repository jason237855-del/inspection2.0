import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

/**
 * LINE Webhook 接收端點
 * 用途：接收 LINE 平台事件，記錄群組 ID（source.groupId）以便設定
 * LINE_ADMIN_GROUP_ID 環境變數。驗證請求（Verification）會回 200。
 *
 * 簽章驗證：若已設定 LINE_CHANNEL_SECRET，會以 x-line-signature 驗證請求確實來自 LINE，
 * 簽章不符回 401；尚未設定時維持原本行為（只記錄日誌，並在日誌留下警告）。
 * 設定方式：supabase secrets set LINE_CHANNEL_SECRET=<LINE Developers > Channel secret>
 */

async function isValidSignature(secret: string, rawBody: string, signature: string | null) {
  if (!signature) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody)));
  const expected = btoa(String.fromCharCode(...mac));
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();

    const channelSecret = Deno.env.get("LINE_CHANNEL_SECRET");
    if (channelSecret) {
      const ok = await isValidSignature(channelSecret, rawBody, req.headers.get("x-line-signature"));
      if (!ok) {
        return new Response(JSON.stringify({ error: "invalid_signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      console.warn("LINE_CHANNEL_SECRET 未設定，略過簽章驗證");
    }

    const body = JSON.parse(rawBody);
    const events = Array.isArray(body?.events) ? body.events : [];

    for (const event of events) {
      const src = event?.source ?? {};
      console.log(
        JSON.stringify({
          type: event?.type,
          sourceType: src?.type,
          groupId: src?.groupId ?? null,
          userId: src?.userId ?? null,
          message: event?.message?.text ?? null,
        }),
      );
    }

    // LINE 規定 webhook 必須回 200
    return new Response(JSON.stringify({ ok: true, received: events.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("line-webhook error", e);
    // 即使解析失敗也回 200，避免 LINE 重送風暴
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
