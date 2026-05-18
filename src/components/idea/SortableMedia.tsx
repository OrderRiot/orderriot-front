import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, ImageIcon } from "lucide-react";

interface Props {
  urls: string[];
  onReorder: (urls: string[]) => void;
  onRemove: (url: string) => void;
  onAddClick: () => void;
  maxItems?: number;
}

export function SortableMedia({ urls, onReorder, onRemove, onAddClick, maxItems = 8 }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = urls.indexOf(active.id as string);
      const newIdx = urls.indexOf(over.id as string);
      onReorder(arrayMove(urls, oldIdx, newIdx));
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={urls} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {urls.map((url) => (
            <SortableItem key={url} url={url} onRemove={onRemove} />
          ))}
          {urls.length < maxItems && (
            <button
              type="button"
              onClick={onAddClick}
              className="h-32 border border-dashed border-line flex flex-col items-center justify-center text-muted-foreground hover:border-ink hover:text-ink transition-colors gap-2"
            >
              <ImageIcon className="h-5 w-5" />
              <span className="text-xs">Add more</span>
            </button>
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({ url, onRemove }: { url: string; onRemove: (url: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const isVideo = /\.(mp4|mov|webm|avi)(\?|$)/i.test(url);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group border border-line h-32 overflow-hidden bg-muted/20"
    >
      {isVideo ? (
        <video src={url} className="h-full w-full object-cover" preload="metadata" />
      ) : (
        <img src={url} alt="" className="h-full w-full object-cover" />
      )}

      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 h-6 w-6 bg-ink/70 text-paper flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        title="Drag to reorder"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      {/* Remove button */}
      <button
        type="button"
        onClick={() => onRemove(url)}
        className="absolute top-1 right-1 h-6 w-6 bg-ink/70 text-paper flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        title="Remove"
      >
        <X className="h-3 w-3" />
      </button>

      {/* Order indicator */}
      <div className="absolute bottom-1 left-1 h-4 w-4 bg-ink/60 text-paper text-[9px] flex items-center justify-center font-mono">
        {/* shown by index in parent, not needed here */}
      </div>
    </div>
  );
}
