// Barabási-Albert network + simulation engine

export interface Network {
  adjList: Map<number, Set<number>>;
  nextId: number;
}

export interface SimMetrics {
  coherence: number;
  lccFraction: number;
  entropy: number;
  step: number;
  percentReplaced: number;
  tippingDetected: boolean;
}

export function generateBANetwork(n: number): Network {
  const adjList = new Map<number, Set<number>>();
  // Start with a complete graph of 5 nodes
  const m0 = Math.min(5, n);
  for (let i = 0; i < m0; i++) {
    adjList.set(i, new Set<number>());
    for (let j = 0; j < i; j++) {
      adjList.get(i)!.add(j);
      adjList.get(j)!.add(i);
    }
  }

  // Add nodes one by one with preferential attachment (m=3 edges per new node)
  const m = 3;
  for (let i = m0; i < n; i++) {
    adjList.set(i, new Set<number>());
    const targets = selectByPreferentialAttachment(adjList, m, i);
    for (const t of targets) {
      adjList.get(i)!.add(t);
      adjList.get(t)!.add(i);
    }
  }

  return { adjList, nextId: n };
}

function selectByPreferentialAttachment(adjList: Map<number, Set<number>>, m: number, exclude: number): number[] {
  const nodes = Array.from(adjList.keys());
  const degrees = nodes.map(n => adjList.get(n)!.size);
  const totalDegree = degrees.reduce((a, b) => a + b, 0) || 1;
  
  const selected = new Set<number>();
  let attempts = 0;
  while (selected.size < Math.min(m, nodes.length) && attempts < 1000) {
    let r = Math.random() * totalDegree;
    for (let i = 0; i < nodes.length; i++) {
      r -= degrees[i];
      if (r <= 0) {
        if (nodes[i] !== exclude) selected.add(nodes[i]);
        break;
      }
    }
    attempts++;
  }
  return Array.from(selected);
}

