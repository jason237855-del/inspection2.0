import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Search, FileText, Users } from "lucide-react";

const values = [
  { icon: ShieldCheck, title: "公正獨立", subtitle: "\n", description: "秉持第三方立場，如實呈現房屋現況，每一項紀錄都有充分依據，每一份報告客觀公正。" },
  { icon: Search, title: "專業細緻", subtitle: "\n", description: "結合系統化流程、專業儀器與工程經驗，仔細確認每一處容易被忽略的細節。" },
  { icon: FileText, title: "報告清晰", subtitle: "\n", description: "以清晰的圖文整理檢測結果，讓您看懂缺失問題與改善方向。" },
  { icon: Users, title: "客戶至上", subtitle: "Client First", description: "從檢測、說明到改善方向，始終站在您的立場，陪您做出更安心的決定。" },
];

const AboutSection = () => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setActive((i) => (i + 1) % values.length), 3500);
    return () => clearInterval(t);
  }, [paused]);

  const current = values[active];
  const Icon = current.icon;

  return (
    <section id="about" className="py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground mb-4 block">ABOUT TEAM</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground tracking-tight">關於我們的團隊</h2>
            <div className="space-y-5 text-muted-foreground font-light leading-relaxed">
              <p>
                關於診斷室驗屋

                我們相信，房屋檢測的價值，不只是列出缺失，而是幫助屋主真正理解房屋的狀況，更加清楚了解缺失問題。

                診斷室驗屋以工程實務、專業技術與系統化檢測為基礎，協助您在交屋或購屋以前，看見容易被忽略的細節與問題。

                我們秉持獨立第三方立場，不隸屬任何建商或仲介等。從發現問題、理解問題，到提出後續改善問題的方向，每一項判斷，都以您的權益與未來居住的安心為出發點。
              </p>
              <p></p>
              <p></p>
            </div>
          </motion.div>

          {/* Auto-rotating carousel */}
          <div
            className="relative"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="relative min-h-[260px] sm:min-h-[240px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.title}
                  initial={{ opacity: 0, x: 32 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -32 }}
                  transition={{ duration: 0.45 }}
                  className="p-10 bg-card border border-border rounded-2xl shadow-soft text-center"
                >
                  <Icon className="h-8 w-8 text-primary mb-6 mx-auto" strokeWidth={1.5} />
                  <h3 className="text-2xl font-bold text-card-foreground mb-1">{current.title}</h3>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-4">{current.subtitle}</p>
                  <p className="text-sm text-muted-foreground leading-loose font-light">{current.description}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-center gap-3 mt-8">
              {values.map((v, i) => (
                <button
                  key={v.title}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={v.title}
                  aria-current={i === active}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === active ? "w-10 bg-primary" : "w-4 bg-border hover:bg-muted-foreground/40"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
