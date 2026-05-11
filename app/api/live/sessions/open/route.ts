import { NextResponse } from "next/server"

import {
  openLiveSession,
  parseLiveOpenRequestBody,
} from "@/lib/services/live-session-control.service"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const options = parseLiveOpenRequestBody(body)
    const liveSession = await openLiveSession(options)

    return NextResponse.json({
      liveSession,
      message: "LiveSession ouverte. Le worker live peut maintenant ingerer les donnees.",
    })
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? Number(error.status) : null
    const message =
      status === 401
        ? "OpenF1 a refuse la session latest. La prochaine session locale doit avoir un providerSessionKey; relance la synchro 2026 si besoin."
        : error instanceof Error
          ? error.message
          : "Impossible d'ouvrir la session live."

    return NextResponse.json(
      {
        error: message,
      },
      { status: 400 },
    )
  }
}
