import { Card } from "@/components/ui/card";

export function ComingSoon({
  title,
  phase,
}: {
  title: string;
  phase: string;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-6"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="max-w-xs text-sm text-foreground-muted">
        Esta sección se construye en la {phase} del plan de ZeroGap.
      </p>
    </Card>
  );
}
