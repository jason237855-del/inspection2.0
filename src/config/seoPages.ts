import { SITE_TITLE, SITE_DESCRIPTION } from "./site";

/** 後台「SEO 設定」可編輯的頁面；title／description 是預設值，資料庫 page_seo 有對應列時以資料庫為準 */
export const SEO_PAGES = [
  { path: "/", label: "首頁", title: SITE_TITLE, description: SITE_DESCRIPTION },
  {
    path: "/about",
    label: "關於我們",
    title: "關於診斷室驗屋｜品牌故事與檢測理念",
    description: "認識診斷室驗屋的品牌故事與檢測理念，以及為什麼房屋檢測是交屋與購屋前重要的一步。",
  },
  {
    path: "/faq",
    label: "常見問題",
    title: "驗屋常見問題｜費用、服務地區與團報｜診斷室驗屋",
    description:
      "從驗屋費用、服務地區到單戶預約與多戶團報，整理委託前最常遇到的實際問題，讓您在聯繫以前先掌握所需資料與安排方式。",
  },
  {
    path: "/group",
    label: "建案團報專區",
    title: "建案團報｜同建案團購驗屋享折扣｜診斷室驗屋",
    description:
      "同建案多戶一起報名驗屋，達成團戶數全團享折扣。找到自己的建案加入團報，每戶各自預約時段，也可以提出新的建案。",
  },
  {
    path: "/journal",
    label: "診斷筆記",
    title: "診斷筆記 Diagnostic Journal｜診斷室驗屋",
    description: "從建築現象出發的診斷筆記：滲漏水、電氣、給排水、建築與設備常見問題的觀察、可能原因與判讀方式。",
  },
  {
    path: "/privacy",
    label: "隱私權政策",
    title: "隱私權政策｜診斷室驗屋",
    description: "說明診斷室驗屋如何蒐集、使用與保護您在預約、團報與瀏覽網站時提供的個人資料，以及您可行使的權利。",
  },
] as const;

export const SEO_TITLE_MAX = 70;
export const SEO_DESCRIPTION_MAX = 200;

export const seoDefaults = (path: (typeof SEO_PAGES)[number]["path"]) => SEO_PAGES.find((p) => p.path === path)!;
