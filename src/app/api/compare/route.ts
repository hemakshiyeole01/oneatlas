    import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  models: z
    .string()
    .transform((v) => [...new Set(v.split(",").map((s) => s.trim()).filter(Boolean))])
    .pipe(z.array(z.string()).min(2, "Pick at least 2 models").max(4, "Compare at most 4 models")),
});

export async function GET(request: NextRequest) {
  const parsed = schema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    );
  }
  const slugs = parsed.data.models;

  try {
    const found = await prisma.model.findMany({
      where: { slug: { in: slugs } },
      include: {
        lab: { select: { name: true, slug: true } },
        providers: { include: { provider: { select: { name: true, slug: true } } } },
        scores: { include: { benchmark: true } },
      },
    });
    const missing = slugs.filter((s) => !found.some((m) => m.slug === s));
    if (missing.length) {
      return NextResponse.json({ error: "Models not found", missing }, { status: 404 });
    }

    // keep the order the user asked for
    const models = slugs.map((s) => found.find((m) => m.slug === s)!).map((m) => ({
      id: m.id, name: m.name, slug: m.slug, type: m.type, lab: m.lab,
      contextWindow: m.contextWindow, maxOutput: m.maxOutput,
      inputModalities: m.inputModalities, outputModalities: m.outputModalities,
      supportsReasoning: m.supportsReasoning, supportsTools: m.supportsTools,
      supportsVision: m.supportsVision, supportsStructuredOutput: m.supportsStructuredOutput,
      openWeights: m.openWeights, deprecated: m.deprecated, releasedAt: m.releasedAt,
      lowestInputPrice: m.lowestInputPrice, lowestOutputPrice: m.lowestOutputPrice,
      providerCount: m.providers.length,
      scores: Object.fromEntries(m.scores.map((s) => [s.benchmark.slug, s.score])),
    }));

    // every benchmark that at least one compared model has a score for
    const benchmarks = [
      ...new Map(
        found.flatMap((m) => m.scores.map((s) => [s.benchmark.slug, s.benchmark] as const))
      ).values(),
    ]
      .map((b) => ({ name: b.name, slug: b.slug, category: b.category }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ models, benchmarks });
  } catch (err) {
    console.error("GET /api/compare failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}