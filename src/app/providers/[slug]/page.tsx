"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useApi } from "@/lib/useApi";
import { ErrorBox, Loading, OpenBadge } from "@/components/ui";
import { formatPrice, formatTokens } from "@/lib/format";

type ProviderDetail = {
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  models: {
    name: string;
    slug: string;
    contextWindow: number;
    openWeights: boolean;
    inputPrice: number;
    outputPrice: number;
    cacheReadPrice: number | null;
    lab: { name: string; slug: string };
  }[];
};

export default function ProviderPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: p, error, status, loading } = useApi<ProviderDetail>(`/api/providers/${slug}`);

  if (loading) return <Loading />;
  if (error || !p) return <ErrorBox message={error ?? "Something went wrong"} status={status} />;

  return (
    <div className="space-y-6">
      <Link href="/providers" className="text-sm text-neutral-500 hover:underline">← All providers</Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{p.name}</h1>
        <p className="mt-1 text-neutral-600">
          {p.models.length} supported models
          {p.website && (
            <>
              {" · "}
              <a href={p.website} target="_blank" rel="noopener noreferrer" className="underline">Website</a>
            </>
          )}
        </p>
        {p.description && <p className="mt-3 max-w-3xl text-neutral-700">{p.description}</p>}
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white">
        <h2 className="border-b border-neutral-200 p-4 font-semibold">Supported models and prices</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2">Model</th>
                <th className="px-4 py-2">Lab</th>
                <th className="px-4 py-2 text-right">Context</th>
                <th className="px-4 py-2">Weights</th>
                <th className="px-4 py-2 text-right">Input $ / 1M</th>
                <th className="px-4 py-2 text-right">Output $ / 1M</th>
              </tr>
            </thead>
            <tbody>
              {p.models.map((m) => (
                <tr key={m.slug} className="border-t border-neutral-100">
                  <td className="px-4 py-2.5">
                    <Link href={`/models/${m.slug}`} className="font-medium hover:underline">{m.name}</Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <Link href={`/labs/${m.lab.slug}`} className="hover:underline">{m.lab.name}</Link>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatTokens(m.contextWindow)}</td>
                  <td className="px-4 py-2.5"><OpenBadge open={m.openWeights} /></td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatPrice(m.inputPrice)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatPrice(m.outputPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}