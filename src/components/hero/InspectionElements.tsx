import { motion, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useState } from "react";
import {
  SCROLL_ELEMENT_SPREAD_PX,
  SCROLL_REVEAL_START_OPACITY,
  SCROLL_REVEAL_END,
  PARALLAX_RANGE_PX,
  IDLE_FLOAT_RANGE_PX,
} from "./heroMotion";

type Visibility = "always" | "md" | "lg";

interface ElementConfig {
  id: string;
  top: string;
  left: string;
  /** direction the piece drifts as the user scrolls past the Hero */
  dx: number;
  dy: number;
  /** 0-1, how strongly it reacts to mouse parallax (closer = stronger) */
  depth: number;
  visibleFrom: Visibility;
  revealOnScroll?: boolean;
  floatDuration: number;
  floatDelay: number;
  /** most icons ignore the arg; only InspectionPointIcon uses it */
  render: (reduced: boolean) => JSX.Element;
}

const ThermalIcon = () => (
  <svg viewBox="0 0 32 32" className="h-8 w-8 sm:h-9 sm:w-9">
    <rect x="2" y="2" width="28" height="20" rx="2" stroke="currentColor" strokeWidth="1.4" opacity="0.6" />
    {[0.15, 0.32, 0.5, 0.7].map((o, i) => (
      <rect key={i} x={4 + i * 6.3} y="4" width="5.5" height="16" className="fill-primary" opacity={o} />
    ))}
    <text x="2" y="29" fontSize="6.5" className="fill-current" opacity="0.55">
      THERMAL
    </text>
  </svg>
);

const ScanLineIcon = () => (
  <svg viewBox="0 0 40 24" className="h-7 w-11 sm:h-8 sm:w-12">
    <path d="M2 4V2h4M34 2h4v2M38 20v2h-4M6 22H2v-2" stroke="currentColor" strokeWidth="1.3" opacity="0.55" />
    <line x1="2" y1="12" x2="38" y2="12" className="stroke-primary" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.7" />
    <text x="8" y="10" fontSize="6" className="fill-current" opacity="0.55">
      SCAN
    </text>
  </svg>
);

const LaserLevelIcon = () => (
  <svg viewBox="0 0 48 20" className="h-6 w-12 sm:h-7 sm:w-14">
    <rect x="1" y="6" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" opacity="0.6" />
    <line x1="11" y1="10" x2="46" y2="10" className="stroke-primary" strokeWidth="1" strokeDasharray="1 3.2" opacity="0.75" />
    <circle cx="46" cy="10" r="1.6" className="fill-primary" opacity="0.8" />
    <text x="14" y="19" fontSize="6" className="fill-current" opacity="0.5">
      ±0.2mm
    </text>
  </svg>
);

const PipeIcon = () => (
  <svg viewBox="0 0 34 34" className="h-8 w-8 sm:h-9 sm:w-9">
    <path d="M6 4v16a6 6 0 0 0 6 6h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.6" fill="none" />
    <path d="M22 20l4 6-6-1z" className="fill-primary" opacity="0.6" />
  </svg>
);

const CircuitIcon = () => (
  <svg viewBox="0 0 40 32" className="h-7 w-9 sm:h-8 sm:w-10">
    <path
      d="M2 6h10v8h14V6h12M2 6v20h16M28 26H18v-8"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.55"
      fill="none"
    />
    <circle cx="2" cy="6" r="1.8" className="fill-primary" />
    <circle cx="38" cy="6" r="1.8" className="fill-primary" />
    <circle cx="2" cy="26" r="1.8" className="fill-primary" />
  </svg>
);

const OutletIcon = () => (
  <svg viewBox="0 0 28 28" className="h-7 w-7 sm:h-8 sm:w-8">
    <rect x="1" y="1" width="26" height="26" rx="4" stroke="currentColor" strokeWidth="1.4" opacity="0.6" />
    <rect x="9" y="8" width="2.4" height="7" className="fill-current" opacity="0.6" />
    <rect x="16.6" y="8" width="2.4" height="7" className="fill-current" opacity="0.6" />
    <path d="M14 17a3 3 0 0 0-3 3" stroke="currentColor" strokeWidth="1.3" opacity="0.5" fill="none" />
  </svg>
);

