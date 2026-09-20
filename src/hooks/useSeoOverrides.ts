import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SeoOverride = { title: string; description: string };
export type SeoOverrides = Record<string, SeoOverride>;

const CACHE_KEY = "page-seo-cache";

// 用上次讀到的值當初始值，避免標題先顯示預設再跳成後台設定的值
const readCache = (): SeoOverrides => {
  try {
    const v = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (v && typeof v === "object") return v;
  } catch {
    // 讀不到就當沒有
  }
  return {};
};

/** 後台「SEO 設定」存的各頁標題／說明（以路徑為 key）；沒有設定的頁面不在裡面 */
export function useSeoOverrides(): SeoOverrides {
  const { data } = useQuery({
    queryKey: ["page-seo"],
    queryFn: async (): Promise<SeoOverrides> => {
      const { data, error } = await supabase.from("page_seo").select("path, title, description");
      if (error) throw error;
      const map: SeoOverrides = {};
      (data || []).forEach((r) => {
        map[r.path] = { title: r.title, description: r.description };
      });
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(map));
      } catch {
        // 忽略
      }
      return map;
    },
    initialData: readCache,
    initialDataUpdatedAt: 0,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  return data ?? {};
}
