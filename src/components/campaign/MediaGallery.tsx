import { useState } from "react";

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
      <div className="aspect-[16/10] bg-muted overflow-hidden">
        <img
          key={items[active]}
          src={items[active]}
          alt={title}
          className="h-full w-full object-cover animate-[rise-up_0.5s_ease-out]"
        />
      </div>
      {items.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {items.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setActive(i)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden border ${
                i === active ? "border-ink" : "border-transparent"
              }`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
