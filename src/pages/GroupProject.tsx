import { Link, useParams } from "react-router-dom";
import { Loader2, MapPin, Users } from "lucide-react";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import { useGroupProjectBySlug } from "@/hooks/useGroupProjects";
import GroupHowItWorks from "@/components/group/GroupHowItWorks";
import ShareButtons from "@/components/group/ShareButtons";
import { formatDiscount, groupPath, groupUrl } from "@/lib/group";
import { LINE_OA_URL } from "@/config/line";
import { SITE_URL } from "@/config/site";

/** 單一建案的團報頁面：/group/<slug> */
const GroupProject = () => {
  const { slug } = useParams<{ slug: string }>();
  const reduced = usePrefersReducedMotion();
  const { project, count, loading } = useGroupProjectBySlug(slug);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation variant="dark" />
        <main className="flex-1 flex items-center justify-center pt-36">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col overflow-x-hidden">
        <Seo
          title="找不到這個團報建案｜診斷室驗屋"
          description="這個團報建案不存在，或已結束開放。"
          path={groupPath(slug ?? "")}
          noindex
        />
        <Navigation variant="dark" />
        <main className="flex-1 pt-40 pb-24">
          <div className="container mx-auto px-6 max-w-xl text-center">
            <h1 className="text-2xl font-semibold mb-4">找不到這個團報建案</h1>
            <p className="text-sm font-light text-muted-foreground mb-8">
              這個建案可能已結束開放，或連結有誤。你可以到團報專區看看目前開放中的建案，或提出你的建案。
            </p>
            <Button asChild className="rounded-full">
              <Link to="/group">前往團報專區</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const discount = formatDiscount(project.discount_rate);
  const reached = count >= project.min_units;
  const remaining = Math.max(0, project.min_units - count);
  const progress = Math.min(100, (count / project.min_units) * 100);
  const url = groupUrl(project.slug);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Seo
        title={`${project.name} 團購驗屋｜滿 ${project.min_units} 戶享 ${discount}｜診斷室驗屋`}
        description={`${project.region}「${project.name}」建案團購驗屋：同建案滿 ${project.min_units} 戶全團享 ${discount}，每戶各自預約時段。加入團報並邀請鄰居一起報名。`}
        path={groupPath(project.slug)}
      >
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "首頁", item: `${SITE_URL}/` },
              { "@type": "ListItem", position: 2, name: "建案團報", item: `${SITE_URL}/group` },
              { "@type": "ListItem", position: 3, name: project.name, item: url },
            ],
          })}
        </script>
      </Seo>
      <Navigation variant="dark" />
      <main className="flex-1 pt-36 lg:pt-44 pb-24">
        <div className="container mx-auto px-6 lg:px-12 max-w-3xl">
          <nav aria-label="breadcrumb" className="mb-8 text-xs font-light text-muted-foreground">
            <Link to="/group" className="hover:text-primary transition-colors">建案團報</Link>
            <span className="mx-2">/</span>
            <span>{project.name}</span>
          </nav>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl lg:text-4xl font-semibold mb-3 tracking-tight">{project.name} 團購驗屋</h1>
            <p className="mb-8 flex items-center gap-1.5 text-sm font-light text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {project.region}
            </p>

            <div className="rounded-3xl border border-border bg-card p-7 shadow-soft">
              <div className="mb-2 flex items-center justify-between text-sm font-light text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  已報名 {count} 戶
                </span>
                <span>滿 {project.min_units} 戶享 {discount}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-3 text-sm font-medium text-primary">
                {reached ? `已成團，全團享 ${discount}` : `再 ${remaining} 戶即成團，邀請鄰居一起加入`}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="rounded-full">
                  <Link to={`/booking?group=${project.id}`}>加入團報</Link>
                </Button>
                <ShareButtons url={url} />
              </div>
            </div>
          </motion.div>

          <section className="mt-16" aria-labelledby="how">
            <h2 id="how" className="text-2xl font-semibold tracking-tight text-center mb-10">報名流程</h2>
            <GroupHowItWorks />
          </section>

          <section className="mt-16 rounded-3xl border border-border bg-card p-8 text-center shadow-soft">
            <h2 className="text-xl font-semibold mb-2">還有疑問？</h2>
            <p className="text-sm font-light text-muted-foreground mb-6">
              想確認檢測範圍、費用或可預約的時段，歡迎透過官方 LINE 詢問。
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild variant="outline" className="rounded-full">
                <a href={LINE_OA_URL} target="_blank" rel="noopener noreferrer">用官方 LINE 詢問</a>
              </Button>
              <Button asChild variant="ghost" className="rounded-full">
                <Link to="/faq">常見問題</Link>
              </Button>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GroupProject;
