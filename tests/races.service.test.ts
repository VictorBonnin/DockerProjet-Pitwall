import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    season: { findUnique: vi.fn() },
  },
}))

vi.mock("@/lib/providers/jolpica", () => ({
  getSeasonSchedule: vi.fn(),
}))

import { prisma } from "@/lib/db/prisma"
import { getSeasonSchedule } from "@/lib/providers/jolpica"
import { getRacesForYear } from "@/lib/services/races.service"

const mockWeekend = {
  id: "w1",
  round: 1,
  name: "Australian Grand Prix",
  circuit: { id: "c1", name: "Albert Park", country: "Australia" },
  sessions: [{ id: "s1", type: "RACE", startsAt: new Date("2025-03-16T04:00:00Z") }],
}

describe("races service", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("returns source='database' when season with race weekends exists in DB", async () => {
    vi.mocked(prisma.season.findUnique).mockResolvedValue({
      id: "season-1",
      year: 2025,
      raceWeekends: [mockWeekend],
    } as any)

    const result = await getRacesForYear(2025)

    expect(result.source).toBe("database")
    expect(result.year).toBe(2025)
    expect(result.items).toHaveLength(1)
    expect(getSeasonSchedule).not.toHaveBeenCalled()
  })

  it("falls back to provider when season exists but has no race weekends", async () => {
    vi.mocked(prisma.season.findUnique).mockResolvedValue({ id: "s1", year: 2025, raceWeekends: [] } as any)
    vi.mocked(getSeasonSchedule).mockResolvedValue([mockWeekend] as any)

    const result = await getRacesForYear(2025)

    expect(result.source).toBe("provider")
    expect(result.year).toBe(2025)
    expect(getSeasonSchedule).toHaveBeenCalledWith(2025)
  })

  it("falls back to provider when season does not exist in DB", async () => {
    vi.mocked(prisma.season.findUnique).mockResolvedValue(null)
    vi.mocked(getSeasonSchedule).mockResolvedValue([mockWeekend] as any)

    const result = await getRacesForYear(2025)

    expect(result.source).toBe("provider")
    expect(getSeasonSchedule).toHaveBeenCalledWith(2025)
  })
})
