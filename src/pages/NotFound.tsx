import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Seo from "@/components/Seo";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-background">
      <Seo title="找不到頁面｜診斷室驗屋" description="您要找的頁面不存在。" path="/404" noindex />
      <Navigation variant="dark" />
      <main className="flex flex-1 items-center justify-center px-6 pt-36 pb-24">
        <div className="max-w-md text-center">
          <p className="mb-3 text-5xl font-bold tracking-tight text-foreground">404</p>
          <h1 className="mb-4 text-2xl font-bold tracking-tight text-foreground">找不到這個頁面</h1>
          <p className="mb-10 text-muted-foreground font-light leading-relaxed">
            網址可能輸入錯誤，或頁面已經移除。
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center rounded-full bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 hover:shadow-hover"
            >
              回到首頁
            </Link>
            <Link
              to="/booking"
              className="inline-flex items-center rounded-full border border-border px-8 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              立即預約驗屋
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
