import { SITE_URL } from "@/config/site";

/** 0.9 -> "9 折"、0.85 -> "8.5 折" */
export const formatDiscount = (rate: number) => `${Number((rate * 10).toFixed(1))} 折`;

/** 站內路徑：/group/<slug>（slug 可能含中文，編碼後 React Router 會自動還原） */
export const groupPath = (slug: string) => `/group/${encodeURIComponent(slug)}`;

export const groupUrl = (slug: string) => `${SITE_URL}${groupPath(slug)}`;

/** 縣市顯示順序（篩選用） */
export const CITY_ORDER = ["台北市", "新北市", "基隆市", "桃園市", "新竹縣", "新竹市", "苗栗縣", "台中市", "宜蘭縣", "花蓮縣", "台東縣"];

const CITY_PREFIX: [RegExp, string][] = [
  [/^新竹縣/, "新竹縣"],
  [/^新竹市/, "新竹市"],
  [/^(台北|臺北)/, "台北市"],
  [/^新北/, "新北市"],
  [/^基隆/, "基隆市"],
  [/^桃園/, "桃園市"],
  [/^苗栗/, "苗栗縣"],
  [/^(台中|臺中)/, "台中市"],
  [/^宜蘭/, "宜蘭縣"],
  [/^花蓮/, "花蓮縣"],
  [/^(台東|臺東)/, "台東縣"],
];

/** 從地區文字判斷縣市（容許「台中太平區」這種沒寫「市」的寫法） */
export const cityOf = (region: string) => CITY_PREFIX.find(([re]) => re.test(region.trim()))?.[1] ?? "其他";

/** 取出縣市之後的行政區，例如「桃園市龜山區」→「龜山區」、「台中太平區」→「太平區」 */
export const districtOf = (region: string) =>
  region
    .trim()
    .replace(/^(新竹縣|新竹市|(台|臺)北市|新北市|基隆市|桃園市|苗栗縣|(台|臺)中市|宜蘭縣|花蓮縣|(台|臺)東縣|(台|臺)北|新北|基隆|桃園|苗栗|(台|臺)中|宜蘭|花蓮|(台|臺)東|新竹)/, "")
    .trim() || "其他";

/** 團報預設條件（來自 group_settings，後台可調整） */
export type GroupDefaults = { default_min_units: number; default_discount_rate: number };

/** 「滿 3 戶享 9 折」 */
export const termsText = (d: GroupDefaults) => `滿 ${d.default_min_units} 戶享 ${formatDiscount(d.default_discount_rate)}`;
