import { NextResponse } from "next/server"

import { closeLiveSession } from "@/lib/services/live-session-control.service"

export async function POST() {
  try {
    const liveSession = await closeLiveSession()

    return NextResponse.json({
      liveSession,
      message: liveSession
        ? "Flux live arrete. Le worker se coupera au prochain tick."
        : "Aucune session live ouverte.",
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Impossible d'arreter la session live.",
      },
      { status: 400 },
    )
  }
}
