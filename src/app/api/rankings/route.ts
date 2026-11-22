import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  benchmark: z.string().optional(), // benchmark slug
  category: z.string().optional(),  // e.g. coding
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

const modelSelect = {
  id: true, name: true, slug: true, openWeights: true,
  lab: { select: { name: true, slug: true } },
} as const;

export async function GET(request: NextRequest) {
  const parsed = schema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    );
  }
  const { benchmark, category, limit } = parsed.data;

  try {
    const benchmarks = await prisma.benchmark.findMany({
      orderBy: { name: "asc" },
      select: { name: true, slug: true, category: true, description: true },
    });
    const categories = [...new Set(benchmarks.map((b) => b.category))].sort();

    // Leaderboard for one benchmark
    if (benchmark) {
      const bm = benchmarks.find((b) => b.slug === benchmark);
      if (!bm) return NextResponse.json({ error: "Benchmark not found" }, { status: 404 });
      const rows = await prisma.benchmarkScore.findMany({
        where: { benchmark: { slug: benchmark } },
        orderBy: [{ score: "desc" }, { id: "asc" }],
        take: limit,
        select: { score: true, model: { select: modelSelect } },
      });
      return NextResponse.json({
        mode: "benchmark",
        benchmark: bm,
        benchmarks,
        categories,
        data: rows.map((r, i) => ({ rank: i + 1, score: r.score, benchmarksCounted: 1, model: r.model })),
      });
    }

    // Overall (or per-category) leaderboard: average score across benchmarks
    const grouped = await prisma.benchmarkScore.groupBy({
      by: ["modelId"],
      where: category ? { benchmark: { category } } : undefined,
      _avg: { score: true },
      _count: { score: true },
      orderBy: { _avg: { score: "desc" } },
      take: limit,
    });
    const models = await prisma.model.findMany({
      where: { id: { in: grouped.map((g) => g.modelId) } },
      select: modelSelect,
    });
    const byId = new Map(models.map((m) => [m.id, m]));

    return NextResponse.json({
      mode: category ? "category" : "overall",
      category: category ?? null,
      benchmarks,
      categories,
      data: grouped.map((g, i) => ({
        rank: i + 1,
        score: Math.round((g._avg.score ?? 0) * 10) / 10,
        benchmarksCounted: g._count.score,
        model: byId.get(g.modelId)!,
      })),
    });
  } catch (err) {
    console.error("GET /api/rankings failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}