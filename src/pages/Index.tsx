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
import { SITE_TITLE, SITE_DESCRIPTION } from "@/config/site";

const Index = () => {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Seo title={SITE_TITLE} description={SITE_DESCRIPTION} path="/" />
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
