import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "bg-card border-border shadow-lg",
          title: "text-foreground",
          description: "text-muted-foreground",
        },
      }}
    />
  );
}
