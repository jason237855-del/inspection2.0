import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Home, Building2, RefreshCcw, MessageSquare } from "lucide-react";
import { Card } from "./ui/card";

const services = [
  {
    number: "01",
    icon: Home,
    title: "新成屋驗屋",
    hoverColor: "#F3A139", // Pantone 14-1064 TCX Saffron
    subtitle: "\n",
    description: "交屋前進行系統化房屋檢測，協助確認施工與設備狀況。",
  },
  {
    number: "02",
    icon: Building2,
    title: "中古屋檢測",
    hoverColor: "#27376F", // Pantone 19-4092 TCX Mazarine Blue
    subtitle: "\n",
    description: "從現況、設備與可能風險出發，協助理解房屋目前的健康狀態。",
  },
  {
    number: "03",
    icon: RefreshCcw,
    title: "複驗服務",
    hoverColor: "#CD212A", // Pantone 18-1662 TCX Flame Scarlet
    subtitle: "\n",
    description: "針對首次驗屋缺失項目，確認改善後的狀況。",
  },
  {
    number: "04",
    icon: MessageSquare,
    title: "屋況諮詢",
    hoverColor: "#4A5335", // Pantone 19-0323 TCX Chive
    subtitle: "\n",
    description: "針對特定房屋問題或檢測需求提供專業判斷與建議。",
  },
];

const Services = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section id="services" className="py-24 lg:py-32 bg-background" ref={ref}>
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground mb-4 block">
            Our Services
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground tracking-tight">
            核心服務項目
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto font-light">
            從新成屋到中古屋，從複驗到諮詢，涵蓋購屋與交屋過程中的每個關鍵環節。
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon;
            const isHovered = hoveredIndex === index;

            return (
              <motion.div
                key={service.number}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="h-full"
              >
                <Card
                  style={isHovered ? { backgroundColor: service.hoverColor } : undefined}
                  className={`h-full p-8 bg-card border border-border transition-all duration-300 text-center ${
                    isHovered ? "shadow-hover -translate-y-1 border-transparent" : "shadow-soft"
                  }`}
                >
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-6 transition-colors duration-300 ${
                      isHovered ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                    }`}
                  >
                    <Icon className="w-7 h-7" strokeWidth={1.5} />
                  </div>

                  <h3 className={`text-xl font-bold mb-1 transition-colors duration-300 ${isHovered ? "text-white" : "text-card-foreground"}`}>{service.title}</h3>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-4 transition-colors duration-300 ${isHovered ? "text-white/80" : "text-muted-foreground"}`}>
                    {service.subtitle}
                  </p>
                  <p className={`text-sm leading-relaxed font-light transition-colors duration-300 ${isHovered ? "text-white/90" : "text-muted-foreground"}`}>
                    {service.description}
                  </p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;
