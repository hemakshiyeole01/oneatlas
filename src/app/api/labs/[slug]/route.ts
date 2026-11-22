import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const lab = await prisma.lab.findUnique({
      where: { slug },
      include: {
        models: {
          orderBy: { releasedAt: "desc" },
          select: {
            id: true, name: true, slug: true, type: true, contextWindow: true,
            releasedAt: true, openWeights: true, deprecated: true,
            lowestInputPrice: true, lowestOutputPrice: true,
            _count: { select: { providers: true } },
          },
        },
      },
    });
    if (!lab) return NextResponse.json({ error: "Lab not found" }, { status: 404 });

    const { models, ...rest } = lab;
    return NextResponse.json({
      ...rest,
      models: models.map(({ _count, ...m }) => ({ ...m, providerCount: _count.providers })),
    });
  } catch (err) {
    console.error("GET /api/labs/[slug] failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}