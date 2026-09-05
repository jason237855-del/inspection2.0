import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import AboutSection from "@/components/AboutSection";
import QuickGuide from "@/components/QuickGuide";
import Process from "@/components/Process";
import Services from "@/components/Services";
import Pricing from "@/components/Pricing";
import Experience from "@/components/Experience";
import Booking from "@/components/Booking";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navigation />
      <Hero />
      <AboutSection />
      <Experience />
      <QuickGuide />
      <Process />
      <Services />
      <Pricing />
      <Booking />
      <Footer />
    </div>
  );
};

export default Index;
