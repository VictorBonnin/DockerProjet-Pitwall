import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    raceWeekend: { findFirst: vi.fn() },
    lap: { findMany: vi.fn() },
    pitStop: { findMany: vi.fn() },
    weatherSample: { findMany: vi.fn() },
  },
}))

import { prisma } from "@/lib/db/prisma"
import {
  getLapsForRound,
  getPitStopsForRound,
  getWeatherForRound,
} from "@/lib/services/session-details-query.service"

const mockRaceSession = { id: "s-race", type: "RACE", startsAt: new Date("2025-03-16T04:00:00Z") }
const mockWeekend = {
  id: "w1",
  round: 1,
  name: "Australian Grand Prix",
  circuit: { id: "c1", name: "Albert Park", country: "Australia" },
  sessions: [mockRaceSession],
}
const mockDriver = { id: "d1", fullName: "Lando Norris", code: "NOR" }
const mockLap = { id: "l1", lapNumber: 1, lapTimeMs: 90000, driver: mockDriver }
const mockPitStop = { id: "p1", lapNumber: 15, durationMs: 2500, driver: mockDriver }
const mockWeatherSample = { id: "ws1", sampledAt: new Date("2025-03-16T04:10:00Z"), airTempC: 22.5 }

describe("session-details-query service", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe("getLapsForRound", () => {
    it("returns laps from DB when they exist", async () => {
      vi.mocked(prisma.raceWeekend.findFirst).mockResolvedValue(mockWeekend as any)
      vi.mocked(prisma.lap.findMany).mockResolvedValue([mockLap] as any)

      const result = await getLapsForRound(2025, 1)

      expect(result.source).toBe("database")
      expect(result.year).toBe(2025)
      expect(result.round).toBe(1)
      expect(result.item.laps).toHaveLength(1)
    })

    it("returns empty laps array when session exists but no laps in DB", async () => {
      vi.mocked(prisma.raceWeekend.findFirst).mockResolvedValue(mockWeekend as any)
      vi.mocked(prisma.lap.findMany).mockResolvedValue([])

      const result = await getLapsForRound(2025, 1)

      expect(result.source).toBe("database")
      expect(result.item.laps).toHaveLength(0)
    })

    it("returns empty laps array when weekend does not exist", async () => {
      vi.mocked(prisma.raceWeekend.findFirst).mockResolvedValue(null)

      const result = await getLapsForRound(2025, 1)

      expect(result.source).toBe("database")
      expect(result.item.laps).toHaveLength(0)
      expect(prisma.lap.findMany).not.toHaveBeenCalled()
    })

    it("returns empty laps array when weekend has no RACE session", async () => {
      vi.mocked(prisma.raceWeekend.findFirst).mockResolvedValue({
        ...mockWeekend,
        sessions: [{ id: "s-quali", type: "QUALIFYING", startsAt: new Date() }],
      } as any)

      const result = await getLapsForRound(2025, 1)

      expect(result.source).toBe("database")
      expect(result.item.laps).toHaveLength(0)
      expect(prisma.lap.findMany).not.toHaveBeenCalled()
    })
  })

  describe("getPitStopsForRound", () => {
    it("returns pit stops from DB when they exist", async () => {
      vi.mocked(prisma.raceWeekend.findFirst).mockResolvedValue(mockWeekend as any)
      vi.mocked(prisma.pitStop.findMany).mockResolvedValue([mockPitStop] as any)

      const result = await getPitStopsForRound(2025, 1)

      expect(result.source).toBe("database")
      expect(result.year).toBe(2025)
      expect(result.round).toBe(1)
      expect(result.item.pitStops).toHaveLength(1)
    })

    it("returns empty pit stops array when session exists but no pit stops in DB", async () => {
      vi.mocked(prisma.raceWeekend.findFirst).mockResolvedValue(mockWeekend as any)
      vi.mocked(prisma.pitStop.findMany).mockResolvedValue([])

      const result = await getPitStopsForRound(2025, 1)

      expect(result.source).toBe("database")
      expect(result.item.pitStops).toHaveLength(0)
    })

    it("returns empty pit stops array when weekend does not exist", async () => {
      vi.mocked(prisma.raceWeekend.findFirst).mockResolvedValue(null)

      const result = await getPitStopsForRound(2025, 1)

      expect(result.source).toBe("database")
      expect(result.item.pitStops).toHaveLength(0)
      expect(prisma.pitStop.findMany).not.toHaveBeenCalled()
    })
  })

  describe("getWeatherForRound", () => {
    it("returns weather samples from DB when they exist", async () => {
      vi.mocked(prisma.raceWeekend.findFirst).mockResolvedValue(mockWeekend as any)
      vi.mocked(prisma.weatherSample.findMany).mockResolvedValue([mockWeatherSample] as any)

      const result = await getWeatherForRound(2025, 1)

      expect(result.source).toBe("database")
      expect(result.year).toBe(2025)
      expect(result.round).toBe(1)
      expect(result.item.weather).toHaveLength(1)
    })

    it("returns empty weather array when session exists but no samples in DB", async () => {
      vi.mocked(prisma.raceWeekend.findFirst).mockResolvedValue(mockWeekend as any)
      vi.mocked(prisma.weatherSample.findMany).mockResolvedValue([])

      const result = await getWeatherForRound(2025, 1)

      expect(result.source).toBe("database")
      expect(result.item.weather).toHaveLength(0)
    })

    it("returns empty weather array when weekend does not exist", async () => {
      vi.mocked(prisma.raceWeekend.findFirst).mockResolvedValue(null)

      const result = await getWeatherForRound(2025, 1)

      expect(result.source).toBe("database")
      expect(result.item.weather).toHaveLength(0)
      expect(prisma.weatherSample.findMany).not.toHaveBeenCalled()
    })
  })
})
