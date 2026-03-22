import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { DatasetsPanel } from "./DatasetsPanel";

interface SidebarProps {
  rate: number;
  setRate: (v: number) => void;
  networkSize: number;
  setNetworkSize: (v: number) => void;
  hubTargeting: number;
  setHubTargeting: (v: number) => void;
  onRun: () => void;
  onReset: () => void;
  isRunning: boolean;
  result: { rate: number; tippingPercent: number; regime: string } | null;
}

function getRegime(rate: number): { label: string; color: string; bg: string } {
  if (rate <= 1) return { label: "SAFE", color: "text-[hsl(var(--safe))]", bg: "bg-[hsl(var(--safe))]/15 border-[hsl(var(--safe))]/30" };
  if (rate <= 2) return { label: "CAUTION", color: "text-[hsl(var(--caution))]", bg: "bg-[hsl(var(--caution))]/15 border-[hsl(var(--caution))]/30" };
  return { label: "UNSTABLE", color: "text-[hsl(var(--unstable))]", bg: "bg-[hsl(var(--unstable))]/15 border-[hsl(var(--unstable))]/30" };
}

export function ThresholdSidebar({
  rate, setRate, networkSize, setNetworkSize,
  hubTargeting, setHubTargeting, onRun, onReset, isRunning, result
}: SidebarProps) {
  const regime = getRegime(rate);
  const [datasetsOpen, setDatasetsOpen] = useState(false);

  return (
    <aside className="w-[280px] min-w-[280px] h-screen bg-sidebar border-r flex flex-col overflow-y-auto">
      <div className="p-5">
        {/* Title */}
        <h1 className="text-xl font-bold text-foreground tracking-tight">Threshold</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Neural replacement simulator</p>

        {/* Controls */}
        <div className="mt-7">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Simulation Controls</p>

          {/* Replacement rate */}
          <div className="mb-5">
            <div className="flex justify-between items-baseline mb-2">
              <label className="text-xs text-sidebar-foreground">Replacement rate</label>
              <span className="text-xs tabular-nums text-foreground font-medium">{rate}% per step</span>
            </div>
            <Slider
              value={[rate]}
              onValueChange={([v]) => setRate(v)}
              min={0.5} max={10} step={0.5}
              className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
            />
            <div className="mt-2">
              <span className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                regime.bg, regime.color
              )}>
                {regime.label}
              </span>
            </div>
          </div>

          {/* Network size */}
          <div className="mb-5">
            <div className="flex justify-between items-baseline mb-2">
              <label className="text-xs text-sidebar-foreground">Network size</label>
              <span className="text-xs tabular-nums text-foreground font-medium">{networkSize} nodes</span>
            </div>
            <Slider
              value={[networkSize]}
              onValueChange={([v]) => setNetworkSize(v)}
              min={50} max={300} step={50}
              className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
            />
          </div>

          {/* Hub targeting */}
          <div className="mb-6">
            <div className="flex justify-between items-baseline mb-2">
              <div className="flex items-center gap-1">
                <label className="text-xs text-sidebar-foreground">Hub targeting</label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[200px] text-xs">
                    Higher = replace most connected nodes first (worst case scenario)
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-xs tabular-nums text-foreground font-medium">{hubTargeting}%</span>
            </div>
            <Slider
              value={[hubTargeting]}
              onValueChange={([v]) => setHubTargeting(v)}
              min={0} max={100} step={10}
              className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
            />
          </div>

          {/* Buttons */}
          <Button
            onClick={onRun}
            disabled={isRunning}
            className="w-full mb-2 bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 hover:shadow-[0_0_16px_hsla(213,52%,56%,0.25)] transition-all active:scale-[0.97]"
          >
            {isRunning ? "Running…" : "Run simulation"}
          </Button>
          <Button
            onClick={onReset}
            variant="outline"
            className="w-full bg-transparent border-border text-muted-foreground hover:text-foreground active:scale-[0.97]"
          >
            Reset
          </Button>
        </div>

        {/* Result */}
        {result && (
          <div className="mt-4 rounded-md border bg-card p-3">
            <p className="text-xs text-sidebar-foreground">
              At <span className="text-foreground font-medium">{result.rate}%/step</span>: network tipped at{" "}
              <span className="text-foreground font-medium">{result.tippingPercent.toFixed(1)}%</span> replaced.
            </p>
            <span className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold mt-1.5",
              getRegime(result.rate).bg, getRegime(result.rate).color
            )}>
              {result.regime}
            </span>
          </div>
        )}

        {/* Key Finding */}
        <div className="mt-5 rounded-md border-l-2 border-l-[hsl(var(--teal-accent))] bg-card p-3 border border-l-0">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Key Finding</p>
          <p className="text-xs text-sidebar-foreground leading-relaxed">
            Safe threshold: ≤1% per step. Above this rate, cascade failure occurs within 4–19 steps regardless of total volume replaced.
          </p>
        </div>

        {/* Scientific basis */}
        <div className="mt-5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Scientific basis</p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Network topology: Barabási-Albert preferential attachment. Metrics: algebraic connectivity, entropy, LCC fraction, global efficiency. Dataset: Human Connectome Project topology.
          </p>
        </div>

        {/* Datasets Panel */}
        <div className="mt-5 border-t border-border pt-4">
          <DatasetsPanel isOpen={datasetsOpen} onToggle={() => setDatasetsOpen(!datasetsOpen)} />
        </div>
      </div>
    </aside>
  );
}
