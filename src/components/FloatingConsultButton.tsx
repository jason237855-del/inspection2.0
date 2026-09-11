import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import logoWhite from "@/assets/logo-mark-white.png";
import { LINE_OA_URL } from "@/config/line";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/**
 * Sitewide floating consult/coupon button, pinned to the right edge.
 * Layout reference: nday.com.tw's right-side floating consultant button.
 * Links out to the LINE OA — the site's existing "加 LINE 好友" discount
 * is the coupon this button promises.
 */
const FloatingConsultButton = () => {
  const location = useLocation();
  const reduced = usePrefersReducedMotion();

  if (location.pathname.startsWith("/admin")) return null;

  return (
    <motion.a
      href={LINE_OA_URL}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 1 }}
      className="group fixed right-4 bottom-24 z-50 flex flex-col items-center gap-1.5 sm:right-6 sm:bottom-28"
      aria-label="加入 LINE 好友領取優惠券"
    >
      <motion.span
        animate={
          reduced
            ? undefined
            : {
                boxShadow: [
                  "0 0 0 0 hsl(var(--primary) / 0.45)",
                  "0 0 0 12px hsl(var(--primary) / 0)",
                ],
              }
        }
        transition={reduced ? undefined : { duration: 2.2, repeat: Infinity, ease: "easeOut" }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-hover transition-transform duration-300 group-hover:scale-105 sm:h-16 sm:w-16"
      >
        <img
          src={logoWhite}
          alt="診斷室驗屋"
          className="h-8 w-8 object-contain sm:h-9 sm:w-9"
        />
      </motion.span>
      <span className="whitespace-nowrap rounded-full bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground shadow-soft">
        優惠券領取
      </span>
    </motion.a>
  );
};

export default FloatingConsultButton;
