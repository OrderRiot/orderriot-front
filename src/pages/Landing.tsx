import { Link } from "react-router-dom";
import { ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampaignCard } from "@/components/campaign/CampaignCard";
import { useCampaigns } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";

const categories = [
  "Design",
  "Technology",
  "Film & Video",
  "Music",
  "Games",
  "Publishing",
  "Food",
  "Fashion",
  "Photography",
  "Theatre",
  "Crafts",
  "Comics",
];

const steps = [
  {
    n: "1",
    title: "Build your campaign",
    desc: "Write your story, set a funding goal, add tiered rewards, and set a deadline.",
  },
  {
    n: "2",
    title: "Launch publicly",
    desc: "Go live. Share with your audience. Backers pledge — but nothing is charged yet.",
  },
  {
    n: "3",
    title: "Hit your goal",
    desc: "If you reach your goal by the deadline, pledges are collected. If not, no one pays.",
  },
  {
    n: "4",
    title: "Ship the project",
    desc: "Build the thing. Update your backers. Deliver the rewards. Make it real.",
  },
];

export default function Landing() {
  const trending = useCampaigns({ limit: 6 });

  return (
    <div className="bg-paper">
      {/* HERO */}
      <section className="container-edge pt-16 md:pt-24 pb-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 text-accent rounded-full text-sm font-semibold mb-8">
            <Zap className="h-3.5 w-3.5" />
            All-or-nothing preorders
          </div>
          <h1 className="font-display text-display-xl text-balance">
            Fund the things<br />worth making.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl text-pretty">
            OrderRiot is where independent creators raise the capital and
            courage to bring real projects into the world.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/discover">
                Browse campaigns <ArrowRight className="ml-0.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/ideas/new">Propose an idea</Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        {/* <div className="mt-16 md:mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-line rounded-2xl overflow-hidden border border-line">
          {[
            { label: "Total pledged", value: "$284M" },
            { label: "Total backers", value: "1.4M" },
            { label: "Projects funded", value: "29,118" },
            { label: "Live right now", value: "2,041" },
          ].map((s) => (
            <div key={s.label} className="bg-paper px-6 py-5">
              <div className="text-2xl md:text-3xl font-display font-semibold tnum">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </div> */}
      </section>

      {/* CATEGORY MARQUEE */}
      <section className="border-y border-line py-4 overflow-hidden bg-muted/30">
        <div className="marquee-row animate-marquee">
          {[...categories, ...categories, ...categories].map((c, i) => (
            <Link
              key={i}
              to={`/discover?category=${encodeURIComponent(c)}`}
              className="mx-2 shrink-0 px-4 py-1.5 bg-paper border border-line rounded-full text-sm font-medium text-ink hover:border-accent hover:text-accent transition-colors whitespace-nowrap"
            >
              {c}
            </Link>
          ))}
        </div>
      </section>

      {/* TRENDING */}
      <section className="container-edge mt-20 md:mt-28">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-display-sm font-semibold">Trending now</h2>
          <Link
            to="/discover"
            className="text-sm font-medium text-muted-foreground hover:text-ink link-quiet flex items-center gap-1 transition-colors"
          >
            See all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {trending.isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-[4/3] rounded-xl" />
                <Skeleton className="h-3 w-1/3 mt-4 rounded-full" />
                <Skeleton className="h-6 w-4/5 mt-2" />
                <Skeleton className="h-3 w-full mt-2" />
              </div>
            ))}
          </div>
        )}

        {trending.data && trending.data.length === 0 && (
          <div className="border border-line rounded-2xl p-16 text-center">
            <div className="text-3xl font-display font-semibold">Nothing live yet.</div>
            <p className="text-muted-foreground mt-2 text-sm">
              Be the first to launch something on OrderRiot.
            </p>
            <Button asChild className="mt-6">
              <Link to="/create">Start a campaign</Link>
            </Button>
          </div>
        )}

        {trending.data && trending.data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trending.data.slice(0, 3).map((c) => (
              <CampaignCard key={c.camp_id} campaign={c} />
            ))}
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section className="container-edge mt-24 md:mt-32">
        <div className="flex flex-col md:flex-row gap-12 md:gap-20">
          <div className="shrink-0 md:w-72">
            <div className="text-xs font-bold uppercase tracking-widest text-accent mb-3">
              How it works
            </div>
            <h2 className="font-display text-display-md font-semibold">
              Simple.<br />
              Transparent.<br />
              All-or-nothing.
            </h2>
            <p className="mt-5 text-muted-foreground text-sm leading-relaxed max-w-xs">
              Set a goal, set a deadline, and either hit it or don't. No mystery,
              no lock-in, no pitch decks.
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link to="/about">Read the handbook</Link>
            </Button>
          </div>

          <div className="flex-1">
            <ol className="divide-y divide-line border-y border-line">
              {steps.map((s) => (
                <li key={s.n} className="flex gap-5 py-7">
                  <div className="w-8 h-8 rounded-full bg-accent/10 text-accent text-sm font-bold font-display flex items-center justify-center shrink-0 mt-0.5">
                    {s.n}
                  </div>
                  <div>
                    <div className="font-display font-semibold text-lg">{s.title}</div>
                    <p className="mt-1.5 text-muted-foreground text-sm leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* QUOTE BAND */}
      <section className="inverse mt-24 md:mt-32">
        <div className="container-edge py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="text-3xl md:text-5xl font-display font-semibold leading-[1.1] text-balance">
              "OrderRiot is the platform for the kind of projects that wouldn't
              survive a pitch deck — and shouldn't have to."
            </div>
            <div className="mt-10 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-paper/10 grid place-items-center font-display font-bold text-lg shrink-0">
                R
              </div>
              <div>
                <div className="font-semibold text-sm">Rae Okafor</div>
                <div className="text-paper/50 text-xs mt-0.5">
                  Filmmaker · funded 'Lighter Than Salt'
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-edge mt-20 mb-16">
        <div className="rounded-3xl bg-accent/10 border border-accent/20 px-8 md:px-16 py-16 md:py-20 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="font-display text-display-md font-semibold text-balance">
              You have an idea.<br />
              We have the runway.
            </h2>
            <p className="mt-3 text-muted-foreground text-sm">
              No pitch decks. No gatekeepers. Just backers who believe.
            </p>
          </div>
          <div className="shrink-0">
            <Button asChild size="lg">
              <Link to="/create">
                Start a campaign <ArrowRight className="ml-0.5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
