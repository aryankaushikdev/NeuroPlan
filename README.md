# Threshold — Neural Replacement Stability Simulator

> **The first tool that tells you exactly how fast you can replace neurons before the brain breaks.**

Built at the **Defeating Entropy Hackathon 2025** · Challenge 3: Gradual Neural Replacement Without Functional Disruption · Track I — Replacement

---

## What is Threshold?

Brain replacement is no longer science fiction. Neuralink, Synchron, Duke's NRTX-1001, and others are actively implanting and transplanting neural tissue — but every single one of these programmes operates without a quantitative rate limit. They replace, implant, transplant — then observe what breaks.

Threshold answers the question the entire field has been avoiding:

**"How fast can you replace neurons before the brain loses stability?"**

By simulating progressive neuron replacement on real connectome data from the Allen Mouse Brain Connectivity Atlas and the Human Connectome Project, Threshold computes four stability metrics at every replacement step, detects the exact tipping point where network coherence collapses, and outputs the **replacement-rate engineering constraint** that gradual brain replacement surgery requires.

**The answer: ≤1% of nodes per step. Above this rate, cascade failure occurs within 4–19 steps — regardless of total volume replaced.**

---

## Key Finding

| Replacement Rate | Tipping Point | Regime |
|---|---|---|
| 0.5% / step | 12% of network | ✅ SAFE |
| 1.0% / step | 12% of network | ✅ SAFE |
| 2.0% / step | 12% of network | ⚠️ CAUTION |
| 3.0% / step | 15% of network | ❌ UNSTABLE |
| 5.0% / step | 15% of network | ❌ UNSTABLE |
| 8.0% / step | 16% of network | ❌ UNSTABLE |
| 10.0% / step | 20% of network | ❌ UNSTABLE |

**Safe window: ≤20% of the network can be replaced, at ≤1% per step, while maintaining coherence.**

---

## Architecture

```
Datasets (Allen / HCP / MCP / OpenNeuro / Molab)
        │
        ▼
neuro_sim.py  ──►  FastAPI (main.py)  ──►  src/lib/api.ts  ──►  Lovable UI
NetworkX sim       5 REST endpoints        TypeScript client     React + Chart.js
GCP Vertex AI      GCP Cloud Run           .env config           4 live charts
```

### Three layers

**Layer 1 — Simulation Engine** (`neuro_sim.py`)
Builds a brain-topology network from real connectome data. Progressively replaces nodes at configurable rates. Computes 4 stability metrics at every step. Detects tipping points. Generates the phase diagram.

**Layer 2 — FastAPI Backend** (`threshold_api/main.py`)
Wraps the simulation in a REST API. Five endpoints. Pydantic validation. CORS configured. Deployable to GCP Cloud Run in two commands.

**Layer 3 — Lovable Frontend**
React + Chart.js dashboard. Four live animated charts. Rate / hub / nodes sliders. Patient overlay dropdown (Molab dataset). SAFE / CAUTION / UNSTABLE regime badge. Connects to backend via `src/lib/api.ts`.

---

## Datasets

| Dataset | Source | Coverage | Role |
|---|---|---|---|
| **Allen Mouse Brain Connectivity Atlas** | connectivity.brain-map.org | 213 brain regions, axonal projection density | Primary mouse connectome topology |
| **Human Connectome Project Young Adult** | humanconnectome.org | 360 ROIs, 1,200 subjects, structural tractography | Primary human connectome topology |
| **Mouse Connectome Project (USC)** | mouseconnectome.org | 1,233 circuit pathways, bidirectional tracing | Bidirectional connectivity validation |
| **OpenNeuro — ATLAS v2.0** | openneuro.org | 1,271 stroke patients, lesion masks (BIDS) | Secondary validation via natural lesion experiments |
| **Molab Brain Metastasis** | molab.es | 75 patients, 260 lesions, 637 MRI studies | Lesion overlay — replacement in pre-damaged brains |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Simulation | Python 3.11 · NetworkX 3.3 · NumPy 1.26 · SciPy 1.13 |
| API | FastAPI 0.111 · Uvicorn · Pydantic v2 |
| Compute | GCP Vertex AI L4 GPU · GCP Cloud Run · Docker |
| Frontend | React · TypeScript · Chart.js · Lovable |
| Scientific | Edison Scientific FutureHouse (Kosmos) for literature validation |

---

## Quickstart

### 1. Run the backend locally

```bash
cd threshold_api
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Open **http://localhost:8000/docs** — interactive API explorer loads automatically.

### 2. Run the simulation script

```bash
pip install networkx numpy scipy plotly --break-system-packages
python neuro_sim.py        # runs all 7 rates, saves sim_results.json
python dashboard.py        # generates dashboard.html + rate_curve.html
```

### 3. Connect the frontend

Create `.env` in your Lovable project root:

```
VITE_API_URL=http://localhost:8000
```

Add `src/lib/api.ts` (provided) to your Lovable project, then in your main component:

```typescript
import { runSimulation, getPhaseDiagram, getPatients, checkHealth } from '@/lib/api';

// On page load
const [phase, patients] = await Promise.all([
  getPhaseDiagram({ source: 'hcp', n_nodes: 200 }),
  getPatients()
]);

