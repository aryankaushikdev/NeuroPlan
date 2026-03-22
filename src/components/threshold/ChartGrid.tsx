import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine,
  ResponsiveContainer, ScatterChart, Scatter, ReferenceArea, Tooltip, Cell
} from "recharts";
import type { SimMetrics, PhasePoint } from "@/lib/simulation";

const GRID_STROKE = "hsl(220, 30%, 20%)";
const LABEL_COLOR = "hsl(215, 18%, 40%)";
const SAFE = "hsl(162, 69%, 37%)";
const CAUTION = "hsl(34, 87%, 55%)";
const UNSTABLE = "hsl(2, 72%, 58%)";

function coherenceColor(value: number, baseline: number) {
  if (value > baseline * 0.5) return SAFE;
  if (value > baseline * 0.25) return CAUTION;
  return UNSTABLE;
}

function lccColor(value: number, baseline: number) {
  if (value > baseline * 0.5) return SAFE;
  if (value > baseline * 0.25) return CAUTION;
  return UNSTABLE;
}

interface ChartGridProps {
  data: SimMetrics[];
  baselineCoherence: number;
  baselineLCC: number;
  phaseData: PhasePoint[];
  currentRate: number;
  tippingPercent: number | null;
}

const axisStyle = { fontSize: 10, fill: LABEL_COLOR };
const chartMargin = { top: 8, right: 12, bottom: 4, left: 8 };

