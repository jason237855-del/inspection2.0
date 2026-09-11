import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Home,
  ClipboardList,
  CalendarCheck,
  FileSearch,
  CalendarDays,
  MessageCircle,
} from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const sections = [
  {
    id: "before",
    icon: Home,
    label: "PART 01",
    title: "驗屋前，屋主們最常這樣問",
    intro: "從驗屋的必要性到最佳安排時機，先替您釐清最關鍵的疑問。",
    items: [
      {
        q: "什麼是驗屋？為什麼交屋前需要驗屋？",
        a: "驗屋是透過系統化檢查與專業儀器，協助屋主確認房屋現況、設備功能及可能存在的施工缺失。除了找出問題，更重要的是讓您理解問題的原因、影響與後續改善方向。",
      },
      {
        q: "建商已經有自主檢查，還需要另外驗屋嗎？",
        a: "建商自主檢查與第三方驗屋的角色不同。第三方驗屋是站在公正角度，重新確認交付房屋的實際狀況，提供另一層專業的檢視。",
      },
      {
        q: "新成屋、中古屋都可以驗嗎？",
        a: "可以，但不同屋況的檢測重點不同。新成屋著重施工品質、設備功能與交屋缺失；中古屋則會更重視既有使用狀況、老化、滲漏水跡象及設備狀態。",
      },
      {
        q: "什麼時間點安排驗屋最好？",
        a: "新成屋通常建議在建商通知驗屋／交屋後，正式完成交屋程序前安排。若不確定建商流程，可先提供相關通知內容，由我們協助判斷適合的時間點。",
      },
    ],
  },
  {
    id: "scope",
    icon: ClipboardList,
    label: "PART 02",
    title: "檢測內容包含什麼項目",
    intro: "從六大系統到專業儀器的應用，說明我們如何完整檢視您的房屋。",
    items: [
      {
        q: "驗屋會檢查哪些項目？",
        a: "涵蓋給排水、電氣、門窗、牆地面、設備功能、水平度、滲漏水跡象等其他檢測項目，並依房屋實際條件修正。",
      },
      {
        q: "會使用哪些專業儀器？",
        a: "依檢測需求使用熱像儀、混凝土水分儀、水平量測設備、內視鏡、電氣檢測設備，以及空氣品質與環境相關儀器等。儀器是協助判讀的工具，最終仍需搭配現場狀況與專業經驗綜合判斷。",
      },
      {
        q: "驗屋能找出房子的所有問題嗎？",
        a: "驗屋主要針對檢測當下可接近、可觀察及可量測的範圍進行判斷。隱蔽於結構、裝修或設備內部，或當下尚未出現徵兆的問題，故無法透過非破壞性檢測發現。",
      },
    ],
  },
  {
    id: "process",
    icon: CalendarCheck,
    label: "PART 03",
    title: "預約流程，驗屋前後該準備什麼？",
    intro: "從預約到現場檢測與報告交付，掌握每個環節該留意的事。",
    items: [
      {
        q: "驗屋需要多久？",
        a: "依房屋坪數、格局、屋況與現場條件而異。一般住宅可先預留 2-3 小時，實際時間於預約時依物件資訊評估。",
      },
      {
        q: "屋主需要全程在現場嗎？",
        a: "不一定，但如果時間允許，建議在檢測完成後參與現場說明。團隊會針對較重要的異常與注意事項協助您理解，而不只是交付一份缺失清單。",
      },
      {
        q: "驗屋前要準備什麼？",
        a: "建議準備建商提供的相關物件資料及客變項目，並確認現場水、電、窗框等是否可檢測。如有特別在意的位置或已發現的問題，也可事先告知。",
      },
      {
        q: "驗屋後會提供報告嗎？",
        a: "會。報告會整理現場發現與相關紀錄，讓屋主後續與建商、賣方或相關單位溝通時有較清楚的依據。",
      },
    ],
  },
  {
    id: "defects",
    icon: FileSearch,
    label: "PART 04",
    title: "缺失與複驗，屋主們該如何審視",
    intro: "驗出缺失後的溝通方向，以及複驗在整個流程中的角色。",
    items: [
      {
        q: "缺失問題驗出後該怎麼辦？",
        a: "我們會協助您理解問題的位置、現象與未來的影響，讓您能更有方向地與建商或相關單位溝通討論並改善問題。",
      },
      {
        q: "是不是所有驗出的問題都一定要要求建商修？",
        a: "不一定。不同問題的重要程度、成因及改善方式不同。我們更重視協助屋主區分需要優先處理的問題與修繕細節，而不是在追求「缺失數量」或「摸魚混時」。",
      },
      {
        q: "建商修繕完成後，需要複驗嗎？",
        a: "視第一次檢測結果與修繕內容而定。若涉及較重要的功能性問題、滲漏水、電氣或其他需要確認改善成果的項目，通常值得再次安排複驗檢測。",
      },
      {
        q: "複驗只是確認原本的缺失嗎？",
        a: "複驗主要針對前次紀錄的改善狀況進行確認，實際範圍仍依服務方案與現場條件而定。這裡最好在網站寫清楚，避免客戶認為複驗等於重新做一次完整驗屋。",
      },
    ],
  },
  {
    id: "booking",
    icon: MessageCircle,
    label: "PART 05",
    title: "費用、地區與預約",
    intro: "報價方式、服務區域與最快速的預約管道，一次說明清楚。",
    items: [
      {
        q: "驗屋費用怎麼計算？",
        a: "費用可依坪數、房屋類型、檢測需求與所在地區等條件評估。建議透過 LINE 提供基本物件資訊，團隊會依實際需求狀況提供報價。",
      },
      {
        q: "哪些地區可以提供驗屋服務？",
        a: "目前服務以雙北、桃園、新竹、基隆及宜蘭為主；其他地區可另外詢問。",
      },
      {
        q: "要提前多久預約？",
        a: "建議收到建商驗屋通知後儘早確認日期，尤其是假日或交屋集中期間，可安排的時段通常較有限。",
      },
      {
        q: "如何預約診斷室驗屋？",
        a: "可透過官方 LINE 聯繫，提供房屋所在地、房屋類型、坪數、預計驗屋日期及其他需求，預約付訂後團隊會協助確認並安排時程。",
      },
    ],
  },
];