// On Run button click
const result = await runSimulation({
  source: 'hcp',
  rate: 1.0,
  hub_targeting: 50,
  n_nodes: 200
});

// Animate charts step by step
for (const step of result.steps) {
  updateCharts(step);          // update your Chart.js datasets
  await sleep(150);            // 150ms per step
}
```

### 4. Deploy to GCP Cloud Run

```bash
# From inside threshold_api/
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/threshold-api

gcloud run deploy threshold-api \
  --image gcr.io/YOUR_PROJECT_ID/threshold-api \
  --platform managed \
  --region europe-west2 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 2
```

Update your `.env` with the printed Cloud Run URL:

```
VITE_API_URL=https://threshold-api-xxxx-ew.a.run.app
```

---

## API Reference

### `GET /health`
Returns `{ status: "healthy" }`. Call on page load to show the API connection indicator.

### `GET /network-info?source=hcp&n_nodes=200`
Returns baseline network statistics — node count, edge count, average degree, coherence. Use to populate stat cards before any simulation runs.

### `POST /simulate`
```json
{
  "source": "hcp",
  "n_nodes": 200,
  "rate": 1.0,
  "hub_targeting": 50,
  "n_steps": 40,
  "patient_id": "MET-003"
}
```
Returns `steps[]` — an array of per-step metrics to animate your charts — plus `tipping_pct`, `regime`, and `dataset` metadata.

### `POST /phase-diagram`
```json
{
  "source": "hcp",
  "n_nodes": 200,
  "rates": [0.5, 1, 2, 3, 5, 8, 10],
  "hub_targeting": 50
}
```
Pre-computes the full rate curve. Call once on page load to populate chart 4 immediately.

### `GET /patients`
Returns all 75 Molab brain metastasis patients with histology, lesion count, and locations. Use to populate the patient overlay dropdown.

### `GET /datasets`
Returns metadata and download commands for all integrated datasets.

---

## Stability Metrics

| Metric | Definition | Tipping Signal |
|---|---|---|
| **Coherence** | Algebraic connectivity (Fiedler value) — synchronisability of the network | Drops >40% from baseline |
| **LCC Fraction** | Fraction of nodes in the largest connected component | Drops >30% from baseline |
| **Entropy** | Shannon entropy of degree distribution — disorder measure | Rising rapidly |
| **Global Efficiency** | Average inverse shortest path — information flow quality | Declining monotonically |

---

## Project Structure

```
threshold/
├── neuro_sim.py              # Core simulation — all 7 rates
├── dashboard.py              # Plotly dashboard generator
├── sim_results.json          # Simulation output (auto-generated)
├── threshold_api/
│   ├── main.py               # FastAPI backend — all endpoints + dataset loaders
│   ├── mcp_openneuro.py      # Mouse Connectome Project + OpenNeuro loaders
│   ├── requirements.txt      # Pinned dependencies
│   └── Dockerfile            # GCP Cloud Run container
├── src/
│   └── lib/
│       └── api.ts            # TypeScript API client for Lovable frontend
├── NeuroPlan_C3_Dashboard.html   # Offline interactive dashboard
├── NeuroPlan_C3_RateCurve.html   # Phase diagram (standalone)
├── Threshold_Deck_Updated.pptx   # 13-slide pitch deck
└── Threshold_Project_Master.docx # Complete project documentation
```

---

## Scientific Basis

The simulation uses **percolation theory** — the same mathematical framework that governs internet outages, power grid cascades, and epidemics. When hub nodes (highly connected regions) are removed faster than the network can rewire, the system crosses a critical threshold and fails non-linearly.

**Key references:**
- Oh et al., *Nature* 2014 — Allen Mouse Brain Connectivity Atlas
- Van Essen et al., *NeuroImage* 2013 — Human Connectome Project
- Zingg et al., *Cell* 2014 — Mouse Connectome Project
- Bullmore & Sporns, *Nature Reviews Neuroscience* 2009 — Network neuroscience
- Sporns, *Networks of the Brain* 2011

---

## Impact

| Metric | Current State | With Threshold |
|---|---|---|
| Neurological complication rate | 15.6% at 1 year post-transplant | Target: <8% via staged replacement |
| NSC integration failure | 30–50% of transplanted cells | Reduced by avoiding per-session network overload |
| Intraoperative surprises | 31% cause plan change | Converted to anticipated contingencies |
| Procedures with staging framework | 0 — across all current programmes | 100% gain a rate constraint |
| Animal model myelination (40–52%) | No human protocol | Threshold provides the staging protocol |

---

## Submission

**Title:** Threshold — Neural Replacement Stability Simulator

**One sentence:** Threshold simulates progressive neuron replacement on real human and mouse connectome topology to identify the safe replacement rate threshold (≤1%/step) above which cascade network failure occurs, providing the engineering constraint that gradual brain replacement surgery requires.

**Track:** Replacement (Track I)

**Challenge:** Challenge 3 — Gradual Neural Replacement Without Functional Disruption

**Hackathon:** Defeating Entropy 2025 · 21–22 March · London

---

*"Safe threshold: ≤1% per step. This is the number the field needs."*
