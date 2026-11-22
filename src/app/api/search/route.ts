import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({ q: z.string().trim().max(100).default("") });

export async function GET(request: NextRequest) {
  const parsed = schema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  const { q } = parsed.data;
  if (!q) return NextResponse.json({ models: [], labs: [], providers: [] });

  const match = { contains: q, mode: "insensitive" as const };
  try {
    const [models, labs, providers] = await Promise.all([
      prisma.model.findMany({
        where: { OR: [{ name: match }, { slug: match }, { lab: { name: match } }] },
        orderBy: { releasedAt: "desc" },
        take: 6,
        select: { name: true, slug: true, lab: { select: { name: true, slug: true } } },
      }),
      prisma.lab.findMany({ where: { name: match }, take: 4, select: { name: true, slug: true } }),
      prisma.provider.findMany({ where: { name: match }, take: 4, select: { name: true, slug: true } }),
    ]);
    return NextResponse.json({ models, labs, providers });
  } catch (err) {
    console.error("GET /api/search failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}