export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

// price per 1M tokens; null/0 means "not applicable" in our dataset (e.g. embedding output)
export function formatPrice(p: number | null | undefined): string {
  if (p == null || p === 0) return "—";
  return `$${p < 1 ? p.toFixed(3).replace(/0$/, "") : p.toFixed(2)}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function capabilityLabels(m: {
  supportsReasoning: boolean;
  supportsTools: boolean;
  supportsVision: boolean;
  supportsStructuredOutput: boolean;
}): string[] {
  const out: string[] = [];
  if (m.supportsReasoning) out.push("Reasoning");
  if (m.supportsTools) out.push("Tools");
  if (m.supportsVision) out.push("Vision");
  if (m.supportsStructuredOutput) out.push("JSON");
  return out;
}