import { useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Share2, ShieldCheck, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgressBar } from "@/components/campaign/ProgressBar";
import { MediaGallery } from "@/components/campaign/MediaGallery";
import { RewardTier } from "@/components/campaign/RewardTier";
import { Comments } from "@/components/campaign/Comments";
import { BackDialog } from "@/components/campaign/BackDialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCampaign,
  useMe,
  useRewards,
  useSubmitCampaign,
} from "@/lib/queries";
import { daysLeft, formatMoney, pad2, pct } from "@/lib/utils";
import type { Reward } from "@/lib/types";
import { toast } from "sonner";
import { apiError } from "@/lib/api";

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const campId = Number(id);
  const camp = useCampaign(campId);
  const rewards = useRewards(campId);
  const me = useMe();
  const submit = useSubmitCampaign(campId);
  const [pledgeOpen, setPledgeOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  if (camp.isLoading) {
    return (
      <div className="container-edge py-12">
        <Skeleton className="h-6 w-1/4 mb-6" />
        <Skeleton className="h-16 w-2/3 mb-8" />
        <div className="grid grid-cols-12 gap-8">
          <Skeleton className="col-span-8 aspect-[16/10]" />
          <Skeleton className="col-span-4 h-96" />
        </div>
      </div>
    );
  }

  if (camp.isError || !camp.data) {
    return (
      <div className="container-edge py-32 text-center">
        <h2 className="font-display text-4xl">Campaign not found.</h2>
        <Button asChild variant="ghost" className="mt-6">
          <Link to="/discover">Back to discover</Link>
        </Button>
      </div>
    );
  }

  const c = camp.data;
  const percent = pct(c.current_amount, c.goal_amount);
  const left = daysLeft(c.completion_date);
  const isOwner = me.data?.user_id === c.owner_id;

  function openPledge(r?: Reward) {
    if (!me.data) {
      toast("Sign in to back this campaign.");
      navigate("/login");
      return;
    }
    setSelectedReward(r ?? null);
    setPledgeOpen(true);
  }

  async function handleSubmit() {
    try {
      await submit.mutateAsync();
      toast.success("Submitted for review.");
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  return (
    <article>
      {/* Top bar */}
      <div className="container-edge py-6 flex items-center justify-between text-sm">
        <Link to="/discover" className="link-quiet inline-flex items-center gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> All campaigns
        </Link>
        <button
          className="link-quiet inline-flex items-center gap-2 text-muted-foreground"
          onClick={() => {
            navigator.clipboard?.writeText(window.location.href);
            toast("Link copied to clipboard.");
          }}
        >
          <Share2 className="h-4 w-4" /> Share
        </button>
      </div>

      {/* Title block */}
      <header className="container-edge pt-8 pb-12">
        <div className="grid grid-cols-12 gap-x-6 gap-y-6 items-end">
          <div className="col-span-12 md:col-span-1 editorial-index">
            № {pad2(c.camp_id)}
          </div>
          <div className="col-span-12 md:col-span-9">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant={c.status === "active" ? "solid" : "outline"}>
                {c.status}
              </Badge>
              {c.category && (
                <Badge variant="outline">
                  <Tag className="h-3 w-3 mr-1.5" />
                  {c.category}
                </Badge>
              )}
              {c.location && (
                <Badge variant="outline">
                  <MapPin className="h-3 w-3 mr-1.5" />
                  {c.location}
                </Badge>
              )}
            </div>
            <h1 className="font-display text-display-lg leading-[0.96] tracking-editorial-tight text-balance">
              {c.title}
            </h1>
            {c.subtitle && (
              <p className="mt-5 max-w-3xl text-lg md:text-xl leading-relaxed text-pretty text-ink/85">
                {c.subtitle}
              </p>
            )}
            {c.company && (
              <p className="mt-5 text-sm text-muted-foreground">
                <span className="uppercase tracking-[0.18em] text-[10px]">
                  by
                </span>{" "}
                <Link to={`/users/${c.owner_id}`} className="link-quiet font-medium">
                  {c.company}
                </Link>
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Hero + sticky pledge column */}
      <section className="container-edge grid grid-cols-12 gap-x-8 gap-y-10">
        <div className="col-span-12 lg:col-span-8">
          <MediaGallery media={c.media} title={c.title} />
        </div>

        <aside className="col-span-12 lg:col-span-4 lg:sticky lg:top-24 self-start">
          <div className="border border-ink p-6 md:p-8">
            <div className="flex items-end justify-between gap-4 tnum">
              <div>
                <div className="font-display text-5xl leading-none">
                  {formatMoney(c.current_amount, { compact: true })}
                </div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-2">
                  Pledged of {formatMoney(c.goal_amount, { compact: true })}
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-5xl leading-none">{percent}%</div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-2">
                  Funded
                </div>
              </div>
            </div>

            <ProgressBar value={percent} className="mt-5" />

            <dl className="mt-7 grid grid-cols-2 gap-4">
              <div>
                <dt className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Backers
                </dt>
                <dd className="font-display text-2xl mt-1 tnum">
                  {(c.key_backers?.length ?? 0).toString()}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {left !== null ? "Days left" : "Status"}
                </dt>
                <dd className="font-display text-2xl mt-1 tnum">
                  {left !== null ? left : c.status}
                </dd>
              </div>
            </dl>

            <div className="mt-7 space-y-3">
              {isOwner && c.status === "draft" ? (
                <>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={submit.isPending}
                  >
                    {submit.isPending ? "Submitting…" : "Send for review"}
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link to={`/create/${c.camp_id}`}>Edit draft</Link>
                  </Button>
                </>
              ) : isOwner && c.status === "pending_review" ? (
                <>
                  <Button className="w-full" size="lg" disabled>
                    Awaiting review
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Your campaign is under review. We'll notify you once it's approved.
                  </p>
                </>
              ) : isOwner && (c.status === "active" || c.status === "funded") ? (
                <Button asChild variant="outline" className="w-full">
                  <Link to={`/create/${c.camp_id}`}>Edit campaign</Link>
                </Button>
              ) : c.status === "active" ? (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => openPledge()}
                >
                  Back this project
                </Button>
              ) : (
                <Button className="w-full" size="lg" disabled>
                  {c.status === "funded" ? "Funded" : "Not accepting pledges"}
                </Button>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-line flex items-start gap-3 text-xs text-muted-foreground leading-relaxed">
              <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                All-or-nothing. You won't be charged unless the campaign hits its
                goal by the deadline.
              </span>
            </div>
          </div>
        </aside>
      </section>

      {/* Body content */}
      <section className="container-edge mt-20">
        <Tabs defaultValue="story">
          <TabsList>
            <TabsTrigger value="story">Story</TabsTrigger>
            <TabsTrigger value="rewards">
              Rewards{" "}
              {rewards.data?.length ? (
                <span className="ml-1 tnum">· {rewards.data.length}</span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="updates">Updates</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>

          <TabsContent value="story">
            <div className="grid grid-cols-12 gap-x-6">
              <div className="col-span-12 md:col-span-8">
                <div>
                  {c.description ? (
                    c.description
                      .split(/\n+/)
                      .filter(Boolean)
                      .map((p, i) => (
                        <p
                          key={i}
                          className={`text-lg leading-[1.7] text-pretty mb-5 ${
                            i === 0
                              ? "first-letter:font-display first-letter:text-6xl first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-[0.85]"
                              : ""
                          }`}
                        >
                          {p}
                        </p>
                      ))
                  ) : (
                    <p className="text-muted-foreground italic">
                      No story yet — the creator hasn't written a description.
                    </p>
                  )}
                </div>
              </div>
              <aside className="col-span-12 md:col-span-4 md:pl-8 mt-10 md:mt-0">
                <div className="border-t border-line pt-6">
                  <div className="editorial-index mb-4">— Facts</div>
                  <dl className="space-y-5 text-sm">
                    <Fact label="Created">
                      {new Date(c.creation_date).toLocaleDateString()}
                    </Fact>
                    {c.launch_date && (
                      <Fact label="Launched">
                        {new Date(c.launch_date).toLocaleDateString()}
                      </Fact>
                    )}
                    {c.completion_date && (
                      <Fact label="Deadline">
                        {new Date(c.completion_date).toLocaleDateString()}
                      </Fact>
                    )}
                    <Fact label="Goal">{formatMoney(c.goal_amount)}</Fact>
                    {c.team_members && c.team_members.length > 0 && (
                      <Fact label="Team size">
                        {c.team_members.length} people
                      </Fact>
                    )}
                  </dl>
                </div>
              </aside>
            </div>
          </TabsContent>

          <TabsContent value="rewards">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rewards.isLoading && (
                <>
                  <Skeleton className="h-72" />
                  <Skeleton className="h-72" />
                </>
              )}
              {rewards.data && rewards.data.length === 0 && (
                <div className="col-span-2 border border-dashed border-line p-12 text-center">
                  <div className="italic-display text-2xl">No reward tiers.</div>
                  <p className="text-muted-foreground text-sm mt-2">
                    The creator hasn't added rewards yet.
                  </p>
                </div>
              )}
              {rewards.data?.map((r, i) => (
                <RewardTier
                  key={r.reward_id}
                  reward={r}
                  index={i}
                  onSelect={(reward) => openPledge(reward)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="updates">
            <div className="border border-dashed border-line p-12 text-center">
              <div className="italic-display text-2xl">No updates yet.</div>
              <p className="text-muted-foreground text-sm mt-2">
                Once the creator posts updates, they'll show up here.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="comments">
            <Comments campId={campId} />
          </TabsContent>
        </Tabs>
      </section>

      <BackDialog
        open={pledgeOpen}
        onOpenChange={setPledgeOpen}
        campId={campId}
        reward={selectedReward}
      />
    </article>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </dt>
      <dd className="tnum text-right">{children}</dd>
    </div>
  );
}