export function ChartGrid({ data, baselineCoherence, baselineLCC, phaseData, currentRate, tippingPercent }: ChartGridProps) {
  // Build colored coherence segments
  const coherenceData = data.map(d => ({
    x: +d.percentReplaced.toFixed(1),
    y: +d.coherence.toFixed(4),
    color: coherenceColor(d.coherence, baselineCoherence),
  }));

  const lccData = data.map(d => ({
    x: +d.percentReplaced.toFixed(1),
    y: +d.lccFraction.toFixed(4),
    color: lccColor(d.lccFraction, baselineLCC),
  }));

  const entropyData = data.map(d => ({
    x: +d.percentReplaced.toFixed(1),
    y: +d.entropy.toFixed(4),
  }));

  const tippingX = tippingPercent !== null && tippingPercent < 100 ? tippingPercent : null;

  // Phase diagram with current simulation point
  const phaseWithCurrent = phaseData.map(p => ({
    ...p,
    isCurrent: Math.abs(p.rate - currentRate) < 0.01,
  }));

  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-3 flex-1 min-h-0">
      {/* Chart 1: Coherence */}
      <div className="rounded-lg border bg-card p-3 flex flex-col min-h-0">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Network coherence</p>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={coherenceData} margin={chartMargin}>
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" />
              <XAxis dataKey="x" tick={axisStyle} tickLine={false} axisLine={false} label={{ value: "% replaced", position: "insideBottomRight", offset: -2, style: { fontSize: 9, fill: LABEL_COLOR } }} />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} domain={[0, 1]} />
              <ReferenceLine y={baselineCoherence} stroke={LABEL_COLOR} strokeDasharray="6 4" label={{ value: "Baseline", position: "right", style: { fontSize: 9, fill: LABEL_COLOR } }} />
              <Line type="monotone" dataKey="y" stroke={SAFE} strokeWidth={2} dot={false} isAnimationActive={false} />
              <Tooltip contentStyle={{ background: "hsl(220,45%,11%)", border: "1px solid hsl(220,30%,20%)", fontSize: 11, color: "#fff" }} labelFormatter={v => `${v}% replaced`} formatter={(v: number) => [v.toFixed(4), "Coherence"]} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Connected Component */}
      <div className="rounded-lg border bg-card p-3 flex flex-col min-h-0">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Connected component</p>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lccData} margin={chartMargin}>
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" />
              <XAxis dataKey="x" tick={axisStyle} tickLine={false} axisLine={false} />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} domain={[0, 1]} />
              <ReferenceLine y={0.5} stroke={UNSTABLE} strokeDasharray="6 4" label={{ value: "Collapse threshold", position: "right", style: { fontSize: 9, fill: UNSTABLE } }} />
              <Line type="monotone" dataKey="y" stroke={SAFE} strokeWidth={2} dot={false} isAnimationActive={false} />
              <Tooltip contentStyle={{ background: "hsl(220,45%,11%)", border: "1px solid hsl(220,30%,20%)", fontSize: 11, color: "#fff" }} labelFormatter={v => `${v}% replaced`} formatter={(v: number) => [v.toFixed(4), "LCC Fraction"]} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 3: Entropy */}
      <div className="rounded-lg border bg-card p-3 flex flex-col min-h-0">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Network entropy</p>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={entropyData} margin={chartMargin}>
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" />
              <XAxis dataKey="x" tick={axisStyle} tickLine={false} axisLine={false} />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
              {tippingX !== null && (
                <ReferenceLine x={+tippingX.toFixed(1)} stroke={CAUTION} strokeDasharray="6 4" label={{ value: "Tipping point", position: "top", style: { fontSize: 9, fill: CAUTION } }} />
              )}
              <Line type="monotone" dataKey="y" stroke="hsl(10, 70%, 60%)" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Tooltip contentStyle={{ background: "hsl(220,45%,11%)", border: "1px solid hsl(220,30%,20%)", fontSize: 11, color: "#fff" }} labelFormatter={v => `${v}% replaced`} formatter={(v: number) => [v.toFixed(4), "Entropy"]} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 4: Phase Diagram */}
      <div className="rounded-lg border bg-card p-3 flex flex-col min-h-0">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Replacement rate curve</p>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={chartMargin}>
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" />
              <XAxis type="number" dataKey="rate" domain={[0, 11]} tick={axisStyle} tickLine={false} axisLine={false} label={{ value: "Rate (%/step)", position: "insideBottomRight", offset: -2, style: { fontSize: 9, fill: LABEL_COLOR } }} />
              <YAxis type="number" dataKey="tippingPercent" domain={[0, 100]} tick={axisStyle} tickLine={false} axisLine={false} label={{ value: "% at tipping", angle: -90, position: "insideLeft", style: { fontSize: 9, fill: LABEL_COLOR } }} />
              {/* Zone backgrounds */}
              <ReferenceArea x1={0} x2={1.5} y1={0} y2={100} fill={SAFE} fillOpacity={0.08} label={{ value: "Safe", position: "insideTopLeft", style: { fontSize: 9, fill: SAFE } }} />
              <ReferenceArea x1={1.5} x2={3} y1={0} y2={100} fill={CAUTION} fillOpacity={0.08} label={{ value: "Caution", position: "insideTopLeft", style: { fontSize: 9, fill: CAUTION } }} />
              <ReferenceArea x1={3} x2={11} y1={0} y2={100} fill={UNSTABLE} fillOpacity={0.08} label={{ value: "Unstable", position: "insideTopLeft", style: { fontSize: 9, fill: UNSTABLE } }} />
              <ReferenceLine x={1.5} stroke={CAUTION} strokeDasharray="6 4" />
              <Scatter data={phaseWithCurrent} isAnimationActive={false}>
                {phaseWithCurrent.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.isCurrent ? "hsl(213, 52%, 56%)" : LABEL_COLOR}
                    r={entry.isCurrent ? 7 : 4}
                    stroke={entry.isCurrent ? "#fff" : "none"}
                    strokeWidth={entry.isCurrent ? 2 : 0}
                  />
                ))}
              </Scatter>
              <Tooltip contentStyle={{ background: "hsl(220,45%,11%)", border: "1px solid hsl(220,30%,20%)", fontSize: 11, color: "#fff" }} formatter={(v: number, name: string) => [name === "tippingPercent" ? `${v.toFixed(1)}%` : `${v}%/step`, name === "tippingPercent" ? "Tipping at" : "Rate"]} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
