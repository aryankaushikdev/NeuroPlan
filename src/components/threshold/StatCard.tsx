import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  color: "safe" | "caution" | "unstable" | "neutral";
  isRunning?: boolean;
  flash?: boolean;
}

const colorMap = {
  safe: "text-[hsl(var(--safe))]",
  caution: "text-[hsl(var(--caution))]",
  unstable: "text-[hsl(var(--unstable))]",
  neutral: "text-foreground",
};

export function StatCard({ label, value, subtitle, color, isRunning, flash }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 transition-all duration-300",
        isRunning && "animate-pulse-glow",
        flash && "animate-red-flash"
      )}
    >
      <p className={cn(
        "text-3xl font-bold tabular-nums tracking-tight transition-colors duration-300",
        colorMap[color]
      )}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}
