import { useEffect, useRef } from "react";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
  warm: boolean;
};

type Ripple = {
  x: number;
  y: number;
  t: number;
  life: number;
  max: number;
};

/**
 * Ambient "diagnostic field" canvas background.
 * Absolute background layer — pointer-events none, no React re-renders.
 */
const DiagnosticField = () => {
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
    let particles: Particle[] = [];
    const ripples: Ripple[] = [];
    let raf = 0;
    let running = false;
    let intensity = 0; // 0..1 driven by scroll visibility
    let targetIntensity = 0;
    const pointer = { x: -9999, y: -9999, active: false };
    let lastRippleAt = 0;
    let start = performance.now();

    const coreX = () => w * (isMobile ? 0.75 : 0.68);
    const coreY = () => h * (isMobile ? 0.6 : 0.5);

    const makeParticles = () => {
      const base = isMobile ? 70 : 180;
      particles = [];
      for (let i = 0; i < base; i++) {
        // Bias density to the right side (45%-100%) — keep left clean for text.
        const biased = Math.random() < 0.82;
        const x = biased
          ? w * (0.45 + Math.random() * 0.6)
          : w * Math.random() * 0.45;
        particles.push({
          x: Math.min(x, w * 1.05),
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.06,
          vy: (Math.random() - 0.5) * 0.06,
          r: Math.random() * 1.7 + 0.5,
          a: Math.random() * 0.5 + 0.16,
          warm: Math.random() < 0.12,
        });
      }
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
      makeParticles();
    };

    // Reduced left-side visibility multiplier
    const sideFade = (x: number) => {
      const t = x / w;
      if (t > 0.45) return 1;
      return 0.3 + (t / 0.45) * 0.55;
    };

    const drawRings = (time: number, energy: number) => {
      const cx = coreX();
      const cy = coreY();
      const cycle = 10000; // ~10s
      const rings = isMobile ? 4 : 7;
      const maxR = Math.hypot(w, h) * 0.85;
      for (let i = 0; i < rings; i++) {
        const p = ((time % cycle) / cycle + i / rings) % 1;
        const r = p * maxR;
        const fade = Math.sin(Math.PI * p);
        const alpha = 0.16 * fade * energy;
        if (alpha <= 0.002) continue;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(176, 192, 214, ${alpha})`;
        ctx.lineWidth = 0.6;
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // faint breathing core glow
      const breathe = 0.5 + 0.5 * Math.sin((time / 9000) * Math.PI * 2);
      const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.42);
      gr.addColorStop(0, `rgba(150, 172, 200, ${(0.16 + breathe * 0.08) * energy})`);
      gr.addColorStop(0.45, `rgba(120, 140, 168, ${0.05 * energy})`);
      gr.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, w, h);
    };

    const drawFlowLines = (time: number, energy: number) => {
      const cx = coreX();
      const cy = coreY();
      const lines = isMobile ? 2 : 4;
      ctx.lineWidth = 0.6;
      for (let i = 0; i < lines; i++) {
        const phase = time / 11000 + i * 0.37;
        ctx.beginPath();
        for (let s = 0; s <= 40; s++) {
          const t = s / 40;
          const x = w * (0.42 + t * 0.72);
          const y =
            cy +
            Math.sin(t * 3.1 + phase * Math.PI * 2 + i) * (h * 0.12) +
            (i - lines / 2) * h * 0.07;
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(198, 206, 218, ${0.1 * energy})`;
        ctx.stroke();
      }
      void cx;
    };

    const drawParticles = (energy: number) => {
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        let dx = 0;
        let dy = 0;
        if (pointer.active) {
          const ddx = p.x - pointer.x;
          const ddy = p.y - pointer.y;
          const d2 = ddx * ddx + ddy * ddy;
          const rad = 130;
          if (d2 < rad * rad && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const f = (1 - d / rad) * 10;
            dx = (ddx / d) * f;
            dy = (ddy / d) * f;
          }
        }

        const alpha = p.a * energy * sideFade(p.x);
        if (alpha <= 0.004) continue;
        ctx.beginPath();
        ctx.fillStyle = p.warm
          ? `rgba(214, 199, 174, ${alpha})`
          : `rgba(206, 216, 230, ${alpha})`;
        ctx.arc(p.x + dx, p.y + dy, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawRipples = (dt: number, energy: number) => {
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.t += dt;
        const p = r.t / r.life;
        if (p >= 1) {
          ripples.splice(i, 1);
          continue;
        }
        const radius = p * r.max;
        const alpha = (1 - p) * 0.26 * energy * sideFade(r.x);
        ctx.beginPath();
        ctx.strokeStyle = `rgba(196, 208, 224, ${alpha})`;
        ctx.lineWidth = 0.7;
        ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const renderStatic = () => {
      ctx.clearRect(0, 0, w, h);
      drawRings(3000, 0.7);
      drawParticles(0.7);
    };

    let last = performance.now();
    const frame = (now: number) => {
      if (!running) return;
      const dt = Math.min(now - last, 50);
      last = now;
      intensity += (targetIntensity - intensity) * 0.05;
      const time = now - start;
      ctx.clearRect(0, 0, w, h);
      if (intensity > 0.01) {
        drawRings(time, intensity);
        drawFlowLines(time, intensity);
        drawParticles(intensity);
        drawRipples(dt, intensity);
      }
      raf = requestAnimationFrame(frame);
    };

    const startLoop = () => {
      if (running || reduced) return;
      running = true;
      last = performance.now();
      start = performance.now();
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

    if (reduced) {
      renderStatic();
    }

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;
        if (reduced) return;
        const ratio = e.intersectionRatio;
        targetIntensity = e.isIntersecting ? Math.min(1, ratio * 1.6) : 0;
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
      const now = performance.now();
      if (now - lastRippleAt > 420 && ripples.length < 6) {
        lastRippleAt = now;
        ripples.push({ x: pointer.x, y: pointer.y, t: 0, life: 2600, max: 130 });
      }
    };
    const onLeave = () => {
      pointer.active = false;
      pointer.x = -9999;
      pointer.y = -9999;
    };
    const onTouch = (ev: TouchEvent) => {
      if (reduced) return;
      const t = ev.touches[0];
      if (!t) return;
      const rect = wrap.getBoundingClientRect();
      if (ripples.length < 2) {
        ripples.push({
          x: t.clientX - rect.left,
          y: t.clientY - rect.top,
          t: 0,
          life: 2200,
          max: 100,
        });
      }
    };

    const parent = wrap.parentElement;
    parent?.addEventListener("pointermove", onMove);
    parent?.addEventListener("pointerleave", onLeave);
    parent?.addEventListener("touchstart", onTouch, { passive: true });

    return () => {
      stopLoop();
      io.disconnect();
      ro.disconnect();
      parent?.removeEventListener("pointermove", onMove);
      parent?.removeEventListener("pointerleave", onLeave);
      parent?.removeEventListener("touchstart", onTouch);
    };
  }, [reduced]);

  return (
    <div ref={wrapRef} aria-hidden className="pointer-events-none absolute inset-0">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
};

export default DiagnosticField;
