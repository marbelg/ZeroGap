import { Card } from "@/components/ui/card";

export function StatTile({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: { pct: number; label: string } | null;
}) {
  return (
    <Card className="p-3">
      <p className="text-xs font-medium text-foreground-muted">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-foreground">{value}</p>
      {delta && (
        <p
          className={`mt-0.5 text-[11px] font-medium ${
            delta.pct > 0 ? "text-success" : delta.pct < 0 ? "text-danger" : "text-foreground-muted"
          }`}
        >
          {delta.pct > 0 ? "▲" : delta.pct < 0 ? "▼" : "—"} {Math.abs(delta.pct).toFixed(0)}%{" "}
          {delta.label}
        </p>
      )}
    </Card>
  );
}
