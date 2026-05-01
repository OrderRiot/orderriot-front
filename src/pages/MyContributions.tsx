import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useMyContributions } from "@/lib/queries";
import { formatMoney } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const statusVariant: Record<string, "default" | "solid" | "muted" | "outline"> = {
  pending: "muted",
  success: "solid",
  failed: "outline",
  refunded: "outline",
};

export default function MyContributions() {
  const list = useMyContributions();

  return (
    <div className="container-edge py-16 md:py-20">
      <div className="editorial-index">— Backed</div>
      <h1 className="font-display text-display-md mt-3 leading-[1.02]">
        Things you've <span className="italic-display">funded</span>.
      </h1>

      <div className="mt-12">
        {list.isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        )}

        {list.data && list.data.length === 0 && (
          <div className="border border-line p-16 text-center">
            <div className="italic-display text-3xl">Nothing yet.</div>
            <p className="text-muted-foreground mt-2">
              Find a project to back.
            </p>
            <Link to="/discover" className="link-quiet text-sm uppercase tracking-[0.18em] mt-4 inline-block">
              Browse campaigns →
            </Link>
          </div>
        )}

        {list.data && list.data.length > 0 && (
          <ul className="border-y border-line divide-y divide-line">
            {list.data.map((c) => (
              <li key={c.contrib_id}>
                <Link
                  to={`/campaigns/${c.camp_id}`}
                  className="grid grid-cols-12 items-center gap-4 py-5"
                >
                  <span className="col-span-2 md:col-span-1 font-mono text-xs text-muted-foreground tnum">
                    #{c.contrib_id}
                  </span>
                  <div className="col-span-7 md:col-span-6">
                    <div className="font-medium">Campaign #{c.camp_id}</div>
                    <div className="text-xs text-muted-foreground tnum mt-1">
                      {new Date(c.contrib_date).toLocaleDateString()}
                      {c.payment_mode && <> · {c.payment_mode}</>}
                    </div>
                  </div>
                  <div className="col-span-3 md:col-span-3 font-display text-2xl tnum">
                    {formatMoney(c.contrib_amount)}
                  </div>
                  <div className="col-span-12 md:col-span-2 md:text-right">
                    <Badge variant={statusVariant[c.payment_status] ?? "outline"}>
                      {c.payment_status}
                    </Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
