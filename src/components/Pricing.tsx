import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Minus, Users, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

type TabKey = "newbuild" | "resale" | "group";

type Plan = {
  key: string;
  label: string;
  title: string;
  price: number;
  originalPrice?: number;
  unit: string;
  extraNote?: string;
  description: string;
  featuresHeader: string;
  features: string[];
  highlighted: boolean;
  badge?: string;
};

const tabs: { key: TabKey; label: string }[] = [
  { key: "newbuild", label: "新成屋驗屋" },
  { key: "resale", label: "中古屋驗屋" },
  { key: "group", label: "新成屋團報優惠" },
];

const plansByTab: Record<TabKey, Plan[]> = {
  newbuild: [
    {
      key: "new-first",
      label: "初驗方案",
      title: "新成屋驗屋（初驗）",
      price: 7777,
      originalPrice: 8000,
      unit: "起 / 20 坪以內",
      extraNote: "每超過一坪 $400",
      description: "交屋前的完整體檢，精準掌握施工品質與設備狀況。",
      featuresHeader: "本方案包含：",
      features: [
        "結構與泥作缺失檢查",
        "水電、給排水測試",
        "門窗、防水抽驗",
        "紅外線熱顯像輔助判讀",
        "圖文缺失清單與報告",
      ],
      highlighted: true,
    },
    {
      key: "new-recheck",
      label: "複驗方案",
      title: "新成屋驗屋（複驗）",
      price: 3000,
      originalPrice: 5000,
      unit: "起 / 20 坪以內",
      extraNote: "每超過一坪 $400",
      description: "確認建商修繕是否確實完成，避免帶著缺失入住。",
      featuresHeader: "本方案包含：",
      features: [
        "前次缺失逐項確認",
        "修繕品質判定",
        "新增缺失補充紀錄",
        "複驗結果報告",
        "建商溝通建議",
      ],
      highlighted: false,
    },
  ],
  resale: [
    {
      key: "resale",
      label: "中古屋驗屋方案",
      title: "中古屋驗屋",
      price: 10000,
      unit: "起 / 30 坪以內",
      extraNote: "每超過一坪 $400",
      description: "從現況、設備與潛在風險出發，看懂房子真正的健康狀態。",
      featuresHeader: "本方案包含：",
      features: [
        "漏水與壁癌排查",
        "管線老化評估",
        "結構安全判讀",
        "設備運作測試",
        "修繕費用說明",
      ],
      highlighted: true,
    },
  ],
  group: [
    {
      key: "group",
      label: "新成屋團報方案",
      title: "新成屋團報優惠",
      price: 6888,
      originalPrice: 8000,
      unit: "起 / 20 坪以內．每戶",
      extraNote: "每超過一坪 $400．同社區 3 戶以上適用",
      description: "同社區、同時段多戶一起檢測，成本更低、排程更順。",
      featuresHeader: "團報專屬：",
      features: [
        "多戶同時預約檢測",
        "專屬時段統一安排",
        "優先排程服務",
        "專案聯絡窗口",
        "統一報告格式與彙整",
        "社區共同缺失彙整建議",
      ],
      highlighted: true,
      badge: "團報方案",
    },
  ],
};

const comparison: {
  label: string;
  newBuild: string | boolean;
  group: string | boolean;
  resale: string | boolean;
}[] = [
  { label: "適合對象", newBuild: "新成屋交屋屋主", group: "同社區多戶屋主", resale: "購買中古屋買方" },
  { label: "建議檢測時機", newBuild: "交屋前", group: "交屋前", resale: "交屋前" },
  { label: "基準坪數", newBuild: "20 坪內／戶", group: "20 坪內／戶", resale: "20 坪內／戶" },
  { label: "完整檢測報告", newBuild: true, group: true, resale: true },
  { label: "紅外線熱顯像", newBuild: true, group: true, resale: true },
  { label: "給排水／機電檢測", newBuild: true, group: true, resale: true },
  { label: "管線老化評估", newBuild: false, group: false, resale: true },
  { label: "屋況風險評估", newBuild: false, group: false, resale: true },
  { label: "建商缺失溝通建議", newBuild: true, group: true, resale: false },
  { label: "複驗服務", newBuild: "$3,000 起", group: "$3,000 起", resale: false },
  { label: "專屬團報排程", newBuild: false, group: true, resale: false },
  { label: "假日驗屋費用", newBuild: false, group: false, resale: true },
];

