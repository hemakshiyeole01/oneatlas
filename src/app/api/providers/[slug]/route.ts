import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const provider = await prisma.provider.findUnique({
      where: { slug },
      include: {
        listings: {
          orderBy: { model: { name: "asc" } },
          include: {
            model: {
              select: {
                name: true, slug: true, type: true, contextWindow: true,
                openWeights: true, releasedAt: true,
                lab: { select: { name: true, slug: true } },
              },
            },
          },
        },
      },
    });
    if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

    const { listings, ...rest } = provider;
    return NextResponse.json({
      ...rest,
      models: listings.map((l) => ({
        ...l.model,
        inputPrice: l.inputPrice,
        outputPrice: l.outputPrice,
        cacheReadPrice: l.cacheReadPrice,
      })),
    });
  } catch (err) {
    console.error("GET /api/providers/[slug] failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}