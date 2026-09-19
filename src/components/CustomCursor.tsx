import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * 自訂滑鼠游標：一顆慢半拍跟著滑鼠的圓點（反色，深淺背景都看得到）。
 * - 滑到連結／按鈕：放大成透鏡
 * - 元素帶 data-cursor="文字"：放大成品牌色圓球並顯示文字
 * - 滑到輸入框：圓點隱藏、恢復系統的文字游標
 * - 只在「有滑鼠的桌機」啟用；觸控裝置、偏好減少動態效果的使用者、後台與登入頁不啟用
 */

const DISABLED_PREFIXES = ["/admin", "/auth", "/reset-password"];
const INTERACTIVE = 'a[href], button, [role="button"], summary, label[for], [data-cursor]';
const TEXT_INPUT =
  'input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, select, [contenteditable="true"]';
const FOLLOW_SPEED = 0.2; // 每個畫面追上剩餘距離的比例，越小越「慢半拍」

const CustomCursor = () => {
  const { pathname } = useLocation();
  const enabled = !DISABLED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const ref = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    const label = labelRef.current;
    if (!el || !label) return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer.matches || reducedMotion.matches) return;

    document.documentElement.classList.add("custom-cursor-on");

    let targetX = -100;
    let targetY = -100;
    let x = targetX;
    let y = targetY;
    let raf = 0;
    let seen = false;

    const tick = () => {
      x += (targetX - x) * FOLLOW_SPEED;
      y += (targetY - y) * FOLLOW_SPEED;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf = Math.abs(targetX - x) > 0.1 || Math.abs(targetY - y) > 0.1 ? requestAnimationFrame(tick) : 0;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      targetX = e.clientX;
      targetY = e.clientY;
      if (!seen) {
        seen = true;
        x = targetX;
        y = targetY;
        el.dataset.visible = "true";
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onOver = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t || typeof t.closest !== "function") return;
      if (t.closest(TEXT_INPUT)) {
        el.dataset.state = "text";
        return;
      }
      const labelled = t.closest("[data-cursor]");
      const text = labelled?.getAttribute("data-cursor");
      if (text) {
        label.textContent = text;
        el.dataset.state = "label";
      } else if (t.closest(INTERACTIVE)) {
        el.dataset.state = "link";
      } else {
        el.dataset.state = "default";
      }
    };

    const onDown = () => {
      el.dataset.pressed = "true";
    };
    const onUp = () => {
      delete el.dataset.pressed;
    };
    const onLeave = () => {
      el.dataset.visible = "false";
    };
    const onEnter = () => {
      if (seen) el.dataset.visible = "true";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
      if (raf) cancelAnimationFrame(raf);
      document.documentElement.classList.remove("custom-cursor-on");
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div ref={ref} className="cursor-dot" data-state="default" data-visible="false" aria-hidden="true">
      <div className="cursor-dot__ball">
        <span ref={labelRef} className="cursor-dot__label" />
      </div>
    </div>
  );
};

export default CustomCursor;
