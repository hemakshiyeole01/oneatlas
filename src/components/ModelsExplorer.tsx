"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ModelListItem, ModelsResponse, Option } from "@/lib/types";
import { capabilityLabels, formatDate, formatPrice, formatTokens } from "@/lib/format";

type Filters = {
  q: string;
  lab: string;
  provider: string;
  type: string;
  caps: string[];
  openWeights: boolean;
  hideDeprecated: boolean;
  million: boolean;
  sort: string;
  order: string;
  page: number;
};

const INITIAL: Filters = {
  q: "", lab: "", provider: "", type: "", caps: [],
  openWeights: false, hideDeprecated: false, million: false,
  sort: "released", order: "desc", page: 1,
};

const CAPS = [
  { key: "reasoning", label: "Reasoning" },
  { key: "tools", label: "Tool calling" },
  { key: "vision", label: "Vision" },
  { key: "structured", label: "Structured output" },
];
const TYPES = [
  { value: "TEXT", label: "Text" },
  { value: "MULTIMODAL", label: "Multimodal" },
  { value: "EMBEDDING", label: "Embedding" },
];
const SORTS = [
  { value: "released", label: "Release date" },
  { value: "price", label: "Price (input)" },
  { value: "context", label: "Context window" },
  { value: "name", label: "Name" },
];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-sm transition ${
        active
          ? "border-neutral-900 bg-neutral-900 text-white"
          : "border-neutral-300 bg-white hover:bg-neutral-100"
      }`}
    >
      {children}
    </button>
  );
}

const selectClass =
  "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900";

function Badges({ m }: { m: ModelListItem }) {
  const caps = capabilityLabels(m);
  return (
    <div className="flex flex-wrap gap-1">
      {caps.length === 0 && <span className="text-xs text-neutral-400">—</span>}
      {caps.map((c) => (
        <span key={c} className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-700">
          {c}
        </span>
      ))}
    </div>
  );
}

function Weights({ open }: { open: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        open ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-700"
      }`}
    >
      {open ? "Open" : "Closed"}
    </span>
  );
}

