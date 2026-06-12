export function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-muted-foreground flex items-center justify-center gap-3 font-mono text-[11px] font-medium tracking-[0.08em] uppercase">
      <span aria-hidden className="bg-border h-px w-8" />
      {children}
      <span aria-hidden className="bg-border h-px w-8" />
    </div>
  );
}
