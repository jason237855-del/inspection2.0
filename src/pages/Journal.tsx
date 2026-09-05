import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import {
  journalArticles,
  journalCategories,
  getCategory,
} from "@/data/journal";

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("zh-TW", { year: "numeric", month: "2-digit" });

const Journal = () => {
  const [active, setActive] = useState<string>("all");
  const reduceMotion = usePrefersReducedMotion();

  const filtered = useMemo(
    () =>
      active === "all"
        ? journalArticles
        : journalArticles.filter((a) => a.category === active),
    [active]
  );

  const [featured, ...rest] = filtered;

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Helmet>
        <title>診斷筆記 Diagnostic Journal｜診斷室驗屋</title>
        <meta
          name="description"
          content="從建築現象出發的診斷筆記：滲漏水、電氣、給排水、建築與設備常見問題的觀察、可能原因與判讀方式。"
        />
        <meta property="og:title" content="診斷筆記 Diagnostic Journal｜診斷室驗屋" />
        <meta
          property="og:description"
          content="看見問題只是開始，理解問題，才能找到改善方向。"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://hushed-haven-stays.lovable.app/journal" />
        <meta property="og:site_name" content="診斷室驗屋" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href="https://hushed-haven-stays.lovable.app/journal" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "@id": "https://hushed-haven-stays.lovable.app/journal",
            name: "診斷筆記 Diagnostic Journal",
            description:
              "從建築現象出發的診斷筆記：滲漏水、電氣、給排水、建築與設備常見問題的觀察、可能原因與判讀方式。",
            inLanguage: "zh-TW",
            publisher: { "@type": "Organization", name: "診斷室驗屋" },
            blogPost: journalArticles.map((a) => ({
              "@type": "BlogPosting",
              headline: a.title,
              description: a.excerpt,
              datePublished: a.date,
              url: `https://hushed-haven-stays.lovable.app/journal/${a.slug}`,
            })),
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "首頁",
                item: "https://hushed-haven-stays.lovable.app/",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "診斷筆記",
                item: "https://hushed-haven-stays.lovable.app/journal",
              },
            ],
          })}
        </script>
      </Helmet>

      <Navigation variant="dark" />

      <main className="flex-1">
        {/* Intro */}
        <section className="pt-36 lg:pt-44 pb-14 lg:pb-20 bg-card/60 border-b border-border/60">
          <div className="container mx-auto px-6 lg:px-12">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-3xl"
            >
              <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground mb-4">
                Diagnostic Journal
              </p>
              <h1 className="text-3xl lg:text-5xl font-semibold tracking-tight mb-6">
                診斷筆記
              </h1>
              <p className="text-base lg:text-lg font-light leading-loose text-muted-foreground">
                房屋會透過水痕、溫差、裂縫、聲音、設備異常與使用狀況留下不同訊號。
                診斷筆記從常見的建築現象出發，帶您理解問題可能代表什麼、
                如何進一步判讀，以及什麼時候值得進一步檢查。
              </p>
              <p className="mt-8 text-sm lg:text-base font-light leading-loose text-foreground/80 border-l-2 border-primary/50 pl-5">
                看見問題只是開始，
                <br />
                理解問題，才能找到改善方向。
              </p>
            </motion.div>
          </div>
        </section>

        {/* Category filter */}
        <section className="sticky top-0 z-10 bg-background/85 backdrop-blur-xl border-b border-border/60">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="flex gap-2 overflow-x-auto py-4 -mx-1 px-1 scrollbar-none">
              {journalCategories.map((c) => {
                const isActive = active === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActive(c.id)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-[12px] tracking-wider transition-colors duration-300 ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                    }`}
                  >
                    <span className="font-medium">{c.zh}</span>
                    <span className="ml-2 opacity-60 text-[10px] tracking-[0.16em]">
                      {c.en}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Grid */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-6 lg:px-12">
            {filtered.length === 0 && (
              <p className="text-muted-foreground font-light">
                此分類的內容正在整理中，敬請期待。
              </p>
            )}

            {featured && (
              <Link
                to={`/journal/${featured.slug}`}
                className="group block mb-14 lg:mb-20"
              >
                <article className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                  <div className="overflow-hidden rounded-2xl bg-muted aspect-[16/10]">
                    <img
                      src={featured.image}
                      alt={featured.imageAlt}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] motion-reduce:transform-none"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <span className="text-[10px] uppercase tracking-[0.22em] text-primary">
                        {getCategory(featured.category)?.en}
                      </span>
                      <span className="text-[11px] text-muted-foreground/70">
                        {formatDate(featured.date)}
                      </span>
                    </div>
                    <h2 className="text-2xl lg:text-4xl font-semibold tracking-tight leading-snug mb-5">
                      {featured.titleLines.map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </h2>
                    <p className="text-sm lg:text-base font-light leading-loose text-muted-foreground max-w-xl">
                      {featured.excerpt}
                    </p>
                    <span className="mt-7 inline-flex items-center gap-2 text-[12px] tracking-[0.18em] text-foreground">
                      READ JOURNAL
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none" />
                    </span>
                  </div>
                </article>
              </Link>
            )}

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((a) => (
                <Link
                  key={a.slug}
                  to={`/journal/${a.slug}`}
                  className="group flex flex-col rounded-2xl border border-border/70 bg-card/40 overflow-hidden transition-colors duration-300 hover:border-primary/50"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-muted">
                    <img
                      src={a.image}
                      alt={a.imageAlt}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] motion-reduce:transform-none"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6 lg:p-7">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-primary">
                        {getCategory(a.category)?.en}
                      </span>
                      <span className="text-[11px] text-muted-foreground/70">
                        {formatDate(a.date)}
                      </span>
                    </div>
                    <h3 className="text-lg lg:text-xl font-semibold leading-snug tracking-tight mb-3">
                      {a.title}
                    </h3>
                    <p className="text-sm font-light leading-loose text-muted-foreground line-clamp-4">
                      {a.excerpt}
                    </p>
                    <span className="mt-6 inline-flex items-center gap-2 text-[11px] tracking-[0.18em] text-foreground">
                      READ JOURNAL
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Journal;
