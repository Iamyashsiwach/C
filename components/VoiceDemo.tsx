"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { from: "you" | "ai"; text: string };

const AGENTS = ["Saarthi Voice", "ChatGPT", "Alexa", "Your own agent"];

const SCRIPT: Record<string, string> = {
  "I'm getting bored": "Let's fix that. Quick game: I'll name a highway song from the 90s, you finish the line. Ready? “Tum hi ho…”",
  "Tell me a story": "Once, a trucker named Bholu found a dhaba that served tea so strong, it kept the whole highway awake for three days. Want the rest, or a new one?",
  "How far is the next dhaba?": "Rajdhani Rest Stop is 41 km ahead, about 45 minutes. It has tea, fuel and cots. Should I add a break to your plan?",
  "I feel sleepy": "Thanks for telling me. Please slow down and take the next safe exit. Rajdhani is 41 km ahead. I'll keep talking until we get there.",
};

export default function VoiceDemo() {
  const [agent, setAgent] = useState(AGENTS[0]);
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "ai", text: "Hi, I'm here. Ask me anything, or just say you're bored." },
  ]);
  const [typing, setTyping] = useState(false);
  const timer = useRef<number>(0);
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const ask = (q: string) => {
    window.clearTimeout(timer.current);
    setMsgs((m) => [...m, { from: "you", text: q }]);
    setTyping(true);
    timer.current = window.setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { from: "ai", text: SCRIPT[q] }]);
    }, 900);
  };

  return (
    <div className="card voice">
      <div className="agents" role="radiogroup" aria-label="Voice agent">
        {AGENTS.map((a) => (
          <button key={a} role="radio" aria-checked={agent === a} className={agent === a ? "on" : ""} onClick={() => setAgent(a)}>
            {a}
          </button>
        ))}
      </div>

      <div className="log" ref={log} aria-live="polite">
        {msgs.map((m, i) => (
          <p key={i} className={`bubble ${m.from}`}>
            {m.from === "ai" && <small>{agent}</small>}
            {m.text}
          </p>
        ))}
        {typing && (
          <p className="bubble ai typing" aria-label="Typing">
            <i /><i /><i />
          </p>
        )}
      </div>

      <div className="chips">
        {Object.keys(SCRIPT).map((q) => (
          <button key={q} className="chip" onClick={() => ask(q)}>
            {q}
          </button>
        ))}
      </div>
      <p className="fine">Scripted preview. Live voice agents are connected in the app.</p>
    </div>
  );
}
