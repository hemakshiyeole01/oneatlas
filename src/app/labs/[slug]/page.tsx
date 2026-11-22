"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useApi } from "@/lib/useApi";
import { ErrorBox, Loading, OpenBadge } from "@/components/ui";
import { formatDate, formatPrice, formatTokens } from "@/lib/format";

type LabDetail = {
  name: string;
  slug: string;
  description: string | null;
  country: string | null;
  website: string | null;
  models: {
    id: string;
    name: string;
    slug: string;
    type: string;
    contextWindow: number;
    releasedAt: string;
    openWeights: boolean;
    deprecated: boolean;
    lowestInputPrice: number | null;
    lowestOutputPrice: number | null;
    providerCount: number;
  }[];
};

export default function LabPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: lab, error, status, loading } = useApi<LabDetail>(`/api/labs/${slug}`);

  if (loading) return <Loading />;
  if (error || !lab) return <ErrorBox message={error ?? "Something went wrong"} status={status} />;

  return (
    <div className="space-y-6">
      <Link href="/labs" className="text-sm text-neutral-500 hover:underline">← All labs</Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{lab.name}</h1>
        <p className="mt-1 text-neutral-600">
          {[lab.country, `${lab.models.length} models`].filter(Boolean).join(" · ")}
          {lab.website && (
            <>
              {" · "}
              <a href={lab.website} target="_blank" rel="noopener noreferrer" className="underline">Website</a>
            </>
          )}
        </p>
        {lab.description && <p className="mt-3 max-w-3xl text-neutral-700">{lab.description}</p>}
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white">
        <h2 className="border-b border-neutral-200 p-4 font-semibold">Models & releases (newest first)</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2">Model</th>
                <th className="px-4 py-2">Released</th>
                <th className="px-4 py-2 text-right">Context</th>
                <th className="px-4 py-2 text-right">In / Out $ per 1M</th>
                <th className="px-4 py-2 text-right">Providers</th>
                <th className="px-4 py-2">Weights</th>
              </tr>
            </thead>
            <tbody>
              {lab.models.map((m) => (
                <tr key={m.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2.5">
                    <Link href={`/models/${m.slug}`} className="font-medium hover:underline">{m.name}</Link>
                    {m.deprecated && (
                      <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">Deprecated</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{formatDate(m.releasedAt)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatTokens(m.contextWindow)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {formatPrice(m.lowestInputPrice)} / {formatPrice(m.lowestOutputPrice)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{m.providerCount}</td>
                  <td className="px-4 py-2.5"><OpenBadge open={m.openWeights} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}