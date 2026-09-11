import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const HeroContent = () => {
  return (
    <div className="relative z-10 max-w-xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="mb-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        BY CERTIFIED PROFESSIONALS
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.6 }}
        className="mb-6 text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl"
      >
        看見問題，
        <br />
        不只指出問題。
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.6 }}
        className="mb-10 max-w-md text-lg font-light leading-relaxed text-muted-foreground"
      >
        從建築、機電到環境檢測，以跨系統專業替你的房子做完整診斷。
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.6 }}
        className="flex flex-wrap items-center gap-4"
      >
        <Link
          to="/booking"
          className="group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 hover:shadow-hover"
        >
          立即預約驗屋
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
        </Link>
        <a
          href="#services"
          className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          了解服務
        </a>
      </motion.div>
    </div>
  );
};

export default HeroContent;
