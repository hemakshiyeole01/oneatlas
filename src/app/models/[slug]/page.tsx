"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useApi } from "@/lib/useApi";
import { ErrorBox, Loading, OpenBadge } from "@/components/ui";
import { formatDate, formatPrice, formatTokens } from "@/lib/format";

type Detail = {
  name: string;
  slug: string;
  description: string | null;
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
  providers: { name: string; slug: string; inputPrice: number; outputPrice: number; cacheReadPrice: number | null }[];
  benchmarks: { name: string; slug: string; category: string; score: number }[];
  related: { name: string; slug: string; contextWindow: number; releasedAt: string; lowestInputPrice: number | null }[];
};

function Spec({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  );
}

export default function ModelPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: m, error, status, loading } = useApi<Detail>(`/api/models/${slug}`);

  if (loading) return <Loading />;
  if (error || !m) return <ErrorBox message={error ?? "Something went wrong"} status={status} />;

  const caps: [string, boolean][] = [
    ["Reasoning", m.supportsReasoning],
    ["Tool calling", m.supportsTools],
    ["Vision input", m.supportsVision],
    ["Structured output", m.supportsStructuredOutput],
  ];
  const card = "rounded-lg border border-neutral-200 bg-white p-5";

  return (
    <div className="space-y-6">
      <Link href="/models" className="text-sm text-neutral-500 hover:underline">← All models</Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{m.name}</h1>
          <p className="mt-1 text-neutral-600">
            by <Link href={`/labs/${m.lab.slug}`} className="underline">{m.lab.name}</Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <OpenBadge open={m.openWeights} />
          {m.deprecated && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Deprecated</span>
          )}
          <Link
            href={`/compare?models=${m.slug}`}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            Compare
          </Link>
        </div>
      </div>

      {m.description && <p className="max-w-3xl text-neutral-700">{m.description}</p>}

      <section className={card}>
        <h2 className="mb-4 font-semibold">Specifications</h2>
        <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Spec label="Context window">{formatTokens(m.contextWindow)} tokens</Spec>
          <Spec label="Max output">{m.maxOutput ? `${formatTokens(m.maxOutput)} tokens` : "—"}</Spec>
          <Spec label="Input $ / 1M">{formatPrice(m.lowestInputPrice)}</Spec>
          <Spec label="Output $ / 1M">{formatPrice(m.lowestOutputPrice)}</Spec>
          <Spec label="Type"><span className="capitalize">{m.type.toLowerCase()}</span></Spec>
          <Spec label="Released">{formatDate(m.releasedAt)}</Spec>
          <Spec label="Input modalities"><span className="capitalize">{m.inputModalities.join(", ")}</span></Spec>
          <Spec label="Output modalities"><span className="capitalize">{m.outputModalities.join(", ")}</span></Spec>
        </dl>
        <p className="mt-3 text-xs text-neutral-500">Prices shown are the lowest across providers.</p>
      </section>

      <section className={card}>
        <h2 className="mb-3 font-semibold">Capabilities</h2>
        <div className="flex flex-wrap gap-2">
          {caps.map(([label, on]) => (
            <span
              key={label}
              className={`rounded-full border px-3 py-1 text-sm ${
                on ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-neutral-200 text-neutral-400"
              }`}
            >
              {on ? "✓" : "✕"} {label}
            </span>
          ))}
        </div>
      </section>

      <section className={card}>
        <h2 className="mb-3 font-semibold">Providers ({m.providers.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="py-2">Provider</th>
                <th className="py-2 text-right">Input $ / 1M</th>
                <th className="py-2 text-right">Output $ / 1M</th>
                <th className="py-2 text-right">Cache read $ / 1M</th>
              </tr>
            </thead>
            <tbody>
              {m.providers.map((p, i) => (
                <tr key={p.slug} className="border-t border-neutral-100">
                  <td className="py-2">
                    <Link href={`/providers/${p.slug}`} className="font-medium hover:underline">{p.name}</Link>
                    {i === 0 && (
                      <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-800">Lowest</span>
                    )}
                  </td>
                  <td className="py-2 text-right tabular-nums">{formatPrice(p.inputPrice)}</td>
                  <td className="py-2 text-right tabular-nums">{formatPrice(p.outputPrice)}</td>
                  <td className="py-2 text-right tabular-nums">{formatPrice(p.cacheReadPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={card}>
        <h2 className="mb-3 font-semibold">Benchmarks</h2>
        {m.benchmarks.length === 0 ? (
          <p className="text-sm text-neutral-500">No benchmark scores for this model.</p>
        ) : (
          <ul className="space-y-3">
            {m.benchmarks.map((b) => (
              <li key={b.slug}>
                <div className="flex justify-between text-sm">
                  <span>
                    {b.name} <span className="text-xs capitalize text-neutral-400">· {b.category}</span>
                  </span>
                  <span className="font-medium tabular-nums">{b.score.toFixed(1)}</span>
                </div>
                <div className="mt-1 h-2 rounded bg-neutral-200">
                  <div className="h-2 rounded bg-neutral-900" style={{ width: `${b.score}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {m.related.length > 0 && (
        <section className={card}>
          <h2 className="mb-3 font-semibold">More from {m.lab.name}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {m.related.map((r) => (
              <li key={r.slug}>
                <Link href={`/models/${r.slug}`} className="flex justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50">
                  <span className="font-medium">{r.name}</span>
                  <span className="text-neutral-500">{formatTokens(r.contextWindow)} ctx · {formatDate(r.releasedAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}