"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Results = {
  models: { name: string; slug: string; lab: { name: string } }[];
  labs: { name: string; slug: string }[];
  providers: { name: string; slug: string }[];
};

const LINKS = [
  { href: "/models", label: "Models" },
  { href: "/compare", label: "Compare" },
  { href: "/rankings", label: "Rankings" },
  { href: "/labs", label: "Labs" },
  { href: "/providers", label: "Providers" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const term = q.trim();

  useEffect(() => {
    if (!term) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && setResults(d))
        .catch(() => {});
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [term]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  const close = () => {
    setOpen(false);
    setQ("");
  };
  const total = results ? results.models.length + results.labs.length + results.providers.length : 0;

  const itemClass = "block rounded-md px-2 py-1.5 text-sm hover:bg-neutral-100";
  const headClass = "px-2 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-neutral-400";

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/models" className="text-lg font-bold tracking-tight">
          OneAtlas
        </Link>

        <nav className="order-3 flex w-full gap-1 overflow-x-auto md:order-none md:w-auto">
          {LINKS.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  active ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div ref={boxRef} className="relative ml-auto w-full md:w-80">
          <input
            ref={inputRef}
            suppressHydrationWarning
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search models, labs, providers  (Ctrl+K)"
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
          {open && term && results && (
            <div className="absolute left-0 right-0 top-full mt-1 max-h-96 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-2 shadow-lg">
              {total === 0 && <p className="px-2 py-3 text-sm text-neutral-500">No results for “{term}”</p>}
              {results.models.length > 0 && (
                <>
                  <p className={headClass}>Models</p>
                  {results.models.map((m) => (
                    <Link key={m.slug} href={`/models/${m.slug}`} onClick={close} className={itemClass}>
                      {m.name} <span className="text-neutral-400">· {m.lab.name}</span>
                    </Link>
                  ))}
                </>
              )}
              {results.labs.length > 0 && (
                <>
                  <p className={headClass}>Labs</p>
                  {results.labs.map((l) => (
                    <Link key={l.slug} href={`/labs/${l.slug}`} onClick={close} className={itemClass}>
                      {l.name}
                    </Link>
                  ))}
                </>
              )}
              {results.providers.length > 0 && (
                <>
                  <p className={headClass}>Providers</p>
                  {results.providers.map((p) => (
                    <Link key={p.slug} href={`/providers/${p.slug}`} onClick={close} className={itemClass}>
                      {p.name}
                    </Link>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}