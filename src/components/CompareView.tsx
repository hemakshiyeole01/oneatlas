"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useApi } from "@/lib/useApi";
import { ErrorBox, Loading } from "@/components/ui";
import type { ModelsResponse } from "@/lib/types";
import { formatDate, formatPrice, formatTokens } from "@/lib/format";

type CompareModel = {
  id: string;
  name: string;
  slug: string;
  type: string;
  lab: { name: string; slug: string };
  contextWindow: number;
  maxOutput: number;
  inputModalities: string[];
  outputModalities: string[];
  supportsReasoning: boolean;
  supportsTools: boolean;
  supportsVision: boolean;
  supportsStructuredOutput: boolean;
  openWeights: boolean;
  releasedAt: string;
  lowestInputPrice: number | null;
  lowestOutputPrice: number | null;
  providerCount: number;
  scores: Record<string, number>;
};
type CompareResponse = {
  models: CompareModel[];
  benchmarks: { name: string; slug: string; category: string }[];
};
type Row = {
  label: string;
  cell: (m: CompareModel) => React.ReactNode;
  best?: { value: (m: CompareModel) => number | null | undefined; mode: "max" | "min" };
};

function bestValue(vals: (number | null | undefined)[], mode: "max" | "min") {
  const nums = vals.filter((v): v is number => typeof v === "number" && v > 0);
  if (nums.length < 2) return null;
  return mode === "max" ? Math.max(...nums) : Math.min(...nums);
}

const yes = (b: boolean) => (b ? "✓" : "—");

const ROWS: Row[] = [
  { label: "Lab", cell: (m) => <Link href={`/labs/${m.lab.slug}`} className="hover:underline">{m.lab.name}</Link> },
  { label: "Type", cell: (m) => <span className="capitalize">{m.type.toLowerCase()}</span> },
  { label: "Context window", cell: (m) => formatTokens(m.contextWindow), best: { value: (m) => m.contextWindow, mode: "max" } },
  { label: "Max output", cell: (m) => (m.maxOutput ? formatTokens(m.maxOutput) : "—"), best: { value: (m) => m.maxOutput, mode: "max" } },
  { label: "Input $ / 1M", cell: (m) => formatPrice(m.lowestInputPrice), best: { value: (m) => m.lowestInputPrice, mode: "min" } },
  { label: "Output $ / 1M", cell: (m) => formatPrice(m.lowestOutputPrice), best: { value: (m) => m.lowestOutputPrice, mode: "min" } },
  { label: "Providers", cell: (m) => m.providerCount, best: { value: (m) => m.providerCount, mode: "max" } },
  { label: "Released", cell: (m) => formatDate(m.releasedAt) },
  { label: "Weights", cell: (m) => (m.openWeights ? "Open" : "Closed") },
  { label: "Input modalities", cell: (m) => <span className="capitalize">{m.inputModalities.join(", ")}</span> },
  { label: "Output modalities", cell: (m) => <span className="capitalize">{m.outputModalities.join(", ")}</span> },
  { label: "Reasoning", cell: (m) => yes(m.supportsReasoning) },
  { label: "Tool calling", cell: (m) => yes(m.supportsTools) },
  { label: "Vision", cell: (m) => yes(m.supportsVision) },
  { label: "Structured output", cell: (m) => yes(m.supportsStructuredOutput) },
];

const HILITE = "font-semibold text-emerald-700";
const labelCell = "sticky left-0 bg-white px-4 py-2.5 text-xs uppercase tracking-wide text-neutral-500";

export default function CompareView() {
  const router = useRouter();
  const params = useSearchParams();
  const slugs = [...new Set((params.get("models") ?? "").split(",").map((s) => s.trim()).filter(Boolean))];
  const key = slugs.join(",");

  const all = useApi<ModelsResponse>("/api/models?sort=name&order=asc&pageSize=50");
  const cmp = useApi<CompareResponse>(slugs.length >= 2 ? `/api/compare?models=${encodeURIComponent(key)}` : null);

  const setSlugs = (next: string[]) =>
    router.replace(next.length ? `/compare?models=${next.join(",")}` : "/compare");
  const options = (all.data?.data ?? []).filter((m) => !slugs.includes(m.slug));

  const picker = (
    <select
      value=""
      disabled={slugs.length >= 4}
      onChange={(e) => e.target.value && setSlugs([...slugs, e.target.value])}
      className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
    >
      <option value="">{slugs.length >= 4 ? "Maximum 4 models" : "+ Add a model…"}</option>
      {options.map((m) => (
        <option key={m.slug} value={m.slug}>{m.name} ({m.lab.name})</option>
      ))}
    </select>
  );

  if (slugs.length < 2) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center">
        <p className="font-medium">Pick at least 2 models to compare</p>
        <p className="mt-1 text-sm text-neutral-500">
          {slugs.length === 1 ? "You have 1 selected. Add another:" : "Choose models below, or tick boxes on the Models page."}
        </p>
        <div className="mt-4 flex justify-center gap-3">
          {picker}
          <Link href="/models" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm">Browse models</Link>
        </div>
      </div>
    );
  }

  if (cmp.loading) return <Loading />;
  if (cmp.error || !cmp.data) return <ErrorBox message={cmp.error ?? "Could not load comparison"} status={cmp.status} />;

  const { models, benchmarks } = cmp.data;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {picker}
        <button onClick={() => setSlugs([])} className="text-sm text-neutral-500 underline">Clear all</button>
        <span className="text-xs text-neutral-500">Green = best value in the row</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="sticky left-0 bg-white px-4 py-3" />
              {models.map((m) => (
                <th key={m.slug} className="px-4 py-3 align-top">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/models/${m.slug}`} className="font-semibold hover:underline">{m.name}</Link>
                    <button
                      onClick={() => setSlugs(slugs.filter((s) => s !== m.slug))}
                      aria-label={`Remove ${m.name}`}
                      className="text-neutral-400 hover:text-neutral-900"
                    >
                      ✕
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => {
              const best = row.best ? bestValue(models.map(row.best.value), row.best.mode) : null;
              return (
                <tr key={row.label} className="border-b border-neutral-100">
                  <th className={labelCell}>{row.label}</th>
                  {models.map((m) => (
                    <td
                      key={m.slug}
                      className={`px-4 py-2.5 tabular-nums ${best !== null && row.best!.value(m) === best ? HILITE : ""}`}
                    >
                      {row.cell(m)}
                    </td>
                  ))}
                </tr>
              );
            })}
            <tr>
              <th colSpan={models.length + 1} className="bg-neutral-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Benchmarks (higher is better)
              </th>
            </tr>
            {benchmarks.map((b) => {
              const best = bestValue(models.map((m) => m.scores[b.slug]), "max");
              return (
                <tr key={b.slug} className="border-b border-neutral-100 last:border-0">
                  <th className={labelCell}>
                    {b.name} <span className="normal-case text-neutral-400">· {b.category}</span>
                  </th>
                  {models.map((m) => {
                    const s = m.scores[b.slug];
                    return (
                      <td key={m.slug} className={`px-4 py-2.5 tabular-nums ${s !== undefined && s === best ? HILITE : ""}`}>
                        {s !== undefined ? s.toFixed(1) : "—"}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}