const TileIcon = () => (
  <svg viewBox="0 0 30 30" className="h-7 w-7 sm:h-8 sm:w-8">
    {[0, 1, 2].map((r) =>
      [0, 1, 2].map((c) => (
        <rect
          key={`${r}-${c}`}
          x={1 + c * 9.7}
          y={1 + r * 9.7}
          width="8"
          height="8"
          stroke="currentColor"
          strokeWidth={r === 1 && c === 1 ? 1.6 : 1}
          className={r === 1 && c === 1 ? "stroke-primary" : undefined}
          opacity={r === 1 && c === 1 ? 0.85 : 0.4}
        />
      ))
    )}
  </svg>
);

const WallSectionIcon = () => (
  <svg viewBox="0 0 40 22" className="h-6 w-11 sm:h-7 sm:w-12">
    <rect x="1" y="1" width="38" height="5" stroke="currentColor" strokeWidth="1.1" opacity="0.55" />
    <rect x="1" y="8" width="38" height="6" stroke="currentColor" strokeWidth="1.1" opacity="0.55" strokeDasharray="2 1.6" />
    <rect x="1" y="16" width="38" height="5" stroke="currentColor" strokeWidth="1.1" opacity="0.55" />
  </svg>
);

const CrackIcon = () => (
  <svg viewBox="0 0 34 28" className="h-7 w-9 sm:h-8 sm:w-10">
    <path
      d="M2 26 10 14l4 5 4-9 3 6 5-10 6 20"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.55"
      fill="none"
    />
    <circle cx="18" cy="10" r="2.4" className="stroke-primary" strokeWidth="1.3" fill="none" opacity="0.85" />
  </svg>
);

const HumidityIcon = () => (
  <svg viewBox="0 0 44 26" className="h-6 w-11 sm:h-7 sm:w-12">
    <rect x="1" y="1" width="42" height="24" rx="2" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
    <path
      d="M4 16c3-6 6 6 9 0s6 6 9 0 6 6 9 0 6 6 9 0"
      stroke="currentColor"
      strokeWidth="1.2"
      opacity="0.55"
      fill="none"
    />
    <text x="4" y="10" fontSize="6.5" className="fill-primary" opacity="0.85">
      62%
    </text>
  </svg>
);

