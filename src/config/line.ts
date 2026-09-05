/**
 * LINE LIFF 設定
 *
 * 請至 LINE Developers Console 建立 LIFF App（Scope 需勾選 profile、openid、email），
 * 並將取得的 LIFF ID 填入下方，或設定環境變數 VITE_LIFF_ID。
 * 例如：LIFF_ID = "2000000000-abcdefgh";
 */
export const LIFF_ID: string =
  (import.meta.env.VITE_LIFF_ID as string | undefined) || "2011399537-wDhjBXzs";

export const LINE_OA_URL = "https://lin.ee/8S6eDLR";