const formatPrice = (v: number) => `$ ${v.toLocaleString("en-US")}`;

const Pricing = () => {
  const [tab, setTab] = useState<TabKey>("newbuild");
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const reduced = usePrefersReducedMotion();

  const visiblePlans = plansByTab[tab];

  const enter = (i: number) =>
    reduced
      ? { initial: { opacity: 0 }, whileInView: { opacity: 1 }, transition: { duration: 0.2 } }
      : {
          initial: { opacity: 0, y: 30 },
          whileInView: { opacity: 1, y: 0 },
          transition: { duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as const },
        };

  const bookButtonBase =
    "mt-6 self-end inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-300";
  const bookButtonHover = reduced
    ? ""
    : "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 [@media(hover:none)]:opacity-100 [@media(hover:none)]:translate-y-0";

  const columns = [
    { key: "newBuild" as const, label: "新成屋驗屋" },
    { key: "group" as const, label: "團報驗屋" },
    { key: "resale" as const, label: "中古屋驗屋" },
  ];

  return (
    <section id="pricing" className="py-24 lg:py-32 bg-muted/40 border-t border-border">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: reduced ? 0.2 : 0.6 }}
          className="text-center mb-10"
        >
          <span className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-4 block font-medium">
            Pricing
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-5 text-foreground tracking-tight">
            驗屋費用
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
            價格依實際坪數、屋齡與檢測範圍調整，報價前不收取任何費用。
          </p>
        </motion.div>

        {/* 方案切換 */}
        <div className="flex flex-col items-center gap-3 mb-14">
          <div
            role="tablist"
            aria-label="驗屋方案"
            className="inline-flex flex-wrap justify-center items-center rounded-full border border-border bg-card p-1 shadow-soft"
          >
            {tabs.map((opt) => {
              const active = tab === opt.key;
              return (
                <button
                  key={opt.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(opt.key)}
                  className={`relative rounded-full px-5 sm:px-6 py-2 text-sm font-medium ${
                    reduced ? "" : "transition-colors duration-300"
                  } ${active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {active && (
                    <motion.span
                      layoutId="pricing-cycle-pill"
                      transition={
                        reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }
                      }
                      className="absolute inset-0 rounded-full bg-primary"
                    />
                  )}
                  <span className="relative z-10">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          className={`grid gap-6 mx-auto ${
            visiblePlans.length === 1
              ? "grid-cols-1 max-w-xl"
              : "grid-cols-1 md:grid-cols-2 max-w-4xl"
          }`}
        >
          {visiblePlans.map((p, i) => {
            const anim = enter(i);
            const saved = p.originalPrice ? p.originalPrice - p.price : 0;

            return (
              <motion.div
                key={p.key}
                initial={anim.initial}
                whileInView={anim.whileInView}
                viewport={{ once: true, amount: 0.2 }}
                transition={anim.transition}
                whileHover={reduced ? undefined : { y: -6 }}
                className={`group rounded-3xl p-8 md:p-10 flex flex-col ${
                  reduced ? "" : "transition-shadow duration-300 hover:shadow-hover"
                } ${
                  p.highlighted
                    ? "bg-primary text-primary-foreground shadow-hover"
                    : "bg-card border border-border text-card-foreground shadow-soft"
                }`}
              >
                <div className="flex items-center justify-between mb-8 gap-3">
                  <p
                    className={`text-[11px] uppercase tracking-[0.25em] font-medium ${
                      p.highlighted ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {p.label}
                  </p>
                  {p.badge && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider ${
                        p.highlighted
                          ? "bg-primary-foreground/15 text-primary-foreground"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      <Users className="w-3 h-3" />
                      {p.badge}
                    </span>
                  )}
                </div>

                <div className="mb-3 flex items-baseline gap-2 flex-wrap">
                  <motion.span
                    key={`${p.key}-price`}
                    initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduced ? 0.15 : 0.3 }}
                    className="text-4xl md:text-5xl font-bold tracking-tight"
                  >
                    {formatPrice(p.price)}
                  </motion.span>
                  {p.originalPrice && (
                    <span
                      className={`text-base font-light line-through ${
                        p.highlighted ? "text-primary-foreground/60" : "text-muted-foreground/70"
                      }`}
                    >
                      {formatPrice(p.originalPrice)}
                    </span>
                  )}
                  <span
                    className={`text-sm font-light ${
                      p.highlighted ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {p.unit}
                  </span>
                </div>

                {saved > 0 && (
                  <span
                    className={`mb-4 inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      p.highlighted
                        ? "bg-primary-foreground/15 text-primary-foreground"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    現省 {formatPrice(saved)}
                    <span className="font-normal opacity-80">
                      （{Math.round((saved / (p.originalPrice as number)) * 100)}% off）
                    </span>
                  </span>
                )}

                {p.extraNote && (
                  <p
                    className={`text-xs mb-4 font-light ${
                      p.highlighted ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {p.extraNote}
                  </p>
                )}

                <p
                  className={`text-sm md:text-base leading-relaxed mb-10 font-light ${
                    p.highlighted ? "text-primary-foreground/85" : "text-muted-foreground"
                  }`}
                >
                  {p.description}
                </p>

                <p
                  className={`text-sm font-semibold italic mb-4 ${
                    p.highlighted ? "text-primary-foreground" : "text-foreground"
                  }`}
                >
                  {p.featuresHeader}
                </p>
                <ul className="space-y-3.5 flex-1">
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className={`flex items-start gap-2.5 text-sm font-light ${
                        p.highlighted ? "text-primary-foreground/85" : "text-muted-foreground"
                      }`}
                    >
                      <Check
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          p.highlighted ? "text-primary-foreground" : "text-primary"
                        }`}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/booking"
                  className={`${bookButtonBase} ${bookButtonHover} ${
                    p.highlighted
                      ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  立即預約
                  <span aria-hidden="true">→</span>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* 方案差異比較表 */}
        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: reduced ? 0.2 : 0.6 }}
          className="max-w-5xl mx-auto mt-16"
        >
          <h3 className="text-xl md:text-2xl font-bold text-foreground tracking-tight mb-6 text-center">
            方案差異比較
          </h3>
          <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-soft">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left font-medium text-muted-foreground px-5 py-4 w-[28%]">
                    比較項目
                  </th>
                  {columns.map((c, idx) => (
                    <th
                      key={c.key}
                      onMouseEnter={() => setHoverCol(idx)}
                      onMouseLeave={() => setHoverCol(null)}
                      className={`text-center px-5 py-4 font-semibold transition-colors duration-200 ${
                        hoverCol === idx ? "bg-primary/10 text-primary" : "text-foreground"
                      }`}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr
                    key={row.label}
                    className={`group border-b border-border last:border-0 ${
                      reduced ? "" : "transition-colors duration-200"
                    } hover:bg-primary/5`}
                  >
                    <td className="px-5 py-3.5 text-muted-foreground font-light group-hover:text-foreground transition-colors">
                      {row.label}
                    </td>
                    {columns.map((c, idx) => {
                      const v = row[c.key];
                      return (
                        <td
                          key={c.key}
                          onMouseEnter={() => setHoverCol(idx)}
                          onMouseLeave={() => setHoverCol(null)}
                          className={`px-5 py-3.5 text-center transition-colors duration-200 ${
                            hoverCol === idx ? "bg-primary/10" : ""
                          }`}
                        >
                          {typeof v === "boolean" ? (
                            v ? (
                              <Check className="w-4 h-4 mx-auto text-primary" />
                            ) : (
                              <span className="text-muted-foreground/50">—</span>
                            )
                          ) : (
                            <span className="text-foreground font-light">{v}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <div className="max-w-4xl mx-auto mt-10 flex items-start justify-center gap-2 text-center">
          <Minus className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground font-light leading-relaxed">
            超出坪數以每坪 $400 加價計算；實際費用以現場評估後之報價為準。
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
