import { useEffect, useState } from "react";

const QUERY = "(prefers-color-scheme: dark)";

/**
 * Returns true when the user's OS/browser is set to dark mode.
 */
export function usePrefersDarkMode() {
  const [prefersDarkMode, setPrefersDarkMode] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(QUERY);
    const onChange = (e: MediaQueryListEvent) => setPrefersDarkMode(e.matches);
    mql.addEventListener("change", onChange);
    setPrefersDarkMode(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return prefersDarkMode;
}

export default usePrefersDarkMode;
