import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import DiagnosticField from "@/components/DiagnosticField";
import TradeMotionIcon, { type TradeType } from "@/components/TradeMotionIcon";


const certGroups: { motion: TradeType; title: string; items: string[] }[] = [
  {
    motion: "electrician",
    title: "電匠",
    items: ["室內配線乙級", "用電設備檢驗丙級"],
  },
  {
    motion: "plumber",
    title: "水匠",
    items: ["自來水配管丙級"],
  },
  {
    motion: "waterproof",
    title: "防水",
    items: ["營建防水丙級"],
  },
  {
    motion: "gas",
    title: "燃氣",
    items: ["特定瓦斯器具裝修丙級"],
  },
  {
    motion: "carpentry",
    title: "木作",
    items: ["裝潢木工乙級"],
  },
  {
    motion: "hvac",
    title: "空調",
    items: ["冷凍空調裝修乙級"],
  },
];

const Experience = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    
    <section
      id="experience"
      className="relative overflow-hidden py-24 lg:py-32 lg:min-h-[80vh] lg:flex lg:items-center"
      style={{
        backgroundColor: "#0c1118",
        backgroundImage:
          "radial-gradient(120% 90% at 68% 50%, #17202e 0%, #101722 45%, #0a0e14 100%)",
      }}
      ref={ref}
    >
      <DiagnosticField />
      {/* readability vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(8,11,16,0.86) 0%, rgba(8,11,16,0.6) 40%, rgba(8,11,16,0.12) 70%, rgba(8,11,16,0.35) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(90% 70% at 50% 50%, rgba(8,11,16,0) 40%, rgba(8,11,16,0.55) 100%)",
        }}
      />
      <div className="container relative z-10 mx-auto w-full px-6 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,340px)_1fr] lg:items-start lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="lg:sticky lg:top-28"
          >
            <span className="text-[11px] uppercase tracking-wider text-slate-400 mb-4 block">
              WHY CHOOSE US
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-50 tracking-tight">
              為什麼選診斷室驗屋
            </h2>
            <p className="text-base text-slate-300/80 font-light leading-relaxed">
              結合多領域技術與工程實務，從現象、原因到改善方向，提供更全面且有依據的檢測判斷。
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6">
            {certGroups.map((g, index) => (
              <motion.div
                key={g.title}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.08 }}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-[2px] transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.06]"
              >
                <div className="flex h-28 items-center justify-center border-b border-white/10 bg-white/[0.02] sm:h-32">
                  <TradeMotionIcon
                    type={g.motion}
                    className="h-14 w-14 text-slate-200 transition-transform duration-300 group-hover:scale-110 sm:h-16 sm:w-16"
                  />
                </div>
                <div className="flex flex-1 flex-col items-center justify-center p-5 text-center">
                  <h3 className="mb-3 text-base font-bold text-slate-50">{g.title}</h3>
                  <ul className="flex flex-wrap justify-center gap-1.5">
                    {g.items.map((item) => (
                      <li
                        key={item}
                        className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-light leading-none text-slate-300/90"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Experience;
