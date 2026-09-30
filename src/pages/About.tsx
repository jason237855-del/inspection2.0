import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, FileText, Users, Search } from "lucide-react";
import { seoDefaults } from "@/config/seoPages";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import bannerImage from "@/assets/hero-inspection.jpg";
import Seo from "@/components/Seo";

// 與首頁「關於我們」區塊（AboutSection.tsx）同一組價值，文字保持一致
const values = [
  {
    icon: ShieldCheck,
    title: "公正獨立",
    description: "秉持第三方立場，如實呈現房屋現況，每一項紀錄都有充分依據，每一份報告客觀公正。",
  },
  {
    icon: Search,
    title: "專業細緻",
    description: "結合系統化流程、專業儀器與工程經驗，仔細確認每一處容易被忽略的細節。",
  },
  {
    icon: FileText,
    title: "報告清晰",
    description: "以清晰的圖文整理檢測結果，讓您看懂缺失問題與改善方向。",
  },
  {
    icon: Users,
    title: "客戶至上",
    description: "從檢測、說明到改善方向，始終站在您的立場，陪您做出更安心的決定。",
  },
];

const About = () => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Seo
        title={seoDefaults("/about").title}
        description={seoDefaults("/about").description}
        path="/about"
      />
      <Navigation />

      {/* Hero Image with Parallax */}
      <div className="relative w-full h-[50vh] overflow-hidden">
        <motion.img
          src={bannerImage}
          alt="驗屋人員在現場進行房屋檢測"
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
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-8">我們的理念</h2>

              <div className="space-y-6 text-muted-foreground font-light leading-relaxed">
                <p>
                  我們相信，房屋檢測的價值，不只是列出缺失，而是幫助屋主真正理解房屋的狀況，更加清楚了解缺失問題。
                </p>
                <p>
                  診斷室驗屋成立於 2025 年，以工程實務、專業技術與系統化檢測為基礎，協助您在交屋或購屋以前，看見容易被忽略的細節與問題。
                </p>
                <p>
                  我們秉持獨立第三方立場，不隸屬任何建商或仲介等。從發現問題、理解問題，到提出後續改善問題的方向，每一項判斷，都以您的權益與未來居住的安心為出發點。
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Why Inspection Matters Section */}
        <section className="py-24 lg:py-32 px-6 lg:px-12 bg-secondary/20">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-8">為什麼交屋前要驗屋</h2>

              <div className="space-y-6 text-muted-foreground font-light leading-relaxed">
                <p>
                  房子是多數家庭一生中最大的一筆支出。然而，滲漏水、空心磚、配電與給排水的問題，常常藏在裝修或日常視線之外，只靠交屋當天走一圈很難看出來。
                </p>
                <p>
                  新成屋在交屋前驗屋，可以把缺失清楚記錄下來，請建商在交屋前修繕完成；中古屋在買前檢測，則能先了解屋況與可能的修繕需求，作為決定與議價的參考。
                </p>
                <p>
                  診斷室驗屋做的，不只是找出問題，而是讓您看懂問題的原因、影響與改善方向，安心入住。
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-24 lg:py-32 px-6 lg:px-12">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">我們的堅持</h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="p-8 border border-border rounded-lg bg-card shadow-soft"
                >
                  <value.icon className="h-6 w-6 text-primary mb-4" strokeWidth={1.5} />
                  <h3 className="text-lg font-bold tracking-tight mb-3">{value.title}</h3>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="mt-16 text-center">
              <Link
                to="/booking"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 hover:shadow-hover"
              >
                立即預約驗屋
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
