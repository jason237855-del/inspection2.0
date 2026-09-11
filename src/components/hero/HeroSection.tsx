import { useEffect, useRef } from "react";
import { useMotionValue, useScroll, useSpring } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { PARALLAX_SPRING } from "./heroMotion";
import HeroVisual from "./HeroVisual";
import InspectionElements from "./InspectionElements";
import HeroContent from "./HeroContent";

/**
 * Hero — "the house currently being diagnosed".
 * Orchestrates scroll progress (drives the shrink/disperse transition into
 * HeroStats) and mouse parallax (disabled on touch / reduced-motion), then
 * hands both down as framer-motion MotionValues to the visual children.
 */
const HeroSection = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const reduced = usePrefersReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const parallaxX = useSpring(rawX, PARALLAX_SPRING);
  const parallaxY = useSpring(rawY, PARALLAX_SPRING);

  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const section = sectionRef.current;
    if (!section) return;

    const onMove = (e: PointerEvent) => {
      const rect = section.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      rawX.set(nx);
      rawY.set(ny);
    };
    const onLeave = () => {
      rawX.set(0);
      rawY.set(0);
    };

    section.addEventListener("pointermove", onMove);
    section.addEventListener("pointerleave", onLeave);
    return () => {
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced, rawX, rawY]);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[92svh] w-full items-center overflow-hidden bg-background md:min-h-screen"
    >
      <HeroVisual
        scrollYProgress={scrollYProgress}
        parallaxX={parallaxX}
        parallaxY={parallaxY}
        reduced={reduced}
      />
      <InspectionElements
        scrollYProgress={scrollYProgress}
        parallaxX={parallaxX}
        parallaxY={parallaxY}
        reduced={reduced}
      />

      <div className="container relative z-10 mx-auto px-6 pt-28 lg:px-12 lg:pt-24">
        <HeroContent />
      </div>
    </section>
  );
};

export default HeroSection;
