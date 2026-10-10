"use client";

import { useState } from "react";

export default function Waitlist() {
  const [done, setDone] = useState(false);
  const [role, setRole] = useState("driver");

  return (
    <form
      className="card waitlist"
      onSubmit={(e) => {
        e.preventDefault();
        // Demo only: wire this to your backend / form service before launch.
        setDone(true);
      }}
    >
      {done ? (
        <p className="ok">You&apos;re on the list. Drive safe. 🚛</p>
      ) : (
        <>
          <div className="seg" role="radiogroup" aria-label="I am a">
            {["driver", "fleet owner"].map((r) => (
              <button
                type="button"
                key={r}
                role="radio"
                aria-checked={role === r}
                className={role === r ? "on" : ""}
                onClick={() => setRole(r)}
              >
                {r}
              </button>
            ))}
          </div>
          <input name="contact" required placeholder="Phone or email" aria-label="Phone or email" />
          <button className="btn primary" type="submit">Join the waitlist</button>
        </>
      )}
    </form>
  );
}
