import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  useComments,
  useMe,
  usePostComment,
  useReactToComment,
  useReactionCounts,
} from "@/lib/queries";
import { apiError } from "@/lib/api";
import { initials, timeAgo } from "@/lib/utils";
import type { Comment } from "@/lib/types";

export function Comments({ campId }: { campId: number }) {
  const me = useMe();
  const list = useComments(campId);
  const post = usePostComment(campId);
  const [body, setBody] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    try {
      await post.mutateAsync({ comment_body: body.trim() });
      setBody("");
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  return (
    <section>
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="editorial-index">— Conversation</div>
          <h2 className="font-display text-display-sm mt-2">
            Comments<span className="italic-display"> ·</span>{" "}
            <span className="tnum">{list.data?.length ?? 0}</span>
          </h2>
        </div>
      </div>

      {me.data ? (
        <form onSubmit={submit} className="border border-line p-5 mb-8">
          <Textarea
            placeholder="Say something thoughtful…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            className="border-0 p-0 min-h-[80px] focus-visible:border-0"
          />
          <div className="flex justify-end pt-3 border-t border-line mt-3">
            <Button type="submit" size="sm" disabled={!body.trim() || post.isPending}>
              {post.isPending ? "Posting…" : "Post comment"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="border border-line p-6 mb-8 text-sm text-muted-foreground flex items-center justify-between gap-4">
          <span>Sign in to join the conversation.</span>
          <Button asChild variant="outline" size="sm">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      )}

      {list.isLoading && (
        <div className="text-sm text-muted-foreground">Loading…</div>
      )}

      {list.data && list.data.length === 0 && (
        <div className="border border-dashed border-line p-12 text-center">
          <div className="italic-display text-2xl">No comments yet.</div>
          <p className="text-muted-foreground text-sm mt-2">Be the first.</p>
        </div>
      )}

      {list.data && list.data.length > 0 && (
        <ul className="border-y border-line divide-y divide-line">
          {list.data.map((c) => (
            <CommentRow key={c.comment_id} campId={campId} comment={c} />
          ))}
        </ul>
      )}
    </section>
  );
}

function CommentRow({ campId, comment }: { campId: number; comment: Comment }) {
  const counts = useReactionCounts(campId, comment.comment_id);
  const react = useReactToComment(campId, comment.comment_id);
  const me = useMe();

  return (
    <li className="py-6 grid grid-cols-12 gap-x-4">
      <div className="col-span-1">
        <Avatar className="h-9 w-9">
          <AvatarFallback>
            {initials(comment.user_id ? `U${comment.user_id}` : "·")}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="col-span-11">
        <div className="flex items-baseline gap-3">
          <Link
            to={comment.user_id ? `/users/${comment.user_id}` : "#"}
            className="text-sm font-medium link-quiet"
          >
            {comment.user_id ? `User #${comment.user_id}` : "Anonymous"}
          </Link>
          <span className="text-xs text-muted-foreground tnum">
            {timeAgo(comment.posted_date)}
          </span>
        </div>
        <p className="mt-2 text-[15px] leading-relaxed text-pretty">
          {comment.comment_body}
        </p>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <button
            disabled={!me.data}
            className="flex items-center gap-1.5 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => react.mutate("like")}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            <span className="tnum">{counts.data?.likes ?? 0}</span>
          </button>
          <button
            disabled={!me.data}
            className="flex items-center gap-1.5 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => react.mutate("dislike")}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
            <span className="tnum">{counts.data?.dislikes ?? 0}</span>
          </button>
        </div>
      </div>
    </li>
  );
}