export default function ModelsExplorer() {
  const [f, setF] = useState<Filters>(INITIAL);
  const [dq, setDq] = useState("");
  const [labs, setLabs] = useState<Option[]>([]);
  const [providers, setProviders] = useState<Option[]>([]);
  const [view, setView] = useState<"table" | "cards">("table");
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<{ key: string; data?: ModelsResponse; error?: string } | null>(null);

  const change = (patch: Partial<Filters>) => setF((prev) => ({ ...prev, page: 1, ...patch }));

  // debounce the search box
  useEffect(() => {
    const t = setTimeout(() => setDq(f.q), 300);
    return () => clearTimeout(t);
  }, [f.q]);

  // options for the lab / provider dropdowns (loaded once from the API)
  useEffect(() => {
    fetch("/api/labs").then((r) => r.json()).then((d) => setLabs(d.data ?? [])).catch(() => {});
    fetch("/api/providers").then((r) => r.json()).then((d) => setProviders(d.data ?? [])).catch(() => {});
  }, []);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (dq.trim()) p.set("q", dq.trim());
    if (f.lab) p.set("lab", f.lab);
    if (f.provider) p.set("provider", f.provider);
    if (f.type) p.set("type", f.type);
    if (f.caps.length) p.set("capabilities", f.caps.join(","));
    if (f.openWeights) p.set("openWeights", "true");
    if (f.hideDeprecated) p.set("hideDeprecated", "true");
    if (f.million) p.set("minContext", "1000000");
    p.set("sort", f.sort);
    p.set("order", f.order);
    p.set("page", String(f.page));
    p.set("pageSize", "20");
    return p.toString();
  }, [dq, f]);

  // fetch whenever the query string changes
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/models?${qs}`, { signal: ctrl.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error("Request failed");
        return (await r.json()) as ModelsResponse;
      })
      .then((data) => setResult({ key: qs, data }))
      .catch((e: Error) => {
        if (e.name !== "AbortError") setResult({ key: qs, error: "Could not load models. Please try again." });
      });
    return () => ctrl.abort();
  }, [qs]);

  const loading = result?.key !== qs;
  const data = result?.data;
  const items = data?.data ?? [];

  const toggleCap = (key: string) =>
    change({ caps: f.caps.includes(key) ? f.caps.filter((c) => c !== key) : [...f.caps, key] });

  const toggleSelect = (slug: string) =>
    setSelected((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : s.length < 4 ? [...s, slug] : s));

  const changeSort = (sort: string) =>
    change({ sort, order: sort === "released" || sort === "context" ? "desc" : "asc" });

  return (
    <div className="pb-24">
      {/* search + dropdowns */}
      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
        <input
          value={f.q}
          onChange={(e) => change({ q: e.target.value })}
          placeholder="Search models…"
          className={`${selectClass} w-full`}
        />
        <select value={f.lab} onChange={(e) => change({ lab: e.target.value })} className={selectClass}>
          <option value="">All labs</option>
          {labs.map((l) => (
            <option key={l.slug} value={l.slug}>{l.name}</option>
          ))}
        </select>
        <select value={f.provider} onChange={(e) => change({ provider: e.target.value })} className={selectClass}>
          <option value="">Any provider</option>
          {providers.map((p) => (
            <option key={p.slug} value={p.slug}>{p.name}</option>
          ))}
        </select>
        <select value={f.type} onChange={(e) => change({ type: e.target.value })} className={selectClass}>
          <option value="">All types</option>
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* capability chips */}
      <div className="mt-3 flex flex-wrap gap-2">
        {CAPS.map((c) => (
          <Chip key={c.key} active={f.caps.includes(c.key)} onClick={() => toggleCap(c.key)}>
            {c.label}
          </Chip>
        ))}
        <Chip active={f.openWeights} onClick={() => change({ openWeights: !f.openWeights })}>Open weights</Chip>
        <Chip active={f.million} onClick={() => change({ million: !f.million })}>1M+ context</Chip>
        <Chip active={f.hideDeprecated} onClick={() => change({ hideDeprecated: !f.hideDeprecated })}>Hide deprecated</Chip>
        <button onClick={() => setF(INITIAL)} className="px-2 text-sm text-neutral-500 underline">
          Reset
        </button>
      </div>

      {/* sort + view toggle */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-neutral-600">
          {data ? `${data.meta.total} models` : "Loading…"}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm text-neutral-600">Sort</label>
          <select value={f.sort} onChange={(e) => changeSort(e.target.value)} className={selectClass}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button
            onClick={() => change({ order: f.order === "asc" ? "desc" : "asc" })}
            className={selectClass}
            aria-label="Toggle sort order"
          >
            {f.order === "asc" ? "↑ Asc" : "↓ Desc"}
          </button>
          <div className="flex overflow-hidden rounded-lg border border-neutral-300">
            {(["table", "cards"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-2 text-sm capitalize ${view === v ? "bg-neutral-900 text-white" : "bg-white"}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* results */}
      <div className={`mt-4 transition-opacity ${loading ? "opacity-50" : ""}`}>
        {result?.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{result.error}</div>
        )}

        {data && items.length === 0 && (
          <div className="rounded-lg border border-dashed border-neutral-300 p-10 text-center">
            <p className="font-medium">No models match your filters</p>
            <button onClick={() => setF(INITIAL)} className="mt-2 text-sm underline">Clear filters</button>
          </div>
        )}

        {items.length > 0 && view === "table" && (
          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="w-10 px-3 py-3">Cmp</th>
                  <th className="px-3 py-3">Model</th>
                  <th className="px-3 py-3 text-right">Context</th>
                  <th className="px-3 py-3 text-right">Max out</th>
                  <th className="px-3 py-3">Capabilities</th>
                  <th className="px-3 py-3">Weights</th>
                  <th className="px-3 py-3 text-right">In / Out $ per 1M</th>
                  <th className="px-3 py-3 text-right">Providers</th>
                  <th className="px-3 py-3">Released</th>
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr key={m.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(m.slug)}
                        onChange={() => toggleSelect(m.slug)}
                        aria-label={`Compare ${m.name}`}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <Link href={`/models/${m.slug}`} className="font-medium hover:underline">{m.name}</Link>
                      {m.deprecated && (
                        <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">Deprecated</span>
                      )}
                      <div className="text-xs text-neutral-500">{m.lab.name}</div>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatTokens(m.contextWindow)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{m.maxOutput ? formatTokens(m.maxOutput) : "—"}</td>
                    <td className="px-3 py-3"><Badges m={m} /></td>
                    <td className="px-3 py-3"><Weights open={m.openWeights} /></td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {formatPrice(m.lowestInputPrice)} / {formatPrice(m.lowestOutputPrice)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{m.providerCount}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{formatDate(m.releasedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {items.length > 0 && view === "cards" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((m) => (
              <div key={m.id} className="rounded-lg border border-neutral-200 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/models/${m.slug}`} className="font-semibold hover:underline">{m.name}</Link>
                    <div className="text-xs text-neutral-500">{m.lab.name}</div>
                  </div>
                  <Weights open={m.openWeights} />
                </div>
                <div className="mt-3"><Badges m={m} /></div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div><dt className="text-xs text-neutral-500">Context</dt><dd className="font-medium">{formatTokens(m.contextWindow)}</dd></div>
                  <div><dt className="text-xs text-neutral-500">Max output</dt><dd className="font-medium">{m.maxOutput ? formatTokens(m.maxOutput) : "—"}</dd></div>
                  <div><dt className="text-xs text-neutral-500">Input $/1M</dt><dd className="font-medium">{formatPrice(m.lowestInputPrice)}</dd></div>
                  <div><dt className="text-xs text-neutral-500">Output $/1M</dt><dd className="font-medium">{formatPrice(m.lowestOutputPrice)}</dd></div>
                </dl>
                <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3 text-xs text-neutral-500">
                  <span>{m.providerCount} providers · {formatDate(m.releasedAt)}</span>
                  <label className="flex items-center gap-1">
                    <input type="checkbox" checked={selected.includes(m.slug)} onChange={() => toggleSelect(m.slug)} />
                    Compare
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* pagination */}
      {data && data.meta.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            disabled={f.page <= 1}
            onClick={() => setF((p) => ({ ...p, page: p.page - 1 }))}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-neutral-600">Page {data.meta.page} of {data.meta.totalPages}</span>
          <button
            disabled={f.page >= data.meta.totalPages}
            onClick={() => setF((p) => ({ ...p, page: p.page + 1 }))}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* compare bar */}
      {selected.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white p-3 shadow-lg">
          <div className="mx-auto flex max-w-[1440px] items-center gap-3">
            <span className="text-sm">{selected.length} selected (max 4)</span>
            <button onClick={() => setSelected([])} className="text-sm text-neutral-500 underline">Clear</button>
            <Link
              href={`/compare?models=${selected.join(",")}`}
              aria-disabled={selected.length < 2}
              className={`ml-auto rounded-lg px-4 py-2 text-sm font-medium text-white ${
                selected.length < 2 ? "pointer-events-none bg-neutral-400" : "bg-neutral-900"
              }`}
            >
              Compare {selected.length < 2 ? "(pick 2+)" : "→"}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}