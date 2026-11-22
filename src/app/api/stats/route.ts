import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [models, labs, providers, listings, dates, reasoning, tools, vision, open] =
      await Promise.all([
        prisma.model.count(),
        prisma.lab.count(),
        prisma.provider.count(),
        prisma.modelProvider.count(),
        prisma.model.findMany({ select: { releasedAt: true } }),
        prisma.model.count({ where: { supportsReasoning: true } }),
        prisma.model.count({ where: { supportsTools: true } }),
        prisma.model.count({ where: { supportsVision: true } }),
        prisma.model.count({ where: { openWeights: true } }),
      ]);

    // releases per month for the 12 months ending at the latest release
    const latest = dates.reduce((max, d) => (d.releasedAt > max ? d.releasedAt : max), new Date(0));
    const buckets = new Map<string, { label: string; count: number }>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(latest.getUTCFullYear(), latest.getUTCMonth() - i, 1));
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
      buckets.set(key, {
        label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" }),
        count: 0,
      });
    }
    for (const { releasedAt } of dates) {
      const b = buckets.get(`${releasedAt.getUTCFullYear()}-${releasedAt.getUTCMonth()}`);
      if (b) b.count++;
    }

    const pct = (n: number) => (models ? Math.round((n / models) * 100) : 0);

    return NextResponse.json({
      totals: { models, labs, providers, listings },
      releases: [...buckets.values()],
      coverage: [
        { label: "Tool calling", pct: pct(tools) },
        { label: "Reasoning", pct: pct(reasoning) },
        { label: "Vision input", pct: pct(vision) },
        { label: "Open weights", pct: pct(open) },
      ],
    });
  } catch (err) {
    console.error("GET /api/stats failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}