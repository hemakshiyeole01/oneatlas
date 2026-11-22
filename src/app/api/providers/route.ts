import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const providers = await prisma.provider.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true, name: true, slug: true, description: true, website: true,
        _count: { select: { listings: true } },
      },
    });
    return NextResponse.json({
      data: providers.map(({ _count, ...p }) => ({ ...p, modelCount: _count.listings })),
    });
  } catch (err) {
    console.error("GET /api/providers failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}