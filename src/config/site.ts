/**
 * 網站對外網址與 SEO 共用設定。
 * 之後若換成自己的網域，只要改 SITE_URL（並同步 public/robots.txt 的 Sitemap 行）。
 * scripts/generate-sitemap.ts 也讀這個值。
 */
export const SITE_URL = "https://inspection20.vercel.app";
export const SITE_NAME = "診斷室驗屋";
export const SITE_TITLE = "診斷室驗屋 Home Inspection & Diagnostics｜專業驗屋檢測服務";
export const SITE_DESCRIPTION =
  "診斷室驗屋提供專業驗屋檢測服務，涵蓋新成屋交屋驗收、中古屋買前檢測、商業建築評估與環境健康監測，報告詳盡、流程透明。";

export const absoluteUrl = (path: string) => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
