import { Link, useParams, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { getArticle, getCategory, journalArticles } from "@/data/journal";

const SITE = "https://hushed-haven-stays.lovable.app";

const SectionHead = ({ en, zh }: { en: string; zh: string }) => (
  <div className="mb-6">
    <p className="text-[10px] uppercase tracking-[0.26em] text-primary mb-2">{en}</p>
    <h2 className="text-xl lg:text-2xl font-semibold tracking-tight">{zh}</h2>
  </div>
);

const JournalArticle = () => {
  const { slug } = useParams();
  const article = getArticle(slug);

  if (!article) return <Navigate to="/journal" replace />;

  const related = article.related
    .map((s) => journalArticles.find((a) => a.slug === s))
    .filter(Boolean)
    .slice(0, 3);

  const url = `${SITE}/journal/${article.slug}`;

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Helmet>
        <title>{article.seoTitle}</title>
        <meta name="description" content={article.metaDescription} />
        <meta property="og:title" content={article.seoTitle} />
        <meta property="og:description" content={article.metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={url} />
        <meta property="og:site_name" content="診斷室驗屋" />
        <meta property="og:image" content={`${SITE}${article.image}`} />
        <meta property="article:published_time" content={article.date} />
        <meta property="article:section" content={getCategory(article.category)?.zh || "診斷筆記"} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.seoTitle} />
        <meta name="twitter:description" content={article.metaDescription} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={url} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: article.title,
            description: article.metaDescription,
            image: [`${SITE}${article.image}`],
            datePublished: article.date,
            dateModified: article.date,
            inLanguage: "zh-TW",
            articleSection: getCategory(article.category)?.zh,
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
            author: { "@type": "Organization", name: "診斷室驗屋" },
            publisher: {
              "@type": "Organization",
              name: "診斷室驗屋",
              url: SITE,
            },
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "首頁", item: `${SITE}/` },
              { "@type": "ListItem", position: 2, name: "診斷筆記", item: `${SITE}/journal` },
              { "@type": "ListItem", position: 3, name: article.title, item: url },
            ],
          })}
        </script>
      </Helmet>

      <Navigation variant="dark" />

      <main className="flex-1">
        <article>
          {/* Header */}
          <header className="pt-36 lg:pt-44 pb-12 bg-card/60 border-b border-border/60">
            <div className="container mx-auto px-6 lg:px-12 max-w-3xl">
              <Link
                to="/journal"
                className="inline-flex items-center gap-2 text-[11px] tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors mb-8"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                DIAGNOSTIC JOURNAL
              </Link>
              <div className="flex items-center gap-3 mb-5">
                <span className="text-[10px] uppercase tracking-[0.22em] text-primary">
                  {getCategory(article.category)?.en}
                </span>
                <span className="text-[11px] text-muted-foreground/70">
                  {getCategory(article.category)?.zh}
                </span>
              </div>
              <h1 className="text-2xl lg:text-4xl font-semibold tracking-tight leading-snug">
                {article.titleLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </h1>
              <p className="mt-6 text-[11px] tracking-wider text-muted-foreground/70">
                {new Date(article.date).toLocaleDateString("zh-TW")}
              </p>
            </div>
          </header>

          <div className="container mx-auto px-6 lg:px-12 max-w-3xl py-14 lg:py-20">
            <div className="overflow-hidden rounded-2xl bg-muted aspect-[16/9] mb-12 lg:mb-16">
              <img
                src={article.image}
                alt={article.imageAlt}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>

            {/* Lead */}
            <div className="space-y-5 mb-14">
              {article.lead.map((p, i) => (
                <p
                  key={i}
                  className={`font-light leading-loose ${
                    i === 0
                      ? "text-lg lg:text-xl text-foreground"
                      : "text-base text-muted-foreground"
                  }`}
                >
                  {p}
                </p>
              ))}
            </div>

            {/* Observation */}
            <section className="mb-14">
              <SectionHead en="Observation" zh="觀察" />
              <p className="font-light leading-loose text-muted-foreground mb-5">
                {article.observation.intro}
              </p>
              <ul className="space-y-3">
                {article.observation.points.map((p) => (
                  <li key={p} className="flex gap-3 font-light leading-loose">
                    <span className="mt-[0.7em] h-px w-4 shrink-0 bg-primary/60" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Possible causes */}
            <section className="mb-14">
              <SectionHead en="Possible Causes" zh="可能原因" />
              <p className="font-light leading-loose text-muted-foreground mb-5">
                {article.causes.intro}
              </p>
              <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
                {article.causes.points.map((p) => (
                  <li key={p} className="flex gap-3 font-light leading-loose">
                    <span className="text-primary/70">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* How we read it */}
            <section className="mb-14">
              <SectionHead en="How We Read It" zh="如何判讀" />
              <p className="font-light leading-loose text-muted-foreground mb-6">
                {article.reading.intro}
              </p>
              <ol className="space-y-4 border-l border-border pl-6">
                {article.reading.points.map((p, i) => (
                  <li key={p} className="relative font-light leading-loose">
                    <span className="absolute -left-[27px] top-[0.6em] h-2 w-2 rounded-full bg-primary/70" />
                    <span className="text-[11px] tracking-[0.18em] text-muted-foreground/70 mr-3">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {p}
                  </li>
                ))}
              </ol>
              <p className="mt-6 font-light leading-loose text-muted-foreground">
                {article.reading.outro}
              </p>
            </section>

            {/* What to do next */}
            <section className="mb-14">
              <SectionHead en="What To Do Next" zh="下一步" />
              <p className="font-light leading-loose text-muted-foreground mb-6">
                {article.next.intro}
              </p>
              <div className="space-y-4">
                {article.next.steps.map((s) => (
                  <div
                    key={s.when}
                    className="rounded-xl border border-border/70 bg-card/40 p-5"
                  >
                    <p className="text-sm font-medium tracking-wide mb-2">
                      {s.when}
                    </p>
                    <p className="text-sm font-light leading-loose text-muted-foreground">
                      {s.action}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Real case study */}
            {article.caseStudy && (
              <section className="mb-14 rounded-2xl border border-primary/30 bg-primary/[0.04] p-7 lg:p-9">
                <div className="mb-6">
                  <p className="text-[10px] uppercase tracking-[0.26em] text-primary mb-2">
                    Real Case
                  </p>
                  <h2 className="text-xl lg:text-2xl font-semibold tracking-tight">
                    實際案例
                  </h2>
                </div>
                <p className="text-sm font-medium tracking-wide mb-4">
                  {article.caseStudy.label}
                </p>
                <p className="font-light leading-loose text-muted-foreground mb-8">
                  {article.caseStudy.context}
                </p>

                <div className="grid gap-8 sm:grid-cols-2 mb-8">
                  <div>
                    <p className="text-[11px] tracking-[0.2em] text-muted-foreground/80 mb-3">
                      現場觀察
                    </p>
                    <ul className="space-y-3">
                      {article.caseStudy.observed.map((p) => (
                        <li
                          key={p}
                          className="flex gap-3 text-sm font-light leading-loose"
                        >
                          <span className="mt-[0.7em] h-px w-3 shrink-0 bg-primary/60" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[11px] tracking-[0.2em] text-muted-foreground/80 mb-3">
                      判讀過程
                    </p>
                    <ol className="space-y-3">
                      {article.caseStudy.process.map((p, i) => (
                        <li
                          key={p}
                          className="flex gap-3 text-sm font-light leading-loose"
                        >
                          <span className="text-[11px] tracking-[0.16em] text-muted-foreground/70 mt-[0.35em]">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                <div className="rounded-xl border border-border/70 bg-background/70 p-6 mb-5">
                  <p className="text-[11px] tracking-[0.2em] text-muted-foreground/80 mb-3">
                    後續改善與結果
                  </p>
                  <p className="text-sm font-light leading-loose">
                    {article.caseStudy.outcome}
                  </p>
                </div>
                <p className="border-l-2 border-primary/60 pl-5 text-sm font-light leading-loose text-foreground/85">
                  {article.caseStudy.lesson}
                </p>
              </section>
            )}


            {/* Diagnosis note */}
            <aside className="rounded-2xl bg-foreground text-background p-8 lg:p-10">
              <p className="text-[10px] uppercase tracking-[0.26em] opacity-70 mb-2">
                Diagnosis Note
              </p>
              <h2 className="text-lg font-semibold tracking-tight mb-4">診斷筆記</h2>
              <p className="font-light leading-loose text-background/85">
                {article.note}
              </p>
            </aside>

            {/* CTA */}
            <section className="mt-14 rounded-2xl border border-border/70 bg-card/40 p-8 lg:p-10">
              <h2 className="text-xl font-semibold tracking-tight mb-4">
                還是不確定您遇到的狀況？
              </h2>
              <p className="font-light leading-loose text-muted-foreground mb-7">
                每間房子的條件都不同。如果您正在交屋、驗屋，或對房屋現況有疑問，
                可以將基本狀況提供給我們。
              </p>
              <Link
                to="/booking"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
              >
                <CalendarDays className="h-4 w-4" />
                立即預約
              </Link>
            </section>
          </div>
        </article>

        {/* Related */}
        {related.length > 0 && (
          <section className="border-t border-border/60 py-16 lg:py-20 bg-card/40">
            <div className="container mx-auto px-6 lg:px-12">
              <p className="text-[10px] uppercase tracking-[0.26em] text-primary mb-2">
                Related Journal
              </p>
              <h2 className="text-xl lg:text-2xl font-semibold tracking-tight mb-10">
                延伸閱讀
              </h2>
              <div className="grid gap-6 md:grid-cols-3">
                {related.map((a) => (
                  <Link
                    key={a!.slug}
                    to={`/journal/${a!.slug}`}
                    className="group rounded-2xl border border-border/70 bg-background/60 p-6 transition-colors hover:border-primary/50"
                  >
                    <span className="text-[10px] uppercase tracking-[0.2em] text-primary">
                      {getCategory(a!.category)?.en}
                    </span>
                    <h3 className="mt-3 text-base font-semibold leading-snug tracking-tight">
                      {a!.title}
                    </h3>
                    <p className="mt-3 text-sm font-light leading-loose text-muted-foreground line-clamp-3">
                      {a!.excerpt}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 text-[11px] tracking-[0.18em]">
                      READ JOURNAL
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default JournalArticle;
