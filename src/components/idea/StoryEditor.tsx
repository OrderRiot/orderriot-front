import { useRef, useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Youtube from "@tiptap/extension-youtube";
import {
  Bold, Italic, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, Strikethrough,
  ImageIcon, Link2, Link2Off, Loader2, X, Youtube as YoutubeIcon,
} from "lucide-react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  onUploadImage?: (file: File) => Promise<string>;
  storageKey?: string;
}

type BarMode = "link" | "youtube" | null;

export function StoryEditor({ value, onChange, onUploadImage, storageKey }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const barInputRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [imgUploading, setImgUploading] = useState(false);
  const [barMode, setBarMode] = useState<BarMode>(null);
  const [barValue, setBarValue] = useState("");
  const [draftRestored, setDraftRestored] = useState(false);
  const [floatPos, setFloatPos] = useState<{ top: number; left: number } | null>(null);
  const floatRef = useRef<HTMLDivElement>(null);

  const savedDraft = storageKey ? (localStorage.getItem(storageKey) ?? null) : null;
  const initialContent = (!value && savedDraft) ? savedDraft : (value || "");

  useEffect(() => {
    if (!value && savedDraft) {
      setDraftRestored(true);
      onChange(savedDraft);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        code: false,
      }),
      Placeholder.configure({
        placeholder: "Start writing your story. What's the problem? What's your vision? Why now?",
        emptyEditorClass: "is-editor-empty",
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: { class: "story-image" },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "story-link", rel: "noopener noreferrer", target: "_blank" },
      }),
      Youtube.configure({
        width: 640,
        height: 340,
        HTMLAttributes: { class: "story-youtube" },
      }),
    ],
    content: initialContent,
    onUpdate({ editor }) {
      const html = editor.getHTML();
      onChange(html);
      if (storageKey) {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => localStorage.setItem(storageKey, html), 800);
      }
    },
    // onSelectionUpdate — floating cursor toolbar (disabled)
    // onBlur — floating cursor toolbar (disabled)
    editorProps: {
      attributes: {
        class: "prose-editor focus:outline-none min-h-[380px] px-4 py-4",
      },
    },
  });

  useEffect(() => {
    if (barMode) {
      setTimeout(() => barInputRef.current?.focus(), 30);
      if (barMode === "link" && editor?.isActive("link")) {
        setBarValue(editor.getAttributes("link").href ?? "");
      } else {
        setBarValue("");
      }
    }
  }, [barMode, editor]);

  /* Floating cursor toolbar — disabled
  useEffect(() => {
    const el = floatRef.current;
    if (!floatPos || !el) return;
    el.style.opacity = "0";

    function onMove(e: MouseEvent) {
      const el = floatRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const nx = Math.max(r.left, Math.min(e.clientX, r.right));
      const ny = Math.max(r.top, Math.min(e.clientY, r.bottom));
      const dist = Math.hypot(e.clientX - nx, e.clientY - ny);

      let o: number;
      if (dist > 120) o = 0;
      else if (dist > 40) o = ((120 - dist) / 80) * 0.35;
      else o = 0.35 + ((40 - dist) / 40) * 0.65;

      el.style.opacity = o.toFixed(3);
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [floatPos]);
  */

  if (!editor) return null;

  // ── Image upload ─────────────────────────────────────────────────
  async function handleImageFile(file: File | undefined) {
    if (!file || !onUploadImage) return;
    setImgUploading(true);
    try {
      const url = await onUploadImage(file);
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch {
      // parent handles toast
    } finally {
      setImgUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // ── Link apply ───────────────────────────────────────────────────
  function applyLink() {
    const url = barValue.trim();
    if (!url) {
      editor.chain().focus().unsetLink().run();
    } else {
      const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      editor.chain().focus().setLink({ href }).run();
    }
    setBarMode(null);
    setBarValue("");
  }

  // ── YouTube embed ────────────────────────────────────────────────
  function applyYoutube() {
    const url = barValue.trim();
    if (!url) { setBarMode(null); return; }
    editor.commands.setYoutubeVideo({ src: url });
    setBarMode(null);
    setBarValue("");
  }

  function handleBarConfirm() {
    if (barMode === "link") applyLink();
    else if (barMode === "youtube") applyYoutube();
  }

  const isLinkActive = editor.isActive("link");
  const canAddImage = !!onUploadImage;

  return (
    <>
      {draftRestored && (
        <div className="flex items-center justify-between gap-3 px-3 py-2 mb-2 border border-line bg-muted/30 text-xs text-muted-foreground">
          <span>Draft restored from your last session.</span>
          <button
            type="button"
            className="hover:text-ink transition-colors"
            onClick={() => {
              if (storageKey) localStorage.removeItem(storageKey);
              setDraftRestored(false);
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className="border border-line focus-within:border-ink transition-colors">
        {/* Toolbar */}
        <div className="flex items-center gap-0.5 border-b border-line px-3 py-2 bg-paper flex-wrap">
          <ToolBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
            <Bold className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
            <Italic className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
            <Strikethrough className="h-3.5 w-3.5" />
          </ToolBtn>

          <Divider />

          <ToolBtn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading">
            <Heading2 className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Subheading">
            <Heading3 className="h-3.5 w-3.5" />
          </ToolBtn>

          <Divider />

          <ToolBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
            <List className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">
            <ListOrdered className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Blockquote">
            <Quote className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
            <Minus className="h-3.5 w-3.5" />
          </ToolBtn>

          <Divider />

          {/* Link */}
          <ToolBtn
            active={isLinkActive || barMode === "link"}
            title={isLinkActive ? "Edit link" : "Add link"}
            onClick={() => {
              if (isLinkActive && barMode !== "link") {
                editor.chain().focus().unsetLink().run();
              } else {
                setBarMode(barMode === "link" ? null : "link");
              }
            }}
          >
            <Link2 className="h-3.5 w-3.5" />
          </ToolBtn>
          {isLinkActive && (
            <ToolBtn active={false} title="Remove link" onClick={() => { editor.chain().focus().unsetLink().run(); setBarMode(null); }}>
              <Link2Off className="h-3.5 w-3.5" />
            </ToolBtn>
          )}

          {/* Image */}
          {canAddImage && (
            <ToolBtn
              active={false}
              title={imgUploading ? "Uploading…" : "Insert image"}
              onClick={() => !imgUploading && fileRef.current?.click()}
            >
              {imgUploading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <ImageIcon className="h-3.5 w-3.5" />
              }
            </ToolBtn>
          )}

          {/* YouTube */}
          <ToolBtn
            active={barMode === "youtube"}
            title="Embed YouTube video"
            onClick={() => setBarMode(barMode === "youtube" ? null : "youtube")}
          >
            <YoutubeIcon className="h-3.5 w-3.5" />
          </ToolBtn>
        </div>

        {/* Inline bar (link or YouTube URL input) */}
        {barMode && (
          <div className="flex items-center gap-2 border-b border-line px-3 py-2 bg-muted/30">
            {barMode === "link"
              ? <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              : <YoutubeIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            }
            <input
              ref={barInputRef}
              value={barValue}
              onChange={(e) => setBarValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); handleBarConfirm(); }
                if (e.key === "Escape") { setBarMode(null); }
              }}
              placeholder={barMode === "link" ? "Paste or type a URL…" : "Paste a YouTube URL…"}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={handleBarConfirm}
              className="text-xs font-medium text-ink border border-line px-2 py-0.5 hover:bg-muted transition-colors shrink-0"
            >
              {barMode === "link" ? "Apply" : "Embed"}
            </button>
            <button type="button" onClick={() => setBarMode(null)} className="text-muted-foreground hover:text-ink shrink-0">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Scrollable editor body */}
        <div className="h-[460px] overflow-y-auto">
          <EditorContent editor={editor} />
        </div>

        {/* Hidden file input */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleImageFile(e.target.files?.[0])}
        />
      </div>

      {/* Floating cursor toolbar — disabled
      {floatPos && (
        <div ref={floatRef} className="fixed z-50 -translate-x-1/2" style={{ top: floatPos.top, left: floatPos.left, opacity: 0, transition: "opacity 120ms ease" }} onMouseDown={(e) => e.preventDefault()}>
          <div className="flex items-center gap-0.5 bg-paper border border-line shadow-md px-1 py-0.5">
            ...
          </div>
        </div>
      )}
      */}
    </>
  );
}

function ToolBtn({
  children, onClick, active, title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`h-7 w-7 flex items-center justify-center transition-colors ${
        active ? "bg-ink text-paper" : "text-muted-foreground hover:text-ink hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function FBtn({
  children, onClick, active, title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`h-6 w-6 flex items-center justify-center transition-colors ${
        active ? "bg-ink text-paper" : "text-muted-foreground hover:text-ink hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="h-5 w-px bg-line mx-1" />;
}
