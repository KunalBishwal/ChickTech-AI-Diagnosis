import { NextResponse } from "next/server";

const round = (num: number, decimals = 1) =>
  Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);

export async function GET() {
  const now = new Date();
  const hour = now.getHours();

  // Simulated dynamic but realistic data
  const baseLoss = 4.6 + Math.sin(hour / 3) * 0.25;
  const avgDelay = 46 + Math.round(Math.random() * 4);
  const mortality = 37.5 + Math.sin(hour / 5) * 1.3;

  // Create 7-point trend history (past 7 hours)
  const trendData = Array.from({ length: 7 }, (_, i) => ({
    time: `${i}h`,
    loss: round(4.5 + Math.sin((hour - i) / 3) * 0.25, 2),
    delay: 46 + (i % 2 ? 1 : -1) * (Math.random() * 2),
    mortality: round(37.5 + Math.sin((hour - i) / 5) * 1.3, 1),
  }));

  const data = {
    globalLosses: round(baseLoss, 1),
    avgDelay,
    mortalityRate: round(mortality, 1),
    trends: trendData.reverse(), // newest last
    lastUpdated: now.toISOString(),
    source: "ChickTech AI Simulated Dynamic Data",
  };

  return NextResponse.json(data, {
    status: 200,
    headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
  });
}
