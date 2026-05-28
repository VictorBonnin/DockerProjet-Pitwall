import { describe, it, expect } from "vitest"

describe("env", () => {
  it("parses valid environment variables", async () => {
    const { parseEnv } = await import("@/lib/env")
    const parsed = parseEnv({
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/pitwall",
      REDIS_URL: "redis://localhost:6379",
    })

    expect(parsed.DATABASE_URL).toMatch(/^postgresql:\/\//)
    expect(parsed.REDIS_URL).toBe("redis://localhost:6379")
  })

  it("returns the same cached instance on repeated calls to getEnv", async () => {
    const { getEnv } = await import("@/lib/env")
    const first = getEnv()
    const second = getEnv()
    expect(first).toBe(second)
  })

  it("throws when REDIS_URL is missing", async () => {
    const { parseEnv } = await import("@/lib/env")
    expect(() =>
      parseEnv({
        DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/pitwall",
      }),
    ).toThrow()
  })
})
