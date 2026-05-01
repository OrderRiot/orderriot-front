import { useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/lib/queries";
import { initials } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function PublicProfile() {
  const { id } = useParams();
  const userId = Number(id);
  const user = useUser(userId);

  if (user.isLoading) {
    return (
      <div className="container-edge py-20 max-w-3xl">
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="h-10 w-1/2 mt-8" />
        <Skeleton className="h-4 w-1/3 mt-4" />
      </div>
    );
  }

  if (user.isError || !user.data) {
    return (
      <div className="container-edge py-32 text-center">
        <h2 className="font-display text-4xl">Person not found.</h2>
        <p className="text-muted-foreground mt-3">This profile doesn't exist or was removed.</p>
      </div>
    );
  }

  const u = user.data;

  return (
    <div className="container-edge py-20">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12 md:col-span-3">
          <Avatar className="h-32 w-32">
            <AvatarImage src={u.avatar_url ?? undefined} />
            <AvatarFallback className="text-3xl">{initials(u.username)}</AvatarFallback>
          </Avatar>
        </div>
        <div className="col-span-12 md:col-span-9 mt-8 md:mt-0">
          <div className="editorial-index">— Profile · #{u.user_id}</div>
          <h1 className="font-display text-display-md mt-3 leading-[1.02]">
            {u.username}
            {u.isverified && <span className="italic-display"> ✓</span>}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {u.location && <Badge variant="outline">{u.location}</Badge>}
            <Badge variant="outline">
              Member since{" "}
              {new Date(u.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
              })}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
