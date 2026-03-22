import { supabase } from "@/integrations/supabase/client";

export interface Dataset {
  id: string;
  source: string;
  sourceUrl: string;
  name: string;
  description: string;
  species: string;
  modality: string;
  subjects?: number | null;
  nodeCount?: number | null;
  totalFiles?: number | null;
  size?: number | null;
  apiAvailable: boolean;
}

export interface DataSource {
  name: string;
  url: string;
  api: boolean;
  description: string;
}

export interface AllenStructure {
  id: number;
  name: string;
  acronym: string;
  parentId: number | null;
  color: string | null;
}

export interface AllenExperiment {
  id: number;
  experimentId: number;
  structureId: number;
  hemisphere: string;
  projectionVolume: number;
  normalizedProjectionVolume: number;
  projectionDensity: number;
  projectionEnergy: number;
}

export const datasetsApi = {
  async list(): Promise<{ datasets: Dataset[]; sources: DataSource[] }> {
    const { data, error } = await supabase.functions.invoke("fetch-datasets", {
      body: { action: "list" },
    });
    if (error) throw new Error(error.message);
    return data.data;
  },

  async getAllenStructures(): Promise<AllenStructure[]> {
    const { data, error } = await supabase.functions.invoke("fetch-datasets", {
      body: { action: "allen-structures" },
    });
    if (error) throw new Error(error.message);
    return data.data;
  },

  async getAllenExperiments(structureId?: number): Promise<AllenExperiment[]> {
    const { data, error } = await supabase.functions.invoke("fetch-datasets", {
      body: { action: "allen-experiments", structureId },
    });
    if (error) throw new Error(error.message);
    return data.data;
  },
};
