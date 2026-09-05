import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Zap, Droplets, ShieldCheck, Flame } from "lucide-react";
import DiagnosticField from "@/components/DiagnosticField";


const certGroups = [
  {
    icon: Zap,
    title: "電匠",
    items: ["室內配線乙級", "用電設備檢驗丙級"],
  },
  {
    icon: Droplets,
    title: "水匠",
    items: ["自來水配管丙級"],
  },
  {
    icon: ShieldCheck,
    title: "防水",
    items: ["營建防水丙級"],
  },
  {
    icon: Flame,
    title: "燃氣",
    items: ["特定瓦斯器具裝修丙級"],
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
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto text-center mb-16"
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


        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-3xl mx-auto rounded-xl border border-white/10 overflow-hidden backdrop-blur-[2px]"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {certGroups.map((g, index) => {
              const Icon = g.icon;
              return (
                <motion.div
                  key={g.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="group relative bg-white/[0.035] border-b border-white/10 sm:[&:nth-child(odd)]:border-r p-4 sm:p-5 transition-colors duration-300 hover:bg-white/[0.08]"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex items-center justify-center w-9 h-9 shrink-0 rounded-lg bg-white/10 text-slate-200 transition-transform duration-300 group-hover:scale-110">
                      <Icon className="h-4 w-4" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-50 mb-2 leading-none">
                        {g.title}
                      </h3>
                      <ul className="flex flex-wrap gap-1.5">
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
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default Experience;
