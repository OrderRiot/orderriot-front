import { Link } from "react-router-dom";
import { MessageSquare, ArrowUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useConversations } from "@/lib/queries";
import { formatDistanceToNow } from "date-fns";

export default function Messages() {
  const { data: convs, isLoading } = useConversations();

  return (
    <div className="container-edge py-16 md:py-20 max-w-2xl">
      <div className="mb-10">
        <div className="editorial-index">— Direct messages</div>
        <h1 className="font-display text-display-md mt-3 leading-[1.02]">
          Your <span className="italic-display">conversations</span>.
        </h1>
        <p className="text-muted-foreground mt-3 text-sm max-w-md">
          Private conversations with collaborators and community members.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      )}

      {!isLoading && convs?.length === 0 && (
        <div className="border border-dashed border-line p-20 text-center">
          <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <div className="italic-display text-2xl mb-2">No messages yet.</div>
          <p className="text-sm text-muted-foreground">
            Start a conversation from a collab post or someone's profile.
          </p>
        </div>
      )}

      {convs && convs.length > 0 && (
        <div className="divide-y divide-line border border-line">
          {convs.map((conv) => (
            <Link
              key={conv.id}
              to={`/messages/${conv.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors group"
            >
              <div className="shrink-0">
                {conv.other_user.avatar_url ? (
                  <img
                    src={conv.other_user.avatar_url}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-semibold text-sm">
                    {conv.other_user.username.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm group-hover:underline underline-offset-4">
                    {conv.other_user.username}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-sm text-muted-foreground truncate flex-1">
                    {conv.last_message ?? "No messages yet"}
                  </p>
                  {conv.unread_count > 0 && (
                    <span className="shrink-0 bg-ink text-paper text-[10px] font-semibold rounded-full px-1.5 py-0.5 min-w-[1.2rem] text-center">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-ink shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
