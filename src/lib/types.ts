export type ModelListItem = {
  id: string;
  name: string;
  slug: string;
  type: string;
  contextWindow: number;
  maxOutput: number;
  inputModalities: string[];
  outputModalities: string[];
  supportsReasoning: boolean;
  supportsTools: boolean;
  supportsVision: boolean;
  supportsStructuredOutput: boolean;
  openWeights: boolean;
  deprecated: boolean;
  releasedAt: string;
  lowestInputPrice: number | null;
  lowestOutputPrice: number | null;
  lab: { name: string; slug: string };
  providerCount: number;
};

export type ModelsResponse = {
  data: ModelListItem[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};

export type Option = { name: string; slug: string };