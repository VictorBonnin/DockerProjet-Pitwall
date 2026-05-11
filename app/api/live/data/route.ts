import { getLivePageData } from "@/lib/services/live-page.service"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const data = await getLivePageData()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Erreur de récupération des données live" }, { status: 500 })
  }
}
