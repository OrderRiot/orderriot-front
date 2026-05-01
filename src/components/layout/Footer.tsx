import { Link } from "react-router-dom";

const cols: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: "Discover",
    links: [
      { label: "All campaigns", to: "/discover" },
      { label: "Design", to: "/discover?category=design" },
      { label: "Technology", to: "/discover?category=technology" },
      { label: "Film", to: "/discover?category=film" },
      { label: "Games", to: "/discover?category=games" },
    ],
  },
  {
    title: "Creators",
    links: [
      { label: "Start a campaign", to: "/create" },
      { label: "Creator handbook", to: "/about" },
      { label: "Pricing", to: "/about" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Press", to: "/about" },
      { label: "Careers", to: "/about" },
      { label: "Contact", to: "/about" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-muted/30">
      <div className="container-edge py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <Link to="/" className="inline-flex items-center">
              <span className="font-display font-bold text-2xl tracking-tight text-ink">Order</span>
              <span className="font-display font-bold text-2xl tracking-tight text-accent">Riot</span>
            </Link>
            <p className="mt-4 max-w-xs text-muted-foreground text-sm leading-relaxed">
              Fund the things worth making. Independent creators, ambitious
              projects, real consequences.
            </p>
          </div>

          {cols.map((c) => (
            <div key={c.title} className="md:col-span-2">
              <div className="text-xs font-bold uppercase tracking-widest text-ink mb-4">
                {c.title}
              </div>
              <ul className="space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="text-sm text-muted-foreground link-quiet hover:text-ink transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="md:col-span-1" />
        </div>

        <div className="rule mt-12 pt-6 flex flex-col md:flex-row justify-between gap-4 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} OrderRiot. All rights reserved.</span>
          <div className="flex gap-5">
            <Link to="/about" className="link-quiet hover:text-ink transition-colors">Terms</Link>
            <Link to="/about" className="link-quiet hover:text-ink transition-colors">Privacy</Link>
            <Link to="/about" className="link-quiet hover:text-ink transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
