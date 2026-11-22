"use client";

import Link from "next/link";
import { useState } from "react";
import { useApi } from "@/lib/useApi";
import { ErrorBox, Loading, OpenBadge } from "@/components/ui";
import { useRouter } from "next/navigation";

type Benchmark = { name: string; slug: string; category: string; description: string | null };
type RankingsResponse = {
  mode: "overall" | "category" | "benchmark";
  benchmark?: Benchmark;
  benchmarks: Benchmark[];
  categories: string[];
  data: {
    rank: number;
    score: number;
    benchmarksCounted: number;
    model: { id: string; name: string; slug: string; openWeights: boolean; lab: { name: string; slug: string } };
  }[];
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function RankingsPage() {
  const [category, setCategory] = useState("");
  const [benchmark, setBenchmark] = useState("");
  const router = useRouter();

  // filter options (categories + benchmarks) come from the API too
  const opts = useApi<RankingsResponse>("/api/rankings?limit=1");
  const url = `/api/rankings?limit=25${benchmark ? `&benchmark=${benchmark}` : category ? `&category=${category}` : ""}`;
  const { data, error, status, loading } = useApi<RankingsResponse>(url);

  const benchmarks = (opts.data?.benchmarks ?? []).filter((b) => !category || b.category === category);
  const categories = opts.data?.categories ?? [];

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-sm transition ${
      active ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white hover:bg-neutral-100"
    }`;

  const title =
    data?.mode === "benchmark"
      ? data.benchmark?.name
      : category
      ? `${cap(category)}: average score`
      : "Overall: average score";

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Rankings & benchmarks</h1>
      <p className="mb-6 mt-1 text-neutral-600">
        Leaderboards by category or by individual benchmark. Scores are sample data for this demo.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => { setCategory(""); setBenchmark(""); }} className={chip(!category && !benchmark)}>
          Overall
        </button>
        {categories.map((c) => (
          <button key={c} onClick={() => { setCategory(c); setBenchmark(""); }} className={chip(category === c && !benchmark)}>
            {cap(c)}
          </button>
        ))}
        <select
          value={benchmark}
          onChange={(e) => setBenchmark(e.target.value)}
          className="ml-auto rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">All benchmarks{category ? ` in ${category}` : ""}</option>
          {benchmarks.map((b) => (
            <option key={b.slug} value={b.slug}>{b.name}</option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        {loading && <Loading />}
        {error && <ErrorBox message={error} status={status} />}
        {data && !loading && (
          <div className="rounded-lg border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 p-4">
              <h2 className="font-semibold">{title}</h2>
              {data.benchmark?.description && (
                <p className="text-sm text-neutral-500">{data.benchmark.description}</p>
              )}
              {data.mode !== "benchmark" && (
                <p className="text-sm text-neutral-500">
                  Mean of each model&apos;s available benchmark scores (see the Benchmarks column for how many).
                </p>
              )}
            </div>
            {data.data.length === 0 ? (
              <p className="p-6 text-center text-sm text-neutral-500">No scores yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-neutral-500">
                    <tr>
                      <th className="px-4 py-2">#</th>
                      <th className="px-4 py-2">Model</th>
                      <th className="px-4 py-2">Weights</th>
                      <th className="px-4 py-2">Score</th>
                      {data.mode !== "benchmark" && <th className="px-4 py-2 text-right">Benchmarks</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((r) => (
                       <tr
                        key={r.model.id}
                        onClick={() => router.push(`/models/${r.model.slug}`)}
                        className="cursor-pointer border-t border-neutral-100 hover:bg-neutral-50">
                        <td className="px-4 py-2.5 font-semibold tabular-nums">{r.rank}</td>
                        <td className="px-4 py-2.5">
                          <Link
                            href={`/models/${r.model.slug}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-medium hover:underline"
                          >
                            {r.model.name}
                          </Link>
                          <div className="text-xs text-neutral-500">{r.model.lab.name}</div>
                        </td>
                        <td className="px-4 py-2.5"><OpenBadge open={r.model.openWeights} /></td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-3">
                            <span className="w-12 font-medium tabular-nums">{r.score.toFixed(1)}</span>
                            <div className="h-2 w-32 rounded bg-neutral-200">
                              <div className="h-2 rounded bg-neutral-900" style={{ width: `${r.score}%` }} />
                            </div>
                          </div>
                        </td>
                        {data.mode !== "benchmark" && (
                          <td className="px-4 py-2.5 text-right tabular-nums">{r.benchmarksCounted}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}