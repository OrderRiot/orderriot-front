import { Link } from "react-router-dom";
import { Plus, ArrowUpRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyOrganizations } from "@/lib/queries";
import type { OrgListItem, OrgStatus } from "@/lib/types";

const statusVariant: Record<OrgStatus, "default" | "outline" | "solid"> = {
  pending: "default",
  verified: "solid",
  rejected: "outline",
};

const statusLabel: Record<OrgStatus, string> = {
  pending: "Under review",
  verified: "Verified",
  rejected: "Rejected",
};

const orgTypeLabel: Record<string, string> = {
  personal: "Personal",
  studio: "Studio",
  agency: "Agency",
  brand: "Brand",
  ngo: "NGO",
  other: "Other",
};

function OrgCard({ org }: { org: OrgListItem }) {
  return (
    <Link
      to={`/organizations/${org.id}`}
      className="flex items-start justify-between gap-4 border border-line p-6 hover:bg-muted/30 transition-colors group"
    >
      <div className="flex items-center gap-4 min-w-0">
        {org.avatar_url ? (
          <img
            src={org.avatar_url}
            alt=""
            className="h-12 w-12 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0">
          <div className="font-display text-lg font-semibold truncate">{org.name}</div>
          {org.description && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{org.description}</p>
          )}
          <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
            <span>{orgTypeLabel[org.org_type] ?? org.org_type}</span>
            <span>{new Date(org.created_at).toLocaleDateString("en-IN")}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Badge variant={statusVariant[org.status]}>{statusLabel[org.status]}</Badge>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-ink transition-colors" />
      </div>
    </Link>
  );
}

export default function MyOrganizations() {
  const list = useMyOrganizations();

  return (
    <div className="container-edge py-16 md:py-20">
      <div className="flex flex-wrap items-end justify-between gap-y-4 mb-12">
        <div>
          <div className="editorial-index">— Yours</div>
          <h1 className="font-display text-display-md mt-3 leading-[1.02]">
            My <span className="italic-display">organizations</span>.
          </h1>
        </div>
        <Button asChild>
          <Link to="/organizations/new">
            <Plus className="h-4 w-4 mr-1.5" />
            New organization
          </Link>
        </Button>
      </div>

      {list.isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      )}

      {list.data?.length === 0 && (
        <div className="border border-dashed border-line p-20 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <div className="italic-display text-2xl mb-2">No organizations yet.</div>
          <p className="text-sm text-muted-foreground mb-6">
            Create a team, studio, or brand to collaborate with others.
          </p>
          <Button asChild variant="outline">
            <Link to="/organizations/new">Create your first organization</Link>
          </Button>
        </div>
      )}

      {list.data && list.data.length > 0 && (
        <div className="space-y-3">
          {list.data.map((org) => (
            <OrgCard key={org.id} org={org} />
          ))}
        </div>
      )}
    </div>
  );
}
