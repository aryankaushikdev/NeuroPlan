import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Allen Brain Institute RMA API
async function fetchAllenBrainDatasets() {
  const url =
    "https://api.brain-map.org/api/v2/data/query.json?criteria=model::Product,rma::criteria,[name$like'*Connectivity*'],rma::options[num_rows$eq50]";
  try {
    const res = await fetch(url);
    const json = await res.json();
    const products = (json.msg || []).map((p: any) => ({
      id: `allen-${p.id}`,
      source: "Allen Brain Atlas",
      sourceUrl: "https://connectivity.brain-map.org/",
      name: p.name || p.abbreviation || "Mouse Brain Connectivity",
      description: p.description || "Projection data from the Allen Mouse Brain Connectivity Atlas.",
      species: (p.name || "").toLowerCase().includes("human") ? "Human" : "Mouse",
      modality: "Tract tracing / Connectivity",
      nodeCount: null,
      apiAvailable: true,
    }));
    // Always include the main connectivity product even if API returns empty
    if (products.length === 0) {
      products.push({
        id: "allen-connectivity",
        source: "Allen Brain Atlas",
        sourceUrl: "https://connectivity.brain-map.org/",
        name: "Mouse Brain Connectivity Atlas",
        description:
          "Mesoscale connectivity atlas with ~2,900 injection experiments mapping projection pathways across the mouse brain using viral tracers.",
        species: "Mouse",
        modality: "Viral tract tracing",
        nodeCount: 295,
        apiAvailable: true,
      });
    }
    return products;
  } catch (e) {
    console.error("Allen Brain API error:", e);
    return [
      {
        id: "allen-connectivity",
        source: "Allen Brain Atlas",
        sourceUrl: "https://connectivity.brain-map.org/",
        name: "Mouse Brain Connectivity Atlas",
        description:
          "Mesoscale connectivity atlas with ~2,900 injection experiments mapping projection pathways across the mouse brain.",
        species: "Mouse",
        modality: "Viral tract tracing",
        nodeCount: 295,
        apiAvailable: true,
      },
    ];
  }
}

// Allen Brain: fetch actual connectivity experiments
async function fetchAllenExperiments(structureId?: number) {
  const criteria = structureId
    ? `rma::criteria,[injection_structures$eq${structureId}]`
    : "";
  const url = `https://api.brain-map.org/api/v2/data/query.json?criteria=model::ProjectionStructureUnionize,${criteria}rma::options[num_rows$eq25][order$eq'normalized_projection_volume$desc']`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    return (json.msg || []).slice(0, 25).map((e: any) => ({
      id: e.id,
      experimentId: e.experiment_id,
      structureId: e.structure_id,
      hemisphere: e.hemisphere_id === 1 ? "left" : e.hemisphere_id === 2 ? "right" : "both",
      projectionVolume: e.projection_volume,
      normalizedProjectionVolume: e.normalized_projection_volume,
      projectionDensity: e.projection_density,
      projectionEnergy: e.projection_energy,
    }));
  } catch (e) {
    console.error("Allen experiments error:", e);
    return [];
  }
}

// Allen Brain: fetch brain structures (regions)
async function fetchAllenStructures() {
  const url =
    "https://api.brain-map.org/api/v2/data/query.json?criteria=model::Structure,rma::criteria,[graph_id$eq1],rma::options[num_rows$eq50][order$eq'graph_order']";
  try {
    const res = await fetch(url);
    const json = await res.json();
    return (json.msg || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      acronym: s.acronym,
      parentId: s.parent_structure_id,
      color: s.color_hex_triplet ? `#${s.color_hex_triplet}` : null,
    }));
  } catch (e) {
    console.error("Allen structures error:", e);
    return [];
  }
}

// OpenNeuro GraphQL API
async function fetchOpenNeuroDatasets() {
  const query = `{
    datasets(first: 20, orderBy: { created: descending }) {
      edges {
        node {
          id
          name
          draft {
            description {
              Name
              BIDSVersion
              License
            }
            summary {
              subjects
              modalities
              totalFiles
              size
            }
          }
        }
      }
    }
  }`;

  try {
    const res = await fetch("https://openneuro.org/crn/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const json = await res.json();
    return (json.data?.datasets?.edges || []).map((edge: any) => {
      const d = edge.node;
      const summary = d.draft?.summary;
      const desc = d.draft?.description;
      const subjectCount = Array.isArray(summary?.subjects) ? summary.subjects.length : (summary?.subjects || null);
      return {
        id: `openneuro-${d.id}`,
        source: "OpenNeuro",
        sourceUrl: `https://openneuro.org/datasets/${d.id}`,
        name: desc?.Name || d.name || d.id,
        description: `BIDS dataset with ${subjectCount || "?"} subjects. ${(summary?.modalities || []).join(", ")}`,
        species: "Human",
        modality: (summary?.modalities || []).join(", ") || "Neuroimaging",
        subjects: subjectCount,
        totalFiles: summary?.totalFiles || null,
        size: summary?.size || null,
        apiAvailable: true,
      };
    });
  } catch (e) {
    console.error("OpenNeuro API error:", e);
    return [];
  }
}

// Static reference datasets (require registration)
function getStaticDatasets() {
  return [
    {
      id: "hcp-young-adult",
      source: "Human Connectome Project",
      sourceUrl: "https://www.humanconnectome.org/study/hcp-young-adult",
      name: "HCP Young Adult (S1200)",
      description:
        "High-resolution structural and functional connectivity data from 1,113 healthy young adults (ages 22–35). Includes diffusion MRI tractography, resting-state fMRI, and task fMRI.",
      species: "Human",
      modality: "dMRI, fMRI, structural MRI",
      subjects: 1113,
      nodeCount: 360,
      apiAvailable: false,
    },
    {
      id: "mouse-connectome-usc",
      source: "USC Mouse Connectome Project",
      sourceUrl: "https://www.mouseconnectome.org/",
      name: "USC Mouse Connectome (MCP)",
      description:
        "Complete mesoscale connectivity map of the C57Bl/6 mouse brain using 755 injection sites with multifluorescent anterograde and retrograde tracers. 1,233 circuit pathways identified.",
      species: "Mouse",
      modality: "Anterograde/retrograde tracing",
      subjects: null,
      nodeCount: 755,
      apiAvailable: false,
    },
  ];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, structureId } = await req.json();

    let data: any;

    switch (action) {
      case "list": {
        const [allen, openneuro] = await Promise.all([
          fetchAllenBrainDatasets(),
          fetchOpenNeuroDatasets(),
        ]);
        const staticDs = getStaticDatasets();
        data = {
          datasets: [...allen, ...staticDs, ...openneuro],
          sources: [
            {
              name: "Allen Brain Atlas",
              url: "https://connectivity.brain-map.org/",
              api: true,
              description: "Mouse brain mesoscale connectivity atlas with public REST API",
            },
            {
              name: "Human Connectome Project",
              url: "https://www.humanconnectome.org/study/hcp-young-adult",
              api: false,
              description: "1,113 subjects, requires ConnectomeDB registration",
            },
            {
              name: "USC Mouse Connectome Project",
              url: "https://www.mouseconnectome.org/",
              api: false,
              description: "755 injection sites, viewable via iConnectome",
            },
            {
              name: "OpenNeuro",
              url: "https://openneuro.org/",
              api: true,
              description: "Open BIDS neuroimaging datasets with GraphQL API",
            },
          ],
        };
        break;
      }
      case "allen-structures": {
        data = await fetchAllenStructures();
        break;
      }
      case "allen-experiments": {
        data = await fetchAllenExperiments(structureId);
        break;
      }
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-datasets error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
