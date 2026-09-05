import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import logoWhite from "@/assets/logo-mark-white.png";
import logoBlack from "@/assets/logo-mark-black.png";

interface NavigationProps {
  variant?: "default" | "dark";
}

const Navigation = ({ variant = "default" }: NavigationProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const isDark = variant === "dark";
  const reduceMotion = usePrefersReducedMotion();
  const [bookingHover, setBookingHover] = useState(false);

  // Reveal the floating nav while the booking form is hovered
  useEffect(() => {
    const onBookingHover = (e: Event) => {
      setBookingHover(Boolean((e as CustomEvent).detail));
    };
    window.addEventListener("booking-hover", onBookingHover);
    return () => window.removeEventListener("booking-hover", onBookingHover);
  }, []);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      setIsScrolled(y > 24);
      if (reduceMotion) {
        setIsHidden(false);
      } else if (y > 160 && y > lastY + 6) {
        setIsHidden(true);
      } else if (y < lastY - 6 || y < 80) {
        setIsHidden(false);
      }
      lastY = y;
      ticking = false;
    };
    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [reduceMotion]);


  // Scroll spy: highlight the menu item of the section currently in view
  useEffect(() => {
    const ids = ["about", "experience", "process", "services", "pricing", "booking"];
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (sections.length === 0) return;

    const ratios = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          ratios.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0);
        });
        let best = "";
        let bestRatio = 0;
        ratios.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = id;
          }
        });
        setActiveSection(best);
      },
      {
        rootMargin: "-25% 0px -45% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);



  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === "/";

  const handleBookNow = () => {
    navigate("/booking");
  };

  const navItems = [
    { label: "關於診斷室驗屋", href: "/#about", isRoute: false },
    { label: "服務流程", href: "/#process", isRoute: false },
    { label: "診斷項目", href: "/#services", isRoute: false },
    { label: "驗屋價格", href: "/#pricing", isRoute: false },
    { label: "診斷筆記", href: "/journal", isRoute: true },
    { label: "常見問題", href: "/faq", isRoute: true },
  ];

  // Centered header menu (home page sections are already visible while scrolling)
  const desktopNavItems = navItems.filter((item) =>
    ["驗屋價格", "診斷筆記", "常見問題"].includes(item.label)
  );

  const isActive = (item: { label: string; href: string; isRoute: boolean }) => {
    if (item.isRoute) return location.pathname === item.href;
    return isHomePage && activeSection === item.href.replace("/#", "");
  };


  const isLightSurface = !isMobileMenuOpen && !isDark && isScrolled;
  const textColor = isLightSurface ? "text-foreground" : "text-white";
  const logoSrc = isLightSurface ? logoBlack : logoWhite;

  return (
    <motion.nav
      initial={reduceMotion ? { y: 0, opacity: 1 } : { y: -100, opacity: 0 }}
      animate={{ y: isHidden && !reduceMotion && !bookingHover ? -140 : 0, opacity: 1 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 260, damping: 30, mass: 0.9 }
      }
      className="fixed top-0 left-0 right-0 z-[100]"
    >
      <div
        className={`container mx-auto motion-reduce:transition-none transition-[padding] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isScrolled ? "px-3 sm:px-6 pt-2 sm:pt-3" : "px-2 sm:px-4 pt-3 sm:pt-5"
        }`}
      >
        <div
          className={`motion-reduce:transition-none transition-[padding,background-color,border-color,box-shadow,backdrop-filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[padding,box-shadow] ${
            isScrolled
              ? "rounded-full px-4 lg:px-6 py-2 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.28)]"
              : "rounded-full px-5 lg:px-8 py-4 shadow-[0_2px_20px_-12px_rgba(0,0,0,0.15)]"
          } ${
            isMobileMenuOpen
              ? "bg-foreground rounded-3xl backdrop-blur-2xl"
              : isDark
                ? "bg-foreground/90 backdrop-blur-xl border border-white/10"
                : isScrolled
                  ? "bg-card/70 backdrop-blur-2xl border border-border/60"
                  : "bg-white/10 backdrop-blur-md border border-white/20"
          }`}
        >
        <div className="flex items-center justify-between gap-4 md:gap-6">

          <Link to="/">
            <motion.div
              whileHover={reduceMotion ? undefined : { scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <img
                src={logoSrc}
                alt="診斷室驗屋 Home Inspection & Diagnostics 標誌"
                className={`w-auto motion-reduce:transition-none transition-[height] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isScrolled ? "h-7 lg:h-8" : "h-8 lg:h-9"
                }`}
                width={44}
                height={36}
              />
              <div className="flex flex-col leading-none">
                <span className={`text-base font-semibold tracking-wide ${textColor}`}>診斷室驗屋</span>
                <span className={`text-[11px] tracking-wider ${textColor} opacity-70`}>Home Inspection & Diagnostics</span>
              </div>
            </motion.div>
          </Link>

          <div className="hidden md:flex flex-1 items-center justify-center gap-1 lg:gap-2">
            {desktopNavItems.map((item) => {
              const active = isActive(item);
              const linkClass = `relative rounded-full px-3 py-1.5 text-[13px] tracking-wider whitespace-nowrap motion-reduce:transition-none transition-[color,opacity] duration-300 ${textColor} ${
                active
                  ? "font-medium opacity-100"
                  : "font-normal opacity-70 hover:opacity-100 motion-reduce:hover:opacity-90"
              }`;
              const highlight = active ? (
                <motion.span
                  layoutId="nav-active-pill"
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 380, damping: 32 }
                  }
                  className={`absolute inset-0 -z-10 rounded-full ${
                    isLightSurface ? "bg-primary/10" : "bg-white/15"
                  }`}
                />
              ) : null;
              return item.isRoute ? (
                <Link key={item.label} to={item.href} className={linkClass}>
                  <span className="relative z-10">{item.label}</span>
                  {highlight}
                </Link>
              ) : (
                <a key={item.label} href={item.href} className={linkClass}>
                  <span className="relative z-10">{item.label}</span>
                  {highlight}
                </a>
              );
            })}
          </div>



          <div className="hidden md:flex items-center">
            <Button
              variant="outline"
              size="default"
              className={`rounded-full smooth-hover animate-blink motion-reduce:transition-none motion-reduce:transform-none motion-reduce:hover:scale-100 motion-reduce:animate-none text-[13px] tracking-wider font-normal whitespace-nowrap backdrop-blur-md border border-white/30 shadow-[0_4px_30px_rgba(0,0,0,0.1)] px-6 ${
                isLightSurface
                  ? "bg-white/20 text-foreground hover:bg-primary/80 hover:text-white hover:border-primary/80"
                  : "bg-white/10 text-white hover:bg-primary/80 hover:text-white hover:border-primary/80"
              }`}
              onClick={handleBookNow}
            >
              立即預約
            </Button>
          </div>

          <button
            className={`md:hidden ${textColor}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="開啟選單"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, clipPath: "inset(0 0 100% 0)" }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, clipPath: "inset(0 0 0% 0)" }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, clipPath: "inset(0 0 100% 0)" }}
              transition={reduceMotion ? { duration: 0.15 } : { duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              className="md:hidden mt-4 pb-2"
            >
              {navItems.map((item) =>
                item.isRoute ? (
                  <Link
                    key={item.label}
                    to={item.href}
                    className="block py-3 text-[12px] tracking-wider font-normal smooth-hover hover:opacity-60 text-white"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    className="block py-3 text-[12px] tracking-wider font-normal smooth-hover hover:opacity-60 text-white"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                )
              )}
              <Button
                variant="outline"
                className="w-full mt-4 rounded-full text-[11px] tracking-wider font-normal backdrop-blur-md border border-white/30 bg-white/10 text-white hover:bg-primary/80 hover:text-white hover:border-primary/80 px-5"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleBookNow();
                }}
              >
                立即預約
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </motion.nav>

  );
};

export default Navigation;
