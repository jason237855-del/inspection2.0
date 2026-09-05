import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

/**
 * LINE Webhook 接收端點
 * 用途：接收 LINE 平台事件，記錄群組 ID（source.groupId）以便設定
 * LINE_ADMIN_GROUP_ID 環境變數。驗證請求（Verification）會回 200。
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
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
