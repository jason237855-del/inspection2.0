import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { GA_MEASUREMENT_ID } from "@/config/site";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

// 後台與登入頁不計入，避免自己的操作污染訪客數據
const UNTRACKED = ["/admin", "/auth", "/reset-password"];

const isLocal = () => ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname) || /^(192\.168|10\.)/.test(window.location.hostname);

/** Google Analytics 4。這是單頁網站，換頁不會重新載入，所以每次路由變化都手動回報一次 page_view。 */
const Analytics = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || isLocal() || window.gtag) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // GA 要求用 arguments 物件，不能改成展開參數
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID, { send_page_view: false });
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (!window.gtag || UNTRACKED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return;
    // 等頁面的 <title>（react-helmet）更新後再回報，GA 才會記到正確的頁面標題
    const timer = window.setTimeout(() => {
      window.gtag?.("event", "page_view", {
        page_path: pathname + search,
        page_location: window.location.href,
        page_title: document.title,
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [pathname, search]);

  return null;
};

export default Analytics;
