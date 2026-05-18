import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useConversation, useMessages, useSendMessage, useMe } from "@/lib/queries";
import { initials, timeAgo } from "@/lib/utils";
import { toast } from "sonner";
import { apiError } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function ConversationView() {
  const { convId } = useParams<{ convId: string }>();
  const id = Number(convId);
  const me = useMe();
  const conv = useConversation(id);
  const msgs = useMessages(id);
  const send = useSendMessage(id);
  const [body, setBody] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.data]);

  async function handleSend() {
    const trimmed = body.trim();
    if (!trimmed || send.isPending) return;
    try {
      await send.mutateAsync(trimmed);
      setBody("");
      textareaRef.current?.focus();
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const myId = me.data?.user_id;
  const other = conv.data?.other_user;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 border-b border-line px-4 py-3 flex items-center gap-3 bg-paper">
        {/* Mobile back button */}
        <Link
          to="/messages"
          className="md:hidden text-muted-foreground hover:text-ink transition-colors mr-1"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        {conv.isLoading ? (
          <>
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-2.5 w-20" />
            </div>
          </>
        ) : other ? (
          <>
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={other.avatar_url ?? undefined} />
              <AvatarFallback>{initials(other.username)}</AvatarFallback>
            </Avatar>
            <div>
              <Link
                to={`/users/${other.username}`}
                className="font-medium text-sm hover:underline underline-offset-4"
              >
                {other.username}
              </Link>
            </div>
          </>
        ) : null}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-2">
        {msgs.isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  i % 2 === 0 ? "justify-start" : "justify-end",
                )}
              >
                <Skeleton
                  className={cn(
                    "h-10 rounded-none",
                    i % 2 === 0 ? "w-48" : "w-36",
                  )}
                />
              </div>
            ))}
          </div>
        )}

        {msgs.data?.map((msg, idx) => {
          const isMine = msg.sender_id === myId;
          const prevMsg = msgs.data![idx - 1];
          const isFirstInGroup =
            !prevMsg || prevMsg.sender_id !== msg.sender_id;

          return (
            <div
              key={msg.id}
              className={cn(
                "flex items-end gap-2",
                isMine ? "justify-end" : "justify-start",
                isFirstInGroup ? "mt-4" : "",
              )}
            >
              {!isMine && isFirstInGroup && (
                <Avatar className="h-6 w-6 shrink-0 mb-0.5">
                  <AvatarImage src={other?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[9px]">
                    {initials(other?.username ?? "?")}
                  </AvatarFallback>
                </Avatar>
              )}
              {!isMine && !isFirstInGroup && <div className="w-6 shrink-0" />}

              <div className="max-w-[70%]">
                <div
                  className={cn(
                    "px-3.5 py-2 text-sm leading-relaxed",
                    isMine
                      ? "bg-ink text-paper"
                      : "border border-line bg-transparent",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                </div>
                <p
                  className={cn(
                    "text-[10px] mt-1 tnum",
                    isMine
                      ? "text-right text-muted-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {timeAgo(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}

        {msgs.data?.length === 0 && !msgs.isLoading && (
          <div className="flex items-center justify-center h-full py-16">
            <p className="text-sm text-muted-foreground">
              No messages yet. Say hello.
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-line px-4 py-3 flex items-end gap-2 bg-paper">
        <textarea
          ref={textareaRef}
          className="flex-1 border border-line px-3.5 py-2.5 text-sm bg-transparent focus:outline-none focus:border-ink resize-none leading-relaxed"
          rows={1}
          placeholder="Message… (Enter to send)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ maxHeight: "120px", overflowY: "auto" }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
          }}
        />
        <Button
          onClick={handleSend}
          disabled={!body.trim() || send.isPending}
          size="icon"
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
