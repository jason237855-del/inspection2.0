import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import GroupProjectCard from "@/components/group/GroupProjectCard";
import { useActiveGroupProjects } from "@/hooks/useGroupProjects";
import { useGroupSettings } from "@/hooks/useGroupSettings";
import { AREAS, areaPath, findArea } from "@/config/areas";
import { SITE_URL } from "@/config/site";
import { LINE_OA_URL } from "@/config/line";
import { cityOf, districtOf, termsText } from "@/lib/group";
import NotFound from "./NotFound";

const SYSTEMS = [
  ["電氣診斷", "配電箱迴路、插座開關、電壓相位與漏電斷路"],
  ["給排水診斷", "全戶水壓、給排水、衛浴與廚具設備洩水與排水"],
  ["防水診斷", "紅外線熱顯像、混凝土含水率與門窗滲漏水檢測"],
  ["建築土建診斷", "壁磚地磚空心、牆面垂直水平與樑柱外觀"],
  ["設備診斷", "門窗、淋浴拉門與廚衛設備的功能及安裝"],
  ["環境診斷", "室內甲醛、PM2.5、噪音、電磁波與水質"],
] as const;

const MAX_CARDS = 12;

/** 服務地區頁：/area/<slug>，例如 /area/taoyuan「桃園驗屋」 */
const Area = () => {
  const { slug } = useParams();
  const area = findArea(slug);
  const { projects, counts, loading } = useActiveGroupProjects();
  const groupDefaults = useGroupSettings();

  const local = useMemo(
    () => (area ? projects.filter((p) => (area.cities as readonly string[]).includes(cityOf(p.region))) : []),
    [area, projects],
  );
  const districts = useMemo(() => Array.from(new Set(local.map((p) => districtOf(p.region)))), [local]);

  if (!area) return <NotFound />;

  const path = areaPath(area.slug);
  const title = `${area.name}驗屋｜新成屋・中古屋驗屋與建案團報｜診斷室驗屋`;
  const description = `診斷室驗屋提供${area.name}地區新成屋交屋驗收與中古屋買前檢測，涵蓋電氣、給排水、防水、土建、設備與環境六大系統；同建案多戶可團報（${termsText(groupDefaults)}）。`;
  const groupCity = area.cities[0];

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Seo title={title} description={description} path={path}>
        <script type="application/ld+json">
          {JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "首頁", item: `${SITE_URL}/` },
                { "@type": "ListItem", position: 2, name: `${area.name}驗屋`, item: `${SITE_URL}${path}` },
              ],
            },
            {
              "@context": "https://schema.org",
              "@type": "Service",
              name: `${area.name}驗屋`,
              serviceType: "房屋檢測、新成屋驗屋、中古屋驗屋",
              provider: { "@id": `${SITE_URL}/#business` },
              areaServed: area.cities.map((name) => ({ "@type": "AdministrativeArea", name })),
            },
          ])}
        </script>
      </Seo>
      <Navigation variant="dark" />
      <main className="flex-1 pt-36 lg:pt-44 pb-24">
        <div className="container mx-auto px-6 lg:px-12 max-w-3xl text-center mb-14 lg:mb-16">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-4">Service Area</p>
          <h1 className="text-3xl lg:text-4xl font-semibold mb-5 tracking-tight">{area.name}驗屋</h1>
          <p className="text-balance text-muted-foreground font-light leading-relaxed">
            在{area.name}交屋或買屋前，由第三方專業團隊到現場檢測，把施工缺失與屋況風險在交屋前確認清楚。新成屋、中古屋都可以預約。
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild className="rounded-full">
              <Link to="/booking">立即預約驗屋</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <a href={LINE_OA_URL} target="_blank" rel="noopener noreferrer">
                用官方 LINE 詢問
              </a>
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-6 lg:px-12 max-w-5xl space-y-16 lg:space-y-20">
          <section aria-labelledby="area-systems">
            <h2 id="area-systems" className="text-2xl font-semibold tracking-tight text-center mb-8">
              {area.name}驗屋，我們檢測什麼
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SYSTEMS.map(([name, desc]) => (
                <div key={name} className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="text-base font-semibold mb-2">{name}</h3>
                  <p className="text-sm font-light leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-sm font-light text-muted-foreground">
              費用依坪數與檢測範圍計算，詳見
              <Link to="/#pricing" className="mx-1 text-primary underline-offset-4 hover:underline">
                驗屋價格
              </Link>
              ；常見疑問請看
              <Link to="/faq" className="mx-1 text-primary underline-offset-4 hover:underline">
                常見問題
              </Link>
              。
            </p>
          </section>

          <section aria-labelledby="area-group">
            <h2 id="area-group" className="text-2xl font-semibold tracking-tight text-center mb-3">
              {area.name}建案團報
            </h2>
            <p className="text-balance text-center text-sm font-light leading-relaxed text-muted-foreground mb-8">
              {local.length > 0
                ? `目前開放團報的${area.name}建案共 ${local.length} 個，分布在${districts.slice(0, 8).join("、")}${districts.length > 8 ? "等" : ""}。同建案${termsText(groupDefaults)}，每戶各自預約時段。`
                : `目前${area.name}還沒有開放中的團報建案。同建案${termsText(groupDefaults)}，歡迎提出您的建案，審核上架後邀請鄰居一起加入。`}
            </p>
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              local.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {local.slice(0, MAX_CARDS).map((p) => (
                    <GroupProjectCard key={p.id} project={p} count={counts[p.id] || 0} />
                  ))}
                </div>
              )
            )}
            <div className="mt-8 text-center">
              <Button asChild variant="ghost" className="rounded-full">
                <Link to={local.length > 0 ? `/group?city=${encodeURIComponent(groupCity)}` : "/group"}>
                  {local.length > MAX_CARDS ? `查看全部 ${local.length} 個${area.name}團報建案 →` : "團報專區與流程說明 →"}
                </Link>
              </Button>
            </div>
          </section>

          <section aria-labelledby="area-other">
            <h2 id="area-other" className="text-lg font-semibold tracking-tight text-center mb-4">
              其他服務地區
            </h2>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-light">
              {AREAS.filter((a) => a.slug !== area.slug).map((a) => (
                <Link key={a.slug} to={areaPath(a.slug)} className="text-muted-foreground hover:text-primary transition-colors">
                  {a.name}驗屋
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Area;
