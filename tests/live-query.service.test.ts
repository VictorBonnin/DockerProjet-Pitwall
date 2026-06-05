import { describe, it, expect } from "vitest"
import { getCurrentLiveSession } from "@/lib/services/live-query.service"

describe("live-query service", () => {
  it("returns null when no current live session exists", async () => {
    const result = await getCurrentLiveSession({
      findCurrentLiveSession: async () => null,
    })

    expect(result).toBeNull()
  })

  it("returns the live session when one is found", async () => {
    const mockSession = { id: "ls1", status: "OPEN" }
    const result = await getCurrentLiveSession({
      findCurrentLiveSession: async () => mockSession,
    })

    expect(result).toEqual(mockSession)
  })
})
