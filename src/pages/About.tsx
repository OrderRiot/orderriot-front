export default function About() {
  return (
    <div className="container-edge py-20 md:py-32 max-w-3xl">
      <div className="editorial-index">— Manifesto</div>
      <h1 className="font-display text-display-lg mt-4 leading-[0.98]">
        We believe<br />
        <span className="italic-display">the right</span> things<br />
        should get made.
      </h1>
      <div className="mt-16 space-y-8 text-lg leading-relaxed text-pretty text-ink/85">
        <p>
          OrderRiot exists for the projects that don't fit anywhere else.
          The first novel. The second album. The strange hardware nobody
          will fund. The ambitious documentary. The board game your friend
          group wants to ship for real this time.
        </p>
        <p>
          We're a platform for all-or-nothing campaigns: creators set a
          goal, set a deadline, and either hit it or don't. If they don't,
          backers pay nothing. If they do, the project gets the money — and
          the responsibility that comes with it.
        </p>
        <p>
          Our job is to keep the platform credible. The creators' job is to
          make what they said they'd make. Backers come along for the ride
          because the alternative — a world without these projects — is
          worse.
        </p>
      </div>
    </div>
  );
}
