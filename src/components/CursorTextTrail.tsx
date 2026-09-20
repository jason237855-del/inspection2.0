import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * 游標文字拖尾（照 typeserviceweb.com 的設定）：網址文字的每個字像蛇一樣一個接一個跟在游標後面。
 * 字體／大小／字距／顏色見 index.css 的 .cursor-trail；動畫參數如下（與參考網站相同）。
 * 不隱藏系統游標；螢幕寬度 ≤1024px、觸控裝置、偏好減少動態效果的使用者、後台與登入頁不顯示。
 */

const TEXT = "inspection20.vercel.app";
const DISABLED_PREFIXES = ["/admin", "/auth", "/reset-password"];
const ANGLE = (25 * Math.PI) / 180; // 往游標右下方 25 度延伸
const EASE = 0.3; // 跟隨速度（每個畫面追上剩餘距離的比例）
const FIRST_OFFSET = 15; // 第一個字離游標的距離（不擋住游標）
const WAVE = 1.5; // 擺動幅度（px）
const TIME_SPEED = 0.002; // 擺動速度
const CHAR_GAP = 4; // 字元寬度外加的間距（px）

const CursorTextTrail = () => {
  const { pathname } = useLocation();
  const enabled = !DISABLED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;

    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const chars = Array.from(container.querySelectorAll<HTMLSpanElement>("span")).map((el) => ({
      el,
      x: -200,
      y: -200,
      width: 0,
    }));
    const dx = Math.cos(ANGLE);
    const dy = Math.sin(ANGLE);

    let mouseX = -200;
    let mouseY = -200;
    let raf = 0;

    // 渲染後量測每個字的寬度並快取（字型載入後再量一次，避免用到備用字型的寬度）
    const measure = () => {
      chars.forEach((c) => {
        c.width = c.el.offsetWidth + CHAR_GAP;
      });
    };
    const measureTimer = window.setTimeout(measure, 50);
    document.fonts?.ready.then(measure);

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const animate = () => {
      const time = Date.now() * TIME_SPEED;
      chars.forEach((c, i) => {
        let targetX: number;
        let targetY: number;
        if (i === 0) {
          targetX = mouseX + FIRST_OFFSET + Math.cos(time) * WAVE;
          targetY = mouseY + FIRST_OFFSET + Math.sin(time * 1.2) * WAVE;
        } else {
          const prev = chars[i - 1];
          // 每個字的擺動有相位差（i * 0.3），看起來像在蠕動
          targetX = prev.x + dx * prev.width + Math.cos(time + i * 0.3) * WAVE;
          targetY = prev.y + dy * prev.width + Math.sin(time * 1.2 + i * 0.3) * WAVE;
        }
        c.x += (targetX - c.x) * EASE;
        c.y += (targetY - c.y) * EASE;
        c.el.style.transform = `translate(${c.x}px, ${c.y}px)`;
      });
      raf = requestAnimationFrame(animate);
    };

    document.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("mousemove", onMove);
      window.clearTimeout(measureTimer);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div ref={containerRef} className="cursor-trail" aria-hidden="true">
      {TEXT.split("").map((ch, i) => (
        <span key={i}>{ch === " " ? " " : ch}</span>
      ))}
    </div>
  );
};

export default CursorTextTrail;
