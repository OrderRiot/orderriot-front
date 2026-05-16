import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useConversation, useMessages, useSendMessage, useMe } from "@/lib/queries";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { apiError } from "@/lib/api";

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

  return (
    <div className="container-edge py-16 md:py-20 max-w-2xl flex flex-col" style={{ minHeight: "calc(100vh - 4rem)" }}>
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link to="/messages" className="text-muted-foreground hover:text-ink transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {conv.isLoading ? (
          <Skeleton className="h-8 w-40" />
        ) : conv.data ? (
          <div className="flex items-center gap-3">
            {conv.data.other_user.avatar_url ? (
              <img
                src={conv.data.other_user.avatar_url}
                alt=""
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center font-semibold text-sm">
                {conv.data.other_user.username.slice(0, 1).toUpperCase()}
              </div>
            )}
            <span className="font-semibold text-base">{conv.data.other_user.username}</span>
          </div>
        ) : null}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-6 min-h-[300px]">
        {msgs.isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className={`h-12 w-2/3 ${i % 2 === 0 ? "" : "ml-auto"}`} />
            ))}
          </div>
        )}
        {msgs.data?.map((msg) => {
          const isMine = msg.sender_id === myId;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed ${
                  isMine
                    ? "bg-ink text-paper"
                    : "border border-line bg-transparent"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                <p className={`text-[10px] mt-1 ${isMine ? "text-paper/50" : "text-muted-foreground"}`}>
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
        {msgs.data?.length === 0 && !msgs.isLoading && (
          <p className="text-sm text-muted-foreground text-center py-10">
            No messages yet. Say hello.
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-line pt-4 flex gap-3 items-end">
        <textarea
          ref={textareaRef}
          className="flex-1 border border-line px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-ink resize-none"
          rows={2}
          placeholder="Write a message… (Enter to send, Shift+Enter for newline)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button
          onClick={handleSend}
          disabled={!body.trim() || send.isPending}
          size="icon"
          className="shrink-0 mb-0.5"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
