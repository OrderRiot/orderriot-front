import { Button } from "@/components/ui/button";
import type { Reward } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

export function RewardTier({
  reward,
  index,
  onSelect,
}: {
  reward: Reward;
  index: number;
  onSelect?: (r: Reward) => void;
}) {
  const soldOut = reward.max_backers
    ? reward.current_backers >= reward.max_backers
    : false;

  return (
    <article className="border border-line p-6 md:p-8 group transition-colors hover:border-ink">
      <div className="flex items-start justify-between gap-4">
        <div className="editorial-index">
          Tier {String(index + 1).padStart(2, "0")}
        </div>
        <div className="font-display text-3xl tnum">
          {formatMoney(reward.min_amount)}+
        </div>
      </div>

      <h3 className="mt-4 font-display text-2xl leading-tight text-pretty">
        {reward.title}
      </h3>

      {reward.description && (
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed text-pretty">
          {reward.description}
        </p>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-4 text-xs border-t border-line pt-4">
        <div>
          <dt className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Backers
          </dt>
          <dd className="mt-1 tnum">
            {reward.current_backers}
            {reward.max_backers ? ` / ${reward.max_backers}` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Delivery
          </dt>
          <dd className="mt-1 tnum">
            {reward.estimated_delivery
              ? new Date(reward.estimated_delivery).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })
              : "TBD"}
          </dd>
        </div>
      </dl>

      <Button
        variant="outline"
        size="sm"
        className="mt-6 w-full"
        disabled={soldOut}
        onClick={() => onSelect?.(reward)}
      >
        {soldOut ? "Sold out" : "Pledge this tier"}
      </Button>
    </article>
  );
}
