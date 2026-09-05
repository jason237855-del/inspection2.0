import { useCallback, useEffect, useState } from "react";
import { LIFF_ID } from "@/config/line";

declare global {
  interface Window {
    liff?: any;
  }
}

const LIFF_SDK_URL = "https://static.line-scdn.net/liff/edge/2/sdk.js";

function loadLiffSdk(): Promise<void> {
  if (window.liff) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${LIFF_SDK_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("LIFF SDK load failed")));
      return;
    }
    const script = document.createElement("script");
    script.src = LIFF_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("LIFF SDK load failed"));
    document.head.appendChild(script);
  });
}

export interface LineProfile {
  userId: string;
  displayName: string | null;
  email: string | null;
}

let initPromise: Promise<any | null> | null = null;

async function ensureLiff(): Promise<any | null> {
  if (!LIFF_ID) return null;
  if (!initPromise) {
    initPromise = (async () => {
      await loadLiffSdk();
      const liff = window.liff;
      if (!liff) return null;
      await liff.init({ liffId: LIFF_ID });
      return liff;
    })().catch((e) => {
      console.warn("LIFF init failed", e);
      initPromise = null;
      return null;
    });
  }
  return initPromise;
}

/**
 * 取得 LINE 使用者資料。
 * - 在 LIFF 瀏覽器（或已授權）時會自動帶入資料。
 * - 也提供 login() 讓使用者手動觸發 LINE Login 授權。
 */
export function useLiffProfile() {
  const [profile, setProfile] = useState<LineProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const available = Boolean(LIFF_ID);

  const readProfile = useCallback(async (liff: any): Promise<LineProfile | null> => {
    if (!liff?.isLoggedIn?.()) return null;
    const p = await liff.getProfile();
    let email: string | null = null;
    try {
      email = liff.getDecodedIDToken?.()?.email ?? null;
    } catch {
      email = null;
    }
    if (!p?.userId) return null;
    return { userId: p.userId, displayName: p.displayName ?? null, email };
  }, []);

  // 自動嘗試（LIFF 內開啟時無感帶入）
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const liff = await ensureLiff();
      if (!liff) return;
      try {
        const result = await readProfile(liff);
        if (!cancelled && result) setProfile(result);
      } catch (e) {
        console.warn("LIFF profile unavailable", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [readProfile]);

  const login = useCallback(async (): Promise<LineProfile | null> => {
    setLoading(true);
    try {
      const liff = await ensureLiff();
      if (!liff) return null;
      if (!liff.isLoggedIn?.()) {
        // 導向 LINE 授權頁，返回後 useEffect 會自動帶入資料
        liff.login({ redirectUri: window.location.href, scope: "profile openid email" });
        return null;
      }
      const result = await readProfile(liff);
      if (result) setProfile(result);
      return result;
    } catch (e) {
      console.warn("LINE login failed", e);
      return null;
    } finally {
      setLoading(false);
    }
  }, [readProfile]);

  return { profile, lineUserId: profile?.userId ?? null, login, loading, available };
}
