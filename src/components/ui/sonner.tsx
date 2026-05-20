import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      duration={3500}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            "border border-ink bg-paper text-ink rounded-sm font-sans text-sm px-4 py-3 shadow-none",
          title: "font-medium",
          description: "text-muted-foreground",
          actionButton: "bg-ink text-paper px-3 py-1 text-xs uppercase tracking-[0.14em]",
          cancelButton: "text-muted-foreground text-xs uppercase tracking-[0.14em]",
        },
      }}
    />
  );
}
