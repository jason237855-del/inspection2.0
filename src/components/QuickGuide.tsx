import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap, Droplets, ShieldCheck, Building2, Wrench, Wind } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import diagElectrical from "@/assets/diag-electrical.jpg";
import diagElectrical2 from "@/assets/diag-electrical-2.jpg";
import diagElectrical3 from "@/assets/diag-electrical-3.jpg";
import diagWater from "@/assets/diag-water.jpg";
import diagWater2 from "@/assets/diag-water-2.jpg";
import diagWater3 from "@/assets/diag-water-3.jpg";
import diagWaterproof from "@/assets/diag-waterproof.jpg";
import diagWaterproof2 from "@/assets/diag-waterproof-2.jpg";
import diagWaterproof3 from "@/assets/diag-waterproof-3.jpg";
import diagStructure from "@/assets/diag-structure.jpg";
import diagStructure2 from "@/assets/diag-structure-2.jpg";
import diagStructure3 from "@/assets/diag-structure-3.jpg";
import diagEquipment from "@/assets/diag-equipment.jpg";
import diagEquipment2 from "@/assets/diag-equipment-2.jpg";
import diagEquipment3 from "@/assets/diag-equipment-3.jpg";
import diagEnvironment from "@/assets/diag-environment.jpg";
import diagEnvironment2 from "@/assets/diag-environment-2.jpg";
import diagEnvironment3 from "@/assets/diag-environment-3.jpg";

const categories = [
  {
    title: "電氣診斷",
    icon: Zap,
    images: [diagElectrical, diagElectrical2, diagElectrical3],
    alt: "驗屋人員以三用電表與插座測試器檢查配電箱迴路",
    focus: "逐一確認電箱迴路與弱電系統、電壓相位與漏電保護，使用功能是否正常。",
    report: "報告會標註異常迴路位置、漏電保護、圖面審核，並紀錄建議改善方式。",
    items: [
      "燈具開關功能及外觀完整性檢測",
      "電源插座功能及外觀完整性檢測",
      "配電箱迴路功能及施工完整性檢測",
      "電箱單線圖圖面審核",
      "全戶電壓相位檢測",
      "全戶漏電斷路檢測",
      "全戶弱電系統檢測",
    ],
  },
  {
    title: "給排水診斷",
    icon: Droplets,
    images: [diagWater, diagWater2, diagWater3],
    alt: "以水壓錶檢測衛浴給水壓力並觀察排水情形",
    focus: "全戶實測水壓、放水試排，確認給排水順暢與洩水坡度是否足夠。",
    report: "報告記錄水壓數值、管內阻塞與地面積水、滲漏水等疑慮位置。",
    items: [
      "全戶給水系統檢測",
      "全戶排水系統檢測",
      "衛浴設備排水檢測",
      "衛浴設備給水檢測",
      "衛浴洩水坡度檢測",
      "全戶空調排水檢測",
      "陽台洩水坡度檢測",
      "廚具設備排水檢測",
      "廚具設備給水檢測",
      "全戶水壓檢測",
    ],
  },
  {
    title: "防水診斷",
    icon: ShieldCheck,
    images: [diagWaterproof, diagWaterproof2, diagWaterproof3],
    alt: "使用水分計與熱顯像儀檢測牆面與天花板滲漏狀況",
    focus: "以專業儀器檢測，追查滲漏來源與潛在風險。",
    report: "報告附上儀器數據、影像紀錄與滲漏路徑判斷。",
    items: [
      "牆面、天花板滲漏水檢測",
      "衛浴空間滲漏水檢測",
      "混凝土水分比檢測",
      "熱顯像儀滲漏水檢測",
      "排水管內視鏡檢測",
      "門框、窗框滲漏水檢測",
      "管道間內部檢查",
    ],
  },
  {
    title: "建築土建診斷",
    icon: Building2,
    images: [diagStructure, diagStructure2, diagStructure3],
    alt: "以雷射水平儀與捲尺檢測地坪水平與空間尺寸",
    focus: "地壁磚空心、結構地面垂直水平。",
    report: "空心磚檢測、水平誤差值與龜裂破損相關缺失。",
    items: [
      "壁磚空心檢測",
      "地磚空心檢測",
      "牆面、天花板油漆施工品質",
      "樑柱結構檢測",
      "牆面垂直水平檢測",
      "地磚外觀完整性檢測",
      "壁磚外觀完整性檢測",
      "室內地面水平檢測",
      "木地板與踢腳板施工檢測",
      "地下室車位尺寸丈量",
    ],
  },
  {
    title: "設備診斷",
    icon: Wrench,
    images: [diagEquipment, diagEquipment2, diagEquipment3],
    alt: "檢查門窗五金開闔功能與廚衛設備安裝品質",
    focus: "門窗、淋浴拉門與廚衛設備，功能使用與外觀細節。",
    report: "報告標記刮傷、變形、五金鬆動與標章缺漏等項目。",
    items: [
      "門扇窗戶外觀完整性檢測",
      "門扇窗戶功能及安裝檢測",
      "玻璃外觀完整性檢測",
      "防火門標章與膠條檢查",
      "淋浴拉門功能及安裝完整性檢測",
      "廚具設備功能及安裝完整性檢測",
      "衛浴設備功能及安裝完整性檢測",
    ],
  },
  {
    title: "環境診斷",
    icon: Wind,
    images: [diagEnvironment, diagEnvironment2, diagEnvironment3],
    alt: "室內空氣品質檢測儀測量甲醛與 PM2.5 數值",
    focus: "檢測室內空氣、水質與噪音，確認入住環境現況。",
    report: "報告提供實測數值與建議改善方式。",
    items: [
      "全室空間甲醛檢測",
      "全室空間PM2.5 檢測",
      "全室空間噪音檢測",
      "全室空間電磁波檢測",
      "屋內水質檢測",
    ],
  },
];

