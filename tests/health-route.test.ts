import { describe, it, expect, beforeAll } from "vitest"

beforeAll(() => {
  process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/pitwall?schema=public"
  process.env.REDIS_URL = "redis://localhost:6379"
})

describe("health route", () => {
  it("returns ok when database and redis are up", async () => {
    const { buildHealthSnapshot } = await import("@/lib/services/health.service")
    const snapshot = await buildHealthSnapshot({
      checkDatabase: async () => true,
      checkRedis: async () => true,
    })

    expect(snapshot.status).toBe("ok")
    expect(snapshot.services.database).toBe("up")
    expect(snapshot.services.redis).toBe("up")
  })
})
