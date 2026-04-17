import { NextResponse } from "next/server"

import { getCurrentLiveSession } from "@/lib/services/live-query.service"

export async function GET() {
  const item = await getCurrentLiveSession()

  return NextResponse.json({
    item,
  })
}
