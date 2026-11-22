"use client";

import Link from "next/link";
import { useApi } from "@/lib/useApi";
import { ErrorBox, Loading } from "@/components/ui";

type Provider = { id: string; name: string; slug: string; description: string | null; modelCount: number };

export default function ProvidersPage() {
  const { data, error, status, loading } = useApi<{ data: Provider[] }>("/api/providers");

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Providers</h1>
      <p className="mb-6 mt-1 text-neutral-600">Platforms and clouds that serve models through an API.</p>
      {loading && <Loading />}
      {error && <ErrorBox message={error} status={status} />}
      {data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.data.map((p) => (
            <Link key={p.id} href={`/providers/${p.slug}`} className="rounded-lg border border-neutral-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-neutral-400 hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold">{p.name}</h2>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs">{p.modelCount} models</span>
              </div>
              <p className="mt-2 text-sm text-neutral-600">{p.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}