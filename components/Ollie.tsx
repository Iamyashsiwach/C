"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SECTION_LINES: Record<string, string> = {
  top: "Hoo-hoo! I'm Ollie, your night-shift co-driver. Poke me!",
  drowsy: "This is how I watch your eyes. Try closing that one!",
  stops: "I know every good chai stop. Drag the truck around.",
  talk: "Bored? I never run out of stories. Tap a chip!",
  push: "I'll ping you before you get tired, not after.",
  waitlist: "Join the list. I'll save you a seat up front.",
};

const TIPS = [
  "Tip: a 15-minute tea break beats another hour of fighting sleep.",
  "Tip: cold air and loud music wake you for minutes. A real break lasts hours.",
  "Tip: if you yawn three times in ten minutes, it's time to stop.",
  "Hoo! You've got this. I'm watching the road with you.",
  "Fun fact: owls can turn their heads 270°. I'll check your mirrors too.",
];

const ALERT_LINES = [
  "",
  "Hey! Eyes up. Talk to me. Next dhaba is close.",
  "WAKE UP! Please pull over safely right now!",
];

export default function Ollie() {
  const body = useRef<HTMLDivElement>(null);
  const [bubble, setBubble] = useState<{ text: string; id: number } | null>(null);
  const [compact, setCompact] = useState(false);
  const [alert, setAlert] = useState(0);
  const [hop, setHop] = useState(0);
  const tip = useRef(0);
  const seen = useRef(new Set<string>());
  const hideTimer = useRef<number>(0);

  const say = useCallback((text: string, ms = 5500) => {
    window.clearTimeout(hideTimer.current);
    setBubble({ text, id: Date.now() });
    if (ms > 0) hideTimer.current = window.setTimeout(() => setBubble(null), ms);
  }, []);

  // Greet once per section as you scroll into it.
  useEffect(() => {
    const els = Object.keys(SECTION_LINES)
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !seen.current.has(e.target.id)) {
            seen.current.add(e.target.id);
            say(SECTION_LINES[e.target.id]);
          }
        }
      },
      { threshold: 0.45 },
    );
    els.forEach((el) => io.observe(el));
    const first = window.setTimeout(() => {
      if (!seen.current.has("top")) {
        seen.current.add("top");
        say(SECTION_LINES.top);
      }
    }, 1400);
    return () => {
      io.disconnect();
      window.clearTimeout(first);
      window.clearTimeout(hideTimer.current);
    };
  }, [say]);

  // React to the drowsiness demo.
  useEffect(() => {
    const onAlert = (e: Event) => {
      const l = (e as CustomEvent<number>).detail ?? 0;
      setAlert((prev) => {
        if (l > prev) say(ALERT_LINES[l], l === 2 ? 0 : 5000);
        else if (l === 0 && prev > 0) say("Phew, you're back! Nice and awake. 🧡", 3500);
        return l;
      });
    };
    window.addEventListener("saarthi:alert", onAlert);
    return () => window.removeEventListener("saarthi:alert", onAlert);
  }, [say]);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 360);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Pointer tilt + draggable with spring-back that inherits release velocity.
  useEffect(() => {
    const el = body.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const p = { x: 0, y: 0, vx: 0, vy: 0 };
    const tilt = { rx: 0, ry: 0 };
    const pointer = { x: 0, y: 0, has: false };
    let dragging = false;
    let grab = { x: 0, y: 0 };
    let hist: { x: number; y: number; t: number }[] = [];
    let moved = 0;

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.has = true;
      if (!dragging) return;
      p.x = e.clientX - grab.x;
      p.y = e.clientY - grab.y;
      moved = Math.max(moved, Math.hypot(p.x, p.y));
      hist.push({ x: p.x, y: p.y, t: performance.now() });
      hist = hist.filter((h) => performance.now() - h.t < 90);
    };
    const onDown = (e: PointerEvent) => {
      dragging = true;
      moved = 0;
      el.setPointerCapture(e.pointerId);
      grab = { x: e.clientX - p.x, y: e.clientY - p.y };
      hist = [];
      el.classList.add("grabbed");
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove("grabbed");
      const a = hist[0];
      const b = hist[hist.length - 1];
      if (a && b && b.t > a.t) {
        p.vx = ((b.x - a.x) / (b.t - a.t)) * 1000;
        p.vy = ((b.y - a.y) / (b.t - a.t)) * 1000;
      }
      if (moved < 6) {
        tip.current = (tip.current + 1) % TIPS.length;
        say(TIPS[tip.current], 6500);
        setHop((h) => h + 1);
      } else {
        say("Whee! Put me back, I'm on duty. 🦉", 2800);
      }
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!dragging) {
        // Under-damped spring (momentum came from a flick): damping ratio ~0.8, response ~0.45s.
        // Sub-stepped so it stays stable when frames are slow.
        const w = (2 * Math.PI) / 0.45;
        const z = 0.8;
        const n = Math.ceil(dt / (1 / 120));
        const h = dt / n;
        for (let i = 0; i < n; i++) {
          p.vx += (-w * w * p.x - 2 * z * w * p.vx) * h;
          p.vy += (-w * w * p.y - 2 * z * w * p.vy) * h;
          p.x += p.vx * h;
          p.y += p.vy * h;
        }
      }
      if (!reduced && pointer.has) {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2 - p.x;
        const cy = r.top + r.height / 2 - p.y;
        const nx = Math.max(-1, Math.min(1, (pointer.x - cx) / 500));
        const ny = Math.max(-1, Math.min(1, (pointer.y - cy) / 500));
        tilt.ry += (nx * 16 - tilt.ry) * Math.min(1, dt * 7);
        tilt.rx += (-ny * 9 - tilt.rx) * Math.min(1, dt * 7);
      }
      el.style.transform = `translate3d(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px,0) rotateY(${tilt.ry.toFixed(1)}deg) rotateX(${tilt.rx.toFixed(1)}deg)`;
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      window.removeEventListener("pointermove", onMove);
    };
  }, [say]);

  return (
    <div className={`ollie${compact ? " compact" : ""}${alert === 2 ? " panic" : ""}${alert === 1 ? " worried" : ""}`}>
      {bubble && (
        <div className="ollie-bubble" key={bubble.id} role="status" aria-live="polite">
          <small>Ollie</small>
          {bubble.text}
        </div>
      )}
      <div className="ollie-persp">
        <div className="ollie-body" ref={body}>
          <div className="ollie-bob" key={hop}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ollie.png" alt="Ollie, the Saarthi mascot: a friendly teal owl in a golden scarf" width={720} height={839} draggable={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
