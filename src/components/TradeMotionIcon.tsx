import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export type TradeType = "electrician" | "plumber" | "waterproof" | "gas" | "carpentry" | "hvac";

const loop = { repeat: Infinity, ease: "easeInOut" as const };

const Electrician = ({ reduced }: { reduced: boolean }) => (
  <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
    <circle cx="24" cy="26" r="15" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    <path d="M11 26a13 13 0 0 1 26 0" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
    <motion.line
      x1="24"
      y1="26"
      x2="24"
      y2="15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      style={{ transformOrigin: "24px 26px" }}
      animate={reduced ? { rotate: -15 } : { rotate: [-28, 26, -28] }}
      transition={reduced ? undefined : { ...loop, duration: 2.4 }}
    />
    <circle cx="24" cy="26" r="1.8" fill="currentColor" />
    <motion.path
      d="M27 6l-3.5 6h3l-3.5 6"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      animate={reduced ? { opacity: 0.9 } : { opacity: [0.25, 1, 0.25] }}
      transition={reduced ? undefined : { ...loop, duration: 1.3 }}
    />
  </svg>
);

const Plumber = ({ reduced }: { reduced: boolean }) => (
  <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
    <path d="M9 16h20a5 5 0 0 1 5 5v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    <path d="M34 23v4a3 3 0 0 1-3 3h-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    <rect x="6" y="12" width="6" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
    {[0, 1].map((i) => (
      <motion.path
        key={i}
        d="M29 30c1.6 1.8 1.6 3.6 0 5.2-1.6-1.6-1.6-3.4 0-5.2Z"
        fill="currentColor"
        initial={{ y: -2, opacity: 0 }}
        animate={
          reduced
            ? { y: 0, opacity: 0.8 }
            : { y: [-2, 14], opacity: [0, 0.9, 0] }
        }
        transition={
          reduced ? undefined : { ...loop, duration: 1.8, delay: i * 0.9 }
        }
      />
    ))}
  </svg>
);

const Waterproof = ({ reduced }: { reduced: boolean }) => (
  <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
    <path d="M24 8 12 13v9c0 8 5 13.5 12 16 7-2.5 12-8 12-16v-9L24 8Z" stroke="currentColor" strokeWidth="1.5" opacity="0.85" />
    <path d="M24 16v14M18 22l6-6 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    {[0, 1, 2].map((i) => (
      <motion.circle
        key={i}
        cx="24"
        cy="24"
        r="16"
        stroke="currentColor"
        strokeWidth="1.2"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={reduced ? { scale: 1, opacity: 0.25 } : { scale: [0.5, 1.15], opacity: [0.55, 0] }}
        transition={reduced ? undefined : { repeat: Infinity, duration: 2.6, delay: i * 0.85, ease: "easeOut" }}
        style={{ transformOrigin: "24px 24px" }}
      />
    ))}
  </svg>
);

const Gas = ({ reduced }: { reduced: boolean }) => (
  <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
    <motion.path
      d="M24 8c4 5-3 7-1 12 1 2.4 3.6 3 5 1.2 1.6 3-.6 6.8-4 8.8-5 3-11-.4-11-6.4 0-4 2.6-6.6 4-9.4 1-2 1.6-4 1-6.2 2.4.6 4.6 2.4 6 4Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      style={{ transformOrigin: "22px 30px" }}
      animate={
        reduced
          ? { scaleY: 1 }
          : { scaleY: [1, 1.08, 0.95, 1], scaleX: [1, 0.96, 1.04, 1] }
      }
      transition={reduced ? undefined : { ...loop, duration: 1.6 }}
    />
    <path d="M14 38h20" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
  </svg>
);

const Carpentry = ({ reduced }: { reduced: boolean }) => (
  <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
    <path d="M10 32h22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <line x1="30" y1="26" x2="30" y2="34" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <motion.g
      style={{ transformOrigin: "30px 26px" }}
      animate={reduced ? { rotate: -8 } : { rotate: [-32, -8, -32] }}
      transition={reduced ? undefined : { ...loop, duration: 1.1, times: [0, 0.35, 1] }}
    >
      <rect x="24" y="9" width="14" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <line x1="30" y1="15" x2="30" y2="26" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </motion.g>
    <motion.g
      animate={reduced ? { opacity: 0 } : { opacity: [0, 0, 1, 0] }}
      transition={reduced ? undefined : { ...loop, duration: 1.1, times: [0, 0.3, 0.4, 0.6] }}
    >
      <line x1="26" y1="30" x2="23" y2="27" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="34" y1="30" x2="37" y2="27" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </motion.g>
  </svg>
);

const HVAC = ({ reduced }: { reduced: boolean }) => (
  <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
    <circle cx="24" cy="24" r="15" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    <motion.g
      style={{ transformOrigin: "24px 24px" }}
      animate={reduced ? { rotate: 0 } : { rotate: 360 }}
      transition={reduced ? undefined : { repeat: Infinity, duration: 4, ease: "linear" }}
    >
      {[0, 120, 240].map((deg) => (
        <path
          key={deg}
          d="M24 24c0-5 3-8 6-8 1.6 0 2.6 1.4 1.6 3-1.4 2-4.4 3.4-7.6 5Z"
          fill="currentColor"
          opacity="0.75"
          transform={`rotate(${deg} 24 24)`}
        />
      ))}
      <circle cx="24" cy="24" r="2" fill="currentColor" />
    </motion.g>
    <motion.path
      d="M8 32c3 1.5 6 1.5 9 0"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      opacity="0.5"
      animate={reduced ? { x: 0 } : { x: [0, 3, 0] }}
      transition={reduced ? undefined : { ...loop, duration: 2 }}
    />
  </svg>
);

const registry: Record<TradeType, (p: { reduced: boolean }) => JSX.Element> = {
  electrician: Electrician,
  plumber: Plumber,
  waterproof: Waterproof,
  gas: Gas,
  carpentry: Carpentry,
  hvac: HVAC,
};

const TradeMotionIcon = ({ type, className }: { type: TradeType; className?: string }) => {
  const reduced = usePrefersReducedMotion();
  const Graphic = registry[type];
  return (
    <div className={className}>
      <Graphic reduced={reduced} />
    </div>
  );
};

export default TradeMotionIcon;
