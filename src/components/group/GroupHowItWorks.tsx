import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import { StepArtDiscount, StepArtProject, StepArtSlots } from "./GroupStepArt";

/**
 * 團報「報名流程」。團報專區與各建案頁共用。
 * - 桌機：三欄步驟（卡片顏色由淺到深，最後一步打勾）＋每步一張示意圖，捲進畫面時依序淡入。
 * - 手機：預設收合成一條「3 步驟完成報名」，點開才展開精簡時間軸（沒有示意圖），省版面。
 * - 行動列（cta）選填：目前只有各建案頁使用；to＝站內路由、href＝頁內錨點。
 */

const steps = [
  {
    title: "選擇建案",
    desc: "選擇所購買的建案，按「加入團報」，資訊將生成預約表單。",
    tone: "bg-primary/5",
    Art: StepArtProject,
  },
  {
    title: "自選時段",
    desc: "每戶屋主皆可自由選擇時間；優先保留已完成訂金支付之名額。",
    tone: "bg-primary/15",
    Art: StepArtSlots,
  },
  {
    title: "團體優惠",
    desc: "社區達到成團戶數，所有屋主皆享團報優惠。",
    tone: "bg-primary/30",
    Art: StepArtDiscount,
  },
] as const;

const notes = [
  "團報折扣不與「LINE 好友折價」並用，團報訂單依成團戶數計價。",
  "尚未成團時先以原價計，無需重新預約。",
  "已取消的訂單，不計入成團戶數。",
];

type Cta = { text: string; label: string; to?: string; href?: string };

/** 桌機：三欄步驟卡＋示意圖 */
const StepsGrid = () => {
  const reduced = usePrefersReducedMotion();
  return (
    <div className="hidden gap-3 md:grid md:grid-cols-3">
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        return (
          <motion.div
            key={s.title}
            initial={reduced ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: reduced ? 0 : i * 0.12 }}
            className="flex flex-col gap-3"
          >
            <div className={`rounded-2xl p-5 ${s.tone}`}>
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                  {i + 1}
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background">
                  {last ? <Check className="h-4 w-4" aria-hidden /> : <ArrowRight className="h-4 w-4" aria-hidden />}
                </span>
              </div>
              <h3 className="mb-1 text-base font-semibold text-foreground">{s.title}</h3>
              <p className="text-sm font-light leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
            <div className="h-60 flex-1 overflow-hidden rounded-2xl">
              <s.Art />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

/** 手機：精簡時間軸（一張卡、三行：編號＋標題＋一行說明） */
const Timeline = () => (
  <ol className="rounded-2xl bg-primary/5 p-5">
    {steps.map((s, i) => {
      const last = i === steps.length - 1;
      return (
        <li key={s.title} className="flex gap-4">
          <div className="flex flex-col items-center">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
              {last ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
            </span>
            {!last && <span className="my-1 w-px flex-1 bg-primary/30" />}
          </div>
          <div className={last ? "" : "pb-5"}>
            <h3 className="text-base font-semibold text-foreground">{s.title}</h3>
            <p className="mt-1 text-sm font-light leading-relaxed text-muted-foreground">{s.desc}</p>
          </div>
        </li>
      );
    })}
  </ol>
);

/** 手機：預設收合，點開才看到時間軸 */
const CollapsibleTimeline = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-2xl bg-primary/10 px-5 py-4 text-left"
      >
        <span>
          <span className="block text-sm font-semibold text-foreground">3 步驟完成報名</span>
          <span className="mt-0.5 block text-xs font-light text-muted-foreground">選擇建案 → 自選時段 → 團體優惠</span>
        </span>
        <ChevronDown className={`h-5 w-5 text-primary transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <div className="mt-3">
          <Timeline />
        </div>
      )}
    </div>
  );
};

const GroupHowItWorks = ({ cta }: { cta?: Cta }) => (
  <div className="space-y-8">
    <StepsGrid />
    <CollapsibleTimeline />

    {cta && (
      <div className="flex flex-col gap-4 rounded-2xl bg-primary/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-light text-foreground">{cta.text}</p>
        <Button asChild className="rounded-full">
          {cta.to ? (
            <Link to={cta.to}>
              {cta.label}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          ) : (
            <a href={cta.href}>
              {cta.label}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </a>
          )}
        </Button>
      </div>
    )}

    <ul className="mx-auto max-w-2xl space-y-2 text-sm font-light text-muted-foreground">
      {notes.map((n) => (
        <li key={n} className="flex gap-2">
          <span aria-hidden className="text-primary">•</span>
          <span>{n}</span>
        </li>
      ))}
    </ul>
  </div>
);

export default GroupHowItWorks;
