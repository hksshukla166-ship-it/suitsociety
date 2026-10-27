import { ReactNode } from "react";

interface InfoPageShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function InfoPageShell({ title, subtitle, children }: InfoPageShellProps) {
  return (
    <div className="container mx-auto px-4 py-10 md:py-14">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl md:text-4xl tracking-wider">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-3 text-sm md:text-base">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
