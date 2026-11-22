import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const model = await prisma.model.findUnique({
      where: { slug },
      include: {
        lab: true,
        providers: { include: { provider: true }, orderBy: { inputPrice: "asc" } },
        scores: { include: { benchmark: true }, orderBy: { benchmark: { name: "asc" } } },
      },
    });
    if (!model) return NextResponse.json({ error: "Model not found" }, { status: 404 });

    const related = await prisma.model.findMany({
      where: { labId: model.labId, id: { not: model.id } },
      orderBy: { releasedAt: "desc" },
      take: 4,
      select: { name: true, slug: true, contextWindow: true, releasedAt: true, lowestInputPrice: true },
    });

    const { providers, scores, ...rest } = model;
    return NextResponse.json({
      ...rest,
      providers: providers.map((p) => ({
        name: p.provider.name,
        slug: p.provider.slug,
        inputPrice: p.inputPrice,
        outputPrice: p.outputPrice,
        cacheReadPrice: p.cacheReadPrice,
      })),
      benchmarks: scores.map((s) => ({
        name: s.benchmark.name,
        slug: s.benchmark.slug,
        category: s.benchmark.category,
        score: s.score,
      })),
      related,
    });
  } catch (err) {
    console.error("GET /api/models/[slug] failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}