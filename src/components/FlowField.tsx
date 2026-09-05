import { useEffect, useRef } from "react";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

/**
 * Ambient fluid / flowing-current canvas background.
 * Absolute background layer — pointer-events none, no React re-renders.
 */
const FlowField = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);

    let w = 0;
    let h = 0;
    let raf = 0;
    let running = false;
    let intensity = 0;
    let targetIntensity = 0;
    let start = performance.now();
    const pointer = { x: -9999, y: -9999, active: false };

    const LINES = isMobile ? 14 : 26;
    const SEGMENTS = isMobile ? 36 : 64;

    // Slow-moving bubbles carried by the stream
    type Bubble = { x: number; y: number; r: number; vx: number; a: number };
    let bubbles: Bubble[] = [];

    const makeBubbles = () => {
      const n = isMobile ? 18 : 42;
      bubbles = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2.2 + 0.6,
        vx: 0.12 + Math.random() * 0.35,
        a: Math.random() * 0.35 + 0.12,
      }));
    };

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeBubbles();
    };

    const drawStreams = (time: number, energy: number) => {
      const t = time / 1000;
      for (let i = 0; i < LINES; i++) {
        const p = i / (LINES - 1);
        const baseY = h * (0.06 + p * 0.88);
        const speed = 0.14 + (i % 5) * 0.035;
        const amp = h * (0.045 + 0.05 * Math.sin(i * 1.7));
        const hue = i % 3 === 0 ? "148, 190, 200" : "168, 190, 216";

        ctx.beginPath();
        for (let s = 0; s <= SEGMENTS; s++) {
          const u = s / SEGMENTS;
          const x = u * (w + 40) - 20;
          let y =
            baseY +
            Math.sin(u * 4.2 + t * speed * Math.PI + i * 0.55) * amp +
            Math.sin(u * 9.5 - t * speed * 1.6 + i) * amp * 0.32;

          if (pointer.active) {
            const dx = x - pointer.x;
            const dy = y - pointer.y;
            const d2 = dx * dx + dy * dy;
            const rad = 170;
            if (d2 < rad * rad) {
              const d = Math.sqrt(d2) || 1;
              const f = (1 - d / rad) * 42;
              y += (dy / d) * f;
            }
          }

          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const wave = 0.5 + 0.5 * Math.sin(t * 0.35 + i * 0.4);
        ctx.strokeStyle = `rgba(${hue}, ${(0.06 + wave * 0.13) * energy})`;
        ctx.lineWidth = 0.7 + (i % 4 === 0 ? 0.6 : 0);
        ctx.stroke();
      }
    };

    const drawBubbles = (energy: number) => {
      for (const b of bubbles) {
        b.x += b.vx;
        b.y -= 0.06;
        if (b.x > w + 12) b.x = -12;
        if (b.y < -12) b.y = h + 12;
        ctx.beginPath();
        ctx.fillStyle = `rgba(190, 214, 226, ${b.a * energy})`;
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawGlow = (time: number, energy: number) => {
      const t = time / 1000;
      const cx = w * (0.5 + Math.sin(t * 0.09) * 0.28);
      const cy = h * (0.5 + Math.cos(t * 0.07) * 0.22);
      const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.5);
      gr.addColorStop(0, `rgba(96, 140, 156, ${0.16 * energy})`);
      gr.addColorStop(0.5, `rgba(70, 96, 124, ${0.05 * energy})`);
      gr.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, w, h);
    };

    const renderStatic = () => {
      ctx.clearRect(0, 0, w, h);
      drawGlow(2000, 0.7);
      drawStreams(2000, 0.7);
    };

    const frame = (now: number) => {
      if (!running) return;
      intensity += (targetIntensity - intensity) * 0.05;
      const time = now - start;
      ctx.clearRect(0, 0, w, h);
      if (intensity > 0.01) {
        drawGlow(time, intensity);
        drawStreams(time, intensity);
        drawBubbles(intensity);
      }
      raf = requestAnimationFrame(frame);
    };

    const startLoop = () => {
      if (running || reduced) return;
      running = true;
      start = performance.now() - 2000;
      raf = requestAnimationFrame(frame);
    };
    const stopLoop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) renderStatic();
    });
    ro.observe(wrap);
    if (reduced) renderStatic();

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e || reduced) return;
        targetIntensity = e.isIntersecting ? Math.min(1, e.intersectionRatio * 1.6) : 0;
        if (e.isIntersecting) startLoop();
        else stopLoop();
      },
      { threshold: [0, 0.15, 0.3, 0.5, 0.75, 1] }
    );
    io.observe(wrap);

    const onMove = (ev: PointerEvent) => {
      if (reduced || isMobile) return;
      const rect = wrap.getBoundingClientRect();
      pointer.x = ev.clientX - rect.left;
      pointer.y = ev.clientY - rect.top;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
      pointer.x = -9999;
      pointer.y = -9999;
    };

    const parent = wrap.parentElement;
    parent?.addEventListener("pointermove", onMove);
    parent?.addEventListener("pointerleave", onLeave);

    return () => {
      stopLoop();
      io.disconnect();
      ro.disconnect();
      parent?.removeEventListener("pointermove", onMove);
      parent?.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced]);

  return (
    <div ref={wrapRef} aria-hidden className="pointer-events-none absolute inset-0">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
};

export default FlowField;
