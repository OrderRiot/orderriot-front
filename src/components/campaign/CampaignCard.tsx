import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { ProgressBar } from "./ProgressBar";
import type { CampaignListItem } from "@/lib/types";
import { daysLeft, formatMoney, pct, getYouTubeId, isVideoUrl } from "@/lib/utils";

function CoverImage({ url, title, className }: { url: string; title: string; className: string }) {
  const [failed, setFailed] = useState(false);

  const fallback = (
    <div className="h-full w-full flex items-center justify-center font-display font-semibold text-5xl text-muted-foreground/30">
      {title.slice(0, 2)}
    </div>
  );

  if (failed) return fallback;

  const ytId = getYouTubeId(url);
  if (ytId) {
    return (
      <img
        src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
        alt={title}
        className={className}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  if (isVideoUrl(url)) {
    return (
      <video
        src={url}
        preload="metadata"
        muted
        playsInline
        className={className}
      />
    );
  }

  return (
    <img
      src={url}
      alt={title}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export function CampaignCard({
  campaign,
  index,
  variant = "default",
}: {
  campaign: CampaignListItem;
  index?: number;
  variant?: "default" | "wide" | "compact";
}) {
  const cover = campaign.media?.[0];
  const percent = pct(campaign.current_amount, campaign.goal_amount);
  const left = daysLeft(campaign.completion_date);

  if (variant === "wide") {
    return (
      <Link
        to={`/campaigns/${campaign.camp_id}`}
        className="group grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 py-10 border-t border-line"
      >
        {typeof index === "number" && (
          <div className="md:col-span-1 text-xs text-muted-foreground font-medium pt-2">
            {index.toString().padStart(2, "0")}
          </div>
        )}
        <div className="md:col-span-5 aspect-[4/3] overflow-hidden bg-muted rounded-xl">
          {cover ? (
            <CoverImage
              url={cover}
              title={campaign.title}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground font-display font-semibold text-3xl">
              {campaign.title.slice(0, 2)}
            </div>
          )}
        </div>
        <div className="md:col-span-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {campaign.category && (
                <span className="text-xs font-semibold text-accent bg-accent/10 px-2.5 py-0.5 rounded-full">
                  {campaign.category}
                </span>
              )}
              {campaign.location && (
                <span className="text-xs text-muted-foreground">{campaign.location}</span>
              )}
            </div>
            <h3 className="mt-4 font-display font-semibold text-display-sm md:text-4xl leading-[1.1] text-pretty">
              {campaign.title}
            </h3>
            {campaign.subtitle && (
              <p className="mt-3 text-base text-muted-foreground max-w-xl text-pretty leading-relaxed">
                {campaign.subtitle}
              </p>
            )}
          </div>

          <div className="mt-8">
            <ProgressBar value={percent} />
            <div className="mt-3 flex items-end justify-between tnum">
              <div>
                <div className="font-display font-semibold text-2xl text-accent leading-none">
                  {formatMoney(campaign.current_amount, { compact: true })}
                </div>
                <div className="text-xs text-muted-foreground mt-1.5">
                  of {formatMoney(campaign.goal_amount, { compact: true })} goal · {percent}%
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground">
                  {left !== null ? `${left} days left` : campaign.status}
                </div>
                <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link
        to={`/campaigns/${campaign.camp_id}`}
        className="group flex items-start gap-3 py-3 border-t border-line"
      >
        <div className="h-14 w-14 shrink-0 bg-muted overflow-hidden rounded-lg">
          {cover && (
            <CoverImage url={cover} title={campaign.title} className="h-full w-full object-cover" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          {campaign.category && (
            <div className="text-xs font-semibold text-accent truncate">{campaign.category}</div>
          )}
          <div className="text-sm font-semibold text-ink truncate mt-0.5">{campaign.title}</div>
          <div className="text-xs text-muted-foreground tnum mt-0.5">
            {percent}% · {formatMoney(campaign.current_amount, { compact: true })}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/campaigns/${campaign.camp_id}`}
      className="group flex flex-col"
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted rounded-xl">
        {cover ? (
          <CoverImage
            url={cover}
            title={campaign.title}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center font-display font-semibold text-5xl text-muted-foreground/30">
            {campaign.title.slice(0, 2)}
          </div>
        )}
      </div>
      <div className="pt-4 flex items-center gap-2 flex-wrap">
        {campaign.category && (
          <span className="text-xs font-semibold text-accent bg-accent/10 px-2.5 py-0.5 rounded-full">
            {campaign.category}
          </span>
        )}
        {campaign.location && (
          <span className="text-xs text-muted-foreground">{campaign.location}</span>
        )}
      </div>
      <h3 className="mt-2 font-display font-semibold text-xl leading-[1.2] text-pretty">
        {campaign.title}
      </h3>
      {campaign.subtitle && (
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2 text-pretty leading-relaxed">
          {campaign.subtitle}
        </p>
      )}

      <div className="mt-4">
        <ProgressBar value={percent} />
        <div className="mt-2.5 flex justify-between text-xs tnum">
          <span className="font-semibold text-accent">
            {formatMoney(campaign.current_amount, { compact: true })}{" "}
            <span className="text-muted-foreground font-normal">· {percent}%</span>
          </span>
          <span className="text-muted-foreground">
            {left !== null ? `${left} days` : campaign.status}
          </span>
        </div>
      </div>
    </Link>
  );
}