const InspectionPointIcon = (reduced: boolean) => (
  <svg viewBox="0 0 32 32" className="h-7 w-7 sm:h-8 sm:w-8">
    {!reduced && (
      <motion.circle
        cx="16"
        cy="16"
        r="6"
        className="stroke-primary"
        strokeWidth="1"
        fill="none"
        initial={{ opacity: 0.6, scale: 1 }}
        animate={{ opacity: [0.6, 0, 0.6], scale: [1, 2.1, 1] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut" }}
        style={{ transformOrigin: "16px 16px" }}
      />
    )}
    <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.6" />
    <line x1="16" y1="6" x2="16" y2="11" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
    <line x1="16" y1="21" x2="16" y2="26" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
    <line x1="6" y1="16" x2="11" y2="16" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
    <line x1="21" y1="16" x2="26" y2="16" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
    <circle cx="16" cy="16" r="1.4" className="fill-primary" />
  </svg>
);

const ELEMENTS: ElementConfig[] = [
  { id: "thermal", top: "14%", left: "50%", dx: -32, dy: -22, depth: 0.6, visibleFrom: "lg", floatDuration: 5.4, floatDelay: 0.2, render: ThermalIcon },
  { id: "scanline", top: "15%", left: "76%", dx: 40, dy: -24, depth: 0.8, visibleFrom: "always", revealOnScroll: true, floatDuration: 4.8, floatDelay: 0.6, render: ScanLineIcon },
  { id: "laser-level", top: "30%", left: "92%", dx: 60, dy: -8, depth: 0.9, visibleFrom: "always", floatDuration: 5.8, floatDelay: 1.1, render: LaserLevelIcon },
  { id: "circuit", top: "47%", left: "95%", dx: 64, dy: 8, depth: 0.5, visibleFrom: "md", revealOnScroll: true, floatDuration: 6.2, floatDelay: 0.3, render: CircuitIcon },
  { id: "outlet", top: "66%", left: "90%", dx: 52, dy: 30, depth: 0.7, visibleFrom: "md", floatDuration: 5.1, floatDelay: 0.8, render: OutletIcon },
  { id: "crack", top: "80%", left: "75%", dx: 22, dy: 46, depth: 1, visibleFrom: "always", floatDuration: 4.5, floatDelay: 1.4, render: CrackIcon },
  { id: "inspection-point", top: "83%", left: "54%", dx: -6, dy: 50, depth: 0.9, visibleFrom: "always", revealOnScroll: true, floatDuration: 4.2, floatDelay: 0.5, render: InspectionPointIcon },
  { id: "wall-section", top: "78%", left: "37%", dx: -40, dy: 40, depth: 0.5, visibleFrom: "lg", floatDuration: 6.6, floatDelay: 1.7, render: WallSectionIcon },
  { id: "pipe", top: "58%", left: "31%", dx: -58, dy: 14, depth: 0.8, visibleFrom: "always", floatDuration: 5.6, floatDelay: 0.9, render: PipeIcon },
  { id: "humidity", top: "36%", left: "33%", dx: -50, dy: -18, depth: 0.7, visibleFrom: "always", revealOnScroll: true, floatDuration: 5.9, floatDelay: 0.2, render: HumidityIcon },
  { id: "tile", top: "21%", left: "45%", dx: -34, dy: -30, depth: 0.6, visibleFrom: "lg", floatDuration: 5.3, floatDelay: 1.2, render: TileIcon },
];

const useBreakpoint = () => {
  const [bp, setBp] = useState<"sm" | "md" | "lg">("lg");
  useEffect(() => {
    const mqMd = window.matchMedia("(min-width: 768px)");
    const mqLg = window.matchMedia("(min-width: 1024px)");
    const update = () => setBp(mqLg.matches ? "lg" : mqMd.matches ? "md" : "sm");
    update();
    mqMd.addEventListener("change", update);
    mqLg.addEventListener("change", update);
    return () => {
      mqMd.removeEventListener("change", update);
      mqLg.removeEventListener("change", update);
    };
  }, []);
  return bp;
};

interface FloatingElementProps {
  config: ElementConfig;
  scrollYProgress: MotionValue<number>;
  parallaxX: MotionValue<number>;
  parallaxY: MotionValue<number>;
  reduced: boolean;
}

const FloatingElement = ({ config, scrollYProgress, parallaxX, parallaxY, reduced }: FloatingElementProps) => {
  const { dx, dy, depth, revealOnScroll } = config;

  const scrollDriftX = useTransform(scrollYProgress, [0, 1], [0, (dx / 60) * SCROLL_ELEMENT_SPREAD_PX]);
  const scrollDriftY = useTransform(scrollYProgress, [0, 1], [0, (dy / 60) * SCROLL_ELEMENT_SPREAD_PX]);
  const scrollOpacity = useTransform(
    scrollYProgress,
    [0, SCROLL_REVEAL_END, 1],
    revealOnScroll ? [SCROLL_REVEAL_START_OPACITY, 1, 0.3] : [0.85, 0.7, 0.15]
  );

  const x = useTransform([parallaxX, scrollDriftX], ([p, s]: number[]) => p * PARALLAX_RANGE_PX * depth + s);
  const y = useTransform([parallaxY, scrollDriftY], ([p, s]: number[]) => p * PARALLAX_RANGE_PX * depth * 0.7 + s);

  const hideClass =
    config.visibleFrom === "lg" ? "hidden lg:block" : config.visibleFrom === "md" ? "hidden md:block" : "";

  return (
    <div
      className={`pointer-events-none absolute text-foreground/70 ${hideClass}`}
      style={{ top: config.top, left: config.left }}
    >
      <motion.div
        style={{ x, y, opacity: reduced ? (revealOnScroll ? 1 : 0.75) : scrollOpacity }}
        animate={
          reduced
            ? undefined
            : { y: [0, -IDLE_FLOAT_RANGE_PX, 0] }
        }
        transition={
          reduced
            ? undefined
            : {
                duration: config.floatDuration,
                delay: config.floatDelay,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
      >
        {config.render(reduced)}
      </motion.div>
    </div>
  );
};

interface InspectionElementsProps {
  scrollYProgress: MotionValue<number>;
  parallaxX: MotionValue<number>;
  parallaxY: MotionValue<number>;
  reduced: boolean;
}

const InspectionElements = ({ scrollYProgress, parallaxX, parallaxY, reduced }: InspectionElementsProps) => {
  const bp = useBreakpoint();
  const visible = ELEMENTS.filter((el) => {
    if (el.visibleFrom === "always") return true;
    if (el.visibleFrom === "md") return bp === "md" || bp === "lg";
    return bp === "lg";
  });

  return (
    <div className="absolute inset-0">
      {visible.map((el) => (
        <FloatingElement
          key={el.id}
          config={el}
          scrollYProgress={scrollYProgress}
          parallaxX={parallaxX}
          parallaxY={parallaxY}
          reduced={reduced}
        />
      ))}
    </div>
  );
};

export default InspectionElements;
