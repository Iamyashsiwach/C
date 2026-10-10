import Nav from "@/components/Nav";
import RoadScene from "@/components/RoadScene";
import Reveal from "@/components/Reveal";
import DrowsinessDemo from "@/components/DrowsinessDemo";
import StopAdvisor from "@/components/StopAdvisor";
import VoiceDemo from "@/components/VoiceDemo";
import Waitlist from "@/components/Waitlist";
import PushDemo from "@/components/PushDemo";
import Ollie from "@/components/Ollie";

const steps = [
  { n: "01", t: "Mount your phone", d: "Any phone on the dash. The front camera watches your eyes, and nothing leaves the device." },
  { n: "02", t: "Drive like normal", d: "Saarthi tracks blink length, head nod and yawns, and learns what tired looks like on you." },
  { n: "03", t: "Get nudged early", d: "A voice check-in first, then a louder alert, then an emergency alarm if you don't respond." },
];

export default function Page() {
  return (
    <>
      <RoadScene />
      <Nav />
      <Ollie />
      <main>
        <section className="hero" id="top">
          <p className="eyebrow">Launching soon · built for the long haul</p>
          <h1>
            The co-driver
            <br />
            that never blinks.
          </h1>
          <p className="lede">
            Meet Ollie, your owl co-driver. He watches your face for the first signs of sleep, finds the next
            dhaba for a tea break, and talks with you when the road gets boring.
          </p>
          <div className="cta-row">
            <a className="btn primary" href="#waitlist">Join the waitlist</a>
            <a className="btn ghost" href="#drowsy">Try the live demo</a>
          </div>
          <p className="hint">Scroll to drive ↓</p>
        </section>

        <section className="section" id="drowsy">
          <Reveal>
            <p className="eyebrow">01 · Wake-up guard</p>
            <h2>It sees tired before you feel it.</h2>
            <p className="sub">
              Drag the eyelid, or press and hold the button to close the eye. Saarthi measures how long it stays
              shut and escalates. The road behind you turns red when it reaches an emergency.
            </p>
          </Reveal>
          <DrowsinessDemo />
        </section>

        <section className="section" id="stops">
          <Reveal>
            <p className="eyebrow">02 · Next-stop advice</p>
            <h2>The right break, at the right dhaba.</h2>
            <p className="sub">
              Saarthi combines hours since your last break, the time of night and the stops ahead. Drag the truck
              along the route.
            </p>
          </Reveal>
          <StopAdvisor />
        </section>

        <section className="section" id="talk">
          <Reveal>
            <p className="eyebrow">03 · Talk to stay sharp</p>
            <h2>Bored? Just say so.</h2>
            <p className="sub">
              Hands-free conversation, stories, quizzes and music. Use Saarthi&apos;s own voice agent, or connect the
              assistant you already trust.
            </p>
          </Reveal>
          <VoiceDemo />
        </section>

        <section className="section" id="push">
          <Reveal>
            <p className="eyebrow">04 · Ollie in your pocket</p>
            <h2>Nudges that arrive before the yawn.</h2>
            <p className="sub">
              Ollie is Saarthi&apos;s owl co-driver. In the app he talks to you, and on your lock screen he sends
              break reminders, night-stretch warnings and a little praise when you rest on time.
            </p>
          </Reveal>
          <PushDemo />
        </section>

        <section className="section" id="how">
          <Reveal>
            <p className="eyebrow">How it works</p>
            <h2>Three steps. Zero fiddling.</h2>
          </Reveal>
          <div className="steps">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 90}>
                <div className="card step">
                  <span className="num">{s.n}</span>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="section" id="waitlist">
          <Reveal>
            <p className="eyebrow">Early access</p>
            <h2>Be first on the road with Saarthi.</h2>
            <p className="sub">Drivers and fleet owners welcome. We&apos;ll write when the beta opens.</p>
          </Reveal>
          <Waitlist />
        </section>
      </main>

      <footer className="footer">
        <p>
          <strong>Saarthi</strong> is a driver-assistance aid, not a replacement for rest. If you feel sleepy,
          pull over safely. No app can make it safe to keep driving while exhausted.
        </p>
        <p className="fine">© 2026 Saarthi. Demos on this page are simulations.</p>
      </footer>
    </>
  );
}
