"use client";

import { useEffect, useRef, useState } from "react";

type Note = { id: number; title: string; body: string; kind: "break" | "alert" | "fun" | "ok" };

const SCENARIOS: { label: string; note: Omit<Note, "id"> }[] = [
  { label: "2 hours driven", note: { kind: "break", title: "Ollie · Chai time? ☕", body: "You've been driving 2 hours. Baba Chai Point is 12 km ahead. Take 15?" } },
  { label: "Drowsy check-in", note: { kind: "alert", title: "Ollie · Hey, still with me?", body: "Your blinks are getting long. Tap to talk, or I'll find a safe stop." } },
  { label: "Night stretch", note: { kind: "alert", title: "Ollie · 2 am danger zone", body: "This is when most drowsy crashes happen. Rajdhani Rest Stop has cots, 41 km." } },
  { label: "Good habit", note: { kind: "ok", title: "Ollie · 5 breaks in a row! 🏅", body: "You've rested on time all week. I'm proud of you. Keep it up!" } },
  { label: "Story time", note: { kind: "fun", title: "Ollie · New story unlocked", body: "Bholu the trucker and the midnight mango. Want to hear it?" } },
];

export default function PushDemo() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [now, setNow] = useState<string>("");
  const [perm, setPerm] = useState<string>("default");
  const next = useRef(0);
  const idc = useRef(1);

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setNow(fmt());
    const t = setInterval(() => setNow(fmt()), 20000);
    if ("Notification" in window) setPerm(Notification.permission);
    else setPerm("unsupported");
    return () => clearInterval(t);
  }, []);

  const push = (n: Omit<Note, "id">) =>
    setNotes((cur) => [{ ...n, id: idc.current++ }, ...cur].slice(0, 4));
  const dismiss = (id: number) => setNotes((cur) => cur.filter((n) => n.id !== id));

  const sendNext = () => {
    push(SCENARIOS[next.current % SCENARIOS.length].note);
    next.current++;
  };

  const realTest = async () => {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPerm(result);
    if (result === "granted") {
      new Notification("Ollie · Chai time? ☕", {
        body: "This is a test from the Saarthi website. In the app, I'll nudge you before you get tired.",
        icon: "/ollie.png",
      });
    }
  };

  return (
    <div className="push-wrap">
      <div className="phone" aria-label="Phone lock screen preview">
        <div className="notch" />
        <div className="lock-time">{now || "9:41"}</div>
        <div className="lock-date">On the road</div>
        <div className="notes" aria-live="polite">
          {notes.length === 0 && <p className="empty">No notifications yet. Tap a nudge →</p>}
          {notes.map((n) => (
            <Card key={n.id} n={n} onDismiss={() => dismiss(n.id)} />
          ))}
        </div>
      </div>

      <div className="push-side">
        <p className="fine" style={{ marginTop: 0 }}>Pick a moment and see how Ollie reaches you:</p>
        <div className="chips">
          {SCENARIOS.map((s) => (
            <button key={s.label} className="chip" onClick={() => push(s.note)}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="cta-row" style={{ marginTop: 20 }}>
          <button className="btn primary" onClick={sendNext}>Send a nudge</button>
          {perm !== "unsupported" && (
            <button className="btn ghost" onClick={realTest} disabled={perm === "denied"}>
              {perm === "denied" ? "Notifications blocked" : "Try a real notification"}
            </button>
          )}
        </div>
        <p className="fine">Swipe a card sideways or tap × to dismiss. The real notification is a browser test only; the app uses native push.</p>
      </div>
    </div>
  );
}

function Card({ n, onDismiss }: { n: Note; onDismiss: () => void }) {
  const [dx, setDx] = useState(0);
  const [drag, setDrag] = useState(false);
  const start = useRef(0);
  const hist = useRef<{ x: number; t: number }[]>([]);

  return (
    <div
      className={`note ${n.kind}`}
      style={{
        transform: `translateX(${dx}px)`,
        opacity: 1 - Math.min(1, Math.abs(dx) / 260),
        transition: drag ? "none" : "transform 0.35s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.35s",
      }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        start.current = e.clientX - dx;
        hist.current = [];
        setDrag(true);
      }}
      onPointerMove={(e) => {
        if (!drag) return;
        const x = e.clientX - start.current;
        setDx(x);
        hist.current.push({ x, t: performance.now() });
        hist.current = hist.current.filter((h) => performance.now() - h.t < 90);
      }}
      onPointerUp={() => {
        setDrag(false);
        const a = hist.current[0];
        const b = hist.current[hist.current.length - 1];
        const v = a && b && b.t > a.t ? ((b.x - a.x) / (b.t - a.t)) * 1000 : 0;
        const projected = dx + v * 0.25; // project where the flick is heading
        if (Math.abs(projected) > 120) {
          setDx(Math.sign(projected) * 420);
          setTimeout(onDismiss, 220);
        } else setDx(0);
      }}
    >
      <div className="avatar" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/ollie.png" alt="" />
      </div>
      <div className="txt">
        <strong>{n.title}</strong>
        <span>{n.body}</span>
      </div>
      <button className="x" aria-label="Dismiss notification" onPointerDown={(e) => e.stopPropagation()} onClick={onDismiss}>×</button>
    </div>
  );
}
