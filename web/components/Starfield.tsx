"use client";

import { useEffect, useRef } from "react";

/**
 * A lightweight animated star field on a canvas: a few dozen stars drifting
 * left and twinkling. Sized to its parent, capped in count, and it honors
 * reduced-motion by drawing a single static frame.
 */
export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let stars: { x: number; y: number; z: number; phase: number }[] = [];

    function resize() {
      width = parent!.clientWidth;
      height = parent!.clientHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(180, Math.floor((width * height) / 8000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random(),
        phase: Math.random() * Math.PI * 2,
      }));
    }

    let time = 0;
    function draw() {
      time += 0.012;
      ctx!.clearRect(0, 0, width, height);
      for (const star of stars) {
        star.x -= 0.04 + star.z * 0.14;
        if (star.x < 0) {
          star.x = width;
          star.y = Math.random() * height;
        }
        const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(star.phase + time));
        const radius = star.z * 1.4 + 0.2;
        ctx!.beginPath();
        ctx!.arc(star.x, star.y, radius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(180, 220, 255, ${twinkle * (0.25 + star.z * 0.5)})`;
        ctx!.fill();
      }
      frame = requestAnimationFrame(draw);
    }

    let frame = 0;
    resize();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      draw();
      cancelAnimationFrame(frame);
    } else {
      draw();
    }
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />;
}
