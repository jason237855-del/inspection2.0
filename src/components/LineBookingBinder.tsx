import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2, Gift } from "lucide-react";
import { useLiffProfile } from "@/hooks/useLiffProfile";
import { supabase } from "@/integrations/supabase/client";
import { LINE_OA_URL } from "@/config/line";

declare global {
  interface Window {
    liff?: any;
  }
}

/**
 * 當使用者從 LIFF 連結（?booking_id=xxx）開啟 /booking 時，
 * 自動取得 LINE userId 並綁定至該筆預約，後端會發送預約憑證與 $500 折抵，
 * 完成後導向官方 LINE 加入好友頁面。
 */
const LineBookingBinder = () => {
  const [params] = useSearchParams();
  const bookingId = params.get("booking_id");
  const { profile, lineUserId, login, available } = useLiffProfile();
  const [state, setState] = useState<"idle" | "binding" | "done" | "error">("idle");
  // 後端回報這筆是否為團報訂單（團報不套用 LINE 好友折價）
  const [isGroup, setIsGroup] = useState(false);
  const attempted = useRef(false);
  const redirected = useRef(false);

  // 尚未登入時，主動觸發 LINE 授權
  useEffect(() => {
    if (!bookingId || !available || lineUserId) return;
    login();
  }, [bookingId, available, lineUserId, login]);

  useEffect(() => {
    if (!bookingId || !lineUserId || attempted.current) return;
    attempted.current = true;
    setState("binding");
    (async () => {
      // 後端用 LIFF 存取憑證向 LINE 驗證身分，不再接受客戶端自報的 LINE ID
      const accessToken: string | null = window.liff?.getAccessToken?.() ?? null;
      if (!accessToken) {
        setState("error");
        return;
      }
      const { data, error } = await supabase.functions.invoke("bind-line-booking", {
        body: { booking_id: bookingId, access_token: accessToken },
      });
      if (!error && data?.is_group) setIsGroup(true);
      setState(error ? "error" : "done");
    })();
  }, [bookingId, lineUserId]);

  // 綁定完成後導向官方 LINE 加入好友頁面；在 LINE App 內優先關閉 LIFF 視窗
  useEffect(() => {
    if (state !== "done" || redirected.current) return;
    redirected.current = true;
    const timer = setTimeout(() => {
      try {
        if (window.liff?.closeWindow) window.liff.closeWindow();
      } catch {
        // 忽略 closeWindow 失敗，改以重導向處理
      }
      window.location.href = LINE_OA_URL;
    }, 1800);
    return () => clearTimeout(timer);
  }, [state]);

  if (!bookingId) return null;

  return (
    <div className="max-w-3xl mx-auto mb-8">
      <div className="flex items-start gap-3 rounded-xl border border-[#06C755]/30 bg-[#06C755]/10 px-4 py-3">
        {state === "done" ? (
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#06C755]" />
        ) : state === "error" ? (
          <Gift className="w-5 h-5 shrink-0 mt-0.5 text-destructive" />
        ) : (
          <Loader2 className="w-5 h-5 shrink-0 mt-0.5 text-[#06C755] animate-spin" />
        )}
        <p className="text-sm leading-relaxed text-foreground/80">
          {state === "done"
            ? isGroup
              ? "綁定成功！預約憑證已發送至您的 LINE 聊天室（團報訂單依成團戶數計價，不與 LINE 好友折價並用），即將為您導向官方 LINE…"
              : "綁定成功！已套用 LINE 好友折價 $500，預約憑證已發送至您的 LINE 聊天室，即將為您導向官方 LINE…"
            : state === "error"
              ? "綁定失敗，請稍後再試或直接於官方 LINE 聯繫我們。"
              : "正在綁定您的 LINE 帳號…"}
        </p>
      </div>
    </div>
  );
};

export default LineBookingBinder;