const Faq = () => {
  const reduced = usePrefersReducedMotion();

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navigation variant="dark" />
      <main className="flex-1 pt-36 lg:pt-44 pb-24">
        {/* Hero */}
        <div className="container mx-auto px-6 lg:px-12 max-w-3xl text-center mb-16 lg:mb-20">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-4">
              FAQ
            </p>
            <h1 className="text-3xl lg:text-4xl font-semibold mb-5 tracking-tight">
              常見問題
            </h1>
            <p className="text-muted-foreground font-light leading-relaxed">
              從驗屋前的心理準備、檢測範圍，到缺失溝通與預約方式，
              <br className="hidden sm:block" />
              我們把屋主最常詢問的問題整理成五大主題，幫助您快速找到答案。
            </p>
          </motion.div>

          {/* Category quick nav */}
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#faq-${s.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <s.icon className="h-3.5 w-3.5 text-primary" aria-hidden />
                {s.title}
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="container mx-auto px-6 lg:px-12 max-w-5xl space-y-20">
          {sections.map((section, si) => {
            const Icon = section.icon;
            return (
              <motion.section
                key={section.id}
                id={`faq-${section.id}`}
                className="scroll-mt-28"
                initial={reduced ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.55, delay: 0.05 }}
              >
                <div className="grid gap-8 lg:grid-cols-[minmax(0,280px)_1fr] lg:gap-14">
                  {/* Left: section intro */}
                  <div className="lg:sticky lg:top-28 lg:self-start">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-medium text-muted-foreground mb-4">
                      <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
                      {section.label}
                    </span>
                    <h2 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight mb-3">
                      {section.title}
                    </h2>
                    <p className="text-sm text-muted-foreground font-light leading-relaxed">
                      {section.intro}
                    </p>
                  </div>

                  {/* Right: Q&A accordion */}
                  <Accordion
                    type="single"
                    collapsible
                    defaultValue={`${section.id}-0`}
                    className="space-y-3"
                  >
                    {section.items.map((item, qi) => (
                      <AccordionItem
                        key={qi}
                        value={`${section.id}-${qi}`}
                        className="rounded-xl border border-border bg-card px-5 lg:px-6 transition-colors data-[state=open]:border-primary/30 data-[state=open]:shadow-soft"
                      >
                        <AccordionTrigger className="py-4 lg:py-5 text-left hover:no-underline">
                          <span className="flex items-start gap-3 pr-2">
                            <span className="mt-0.5 shrink-0 text-[11px] font-semibold text-primary/70">
                              Q{qi + 1}
                            </span>
                            <span className="text-sm lg:text-[15px] font-medium text-foreground leading-relaxed">
                              {item.q}
                            </span>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="pb-5 pl-9 text-sm text-muted-foreground font-light leading-relaxed">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </motion.section>
            );
          })}

          {/* CTA */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55 }}
            className="mx-auto max-w-2xl rounded-2xl border border-border bg-secondary p-8 lg:p-10 text-center"
          >
            <h2 className="text-xl lg:text-2xl font-semibold text-secondary-foreground mb-3 tracking-tight">
              還有其他問題嗎？
            </h2>
            <p className="text-sm text-secondary-foreground/70 font-light leading-relaxed mb-6">
              歡迎透過官方 LINE 與我們聯繫，提供您的物件資訊，團隊會盡快為您解答並協助安排驗屋時程。
            </p>
            <Link
              to="/booking"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 hover:shadow-hover"
            >
              <CalendarDays className="h-4 w-4" aria-hidden />
              立即預約
            </Link>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Faq;
