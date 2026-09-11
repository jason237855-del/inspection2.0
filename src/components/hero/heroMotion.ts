/**
 * Shared, named animation parameters for the Hero section.
 * Centralised so scroll/parallax/idle-float tuning happens in one place
 * instead of scattered magic numbers across hero/* components.
 */

// Scroll-driven transform ranges (input: hero scrollYProgress 0 → 1)
export const SCROLL_HOUSE_SCALE: [number, number] = [1, 0.8];
export const SCROLL_HOUSE_Y: [number, number] = [0, -36];
export const SCROLL_HOUSE_OPACITY: [number, number] = [1, 0.45];
export const SCROLL_HOUSE_BLUR: [number, number] = [0, 2.5];

// How far a floating inspection element drifts outward from the house by
// the time the user has scrolled through the whole Hero.
export const SCROLL_ELEMENT_SPREAD_PX = 64;
// Elements flagged `revealOnScroll` start at this opacity and ramp to 1.
export const SCROLL_REVEAL_START_OPACITY = 0.12;
// Scroll progress (0-1) at which a revealOnScroll element reaches full opacity.
export const SCROLL_REVEAL_END = 0.55;

// Mouse parallax: max translate (px) for the strongest (depth = 1) layer.
export const PARALLAX_RANGE_PX = 16;
export const PARALLAX_SPRING = { stiffness: 60, damping: 18, mass: 0.6 };

// Idle floating loop (independent of scroll/mouse).
export const IDLE_FLOAT_RANGE_PX = 7;
export const IDLE_FLOAT_MIN_DURATION = 4.2;
export const IDLE_FLOAT_MAX_DURATION = 6.8;

// Count-up (Hero stats)
export const COUNT_UP_DURATION_MS = 1400;
