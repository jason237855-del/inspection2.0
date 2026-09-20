import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import { StepArtDiscount, StepArtProject, StepArtSlots } from "./GroupStepArt";

/**
 * 團報「報名流程」：三欄步驟（卡片顏色由淺到深，最後一步打勾）＋每步一張示意圖＋底部行動列。
 * 團報專區與各建案頁共用；行動列的按鈕由呼叫端用 cta 指定（to＝站內路由、href＝頁內錨點）。
 * 手機上改成一欄一欄往下排。
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

const GroupHowItWorks = ({ cta }: { cta?: Cta }) => {
  const reduced = usePrefersReducedMotion();

  return (
    <div className="space-y-8">
      <div className="grid gap-3 md:grid-cols-3">
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
              <div className="h-56 flex-1 overflow-hidden rounded-2xl md:h-60">
                <s.Art />
              </div>
            </motion.div>
          );
        })}
      </div>

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
};

export default GroupHowItWorks;
