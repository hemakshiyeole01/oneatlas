import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: "ok", db: "up", latencyMs: Date.now() - start },
      { headers: noStore }
    );
  } catch (err) {
    console.error("Health check failed", err);
    return NextResponse.json({ status: "error", db: "down" }, { status: 503, headers: noStore });
  }
}