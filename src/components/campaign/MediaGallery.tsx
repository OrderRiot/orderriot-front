import { useState } from "react";
import { Play } from "lucide-react";
import { isVideoUrl, getYouTubeId } from "@/lib/utils";
import { VideoPlayer } from "@/components/ui/VideoPlayer";

function MainMedia({ url, title }: { url: string; title: string }) {
  const ytId = getYouTubeId(url);
  if (ytId) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${ytId}?rel=0`}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        title={title}
      />
    );
  }
  if (isVideoUrl(url)) {
    return <VideoPlayer key={url} src={url} className="h-full w-full" />;
  }
  return (
    <img
      key={url}
      src={url}
      alt={title}
      className="h-full w-full object-cover animate-[rise-up_0.5s_ease-out]"
    />
  );
}

function Thumb({
  url,
  active,
  onClick,
}: {
  url: string;
  active: boolean;
  onClick: () => void;
}) {
  const ytId = getYouTubeId(url);
  const isVid = isVideoUrl(url);
  return (
    <button
      onClick={onClick}
      className={`relative h-16 w-24 shrink-0 overflow-hidden border ${
        active ? "border-ink" : "border-transparent"
      }`}
    >
      {ytId ? (
        <>
          <img
            src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
            alt=""
            className="h-full w-full object-cover"
          />
          <span className="absolute inset-0 grid place-items-center bg-black/30">
            <Play className="h-4 w-4 fill-white text-white" />
          </span>
        </>
      ) : isVid ? (
        <>
          <video
            src={url}
            preload="metadata"
            muted
            playsInline
            className="h-full w-full object-cover"
          />
          <span className="absolute inset-0 grid place-items-center pointer-events-none">
            <Play className="h-5 w-5 fill-white text-white drop-shadow" />
          </span>
        </>
      ) : (
        <img src={url} alt="" className="h-full w-full object-cover" />
      )}
    </button>
  );
}

export function MediaGallery({ media, title }: { media: string[] | null; title: string }) {
  const items = media ?? [];
  const [active, setActive] = useState(0);

  if (items.length === 0) {
    return (
      <div className="aspect-[16/10] bg-muted grid place-items-center">
        <span className="font-display italic text-7xl text-muted-foreground/30">
          {title.slice(0, 2)}
        </span>
      </div>
    );
  }

  return (
    <div>
      <div className={`aspect-[16/10] bg-muted ${getYouTubeId(items[active]!) ? "" : "overflow-hidden"}`}>
        <MainMedia url={items[active]!} title={title} />
      </div>
      {items.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {items.map((src, i) => (
            <Thumb
              key={src + i}
              url={src}
              active={i === active}
              onClick={() => setActive(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
