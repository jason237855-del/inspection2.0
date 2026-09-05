import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneCall, ClipboardList, Search, FileCheck, RefreshCcw } from "lucide-react";
import FlowField from "@/components/FlowField";

const steps = [
  { icon: PhoneCall, step: "01", title: "預約洽詢", subtitle: "Enquiry", description: "line 或電話說明物件坪數、屋齡與交屋時程，我們評估所需人力與時間並報價。" },
  { icon: ClipboardList, step: "02", title: "行前準備", subtitle: "Preparation", description: "確認檢測範圍與時間，提醒您備妥權狀、平面圖、建材表與交屋文件。" },
  { icon: Search, step: "03", title: "現場檢測", subtitle: "On-site Inspection", description: "以專業儀器逐區檢查結構、水電、防水、門窗與空氣品質，現場標示缺失。" },
  { icon: FileCheck, step: "04", title: "報告交付", subtitle: "Report", description: "48 小時內交付圖文報告，標註缺失位置、風險等級與建議改善方式。" },
  { icon: RefreshCcw, step: "05", title: "複驗追蹤", subtitle: "Re-inspection", description: "建商或屋主修繕完成後安排複驗，確認缺失確實改善才算完成。" },
];

const Process = () => {
  const [active, setActive] = useState(0);
  const activeStep = steps[active];

  return (
    <section
      id="process"
      className="relative overflow-hidden py-24 lg:py-32"
      style={{
        backgroundColor: "#0b1016",
        backgroundImage:
          "linear-gradient(160deg, #101a22 0%, #0d141c 45%, #090d13 100%)",
      }}
    >
      <FlowField />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(90% 70% at 50% 45%, rgba(9,13,19,0) 35%, rgba(9,13,19,0.6) 100%)",
        }}
      />

      <div className="container relative z-10 mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-[11px] uppercase tracking-wider text-slate-400 mb-4 block">Our Process</span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-50 tracking-tight">服務流程</h2>
          <p className="text-base text-slate-300/80 max-w-2xl mx-auto font-light leading-relaxed">
            從第一通詢問到複驗完成，每個階段都有明確的時程與交付內容。點選任一步驟查看詳細說明。
          </p>
        </motion.div>

        <div className="grid grid-cols-5 gap-2 sm:gap-4 lg:gap-6">
          {steps.map((s, i) => {
            const isActive = i === active;
            return (
              <motion.button
                key={s.step}
                type="button"
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                aria-pressed={isActive}
                aria-label={`${s.step} ${s.title}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group focus:outline-none flex flex-col items-center text-center"
              >
                <div className="relative shrink-0">
                  <div
                    className={`w-14 h-14 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-2xl border flex items-center justify-center backdrop-blur-[2px] transition-all duration-300 ${
                      isActive
                        ? "bg-primary border-primary shadow-hover -translate-y-1"
                        : "bg-white/[0.05] border-white/10 group-hover:-translate-y-1 group-hover:bg-white/[0.1]"
                    }`}
                  >
                    <s.icon
                      className={`w-6 h-6 sm:w-9 sm:h-9 lg:w-11 lg:h-11 transition-colors duration-300 ${
                        isActive ? "text-primary-foreground" : "text-slate-200"
                      }`}
                      strokeWidth={1.4}
                    />
                  </div>
                  <span
                    className={`absolute -top-2 -right-2 w-7 h-7 rounded-full text-[11px] font-semibold flex items-center justify-center shadow-md transition-colors duration-300 ${
                      isActive
                        ? "bg-slate-50 text-slate-900"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {s.step}
                  </span>
                </div>
                <div className="mt-3 sm:mt-4">
                  <h3
                    className={`text-xs sm:text-sm lg:text-base font-bold whitespace-nowrap transition-colors duration-300 ${
                      isActive ? "text-primary" : "text-slate-100"
                    }`}
                  >
                    {s.title}
                  </h3>
                  <p className="hidden sm:block text-[10px] uppercase tracking-wider text-slate-400 mt-1">
                    {s.subtitle}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Active step detail */}
        <div className="mt-14 max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep.step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="p-8 bg-white/[0.04] border border-white/10 rounded-xl backdrop-blur-[2px] text-center"
            >
              <span className="text-[11px] uppercase tracking-[0.16em] text-primary block mb-3">
                Step {activeStep.step} · {activeStep.subtitle}
              </span>
              <h3 className="text-xl font-bold text-slate-50 mb-3">{activeStep.title}</h3>
              <p className="text-sm text-slate-300/80 leading-loose font-light">{activeStep.description}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default Process;
