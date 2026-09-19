import { SITE_URL } from "@/config/site";

/** 0.9 -> "9 折"、0.85 -> "8.5 折" */
export const formatDiscount = (rate: number) => `${Number((rate * 10).toFixed(1))} 折`;

/** 站內路徑：/group/<slug>（slug 可能含中文，編碼後 React Router 會自動還原） */
export const groupPath = (slug: string) => `/group/${encodeURIComponent(slug)}`;

export const groupUrl = (slug: string) => `${SITE_URL}${groupPath(slug)}`;
