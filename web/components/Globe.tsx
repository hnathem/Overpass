"use client";

import { geoDistance, geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import { useEffect, useRef } from "react";
import { feature } from "topojson-client";
import land110m from "world-atlas/land-110m.json";

import { orbitParams, subpoint } from "@/lib/orbits";
import type { Station } from "@/lib/types";

// Real coastlines (low-detail), decoded once.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LAND = feature(land110m as any, (land110m as any).objects.land) as any;
const GRATICULE = geoGraticule10();

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * An interactive globe of the real Earth, drawn on a canvas with d3-geo's
 * orthographic projection. Continents and a graticule rotate under the pointer;
 * ground stations glow at their true coordinates; satellites track live across
 * the sky and beam down to whichever station they're currently over.
 *
 * Drag to spin (with momentum on release); it drifts gently otherwise. Setting
 * `focusStation` smoothly turns the globe to bring that station to the front.
 */
export function Globe({
  stations,
  satelliteIds,
  activeIds,
  hovered,
  focusStation,
}: {
  stations: Station[];
  satelliteIds: string[];
  activeIds: Set<string>;
  hovered: string | null;
  focusStation: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotation = useRef<[number, number]>([-70, -18]);
  const velocity = useRef<[number, number]>([0, 0]);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const focusTarget = useRef<[number, number] | null>(null);
  const hoveredRef = useRef<string | null>(null);

  useEffect(() => {
    hoveredRef.current = hovered;
  }, [hovered]);

  // Turn to a station when it's clicked in the list.
  useEffect(() => {
    if (!focusStation) return;
    const station = stations.find((s) => s.id === focusStation);
    if (station) focusTarget.current = [-station.longitude, -station.latitude];
  }, [focusStation, stations]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const projection = geoOrthographic();
    const path = geoPath(projection, ctx);
    const sats = satelliteIds.map((id) => ({ id, params: orbitParams(id) }));

    let cx = 0;
    let cy = 0;

    function resize() {
      const width = parent!.clientWidth;
      const height = parent!.clientHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = width / 2;
      cy = height / 2;
      projection.translate([cx, cy]).scale(Math.min(width, height) / 2 - 14);
    }

    function visible(lon: number, lat: number): boolean {
      const center: [number, number] = [-rotation.current[0], -rotation.current[1]];
      return geoDistance([lon, lat], center) < Math.PI / 2;
    }

    function draw() {
      const light = document.documentElement.dataset.theme === "light";
      const ocean1 = light ? "#cfe6f5" : "#102a3f";
      const ocean2 = light ? "#a9cce5" : "#06121c";
      const landFill = light ? "#eef3f7" : "#22425a";
      const coast = light ? "rgba(30,80,120,0.35)" : "rgba(130,180,220,0.35)";
      const grat = light ? "rgba(30,80,120,0.12)" : "rgba(130,180,220,0.13)";
      const accent = cssVar("--accent") || "#22d3ee";
      const sat = cssVar("--warn") || "#f59e0b";
      const bad = cssVar("--bad") || "#ef4444";
      const text = cssVar("--text-secondary") || "#9aa7b4";

      projection.rotate(rotation.current);
      const radius = projection.scale();

      ctx!.clearRect(0, 0, cx * 2, cy * 2);

      // ocean
      const gradient = ctx!.createRadialGradient(cx - radius * 0.35, cy - radius * 0.35, radius * 0.2, cx, cy, radius);
      gradient.addColorStop(0, ocean1);
      gradient.addColorStop(1, ocean2);
      ctx!.beginPath();
      path({ type: "Sphere" });
      ctx!.fillStyle = gradient;
      ctx!.fill();

      // graticule
      ctx!.beginPath();
      path(GRATICULE);
      ctx!.strokeStyle = grat;
      ctx!.lineWidth = 0.5;
      ctx!.stroke();

      // continents
      ctx!.beginPath();
      path(LAND);
      ctx!.fillStyle = landFill;
      ctx!.fill();
      ctx!.strokeStyle = coast;
      ctx!.lineWidth = 0.5;
      ctx!.stroke();

      const nowSec = Date.now() / 1000;

      // satellites (and a beam to any station they're currently over)
      for (const { params } of sats) {
        const [lon, lat] = subpoint(params, nowSec);
        if (!visible(lon, lat)) continue;
        const p = projection([lon, lat]);
        if (!p) continue;
        const satX = cx + (p[0] - cx) * 1.16;
        const satY = cy + (p[1] - cy) * 1.16;

        let overhead = false;
        for (const station of stations) {
          if (geoDistance([lon, lat], [station.longitude, station.latitude]) < 0.14) {
            overhead = true;
            break;
          }
        }

        ctx!.beginPath();
        ctx!.moveTo(p[0], p[1]);
        ctx!.lineTo(satX, satY);
        ctx!.strokeStyle = overhead ? accent : coast;
        ctx!.globalAlpha = overhead ? 0.9 : 0.4;
        ctx!.lineWidth = overhead ? 1.2 : 0.6;
        ctx!.stroke();
        ctx!.globalAlpha = 1;

        ctx!.beginPath();
        ctx!.arc(satX, satY, 2.2, 0, Math.PI * 2);
        ctx!.fillStyle = sat;
        ctx!.fill();
      }

      // ground stations
      for (const station of stations) {
        if (!visible(station.longitude, station.latitude)) continue;
        const p = projection([station.longitude, station.latitude]);
        if (!p) continue;
        const online = station.status === "online";
        const color = online ? accent : bad;
        const active = activeIds.has(station.id) && online;

        ctx!.globalAlpha = active ? 0.55 + 0.4 * Math.abs(Math.sin(nowSec * 2)) : 0.4;
        ctx!.beginPath();
        ctx!.arc(p[0], p[1], active ? 9 : 6, 0, Math.PI * 2);
        ctx!.fillStyle = color;
        ctx!.fill();
        ctx!.globalAlpha = 1;

        ctx!.beginPath();
        ctx!.arc(p[0], p[1], 2.6, 0, Math.PI * 2);
        ctx!.fillStyle = color;
        ctx!.fill();

        if (hoveredRef.current === station.id) {
          ctx!.beginPath();
          ctx!.arc(p[0], p[1], 11, 0, Math.PI * 2);
          ctx!.strokeStyle = color;
          ctx!.lineWidth = 1;
          ctx!.stroke();
        }

        ctx!.fillStyle = text;
        ctx!.font = "10px 'IBM Plex Mono', monospace";
        ctx!.fillText(station.id.replace("GS-", ""), p[0] + 8, p[1] - 6);
      }

      // advance rotation: follow the focus target, else drift + momentum
      if (!dragging.current) {
        const target = focusTarget.current;
        if (target) {
          let dLon = (((target[0] - rotation.current[0] + 540) % 360) - 180);
          rotation.current[0] += dLon * 0.12;
          rotation.current[1] += (target[1] - rotation.current[1]) * 0.12;
          if (Math.abs(dLon) < 0.4 && Math.abs(target[1] - rotation.current[1]) < 0.4) {
            rotation.current = [target[0], target[1]];
            focusTarget.current = null;
          }
        } else {
          rotation.current[0] += 0.08 + velocity.current[0];
          rotation.current[1] += velocity.current[1];
          velocity.current[0] *= 0.94;
          velocity.current[1] *= 0.94;
          rotation.current[1] = Math.max(-90, Math.min(90, rotation.current[1]));
        }
      }
      frame = requestAnimationFrame(draw);
    }

    function onDown(event: PointerEvent) {
      dragging.current = true;
      focusTarget.current = null;
      velocity.current = [0, 0];
      last.current = { x: event.clientX, y: event.clientY };
      canvas!.style.cursor = "grabbing";
    }
    function onMove(event: PointerEvent) {
      if (!dragging.current) return;
      const dx = event.clientX - last.current.x;
      const dy = event.clientY - last.current.y;
      rotation.current[0] += dx * 0.25;
      rotation.current[1] = Math.max(-90, Math.min(90, rotation.current[1] - dy * 0.25));
      velocity.current = [dx * 0.25, -dy * 0.25];
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
  }, [stations, satelliteIds, activeIds]);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[440px] touch-none select-none">
      <canvas ref={canvasRef} className="h-full w-full" aria-label="Interactive globe of ground stations and satellites" />
    </div>
  );
}
