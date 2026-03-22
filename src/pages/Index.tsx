import { useState, useEffect, useRef, useCallback } from "react";
import { ThresholdSidebar } from "@/components/threshold/Sidebar";
import { StatCard } from "@/components/threshold/StatCard";
import { ChartGrid } from "@/components/threshold/ChartGrid";
import {
  generateBANetwork,
  computeMetrics,
  simulationStep,
  precomputePhaseData,
  type Network,
  type SimMetrics,
  type PhasePoint,
} from "@/lib/simulation";
import { toast } from "sonner";

function getStatColor(value: number, baseline: number): "safe" | "caution" | "unstable" | "neutral" {
  if (baseline === 0) return "neutral";
  const ratio = value / baseline;
  if (ratio > 0.5) return "safe";
  if (ratio > 0.25) return "caution";
  return "unstable";
}

export default function Index() {
  const [rate, setRate] = useState(1);
  const [networkSize, setNetworkSize] = useState(200);
  const [hubTargeting, setHubTargeting] = useState(50);
  const [isRunning, setIsRunning] = useState(false);
  const [simData, setSimData] = useState<SimMetrics[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<SimMetrics | null>(null);
  const [baselineCoherence, setBaselineCoherence] = useState(0.8);
  const [baselineLCC, setBaselineLCC] = useState(1);
  const [baselineEntropy, setBaselineEntropy] = useState(1);
  const [phaseData, setPhaseData] = useState<PhasePoint[]>([]);
  const [tippingDetectedAt, setTippingDetectedAt] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [result, setResult] = useState<{ rate: number; tippingPercent: number; regime: string } | null>(null);

  const networkRef = useRef<Network | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepRef = useRef(0);
  const replacedRef = useRef(0);
  const tippingFoundRef = useRef(false);

  // Pre-compute phase data on mount and when params change
  useEffect(() => {
    const data = precomputePhaseData(networkSize, hubTargeting);
    setPhaseData(data);
  }, [networkSize, hubTargeting]);

  const stopSim = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const runSim = useCallback(() => {
    stopSim();
    setSimData([]);
    setTippingDetectedAt(null);
    setFlash(false);
    tippingFoundRef.current = false;
    setResult(null);

    const network = generateBANetwork(networkSize);
    networkRef.current = network;
    const baseline = computeMetrics(network, networkSize);
    setBaselineCoherence(baseline.coherence);
    setBaselineLCC(baseline.lccFraction);
    setBaselineEntropy(baseline.entropy);
    setCurrentMetrics({
      coherence: baseline.coherence,
      lccFraction: baseline.lccFraction,
      entropy: baseline.entropy,
      step: 0,
      percentReplaced: 0,
      tippingDetected: false,
    });

    stepRef.current = 0;
    replacedRef.current = 0;
    setIsRunning(true);

    const replacePerStep = Math.max(1, Math.floor(networkSize * rate / 100));
    const blCoherence = baseline.coherence;
    const blLCC = baseline.lccFraction;

    intervalRef.current = setInterval(() => {
      if (!networkRef.current) return;

      networkRef.current = simulationStep(networkRef.current, rate, hubTargeting, networkSize);
      stepRef.current += 1;
      replacedRef.current += replacePerStep;
      const pctReplaced = Math.min(100, (replacedRef.current / networkSize) * 100);
      const m = computeMetrics(networkRef.current, networkSize);
      const tipping = m.lccFraction < blLCC * 0.7 || m.coherence < blCoherence * 0.4;

      const metrics: SimMetrics = {
        ...m,
        step: stepRef.current,
        percentReplaced: pctReplaced,
        tippingDetected: tipping,
      };

      setCurrentMetrics(metrics);
      setSimData(prev => [...prev, metrics]);

      if (tipping && !tippingFoundRef.current) {
        tippingFoundRef.current = true;
        setTippingDetectedAt(pctReplaced);
        setFlash(true);
        toast.error(`Tipping point detected at ${pctReplaced.toFixed(1)}% replaced`);
        setTimeout(() => setFlash(false), 1000);
      }

        if (pctReplaced >= 85) {
        // Done
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsRunning(false);
        const regime = rate <= 1 ? "SAFE" : rate <= 2 ? "CAUTION" : "UNSTABLE";
        setResult({
          rate,
          tippingPercent: pctReplaced,
          regime,
        });
        // Also update phase data with this result
        setPhaseData(prev => {
          const existing = prev.filter(p => Math.abs(p.rate - rate) > 0.01);
          return [...existing, { rate, tippingPercent: tippingFoundRef.current ? pctReplaced : 100 }].sort((a, b) => a.rate - b.rate);
        });
      }
    }, 200);
  }, [rate, networkSize, hubTargeting, stopSim]);

  const handleReset = useCallback(() => {
    stopSim();
    setSimData([]);
    setCurrentMetrics(null);
    setTippingDetectedAt(null);
    setFlash(false);
    setResult(null);
    networkRef.current = null;
  }, [stopSim]);

  const cm = currentMetrics;

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <ThresholdSidebar
        rate={rate} setRate={setRate}
        networkSize={networkSize} setNetworkSize={setNetworkSize}
        hubTargeting={hubTargeting} setHubTargeting={setHubTargeting}
        onRun={runSim} onReset={handleReset}
        isRunning={isRunning} result={result}
      />

      <main className="flex-1 flex flex-col p-4 gap-3 min-h-0 overflow-hidden">
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard
            label="Coherence"
            value={cm ? cm.coherence.toFixed(4) : "—"}
            color={cm ? getStatColor(cm.coherence, baselineCoherence) : "neutral"}
            isRunning={isRunning}
            flash={flash}
          />
          <StatCard
            label="LCC Fraction"
            value={cm ? (cm.lccFraction * 100).toFixed(1) + "%" : "—"}
            color={cm ? getStatColor(cm.lccFraction, baselineLCC) : "neutral"}
            isRunning={isRunning}
            flash={flash}
          />
          <StatCard
            label="Entropy"
            value={cm ? cm.entropy.toFixed(4) : "—"}
            color={cm && baselineEntropy > 0 && cm.entropy > baselineEntropy * 1.5 ? "unstable" : cm && cm.entropy > baselineEntropy * 1.2 ? "caution" : "neutral"}
            isRunning={isRunning}
            flash={flash}
          />
          <StatCard
            label="Step"
            value={cm ? String(cm.step) : "0"}
            subtitle={cm ? `${cm.percentReplaced.toFixed(1)}% replaced` : "0% replaced"}
            color="neutral"
            isRunning={isRunning}
            flash={flash}
          />
        </div>

        {/* Chart Grid */}
        <ChartGrid
          data={simData}
          baselineCoherence={baselineCoherence}
          baselineLCC={baselineLCC}
          phaseData={phaseData}
          currentRate={rate}
          tippingPercent={tippingDetectedAt}
        />
      </main>
    </div>
  );
}
