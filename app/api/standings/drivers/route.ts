import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { getDriverStandingsForYear } from "@/lib/services/standings.service"

const querySchema = z.object({
  year: z.coerce.number().int().min(1950).max(2100),
})

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  )

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid query parameters",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    )
  }

  return NextResponse.json(await getDriverStandingsForYear(parsed.data.year), {
    headers: {
      "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
    },
  })
}
