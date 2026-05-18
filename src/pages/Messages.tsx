import { useEffect } from "react";
import { Link, Outlet, useNavigate, useParams } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useConversations } from "@/lib/queries";
import { cn, initials, timeAgo } from "@/lib/utils";

export default function Messages() {
  const { convId } = useParams<{ convId: string }>();
  const { data: convs, isLoading } = useConversations();
  const navigate = useNavigate();
  const activeId = convId ? Number(convId) : null;

  // On desktop, auto-select first conv if none active
  useEffect(() => {
    if (!convId && convs && convs.length > 0 && window.innerWidth >= 768) {
      navigate(`/messages/${convs[0].id}`, { replace: true });
    }
  }, [convId, convs, navigate]);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* ── Left panel: conversation list ── */}
      <aside
        className={cn(
          "flex flex-col border-r border-line bg-paper",
          "w-full md:w-80 lg:w-96 shrink-0",
          // On mobile, hide sidebar when a conversation is open
          activeId ? "hidden md:flex" : "flex",
        )}
      >
        {/* Panel header */}
        <div className="px-5 py-4 border-b border-line shrink-0">
          <div className="editorial-index text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            — Direct messages
          </div>
          <h1 className="font-display text-xl mt-1">
            Conversations
          </h1>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="divide-y divide-line">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && convs?.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center py-20">
              <MessageSquare className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No conversations yet.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Start one from a collab post or profile.
              </p>
            </div>
          )}

          {convs && convs.length > 0 && (
            <ul className="divide-y divide-line">
              {convs.map((conv) => {
                const isActive = conv.id === activeId;
                return (
                  <li key={conv.id}>
                    <Link
                      to={`/messages/${conv.id}`}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3.5 transition-colors",
                        isActive
                          ? "bg-ink text-paper"
                          : "hover:bg-muted/40",
                      )}
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={conv.other_user.avatar_url ?? undefined} />
                        <AvatarFallback
                          className={isActive ? "bg-paper/20 text-paper" : undefined}
                        >
                          {initials(conv.other_user.username)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              "text-sm font-medium truncate",
                              isActive ? "text-paper" : "text-ink",
                            )}
                          >
                            {conv.other_user.username}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] shrink-0 tnum",
                              isActive ? "text-paper/60" : "text-muted-foreground",
                            )}
                          >
                            {timeAgo(conv.last_message_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p
                            className={cn(
                              "text-xs truncate flex-1",
                              isActive ? "text-paper/70" : "text-muted-foreground",
                            )}
                          >
                            {conv.last_message ?? "No messages yet"}
                          </p>
                          {conv.unread_count > 0 && !isActive && (
                            <span className="shrink-0 bg-ink text-paper text-[10px] font-semibold rounded-full px-1.5 py-0.5 min-w-[1.2rem] text-center leading-none">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* ── Right panel: conversation or empty state ── */}
      <div
        className={cn(
          "flex-1 min-w-0 flex flex-col",
          // On mobile, only show when a conversation is open
          activeId ? "flex" : "hidden md:flex",
        )}
      >
        {activeId ? (
          <Outlet />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
            <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Select a conversation to start reading.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
