import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { COUNT_UP_DURATION_MS } from "./heroMotion";

/**
 * Placeholder brand numbers supplied by the client — do not invent
 * additional figures here; update these once real numbers are confirmed.
 */
const STATS = [
  { value: 3000, suffix: "+", label: "累積檢測戶數" },
  { value: 10, suffix: "+", label: "年專業經驗" },
  { value: 11111, suffix: "+", label: "發現缺失與異常" },
  { value: 30, suffix: "+", label: "專業檢測項目" },
];

const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);

const CountUpValue = ({ value, suffix, active }: { value: number; suffix: string; active: boolean }) => {
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (!active || reduced) {
      if (reduced) setDisplay(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / COUNT_UP_DURATION_MS);
      setDisplay(Math.round(value * easeOutQuad(progress)));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, reduced, value]);

  return (
    <span>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
};

const HeroStats = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <section ref={ref} className="relative bg-background py-16 lg:py-20">
      <div className="container mx-auto grid grid-cols-2 gap-8 px-6 lg:grid-cols-4 lg:gap-6 lg:px-12">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="text-center lg:text-left"
          >
            <div className="mb-1.5 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              <CountUpValue value={stat.value} suffix={stat.suffix} active={isInView} />
            </div>
            <p className="text-xs text-muted-foreground font-light md:text-sm">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default HeroStats;
