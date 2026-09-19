import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { GroupProject } from "@/components/admin/types";

const fetchCounts = async (): Promise<Record<string, number>> => {
  const { data } = await supabase.rpc("get_group_project_counts");
  const map: Record<string, number> = {};
  data?.forEach((r) => {
    map[r.group_project_id] = r.unit_count;
  });
  return map;
};

/** 開放中的團報建案清單＋各建案目前戶數 */
export function useActiveGroupProjects() {
  const [projects, setProjects] = useState<GroupProject[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data, error }, countMap] = await Promise.all([
        supabase
          .from("group_projects")
          .select("*")
          .eq("status", "active")
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
        fetchCounts(),
      ]);
      if (cancelled) return;
      if (error) {
        console.error("[group_projects load]", error.message);
        setFailed(true);
      } else {
        setProjects((data || []) as GroupProject[]);
        setCounts(countMap);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { projects, counts, loading, failed };
}

/** 依 slug 取得單一「開放中」建案（找不到或已關閉時 project 為 null） */
export function useGroupProjectBySlug(slug: string | undefined) {
  const [project, setProject] = useState<GroupProject | null>(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("group_projects")
        .select("*")
        .eq("slug", slug)
        .eq("status", "active")
        .maybeSingle();
      const found = (data as GroupProject | null) ?? null;
      const countMap = found ? await fetchCounts() : {};
      if (cancelled) return;
      setProject(found);
      setCount(found ? (countMap[found.id] ?? 0) : 0);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { project, count, loading };
}