const CardCarousel = ({
  images,
  alt,
  delay,
}: {
  images: string[];
  alt: string;
  delay: number;
}) => {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduced || images.length < 2) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % images.length),
      5000
    );
    return () => window.clearInterval(id);
  }, [reduced, images.length]);

  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={alt}
          loading="lazy"
          width={1024}
          height={640}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 group-hover:scale-105 [transition-property:opacity,transform] ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          style={{ transitionDelay: `${delay}ms` }}
        />
      ))}
      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            aria-label={`顯示第 ${i + 1} 張照片`}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? "w-5 bg-white" : "w-1.5 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const QuickGuide = () => {
  return (
    <section className="py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground mb-4 block">
            我們的診斷項目
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground tracking-tight">
            六大系統，逐項確認。
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
            系統化安排檢測順序，讓每一個區域與設備都有明確的紀錄方式。
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <motion.div
                key={cat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
                className="group h-full bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-soft transition-all duration-300"
              >
                <CardCarousel images={cat.images} alt={cat.alt} delay={i * 300} />
                <div className="relative flex flex-col h-full p-6 lg:p-7 overflow-hidden">
                  {/* watermark icon */}
                  <Icon
                    aria-hidden
                    strokeWidth={1}
                    className="pointer-events-none absolute -right-4 top-1/2 -translate-y-1/2 h-56 w-56 text-primary/[0.14] transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="relative">
                    <h3 className="text-base font-bold text-card-foreground mb-4 text-center">
                      {cat.title}
                    </h3>

                    <div className="mb-5 space-y-2 rounded-lg bg-accent/30 p-4">
                      <p className="text-xs text-muted-foreground font-light leading-relaxed">
                        <span className="text-foreground font-medium">檢測重點｜</span>
                        {cat.focus}
                      </p>
                      <p className="text-xs text-muted-foreground font-light leading-relaxed">
                        <span className="text-foreground font-medium">報告內容｜</span>
                        {cat.report}
                      </p>
                    </div>

                    <ul className="space-y-2 flex-1">
                      {cat.items.map((item) => (
                        <li
                          key={item}
                          className="text-sm text-muted-foreground font-light leading-relaxed flex items-start gap-2.5"
                        >
                          <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
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
      </div>
    </section>
  );
};

export default QuickGuide;
