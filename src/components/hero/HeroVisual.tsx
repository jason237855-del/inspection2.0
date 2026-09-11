import { motion, useTransform, type MotionValue } from "framer-motion";
import {
  SCROLL_HOUSE_SCALE,
  SCROLL_HOUSE_Y,
  SCROLL_HOUSE_OPACITY,
  SCROLL_HOUSE_BLUR,
  PARALLAX_RANGE_PX,
} from "./heroMotion";

interface HeroVisualProps {
  scrollYProgress: MotionValue<number>;
  parallaxX: MotionValue<number>;
  parallaxY: MotionValue<number>;
  reduced: boolean;
}

/**
 * Abstract, line-art house — the "building currently being diagnosed".
 * Deliberately not a literal illustration: a few clean strokes plus a
 * slow scan-line sweep to read as "under inspection" rather than decoration.
 *
 * Positioning is split across two layers: a plain div does the static
 * centring (Tailwind translate utilities), while the inner motion.div only
 * carries the animated scroll/parallax transform — mixing framer-motion's
 * `style={{ x, y }}` with Tailwind translate classes on the same element
 * would fight over the `transform` property.
 */
const HeroVisual = ({ scrollYProgress, parallaxX, parallaxY, reduced }: HeroVisualProps) => {
  const scale = useTransform(scrollYProgress, [0, 1], SCROLL_HOUSE_SCALE);
  const scrollY = useTransform(scrollYProgress, [0, 1], SCROLL_HOUSE_Y);
  const opacity = useTransform(scrollYProgress, [0, 1], SCROLL_HOUSE_OPACITY);
  const blur = useTransform(scrollYProgress, [0, 1], SCROLL_HOUSE_BLUR);
  const filter = useTransform(blur, (b) => `blur(${b}px)`);

  const x = useTransform(parallaxX, (v) => v * PARALLAX_RANGE_PX);
  const y = useTransform([scrollY, parallaxY], ([sY, pY]: number[]) => sY + pY * PARALLAX_RANGE_PX * 0.6);

  return (
    <div className="pointer-events-none absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 md:left-[64%] md:top-1/2">
      <motion.div
        style={{ x, y, scale, opacity, filter }}
        className="w-[220px] text-foreground sm:w-[260px] md:w-[340px] lg:w-[420px]"
      >
        <svg viewBox="0 0 200 200" fill="none" className="h-full w-full overflow-visible">
          {/* faint ground / blueprint baseline */}
          <line x1="18" y1="168" x2="182" y2="168" stroke="currentColor" strokeWidth="0.6" opacity="0.25" strokeDasharray="2 4" />

          {/* roof */}
          <path
            d="M30 92 100 42 170 92"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />
          {/* body */}
          <rect x="42" y="92" width="116" height="76" rx="1.5" stroke="currentColor" strokeWidth="2" opacity="0.85" />

          {/* door */}
          <rect x="90" y="126" width="20" height="42" stroke="currentColor" strokeWidth="1.4" opacity="0.65" />
          {/* windows */}
          <rect x="56" y="112" width="18" height="18" stroke="currentColor" strokeWidth="1.3" opacity="0.55" />
          <rect x="126" y="112" width="18" height="18" stroke="currentColor" strokeWidth="1.3" opacity="0.55" />

          {/* chimney */}
          <rect x="140" y="58" width="10" height="22" stroke="currentColor" strokeWidth="1.3" opacity="0.5" />

          {/* scan sweep */}
          {!reduced && (
            <motion.rect
              x="42"
              width="116"
              height="10"
              fill="url(#hero-scan-gradient)"
              initial={{ y: 92 }}
              animate={{ y: [92, 160, 92] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <defs>
            <linearGradient id="hero-scan-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.28" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    </div>
  );
};

export default HeroVisual;
