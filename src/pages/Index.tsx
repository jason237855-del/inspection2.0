import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import HeroStats from "@/components/hero/HeroStats";
import AboutSection from "@/components/AboutSection";
import QuickGuide from "@/components/QuickGuide";
import Process from "@/components/Process";
import Services from "@/components/Services";
import Pricing from "@/components/Pricing";
import GroupBuying from "@/components/GroupBuying";
import Experience from "@/components/Experience";
import Booking from "@/components/Booking";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { SITE_URL, SITE_NAME, SITE_TITLE, SITE_DESCRIPTION, DEFAULT_OG_IMAGE } from "@/config/site";
import { LINE_OA_URL } from "@/config/line";

const Index = () => {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Seo title={SITE_TITLE} description={SITE_DESCRIPTION} path="/">
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfessionalService",
            "@id": `${SITE_URL}/#business`,
            name: SITE_NAME,
            alternateName: "Home Inspection & Diagnostics",
            url: SITE_URL,
            logo: `${SITE_URL}/apple-touch-icon.png`,
            image: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
            description: SITE_DESCRIPTION,
            knowsAbout: ["新成屋驗屋", "中古屋驗屋", "房屋檢測", "交屋驗收", "紅外線熱顯像"],
            // 服務範圍依常見問題頁：台中以北（雙北、基隆、桃園、新竹、苗栗、台中、宜蘭）及花蓮、台東
            areaServed: ["台北市", "新北市", "基隆市", "桃園市", "新竹縣", "新竹市", "苗栗縣", "台中市", "宜蘭縣", "花蓮縣", "台東縣"].map(
              (name) => ({ "@type": "AdministrativeArea", name }),
            ),
            sameAs: [LINE_OA_URL],
          })}
        </script>
      </Seo>
      <Navigation variant="dark" />
      <Hero />
      <HeroStats />
      <AboutSection />
      <Experience />
      <QuickGuide />
      <Process />
      <Services />
      <Pricing />
      <GroupBuying />
      <Booking />
      <Footer />
    </div>
  );
};

export default Index;
