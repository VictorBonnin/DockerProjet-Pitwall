import assert from "node:assert/strict"

export async function runHealthRouteTests() {
  process.env.DATABASE_URL =
    "postgresql://postgres:postgres@localhost:5432/pitwall?schema=public"
  process.env.REDIS_URL = "redis://localhost:6379"

  const { buildHealthSnapshot } = await import("@/lib/services/health.service")
  const snapshot = await buildHealthSnapshot({
    checkDatabase: async () => true,
    checkRedis: async () => true,
  })

  assert.equal(snapshot.status, "ok")
  assert.equal(snapshot.services.database, "up")
  assert.equal(snapshot.services.redis, "up")
}
