/**
 * 網站對外網址與 SEO 共用設定。
 * 之後若換成自己的網域，只要改 SITE_URL（並同步 public/robots.txt 的 Sitemap 行）。
 * scripts/generate-sitemap.ts 也讀這個值。
 */
export const SITE_URL = "https://inspection20.vercel.app";
export const SITE_NAME = "診斷室驗屋";
export const SITE_TITLE = "新成屋・中古屋驗屋｜診斷室驗屋 Home Inspection & Diagnostics";
export const SITE_DESCRIPTION =
  "診斷室驗屋提供新成屋交屋驗收與中古屋買前檢測，結合紅外線熱顯像與水電、防水、環境檢測，服務台北、新北、桃園、新竹、台中等地；同建案多戶可團報享折扣。";

/** 分享預覽圖（LINE／Facebook 連結預覽），1200×630；換圖時用同檔名覆蓋 public/og-image.jpg 即可 */
export const DEFAULT_OG_IMAGE = "/og-image.jpg";
export const DEFAULT_OG_IMAGE_ALT = "診斷室驗屋 Home Inspection & Diagnostics";

export const absoluteUrl = (path: string) => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
