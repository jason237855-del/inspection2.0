import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Loader2 } from "lucide-react";
import Index from "./pages/Index";
import ScrollToTop from "./components/ScrollToTop";
import FloatingConsultButton from "./components/FloatingConsultButton";
import CursorTextTrail from "@/components/CursorTextTrail";
import Analytics from "@/components/Analytics";

// 首頁以外的頁面改用 lazy load：一般訪客進站大多先看首頁，
// 沒必要讓他們一次下載後台管理系統、預約表單等用不到的程式碼。
const About = lazy(() => import("./pages/About"));
const Admin = lazy(() => import("./pages/Admin"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Journal = lazy(() => import("./pages/Journal"));
const JournalArticle = lazy(() => import("./pages/JournalArticle"));
const GroupHub = lazy(() => import("./pages/GroupHub"));
const GroupProject = lazy(() => import("./pages/GroupProject"));
const Faq = lazy(() => import("./pages/Faq"));
const Area = lazy(() => import("./pages/Area"));
const Privacy = lazy(() => import("./pages/Privacy"));
const BookingPage = lazy(() => import("./pages/BookingPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Analytics />
        <CursorTextTrail />
        <FloatingConsultButton />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            {/* 已移除的舊頁面（原為範本示範資料）：導向團報專區，避免舊連結／搜尋引擎收錄的網址變成 404 */}
            <Route path="/contact" element={<Navigate to="/group" replace />} />
            <Route path="/group" element={<GroupHub />} />
            <Route path="/group/:slug" element={<GroupProject />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/notes" element={<Navigate to="/journal" replace />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/journal/:slug" element={<JournalArticle />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/area/:slug" element={<Area />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/admin" element={<Admin />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
