import { Link } from "react-router-dom";
import { ArrowUpRight, Settings, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/lib/queries";
import { initials } from "@/lib/utils";
import { UserType } from "@/lib/types";

const typeLabel: Record<number, string> = {
  [UserType.backer]: "Backer",
  [UserType.creator]: "Creator",
  [UserType.both]: "Creator & Backer",
  [UserType.admin]: "Admin",
};

export default function Profile() {
  const me = useMe();

  if (me.isLoading || !me.data) {
    return (
      <div className="container-edge py-20 max-w-3xl space-y-6">
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    );
  }

  const user = me.data;

  return (
    <div className="container-edge py-12 md:py-20 max-w-3xl">
      {/* Header */}
      <div className="flex items-start gap-5 mb-12">
        <Avatar className="h-20 w-20 shrink-0">
          <AvatarImage src={user.avatar_url ?? undefined} alt={user.username} />
          <AvatarFallback className="text-xl">{initials(user.name || user.username)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="editorial-index">— Profile</div>
          <h1 className="font-display text-display-md mt-2 leading-[1.02]">
            {user.name ? (
              <>{user.name}<span className="italic-display">.</span></>
            ) : (
              <><span className="italic-display">Hello,</span> {user.username}.</>
            )}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-sm text-muted-foreground">@{user.username}</span>
            {user.isverified && (
              <Badge variant="outline" className="text-green-700 border-green-600/40 text-[10px]">
                Verified
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {typeLabel[user.user_type] ?? "Member"}
            </Badge>
            {user.location && (
              <span className="text-xs text-muted-foreground">{user.location}</span>
            )}
          </div>
        </div>
      </div>

      {/* Two main actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        <Link
          to="/profile/edit"
          className="border border-line p-6 hover:border-ink transition-colors group"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <UserIcon className="h-5 w-5 text-muted-foreground group-hover:text-ink transition-colors" />
            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-ink transition-colors" />
          </div>
          <div className="font-display text-xl font-semibold">Public profile</div>
          <p className="text-xs text-muted-foreground mt-1">
            Avatar, display name, bio, social links, portfolio
          </p>
        </Link>

        <Link
          to="/profile/settings"
          className="border border-line p-6 hover:border-ink transition-colors group"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <Settings className="h-5 w-5 text-muted-foreground group-hover:text-ink transition-colors" />
            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-ink transition-colors" />
          </div>
          <div className="font-display text-xl font-semibold">Account settings</div>
          <p className="text-xs text-muted-foreground mt-1">
            Username, email, phone, role, identity verification
          </p>
        </Link>
      </div>

      {/* Quick nav */}
      <div className="border-t border-line pt-8 space-y-1">
        {[
          { to: `/users/${user.username}`, label: "View public profile" },
          { to: "/profile/campaigns", label: "My campaigns" },
          { to: "/profile/ideas", label: "My ideas" },
          { to: "/profile/contributions", label: "Backed projects" },
          { to: "/profile/organizations", label: "My organizations" },
          { to: "/messages", label: "Messages" },
        ].map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center justify-between py-3 text-sm border-b border-line last:border-0 group"
          >
            <span className="group-hover:text-ink transition-colors">{label}</span>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-ink transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
