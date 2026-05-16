"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient particle field from Oxecute — Execution Intelligence2.html (canvas layer).
 */
export function AmbientParticles() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    type Particle = {
      x: number;
      y: number;
      r: number;
      vx: number;
      vy: number;
      a: number;
      col: string;
    };

    let W = 0;
    let H = 0;
    const particles: Particle[] = [];

    const resize = () => {
      const el = ref.current;
      if (!el) return;
      W = window.innerWidth;
      H = window.innerHeight;
      el.width = W;
      el.height = H;
    };

    function ParticleFactory(): Particle {
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.5 + 0.3,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        a: Math.random() * 0.4 + 0.1,
        col: Math.random() > 0.6 ? "99,102,241" : "139,92,246",
      };
    }

    resize();
    window.addEventListener("resize", resize);
    for (let i = 0; i < 80; i++) particles.push(ParticleFactory());

    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.col},${p.a})`;
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      });
      frame = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="ei-particles"
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.55,
      }}
    />
  );
}
