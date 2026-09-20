import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { GroupDefaults } from "@/lib/group";

const FALLBACK: GroupDefaults = { default_min_units: 3, default_discount_rate: 0.9 };
const CACHE_KEY = "group-settings-cache";

// 用上次讀到的值當初始值，避免預設條件被改過後、每次載入先閃一下舊數字
const readCache = (): GroupDefaults => {
  try {
    const v = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (v && Number.isInteger(v.default_min_units) && typeof v.default_discount_rate === "number") return v;
  } catch {
    // 讀不到就用預設
  }
  return FALLBACK;
};

/** 團報預設條件（成團戶數、折數），後台「團報管理」可調整；官網上的「滿 N 戶享 X 折」都讀這裡 */
export function useGroupSettings(): GroupDefaults {
  const { data } = useQuery({
    queryKey: ["group-settings"],
    queryFn: async (): Promise<GroupDefaults> => {
      const { data, error } = await supabase
        .from("group_settings")
        .select("default_min_units, default_discount_rate")
        .maybeSingle();
      if (error || !data) throw error ?? new Error("group_settings missing");
      const v = { default_min_units: data.default_min_units, default_discount_rate: Number(data.default_discount_rate) };
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(v));
      } catch {
        // 忽略
      }
      return v;
    },
    initialData: readCache,
    initialDataUpdatedAt: 0, // 視為過期，載入後立刻重新讀取
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  return data ?? FALLBACK;
}
