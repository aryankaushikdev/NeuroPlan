import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { datasetsApi, type Dataset, type DataSource, type AllenStructure, type AllenExperiment } from "@/lib/api/datasets";
import { Database, ExternalLink, Globe, FlaskConical, ChevronDown, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function SpeciesBadge({ species }: { species: string }) {
  const isHuman = species.toLowerCase() === "human";
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider border",
      isHuman
        ? "text-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 border-[hsl(var(--primary))]/25"
        : "text-[hsl(var(--teal-accent))] bg-[hsl(var(--teal-accent))]/10 border-[hsl(var(--teal-accent))]/25"
    )}>
      {species}
    </span>
  );
}

function ApiBadge({ available }: { available: boolean }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider border",
      available
        ? "text-[hsl(var(--safe))] bg-[hsl(var(--safe))]/10 border-[hsl(var(--safe))]/25"
        : "text-muted-foreground bg-muted/30 border-border"
    )}>
      {available ? "API" : "Manual"}
    </span>
  );
}

function DatasetCard({ dataset, onExplore }: { dataset: Dataset; onExplore?: () => void }) {
  return (
    <div className="rounded-md border bg-card p-3 hover:border-[hsl(var(--primary))]/40 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h4 className="text-xs font-medium text-foreground leading-tight line-clamp-2">{dataset.name}</h4>
        <a href={dataset.sourceUrl} target="_blank" rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed mb-2 line-clamp-2">{dataset.description}</p>
      <div className="flex items-center gap-1.5 flex-wrap">
        <SpeciesBadge species={dataset.species} />
        <ApiBadge available={dataset.apiAvailable} />
        {dataset.nodeCount && (
          <span className="text-[9px] text-muted-foreground">{dataset.nodeCount} regions</span>
        )}
        {dataset.subjects && (
          <span className="text-[9px] text-muted-foreground">{dataset.subjects} subjects</span>
        )}
      </div>
      {dataset.apiAvailable && dataset.source === "Allen Brain Atlas" && onExplore && (
        <Button
          onClick={onExplore}
          size="sm"
          variant="outline"
          className="mt-2 h-6 text-[10px] px-2 bg-transparent border-border text-muted-foreground hover:text-foreground"
        >
          <FlaskConical className="w-3 h-3 mr-1" /> Explore structures
        </Button>
      )}
    </div>
  );
}

function SourceHeader({ source }: { source: DataSource }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors group"
    >
      <Globe className="w-3 h-3" />
      <span>{source.name}</span>
      {source.api && (
        <span className="text-[8px] text-[hsl(var(--safe))] opacity-60 group-hover:opacity-100">● live</span>
      )}
    </a>
  );
}

function AllenExplorer() {
  const [selectedStructure, setSelectedStructure] = useState<number | null>(null);

  const { data: structures, isLoading: loadingStructures } = useQuery({
    queryKey: ["allen-structures"],
    queryFn: () => datasetsApi.getAllenStructures(),
  });

  const { data: experiments, isLoading: loadingExperiments } = useQuery({
    queryKey: ["allen-experiments", selectedStructure],
    queryFn: () => datasetsApi.getAllenExperiments(selectedStructure ?? undefined),
    enabled: selectedStructure !== null,
  });

  return (
    <div className="mt-2 rounded-md border bg-[hsl(var(--background))]/50 p-2">
      <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-2">Allen Brain Structures</p>
      {loadingStructures ? (
        <div className="flex items-center gap-1.5 py-2">
          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">Loading structures…</span>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1 mb-2 max-h-24 overflow-y-auto">
          {(structures || []).slice(0, 30).map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedStructure(s.id)}
              className={cn(
                "rounded px-1.5 py-0.5 text-[9px] font-medium border transition-colors",
                selectedStructure === s.id
                  ? "bg-[hsl(var(--primary))]/20 border-[hsl(var(--primary))]/40 text-foreground"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>{s.acronym}</span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">{s.name}</TooltipContent>
              </Tooltip>
            </button>
          ))}
        </div>
      )}

      {selectedStructure !== null && (
        <div className="mt-1">
          <p className="text-[9px] text-muted-foreground mb-1">Projection data ({experiments?.length || 0} entries)</p>
          {loadingExperiments ? (
            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          ) : (
            <div className="max-h-32 overflow-y-auto space-y-0.5">
              {(experiments || []).slice(0, 10).map(e => (
                <div key={e.id} className="flex items-center justify-between text-[9px] px-1.5 py-0.5 rounded bg-card border">
                  <span className="text-muted-foreground">Exp #{e.experimentId} → Structure {e.structureId}</span>
                  <span className="text-foreground tabular-nums">
                    {(e.normalizedProjectionVolume * 100).toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DatasetsPanel({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const [showAllenExplorer, setShowAllenExplorer] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["datasets-catalog"],
    queryFn: () => datasetsApi.list(),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="flex flex-col">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors py-1"
      >
        {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        <Database className="w-3 h-3" />
        Available Resources
      </button>

      {isOpen && (
        <div className="mt-2">
          {/* Source links */}
          {data?.sources && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
              {data.sources.map(s => (
                <SourceHeader key={s.name} source={s} />
              ))}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center gap-2 py-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Fetching datasets from live APIs…</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 py-3 text-[hsl(var(--unstable))]">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="text-xs">Failed to fetch datasets. Check edge function deployment.</span>
            </div>
          )}

          {data?.datasets && (
            <ScrollArea className="max-h-[280px]">
              <div className="space-y-2 pr-2">
                {data.datasets.map(d => (
                  <DatasetCard
                    key={d.id}
                    dataset={d}
                    onExplore={d.source === "Allen Brain Atlas" ? () => setShowAllenExplorer(true) : undefined}
                  />
                ))}
              </div>
            </ScrollArea>
          )}

          {showAllenExplorer && <AllenExplorer />}
        </div>
      )}
    </div>
  );
}
