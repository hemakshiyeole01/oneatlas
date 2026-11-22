import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const labs = await prisma.lab.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true, name: true, slug: true, description: true, country: true, website: true,
        _count: { select: { models: true } },
      },
    });
    return NextResponse.json({
      data: labs.map(({ _count, ...l }) => ({ ...l, modelCount: _count.models })),
    });
  } catch (err) {
    console.error("GET /api/labs failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}