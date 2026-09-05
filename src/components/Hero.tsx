import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import heroImage from "@/assets/hero-inspection.jpg";
import slideStructure from "@/assets/diag-structure.jpg";
import slideWaterproof from "@/assets/diag-waterproof.jpg";
import slideElectrical from "@/assets/diag-electrical.jpg";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

const slides = [
  { src: heroImage, alt: "Professional home inspector evaluating a modern residence" },
  { src: slideStructure, alt: "建築土建結構檢測現場" },
  { src: slideWaterproof, alt: "防水與滲漏水檢測現場" },
  { src: slideElectrical, alt: "電氣系統檢測現場" },
];

const Hero = () => {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, [reduced]);

  return (
    <section className="group relative min-h-screen w-full overflow-hidden flex items-center">
      {/* Background slideshow */}
      <div className="absolute inset-0">
        <AnimatePresence initial={false}>
          <motion.img
            key={index}
            src={slides[index].src}
            alt={slides[index].alt}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 1.6, ease: "easeInOut" }, scale: { duration: 7, ease: "linear" } }}
            className="absolute inset-0 w-full h-full object-cover"
            width={1440}
            height={900}
            loading={index === 0 ? "eager" : "lazy"}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-r from-[#2d3748]/85 via-[#2d3748]/70 to-[#2d3748]/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 lg:px-12 pt-32 pb-20">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-[11px] tracking-wider uppercase mb-8 transition-colors duration-300 group-hover:bg-teal-400/25 group-hover:border-teal-400/40 group-hover:text-white group-hover:font-bold group-hover:animate-blink"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse group-hover:bg-teal-400" />
            BY CERTIFIED PROFESSIONALS
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
          >
            專業技術士房屋檢測
            <span className="block text-primary-foreground/80 font-light mt-2">Professional Home Inspection</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-lg text-white/80 leading-relaxed max-w-xl mb-10"
          >
            房子也需要一場全面性的健康檢查，專業第三方從發現問題、理解問題，到改善問題，替屋主找出那些容易被忽略的缺失及細節。
          </motion.p>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        {slides.map((s, i) => (
          <button
            key={s.src}
            type="button"
            aria-label={`切換到第 ${i + 1} 張圖片`}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === index ? "w-8 bg-white/90" : "w-2 bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;
