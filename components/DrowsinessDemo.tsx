"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Eye aspect ratio: ~0.30 wide open, <0.21 treated as closed.
const EAR_OPEN = 0.3;
const EAR_CLOSED = 0.05;
const EAR_THRESHOLD = 0.21;

type Level = 0 | 1 | 2;

const LEVELS: { title: string; body: string }[] = [
  { title: "Alert", body: "Eyes are tracking the road. Blinks look normal." },
  { title: "Drowsy", body: "“Hey, you seem tired. Let's talk. Next dhaba is 18 km away.” A chime plays." },
  { title: "Emergency", body: "Loud alarm, hazard prompt, and your fleet contact is notified. Pull over now." },
];

export default function DrowsinessDemo() {
  const [openness, setOpenness] = useState(1);
  const [closedMs, setClosedMs] = useState(0);
  const [sound, setSound] = useState(false);

  const target = useRef(1);
  const pos = useRef(1);
  const vel = useRef(0);
  const closed = useRef(0);
  const level = useRef<Level>(0);
  const audio = useRef<{ ctx: AudioContext; osc: OscillatorNode; gain: GainNode } | null>(null);
  const soundOn = useRef(false);

  const setLevel = useCallback((l: Level) => {
    if (level.current === l) return;
    level.current = l;
    window.dispatchEvent(new CustomEvent("sarathi:alert", { detail: l }));
  }, []);

  useEffect(() => {
    soundOn.current = sound;
    if (!sound && audio.current) {
      audio.current.gain.gain.value = 0;
    }
  }, [sound]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      // Critically damped spring toward target openness: starts from the live value, so it is always interruptible.
      const w = 2 * Math.PI / 0.28;
      const x = pos.current - target.current;
      const acc = -w * w * x - 2 * w * vel.current;
      vel.current += acc * dt;
      pos.current = Math.min(1, Math.max(0, pos.current + vel.current * dt));

      const ear = EAR_CLOSED + (EAR_OPEN - EAR_CLOSED) * pos.current;
      if (ear < EAR_THRESHOLD) closed.current += dt * 1000;
      else closed.current = Math.max(0, closed.current - dt * 2500);

      const l: Level = closed.current > 1600 ? 2 : closed.current > 600 ? 1 : 0;
      setLevel(l);

      const a = audio.current;
      if (a) {
        const beep = soundOn.current && l === 2 && Math.floor(now / 220) % 2 === 0;
        a.gain.gain.value = beep ? 0.08 : 0;
      }

      setOpenness(pos.current);
      setClosedMs(closed.current);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.dispatchEvent(new CustomEvent("sarathi:alert", { detail: 0 }));
      audio.current?.osc.stop();
      audio.current?.ctx.close();
      audio.current = null;
    };
  }, [setLevel]);

  const enableSound = () => {
    if (!audio.current) {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = 880;
      gain.gain.value = 0;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      audio.current = { ctx, osc, gain };
    }
    audio.current.ctx.resume();
    setSound((s) => !s);
  };

  const ear = EAR_CLOSED + (EAR_OPEN - EAR_CLOSED) * openness;
  const lvl: Level = closedMs > 1600 ? 2 : closedMs > 600 ? 1 : 0;
  const meter = Math.min(1, closedMs / 1600);

  return (
    <div className={`card drowsy lvl${lvl}`}>
      <div className="eye-wrap">
        <svg viewBox="0 0 240 120" role="img" aria-label="Simulated eye with eyelid position">
          <defs>
            <clipPath id="eyeclip">
              <path d="M10 60 Q120 -10 230 60 Q120 130 10 60Z" />
            </clipPath>
          </defs>
          <path d="M10 60 Q120 -10 230 60 Q120 130 10 60Z" className="eye-white" />
          <g clipPath="url(#eyeclip)">
            <circle cx="120" cy="60" r="30" className="iris" />
            <circle cx="120" cy="60" r="13" className="pupil" />
            <circle cx="111" cy="51" r="5" className="spark" />
            <rect x="0" y="-20" width="240" height={80 - 50 * openness} className="lid" />
            <rect x="0" y={60 + 50 * openness} width="240" height="80" className="lid" />
          </g>
          <path d="M10 60 Q120 -10 230 60 Q120 130 10 60Z" className="eye-line" />
          {/* landmark points the model tracks */}
          {[[60, 44], [90, 30], [150, 30], [180, 44]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y + (1 - openness) * (y < 60 ? 22 : 0)} r="2.4" className="lm" />
          ))}
        </svg>
        <button
          className="btn hold"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            target.current = 0;
          }}
          onPointerUp={() => (target.current = 1)}
          onPointerCancel={() => (target.current = 1)}
        >
          Hold to close eye
        </button>
      </div>

      <div className="readout">
        <label className="slider">
          <span>Eyelid</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(openness * 100)}
            onChange={(e) => {
              const v = Number(e.target.value) / 100;
              target.current = v;
              pos.current = v;
              vel.current = 0;
            }}
            onPointerUp={() => (target.current = 1)}
            aria-label="Eyelid openness"
          />
        </label>

        <dl className="stats">
          <div>
            <dt>Eye aspect ratio</dt>
            <dd>{ear.toFixed(2)}</dd>
          </div>
          <div>
            <dt>Eyes closed for</dt>
            <dd>{(closedMs / 1000).toFixed(1)}s</dd>
          </div>
        </dl>

        <div className="meter" aria-hidden="true">
          <i style={{ transform: `scaleX(${meter})` }} />
          <b style={{ left: `${(600 / 1600) * 100}%` }} />
        </div>

        <div className="status" aria-live="polite">
          <span className="pill">{LEVELS[lvl].title}</span>
          <p>{LEVELS[lvl].body}</p>
        </div>

        <button className="btn ghost small" onClick={enableSound} aria-pressed={sound}>
          {sound ? "Alarm sound: on" : "Alarm sound: off"}
        </button>
      </div>
    </div>
  );
}
