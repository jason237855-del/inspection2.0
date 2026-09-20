import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // 從別頁用 /#pricing 這類連結進來時，等頁面畫出來再捲到對應區塊
      const id = decodeURIComponent(hash.slice(1));
      const timer = window.setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView();
        else window.scrollTo(0, 0);
      }, 100);
      return () => window.clearTimeout(timer);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
