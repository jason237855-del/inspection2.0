import { motion, useScroll, useTransform } from "framer-motion";
import { ShieldCheck, FileText, Users, Award, Clock, Search } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import bannerImage from "@/assets/hero-inspection.jpg";

const values = [
  {
    icon: ShieldCheck,
    title: "專業獨立",
    subtitle: "Independence",
    description: "作為第三方檢測機構，我們獨立於開發商、中介及賣方，確保每一份報告客觀公正。"
  },
  {
    icon: Search,
    title: "細緻入微",
    subtitle: "Thoroughness",
    description: "從地基到屋頂，從結構到環境，我們使用先進儀器檢測每一處可能影響居住安全與價值的細節。"
  },
  {
    icon: FileText,
    title: "報告清晰",
    subtitle: "Clarity",
    description: "圖文並茂的專業報告，用通俗語言解釋技術問題，讓每一位客戶都能讀懂房屋真實狀況。"
  },
  {
    icon: Users,
    title: "客戶至上",
    subtitle: "Client First",
    description: "我們理解房產交易的壓力，始終以耐心、透明和及時響應陪伴客戶完成每一步。"
  },
  {
    icon: Award,
    title: "持續提升",
    subtitle: "Excellence",
    description: "定期培訓與技術更新，確保檢測標準與國際接軌，為客戶提供行業領先的評估服務。"
  },
  {
    icon: Clock,
    title: "高效可靠",
    subtitle: "Reliability",
    description: "從預約到報告交付，每個環節都有明確時限，絕不因拖延影響客戶的交易節奏。"
  }
];

const About = () => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation />

      {/* Hero Image with Parallax */}
      <div className="relative w-full h-[50vh] overflow-hidden">
        <motion.img
          src={bannerImage}
          alt="Professional home inspection"
          style={{ y }}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 w-full h-[120%] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#2d3748]/40 to-[#2d3748]/70" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-6">
            <span className="text-[11px] uppercase tracking-wider text-white/70 mb-3 block">About Us</span>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">關於診斷室驗屋</h1>
          </div>
        </div>
      </div>

      <main>
        {/* Our Story Section */}
        <section className="py-24 lg:py-32 px-6 lg:px-12">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Our Story</span>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mt-2 mb-8">品牌故事</h2>

              <div className="space-y-6 text-muted-foreground font-light leading-relaxed">
                <p>
                  診斷室驗屋成立於 2010 年，源於一個簡單的信念：每一位購房者都應當在籤字前，清楚地知道自己將要購買的房子真實狀況如何。
                </p>
                <p>
                  在房地產市場高速發展的同時，信息不對稱與隱性質量問題讓許多家庭在入住後才發現隱患。我們希望通過獨立、專業、透明的房屋檢測服務，幫助客戶在做出重大資產決策前掌握充分信息。
                </p>
                <p>
                  十餘年來，我們已完成超過 3,000 套住宅與商業物業的檢測，服務範圍涵蓋住宅買前檢驗、新房交付驗收、商業建築評估及環境健康監測。我們的團隊由持證工程師與資深檢測師組成，堅持將技術與責任心注入每一次上門檢測。
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Why Inspection Matters Section */}
        <section className="py-24 lg:py-32 px-6 lg:px-12 bg-secondary/20">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">The Why</span>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mt-2 mb-8">為什麼房屋檢測如此重要</h2>

              <div className="space-y-6 text-muted-foreground font-light leading-relaxed">
                <p>
                  房屋是大多數家庭一生中最大的一筆支出。然而，牆體裂縫、滲漏、電路老化、管道問題等隱患往往隱藏在裝修或日常視線之外，普通買家很難在幾次看房中全面識別。
                </p>
                <p>
                  一次專業的房屋檢測，能夠幫助您在交易前發現這些潛在問題，評估維修成本，並在價格談判中掌握主動權。對於新房交付，檢測則是確保開發商履行質量承諾、保護業主權益的重要手段。
                </p>
                <p>
                  我們相信，信息透明是健康交易的基礎。診斷室驗屋所做的，不僅是發現問題，更是為客戶提供安心置業的底氣。
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-24 lg:py-32 px-6 lg:px-12">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">What We Stand For</span>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mt-2">我們的價值觀</h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="p-8 border border-border rounded-lg bg-card shadow-soft hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                >
                  <value.icon className="h-6 w-6 text-primary mb-4" />
                  <h3 className="text-lg font-bold tracking-tight mb-1">{value.title}</h3>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">{value.subtitle}</p>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
