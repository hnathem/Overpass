// A simple, live orbital model for the fleet. It is NOT real orbital mechanics
// (no TLEs); it's a smooth, believable ground track per satellite, driven by the
// real clock so the satellites visibly move over the globe in real time. Each
// satellite's parameters are derived deterministically from its id.

export interface OrbitParams {
  inclination: number; // degrees; the ground track swings between ±inclination
  raan: number; // degrees; where the track sits east-west
  periodSec: number; // how long one orbit takes
  phase: number; // 0..1 offset so satellites don't bunch up
}

export function orbitParams(id: string): OrbitParams {
  const n = parseInt(id.replace(/\D/g, ""), 10) || 1;
  return {
    inclination: 45 + ((n * 7) % 41), // 45°..85°
    raan: ((n * 53) % 360) - 180,
    periodSec: 90 * 60 + (n % 5) * 4 * 60, // ~90–106 minutes
    phase: (n * 0.137) % 1,
  };
}

/** The point on Earth directly beneath the satellite at time `tSec`, as [lon, lat]. */
export function subpoint(params: OrbitParams, tSec: number): [number, number] {
  const frac = tSec / params.periodSec + params.phase;
  const theta = 2 * Math.PI * frac;
  const lat = params.inclination * Math.sin(theta);
  // Longitude advances with the orbit and regresses with Earth's rotation,
  // giving the familiar drifting ground track.
  let lon = params.raan + (theta * 180) / Math.PI - (tSec / 86400) * 360;
  lon = (((lon + 180) % 360) + 360) % 360 - 180;
  return [lon, lat];
}