export function computeMetrics(network: Network, totalNodes: number): Omit<SimMetrics, 'step' | 'percentReplaced' | 'tippingDetected'> {
  const nodes = Array.from(network.adjList.keys());
  const n = nodes.length;
  if (n === 0) return { coherence: 0, lccFraction: 0, entropy: 0 };

  // Degree distribution
  const degrees = nodes.map(id => network.adjList.get(id)!.size);
  
  // Coherence: inverse of normalized degree variance
  const meanDeg = degrees.reduce((a, b) => a + b, 0) / n;
  const variance = degrees.reduce((s, d) => s + (d - meanDeg) ** 2, 0) / n;
  const maxVariance = meanDeg * meanDeg; // rough normalization
  const coherence = maxVariance > 0 ? Math.max(0, Math.min(1, 1 - variance / (maxVariance + variance))) : 1;

  // LCC via BFS
  const visited = new Set<number>();
  let maxComponent = 0;
  for (const node of nodes) {
    if (visited.has(node)) continue;
    const queue = [node];
    let size = 0;
    visited.add(node);
    while (queue.length > 0) {
      const curr = queue.shift()!;
      size++;
      for (const neighbor of network.adjList.get(curr)!) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    maxComponent = Math.max(maxComponent, size);
  }
  const lccFraction = n > 0 ? maxComponent / totalNodes : 0;

  // Shannon entropy of degree distribution
  const degCounts = new Map<number, number>();
  for (const d of degrees) {
    degCounts.set(d, (degCounts.get(d) || 0) + 1);
  }
  let entropy = 0;
  for (const count of degCounts.values()) {
    const p = count / n;
    if (p > 0) entropy -= p * Math.log(p);
  }

  return { coherence, lccFraction, entropy };
}

export function simulationStep(
  network: Network,
  rate: number,
  hubTargeting: number,
  originalSize: number
): Network {
  const adjList = new Map(Array.from(network.adjList.entries()).map(([k, v]) => [k, new Set(v)]));
  const numToReplace = Math.max(1, Math.floor(originalSize * rate / 100));
  
  // Sort nodes by degree for hub targeting
  const nodes = Array.from(adjList.keys());
  const nodesByDegree = nodes.map(id => ({ id, degree: adjList.get(id)!.size }))
    .sort((a, b) => b.degree - a.degree);
  
  // Select nodes to remove: mix of hub-targeted and random
  const toRemove: number[] = [];
  const hubCount = Math.round(numToReplace * hubTargeting / 100);
  const randomCount = numToReplace - hubCount;
  
  // Take top-degree nodes
  for (let i = 0; i < Math.min(hubCount, nodesByDegree.length); i++) {
    toRemove.push(nodesByDegree[i].id);
  }
  
  // Take random nodes from the rest
  const remaining = nodesByDegree.slice(hubCount).map(n => n.id);
  for (let i = 0; i < Math.min(randomCount, remaining.length); i++) {
    const idx = Math.floor(Math.random() * remaining.length);
    toRemove.push(remaining[idx]);
    remaining.splice(idx, 1);
  }
  
  // Remove selected nodes
  for (const nodeId of toRemove) {
    const neighbors = adjList.get(nodeId);
    if (neighbors) {
      for (const neighbor of neighbors) {
        adjList.get(neighbor)?.delete(nodeId);
      }
      adjList.delete(nodeId);
    }
  }
  
  // Add replacement nodes with 2-3 random connections
  let nextId = network.nextId;
  const existingNodes = Array.from(adjList.keys());
  for (let i = 0; i < toRemove.length; i++) {
    if (existingNodes.length === 0) break;
    const newId = nextId++;
    adjList.set(newId, new Set<number>());
    const numConnections = 2 + Math.floor(Math.random() * 2); // 2-3
    const targets = new Set<number>();
    let attempts = 0;
    while (targets.size < Math.min(numConnections, existingNodes.length) && attempts < 50) {
      const target = existingNodes[Math.floor(Math.random() * existingNodes.length)];
      targets.add(target);
      attempts++;
    }
    for (const t of targets) {
      adjList.get(newId)!.add(t);
      adjList.get(t)?.add(newId);
    }
    existingNodes.push(newId);
  }
  
  return { adjList, nextId };
}

export interface PhasePoint {
  rate: number;
  tippingPercent: number;
}

export function runFullSimulation(
  networkSize: number,
  rate: number,
  hubTargeting: number,
  maxSteps: number = 100
): { metrics: SimMetrics[]; tippingPercent: number } {
  let network = generateBANetwork(networkSize);
  const baseline = computeMetrics(network, networkSize);
  const metrics: SimMetrics[] = [];
  let tippingPercent = 100;
  let totalReplaced = 0;
  const replacePerStep = Math.max(1, Math.floor(networkSize * rate / 100));

  for (let step = 0; step < maxSteps; step++) {
    network = simulationStep(network, rate, hubTargeting, networkSize);
    totalReplaced += replacePerStep;
    const pctReplaced = Math.min(100, (totalReplaced / networkSize) * 100);
    const m = computeMetrics(network, networkSize);
    const tipping = m.lccFraction < baseline.lccFraction * 0.7 || m.coherence < baseline.coherence * 0.4;
    
    metrics.push({
      ...m,
      step: step + 1,
      percentReplaced: pctReplaced,
      tippingDetected: tipping,
    });

    if (tipping && tippingPercent === 100) {
      tippingPercent = pctReplaced;
    }
    if (pctReplaced >= 85) break;
  }

  return { metrics, tippingPercent };
}

export function precomputePhaseData(networkSize: number, hubTargeting: number): PhasePoint[] {
  const rates = [0.5, 1, 2, 3, 5, 8, 10];
  return rates.map(rate => {
    const { tippingPercent } = runFullSimulation(networkSize, rate, hubTargeting);
    return { rate, tippingPercent };
  });
}
