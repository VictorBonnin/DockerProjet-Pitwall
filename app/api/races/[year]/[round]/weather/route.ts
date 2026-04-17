import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { getWeatherForRound } from "@/lib/services/session-details-query.service"

const paramsSchema = z.object({
  year: z.coerce.number().int().min(1950).max(2100),
  round: z.coerce.number().int().min(1).max(99),
})

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ year: string; round: string }> },
) {
  const parsed = paramsSchema.safeParse(await context.params)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid route parameters", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  return NextResponse.json(await getWeatherForRound(parsed.data.year, parsed.data.round), {
    headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
  })
}
