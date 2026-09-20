import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Search } from "lucide-react";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "react-router-dom";
import { CITY_ORDER, cityOf, districtOf } from "@/lib/group";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import { useActiveGroupProjects } from "@/hooks/useGroupProjects";
import GroupProjectCard from "@/components/group/GroupProjectCard";
import GroupHowItWorks from "@/components/group/GroupHowItWorks";
import ProposeGroupDialog from "@/components/group/ProposeGroupDialog";
import { LINE_OA_URL } from "@/config/line";
import { SITE_URL } from "@/config/site";

/** 團報專區：流程說明＋所有開放中的團報建案 */
const PAGE_SIZE = 12;

const GroupHub = () => {
  const reduced = usePrefersReducedMotion();
  const { projects, counts, loading, failed } = useActiveGroupProjects();
  const [proposeOpen, setProposeOpen] = useState(false);
  // 首頁搜尋框會用 /group?q=關鍵字（也可用 ?city=桃園市）帶進來
  const [searchParams] = useSearchParams();
  const [city, setCity] = useState(searchParams.get("city") || "全部");
  const [district, setDistrict] = useState("全部");
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [visible, setVisible] = useState(PAGE_SIZE);

  // 各縣市的建案數（只列出有建案的縣市）
  const cityCounts = useMemo(() => {
    const map = new Map<string, number>();
    projects.forEach((p) => map.set(cityOf(p.region), (map.get(cityOf(p.region)) ?? 0) + 1));
    return [...CITY_ORDER, "其他"].filter((c) => map.has(c)).map((c) => [c, map.get(c) as number] as const);
  }, [projects]);

  // 選了縣市後，列出該縣市內有建案的行政區
  const districtCounts = useMemo(() => {
    if (city === "全部") return [];
    const map = new Map<string, number>();
    projects
      .filter((p) => cityOf(p.region) === city)
      .forEach((p) => map.set(districtOf(p.region), (map.get(districtOf(p.region)) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "zh-Hant"));
  }, [projects, city]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter(
      (p) =>
        (city === "全部" || cityOf(p.region) === city) &&
        (district === "全部" || districtOf(p.region) === district) &&
        (!q || `${p.name}${p.region}`.toLowerCase().includes(q)),
    );
  }, [projects, city, district, query]);

  // 換縣市時清掉行政區；換任何篩選條件時回到第一頁
  useEffect(() => setDistrict("全部"), [city]);
  useEffect(() => setVisible(PAGE_SIZE), [city, district, query]);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Seo
        title="建案團報｜同建案團購驗屋享折扣｜診斷室驗屋"
        description="同建案多戶一起報名驗屋，達成團戶數全團享折扣。找到自己的建案加入團報，每戶各自預約時段，也可以提出新的建案。"
        path="/group"
      >
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "首頁", item: `${SITE_URL}/` },
              { "@type": "ListItem", position: 2, name: "建案團報", item: `${SITE_URL}/group` },
            ],
          })}
        </script>
      </Seo>
      <Navigation variant="dark" />
      <main className="flex-1 pt-36 lg:pt-44 pb-24">
        <div className="container mx-auto px-6 lg:px-12 max-w-3xl text-center mb-14 lg:mb-16">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-4">Group Inspection</p>
            <h1 className="text-3xl lg:text-4xl font-semibold mb-5 tracking-tight">建案團報</h1>
            <p className="text-muted-foreground font-light leading-relaxed">
              同社區多戶一起報名驗屋，達成戶數，全團享折扣（滿 3 戶享 9 折），按「加入團報」就即開始。
            </p>
          </motion.div>
        </div>

        <div className="container mx-auto px-6 lg:px-12 max-w-5xl">
          <section aria-labelledby="group-how" className="mb-16 lg:mb-20">
            <h2 id="group-how" className="text-2xl font-semibold tracking-tight text-center mb-10">報名流程</h2>
            <GroupHowItWorks />
          </section>

          <section aria-labelledby="group-list">
            <h2 id="group-list" className="scroll-mt-32 text-2xl font-semibold tracking-tight text-center mb-8">
              開放中的團報建案{!loading && !failed && projects.length > 0 ? `（${projects.length}）` : ""}
            </h2>
            {!loading && !failed && projects.length > PAGE_SIZE && (
              <div className="mb-8 space-y-4">
                <div className="relative mx-auto max-w-md">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="搜尋建案名稱或地區"
                    aria-label="搜尋建案"
                    className="rounded-full pl-10"
                  />
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {[["全部", projects.length] as const, ...cityCounts].map(([c, n]) => (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={city === c}
                      onClick={() => setCity(c)}
                      className={`rounded-full border px-4 py-1.5 text-xs transition-colors ${
                        city === c
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      }`}
                    >
                      {c}
                      <span className="ml-1.5 opacity-70">{n}</span>
                    </button>
                  ))}
                </div>
                {districtCounts.length > 1 && (
                  <div className="flex flex-wrap justify-center gap-2 border-t border-border pt-4">
                    {[["全部", filtered.length] as const, ...districtCounts].map(([d, n], i) => (
                      <button
                        key={d}
                        type="button"
                        aria-pressed={district === d}
                        onClick={() => setDistrict(d)}
                        className={`rounded-full border px-3.5 py-1 text-xs transition-colors ${
                          district === d
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                        }`}
                      >
                        {i === 0 ? `${city}全部` : d}
                        <span className="ml-1.5 opacity-70">{i === 0 ? districtCounts.reduce((a, [, c]) => a + c, 0) : n}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : failed ? (
              <p className="text-center text-sm text-muted-foreground font-light py-6">
                暫時無法載入建案清單，請稍後再試，或直接透過官方 LINE 詢問。
              </p>
            ) : projects.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground font-light py-6">
                目前沒有開放中的團報建案，歡迎提出您的建案。
              </p>
            ) : filtered.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground font-light py-6">
                找不到符合的建案，你可以在下方提出新的建案。
              </p>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.slice(0, visible).map((p) => (
                    <GroupProjectCard key={p.id} project={p} count={counts[p.id] || 0} />
                  ))}
                </div>
                {filtered.length > visible && (
                  <div className="mt-10 text-center">
                    <Button variant="outline" className="rounded-full" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                      顯示更多（還有 {filtered.length - visible} 個）
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="mt-16 rounded-3xl border border-border bg-card p-8 text-center shadow-soft">
            <h2 className="text-xl font-semibold mb-2">找不到您的建案？</h2>
            <p className="text-sm font-light text-muted-foreground mb-6">
              提出您的建案，審核上架後就能邀請同社區的鄰居一起加入。
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => setProposeOpen(true)} className="rounded-full">
                <Plus className="h-4 w-4 mr-1.5" />
                提出新建案團報
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <a href={LINE_OA_URL} target="_blank" rel="noopener noreferrer">
                  用官方 LINE 詢問
                </a>
              </Button>
            </div>
          </section>
        </div>
      </main>
      <Footer />
      <ProposeGroupDialog open={proposeOpen} onOpenChange={setProposeOpen} />
    </div>
  );
};

export default GroupHub;
