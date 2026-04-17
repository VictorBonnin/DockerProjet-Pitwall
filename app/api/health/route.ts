import { NextResponse } from "next/server"

import { prisma } from "@/lib/db/prisma"
import { redis } from "@/lib/db/redis"
import { buildHealthSnapshot } from "@/lib/services/health.service"

async function defaultDatabaseCheck() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

async function defaultRedisCheck() {
  try {
    const reply = await redis.ping()
    return reply === "PONG"
  } catch {
    return false
  }
}

export async function GET() {
  const snapshot = await buildHealthSnapshot({
    checkDatabase: defaultDatabaseCheck,
    checkRedis: defaultRedisCheck,
  })
  const statusCode = snapshot.status === "ok" ? 200 : 503

  return NextResponse.json(snapshot, { status: statusCode })
}
