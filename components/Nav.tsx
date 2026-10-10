export default function Nav() {
  return (
    <header className="nav">
      <a href="#top" className="brand">
        <span className="dot" /> Saarthi
      </a>
      <nav>
        <a href="#drowsy">Wake guard</a>
        <a href="#stops">Stops</a>
        <a href="#talk">Talk</a>
        <a href="#waitlist" className="btn small primary">Get access</a>
      </nav>
    </header>
  );
}
