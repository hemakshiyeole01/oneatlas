import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// "a,b,c" -> ["a","b","c"]
const csv = z
  .string()
  .optional()
  .transform((v) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : []));

const bool = z
  .enum(["true", "false"])
  .optional()
  .transform((v) => v === "true");

const querySchema = z.object({
  q: z.string().trim().max(100).optional(),
  lab: csv,
  provider: csv,
  type: z.enum(["TEXT", "MULTIMODAL", "IMAGE", "AUDIO", "EMBEDDING"]).optional(),
  capabilities: csv.pipe(z.array(z.enum(["reasoning", "tools", "vision", "structured"]))),
  openWeights: bool,
  hideDeprecated: bool,
  minContext: z.coerce.number().int().min(0).optional(),
  sort: z.enum(["released", "price", "context", "name"]).default("released"),
  order: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid query parameters",
        details: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }

  const {
    q, lab, provider, type, capabilities, openWeights,
    hideDeprecated, minContext, sort, order, page, pageSize,
  } = parsed.data;

  // ----- filters -----
  const where: Prisma.ModelWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { lab: { name: { contains: q, mode: "insensitive" } } },
    ];
  }
  if (lab.length) where.lab = { slug: { in: lab } };
  if (provider.length) where.providers = { some: { provider: { slug: { in: provider } } } };
  if (type) where.type = type;
  if (openWeights) where.openWeights = true;
  if (hideDeprecated) where.deprecated = false;
  if (minContext !== undefined) where.contextWindow = { gte: minContext };
  if (capabilities.includes("reasoning")) where.supportsReasoning = true;
  if (capabilities.includes("tools")) where.supportsTools = true;
  if (capabilities.includes("vision")) where.supportsVision = true;
  if (capabilities.includes("structured")) where.supportsStructuredOutput = true;

  // ----- sorting (id is a tie-breaker so pages never overlap) -----
  const dir = order ?? (sort === "released" || sort === "context" ? "desc" : "asc");
  const orderBy: Prisma.ModelOrderByWithRelationInput[] =
    sort === "price"
      ? [{ lowestInputPrice: { sort: dir, nulls: "last" } }, { id: "asc" }]
      : sort === "context"
      ? [{ contextWindow: dir }, { id: "asc" }]
      : sort === "name"
      ? [{ name: dir }, { id: "asc" }]
      : [{ releasedAt: dir }, { id: "asc" }];

  try {
    const [total, items] = await Promise.all([
      prisma.model.count({ where }),
      prisma.model.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, name: true, slug: true, type: true,
          contextWindow: true, maxOutput: true,
          inputModalities: true, outputModalities: true,
          supportsReasoning: true, supportsTools: true,
          supportsVision: true, supportsStructuredOutput: true,
          openWeights: true, deprecated: true, releasedAt: true,
          lowestInputPrice: true, lowestOutputPrice: true,
          lab: { select: { name: true, slug: true } },
          providers: {
            select: {
              inputPrice: true, outputPrice: true, cacheReadPrice: true,
              provider: { select: { name: true, slug: true } },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      data: items.map(({ providers, ...m }) => ({
        ...m,
        providerCount: providers.length,
        providers: providers.map((p) => ({
          name: p.provider.name,
          slug: p.provider.slug,
          inputPrice: p.inputPrice,
          outputPrice: p.outputPrice,
          cacheReadPrice: p.cacheReadPrice,
        })),
      })),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    console.error("GET /api/models failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}