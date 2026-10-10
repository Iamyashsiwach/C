"use client";

import { useRef, useState } from "react";

const ROUTE_KM = 420;
const AVG_KMH = 55;

// Fictional stops for the demo.
const STOPS = [
  { km: 38, name: "Baba Chai Point", perks: ["Tea", "Parking"] },
  { km: 96, name: "Highway Tadka", perks: ["Meals", "Showers"] },
  { km: 151, name: "Rajdhani Rest Stop", perks: ["Tea", "Fuel", "Cots"] },
  { km: 224, name: "Lucky Truckers' Dhaba", perks: ["Meals", "Cots"] },
  { km: 297, name: "Mile 297 Chai", perks: ["Tea", "Parking"] },
  { km: 361, name: "Sunrise Highway Hotel", perks: ["Meals", "Fuel", "Cots"] },
];

export default function StopAdvisor() {
  const [km, setKm] = useState(70);
  const [night, setNight] = useState(true);
  const [sinceBreak, setSinceBreak] = useState(2.5); // hours since last proper break
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; grab: number } | null>(null);

  const fatigue = Math.min(
    100,
    Math.round((sinceBreak / 5) * 70 + (night ? 25 : 0) + (sinceBreak > 4 ? 8 : 0)),
  );
  const tier = fatigue >= 75 ? "high" : fatigue >= 45 ? "mid" : "low";
  const reach = tier === "high" ? 30 : tier === "mid" ? 70 : 140; // how far ahead we're willing to go
  const ahead = STOPS.filter((s) => s.km > km);
  const reachable = ahead.filter((s) => s.km - km <= reach);
  const pick =
    tier === "high"
      ? ahead.find((s) => s.perks.includes("Cots")) ?? ahead[0]
      : reachable[reachable.length - 1] ?? ahead[0];
  const dist = pick ? pick.km - km : 0;
  const eta = pick ? Math.round((dist / AVG_KMH) * 60) : 0;

  const advice =
    tier === "high"
      ? "Take a 20-minute nap, then tea. Skipping this stop is the risky choice."
      : tier === "mid"
        ? "Stop for a 15-minute tea break. Walk around and splash water on your face."
        : "You're fresh. Keep going and I'll check again in 30 minutes.";

  const fromPointer = (clientX: number, grab = 0) => {
    const r = track.current!.getBoundingClientRect();
    const f = (clientX - grab - r.left) / r.width;
    setKm(Math.round(Math.min(1, Math.max(0, f)) * ROUTE_KM));
  };

  return (
    <div className="card advisor">
      <div
        className="route"
        ref={track}
        onPointerMove={(e) => drag.current && fromPointer(e.clientX, drag.current.grab)}
        onPointerUp={() => (drag.current = null)}
      >
        <div className="road-line" />
        <div className="done" style={{ width: `${(km / ROUTE_KM) * 100}%` }} />
        {STOPS.map((s) => (
          <div
            key={s.km}
            className={`stop${pick?.km === s.km ? " pick" : ""}${s.km < km ? " passed" : ""}`}
            style={{ left: `${(s.km / ROUTE_KM) * 100}%` }}
            title={s.name}
          >
            <i />
            <span>{s.km}</span>
          </div>
        ))}
        <button
          className="truck"
          style={{ left: `${(km / ROUTE_KM) * 100}%` }}
          aria-label={`Truck position ${km} km. Use arrow keys to move.`}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            const r = e.currentTarget.getBoundingClientRect();
            drag.current = { id: e.pointerId, grab: e.clientX - (r.left + r.width / 2) };
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") setKm((k) => Math.min(ROUTE_KM, k + 5));
            if (e.key === "ArrowLeft") setKm((k) => Math.max(0, k - 5));
          }}
        >
          🚛
        </button>
      </div>

      <div className="controls">
        <label className="slider">
          <span>Hours since last break · {sinceBreak.toFixed(1)}h</span>
          <input type="range" min={0} max={6} step={0.5} value={sinceBreak} onChange={(e) => setSinceBreak(Number(e.target.value))} />
        </label>
        <div className="seg" role="radiogroup" aria-label="Time of day">
          {[true, false].map((n) => (
            <button key={String(n)} role="radio" aria-checked={night === n} className={night === n ? "on" : ""} onClick={() => setNight(n)}>
              {n ? "Night (1–5 am)" : "Daytime"}
            </button>
          ))}
        </div>
      </div>

      <div className={`advice tier-${tier}`}>
        <div className="gauge">
          <span>Fatigue risk</span>
          <strong>{fatigue}</strong>
          <div className="bar"><i style={{ transform: `scaleX(${fatigue / 100})` }} /></div>
        </div>
        {pick ? (
          <div className="rec">
            <p className="where">
              Next stop: <strong>{pick.name}</strong>
            </p>
            <p className="meta">
              {dist} km · about {eta} min · {pick.perks.join(" · ")}
            </p>
            <p className="say">“{advice}”</p>
          </div>
        ) : (
          <div className="rec"><p className="say">No more stops on this route. You&apos;re nearly there.</p></div>
        )}
      </div>
    </div>
  );
}
