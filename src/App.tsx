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

// 首頁以外的頁面改用 lazy load：一般訪客進站大多先看首頁，
// 沒必要讓他們一次下載後台管理系統、預約表單等用不到的程式碼。
const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import("./pages/About"));
const Admin = lazy(() => import("./pages/Admin"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Journal = lazy(() => import("./pages/Journal"));
const JournalArticle = lazy(() => import("./pages/JournalArticle"));
const Faq = lazy(() => import("./pages/Faq"));
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
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/notes" element={<Navigate to="/journal" replace />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/journal/:slug" element={<JournalArticle />} />
            <Route path="/faq" element={<Faq />} />
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
