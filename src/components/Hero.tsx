"use client";

import Link from "next/link";
import { useApi } from "@/lib/useApi";

type Stats = {
  totals: { models: number; labs: number; providers: number; listings: number };
  releases: { label: string; count: number }[];
  coverage: { label: string; pct: number }[];
};

const btn = "rounded-lg px-5 py-2.5 text-sm font-medium transition";

export default function Hero() {
  const { data } = useApi<Stats>("/api/stats");
  const maxRelease = Math.max(1, ...(data?.releases.map((r) => r.count) ?? [1]));
  const releaseTotal = data?.releases.reduce((s, r) => s + r.count, 0) ?? 0;

  const totals = [
    { label: "Models", value: data?.totals.models },
    { label: "Labs", value: data?.totals.labs },
    { label: "Providers", value: data?.totals.providers },
    { label: "API listings", value: data?.totals.listings },
  ];

  return (
    <section className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-950 via-neutral-900 to-indigo-950 p-6 text-white md:p-10">
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div>
          <p className="text-sm text-neutral-400">AI model discovery & intelligence</p>
          <h1 className="font-display mt-3 text-5xl leading-tight md:text-6xl">
            Every AI model, compared.
          </h1>
          <p className="mt-4 max-w-md text-neutral-300">
            Specs, pricing, capabilities and providers in one place. Filter to what you need and
            open a model for the full record.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/rankings" className={`${btn} bg-white text-neutral-900 hover:bg-neutral-200`}>
              See rankings
            </Link>
            <Link href="/compare" className={`${btn} border border-neutral-600 hover:bg-neutral-800`}>
              Compare models
            </Link>
            <Link href="/labs" className={`${btn} text-neutral-300 hover:text-white`}>
              Browse labs →
            </Link>
          </div>
        </div>

        <div className="rounded-2xl bg-stone-100 p-5 text-neutral-900">
          <div className="grid grid-cols-4 gap-2">
            {totals.map((t) => (
              <div key={t.label}>
                <div className="font-display text-3xl tabular-nums">
                  {t.value !== undefined ? t.value.toLocaleString("en-US") : "–"}
                </div>
                <div className="text-xs text-neutral-600">{t.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-white p-4">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-semibold">Releases per month</span>
                <span className="text-neutral-500">{releaseTotal} in 12 mo</span>
              </div>
              <div className="mt-4 flex h-24 items-end gap-1" aria-hidden="true">
                {(data?.releases ?? Array.from({ length: 12 }, () => ({ label: "", count: 0 }))).map((r, i) => (
                  <div
                    key={i}
                    title={`${r.label}: ${r.count}`}
                    className="flex-1 rounded-sm bg-neutral-400 transition-all hover:bg-neutral-900"
                    style={{ height: `${Math.max(4, (r.count / maxRelease) * 100)}%` }}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-neutral-500">
                <span>{data?.releases[0]?.label}</span>
                <span>{data?.releases[11]?.label}</span>
              </div>
            </div>

            <div className="rounded-xl bg-white p-4">
              <div className="text-xs font-semibold">Capability coverage</div>
              <div className="mt-3 space-y-3">
                {(data?.coverage ?? []).map((c) => (
                  <div key={c.label}>
                    <div className="flex justify-between text-xs">
                      <span>{c.label}</span>
                      <span className="tabular-nums text-neutral-600">{c.pct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded bg-neutral-200">
                      <div className="h-1.5 rounded bg-neutral-900" style={{ width: `${c.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}