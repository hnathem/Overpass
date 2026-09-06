"use client";

import { useEffect, useRef } from "react";

import type { Station } from "@/lib/types";

const DEG = Math.PI / 180;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const DOTS = 820; // points that make up the dotted sphere

type Vec = { x: number; y: number; z: number };

// A fixed cloud of points spread evenly over a unit sphere (Fibonacci sphere).
// Rotated each frame to give the globe its surface.
function makeSpherePoints(count: number): Vec[] {
  const points: Vec[] = [];
  for (let i = 0; i < count; i += 1) {
    const y = 1 - (i / (count - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = i * GOLDEN;
    points.push({ x: Math.cos(theta) * radius, y, z: Math.sin(theta) * radius });
  }
  return points;
}

// A latitude/longitude on the unit sphere (z toward the viewer at lon 0).
function latLonToVec(lat: number, lon: number): Vec {
  const b = lat * DEG;
  const a = lon * DEG;
  return { x: Math.cos(b) * Math.sin(a), y: Math.sin(b), z: Math.cos(b) * Math.cos(a) };
}

// Rotate a base vector by yaw (around Y) then pitch (around X).
function rotate(v: Vec, yaw: number, pitch: number): Vec {
  const x1 = v.x * Math.cos(yaw) + v.z * Math.sin(yaw);
  const z1 = -v.x * Math.sin(yaw) + v.z * Math.cos(yaw);
  const y2 = v.y * Math.cos(pitch) - z1 * Math.sin(pitch);
  const z2 = v.y * Math.sin(pitch) + z1 * Math.cos(pitch);
  return { x: x1, y: y2, z: z2 };
}

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * An interactive globe rendered on a canvas — no 3D library. Drag to spin it
 * (with momentum on release); otherwise it drifts slowly. Ground stations glow
 * at their real coordinates and rotate around the limb as the globe turns.
 */
export function Globe({
  stations,
  activeIds,
  hovered,
}: {
  stations: Station[];
  activeIds: Set<string>;
  hovered: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotation = useRef({ lon: -70, lat: 18 }); // opens on the Atlantic
  const velocity = useRef({ lon: 0, lat: 0 });
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const hoveredRef = useRef<string | null>(null);

  useEffect(() => {
    hoveredRef.current = hovered;
  }, [hovered]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const points = makeSpherePoints(DOTS);
    const stationVecs = stations.map((s) => ({ station: s, base: latLonToVec(s.latitude, s.longitude) }));

    let width = 0;
    let height = 0;
    let cx = 0;
    let cy = 0;
    let radius = 0;

    function resize() {
      width = parent!.clientWidth;
      height = parent!.clientHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = width / 2;
      cy = height / 2;
      radius = Math.min(width, height) / 2 - 14;
    }

    let time = 0;
    function draw() {
      time += 0.016;
      const light = document.documentElement.dataset.theme === "light";
      const ocean1 = light ? "#bcd6ea" : "#12324a";
      const ocean2 = light ? "#7fa8c9" : "#081019";
      const grat = light ? "rgba(30,70,110,0.5)" : "rgba(130,180,220,0.4)";
      const accent = cssVar("--accent") || "#22d3ee";
      const bad = cssVar("--bad") || "#ef4444";
      const textColor = cssVar("--text-secondary") || "#9aa7b4";

      const yaw = rotation.current.lon * DEG;
      const pitch = rotation.current.lat * DEG;

      ctx!.clearRect(0, 0, width, height);

      // the sphere, lit from the upper-left
      const gradient = ctx!.createRadialGradient(
        cx - radius * 0.35,
        cy - radius * 0.35,
        radius * 0.2,
        cx,
        cy,
        radius,
      );
      gradient.addColorStop(0, ocean1);
      gradient.addColorStop(1, ocean2);
      ctx!.beginPath();
      ctx!.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx!.fillStyle = gradient;
      ctx!.fill();

      // dotted surface (front hemisphere only)
      for (const point of points) {
        const p = rotate(point, yaw, pitch);
        if (p.z <= 0) continue;
        ctx!.globalAlpha = 0.25 + p.z * 0.5;
        ctx!.beginPath();
        ctx!.arc(cx + radius * p.x, cy - radius * p.y, 0.9, 0, Math.PI * 2);
        ctx!.fillStyle = grat;
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;

      // stations
      for (const { station, base } of stationVecs) {
        const p = rotate(base, yaw, pitch);
        if (p.z <= 0) continue; // on the far side
        const sx = cx + radius * p.x;
        const sy = cy - radius * p.y;
        const online = station.status === "online";
        const color = online ? accent : bad;
        const active = activeIds.has(station.id) && online;
        const pulse = active ? 0.55 + 0.45 * Math.abs(Math.sin(time * 2)) : 0.4;

        ctx!.globalAlpha = pulse;
        ctx!.beginPath();
        ctx!.arc(sx, sy, active ? 9 : 6, 0, Math.PI * 2);
        ctx!.fillStyle = color;
        ctx!.fill();

        ctx!.globalAlpha = 1;
        ctx!.beginPath();
        ctx!.arc(sx, sy, 2.6, 0, Math.PI * 2);
        ctx!.fillStyle = color;
        ctx!.fill();

        if (hoveredRef.current === station.id) {
          ctx!.beginPath();
          ctx!.arc(sx, sy, 11, 0, Math.PI * 2);
          ctx!.strokeStyle = color;
          ctx!.lineWidth = 1;
          ctx!.stroke();
        }

        ctx!.fillStyle = textColor;
        ctx!.font = "10px 'IBM Plex Mono', monospace";
        ctx!.fillText(station.id.replace("GS-", ""), sx + 8, sy - 6);
      }

      if (!dragging.current) {
        rotation.current.lon += 0.06 + velocity.current.lon;
        rotation.current.lat += velocity.current.lat;
        velocity.current.lon *= 0.95;
        velocity.current.lat *= 0.95;
        rotation.current.lat = Math.max(-85, Math.min(85, rotation.current.lat));
      }
      frame = requestAnimationFrame(draw);
    }

    function onDown(event: PointerEvent) {
      dragging.current = true;
      velocity.current = { lon: 0, lat: 0 };
      last.current = { x: event.clientX, y: event.clientY };
      canvas!.style.cursor = "grabbing";
    }
    function onMove(event: PointerEvent) {
      if (!dragging.current) return;
      const dx = event.clientX - last.current.x;
      const dy = event.clientY - last.current.y;
      rotation.current.lon += dx * 0.35;
      rotation.current.lat = Math.max(-85, Math.min(85, rotation.current.lat - dy * 0.35));
      velocity.current = { lon: dx * 0.35, lat: -dy * 0.35 };
      last.current = { x: event.clientX, y: event.clientY };
    }
    function onUp() {
      dragging.current = false;
      canvas!.style.cursor = "grab";
    }

    let frame = 0;
    resize();
    canvas.style.cursor = "grab";
    draw();
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("resize", resize);
    };
  }, [stations, activeIds]);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[420px] touch-none select-none">
      <canvas ref={canvasRef} className="h-full w-full" aria-label="Interactive globe of ground stations" />
    </div>
  );
}
