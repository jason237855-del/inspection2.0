import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Navigation from "@/components/Navigation";
import BookingForm from "@/components/BookingForm";
import LineBookingBinder from "@/components/LineBookingBinder";
import Footer from "@/components/Footer";


const BookingPage = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <>
      <Helmet>
        <title>預約檢測服務 | 診斷室驗屋 Home Inspection &amp; Diagnostics</title>
        <meta
          name="description"
          content="立即預約診斷室驗屋服務，填寫檢測類型、房屋類型、地區與聯絡資訊，我們將在 24 小時內與您聯繫確認檢測時間。"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://hushed-haven-stays.lovable.app/booking" />
      </Helmet>

      <div className="min-h-screen overflow-x-hidden bg-background">
        <Navigation />

        <main className="pt-32 lg:pt-40 pb-24 lg:pb-32">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground mb-4 block">
                Book an Inspection
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground tracking-tight">
                預約檢測服務
              </h1>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto font-light">
                填寫基本信息，我們將在 24 小時內與您聯繫確認檢測時間。
              </p>
            </div>

            <LineBookingBinder />

            <BookingForm autoFocus />

          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default BookingPage;
