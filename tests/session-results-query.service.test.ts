import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    raceWeekend: { findFirst: vi.fn() },
    raceResult: { findMany: vi.fn() },
    qualifyingResult: { findMany: vi.fn() },
    sprintResult: { findMany: vi.fn() },
  },
}))

vi.mock("@/lib/providers/jolpica", () => ({
  getRaceResults: vi.fn(),
  getQualifyingResults: vi.fn(),
  getSprintResults: vi.fn(),
}))

import { prisma } from "@/lib/db/prisma"
import { getQualifyingResults, getRaceResults, getSprintResults } from "@/lib/providers/jolpica"
import {
  getQualifyingResultsForRound,
  getRaceResultsForRound,
  getSprintResultsForRound,
} from "@/lib/services/session-results-query.service"

const mockCircuit = { id: "c1", name: "Albert Park", country: "Australia" }
const mockRaceSession = { id: "s-race", type: "RACE", startsAt: new Date("2025-03-16T04:00:00Z") }
const mockQualifyingSession = { id: "s-quali", type: "QUALIFYING", startsAt: new Date("2025-03-15T05:00:00Z") }
const mockSprintSession = { id: "s-sprint", type: "SPRINT", startsAt: new Date("2025-03-15T01:00:00Z") }

const mockWeekend = {
  id: "w1",
  round: 1,
  name: "Australian Grand Prix",
  circuit: mockCircuit,
  sessions: [mockRaceSession, mockQualifyingSession, mockSprintSession],
}

const mockDriver = { id: "d1", fullName: "Lando Norris", code: "NOR" }
const mockConstructor = { id: "c1", name: "McLaren" }
const mockRaceResult = { id: "r1", finishPosition: 1, driver: mockDriver, constructor: mockConstructor }
const mockQualifyingResult = { id: "q1", position: 1, driver: mockDriver, constructor: mockConstructor }
const mockSprintResult = { id: "sr1", position: 1, driver: mockDriver, constructor: mockConstructor }

describe("session-results-query service", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe("getRaceResultsForRound", () => {
    it("returns source='database' when race results exist in DB", async () => {
      vi.mocked(prisma.raceWeekend.findFirst).mockResolvedValue(mockWeekend as any)
      vi.mocked(prisma.raceResult.findMany).mockResolvedValue([mockRaceResult] as any)

      const result = await getRaceResultsForRound(2025, 1)

      expect(result.source).toBe("database")
      expect(result.year).toBe(2025)
      expect(result.round).toBe(1)
      expect(result.item.results).toHaveLength(1)
      expect(getRaceResults).not.toHaveBeenCalled()
    })

    it("falls back to provider when weekend exists but race results are empty", async () => {
      vi.mocked(prisma.raceWeekend.findFirst).mockResolvedValue(mockWeekend as any)
      vi.mocked(prisma.raceResult.findMany).mockResolvedValue([])
      vi.mocked(getRaceResults).mockResolvedValue({ results: [] } as any)

      const result = await getRaceResultsForRound(2025, 1)

      expect(result.source).toBe("provider")
      expect(getRaceResults).toHaveBeenCalledWith(2025, 1)
    })

    it("falls back to provider when weekend does not exist", async () => {
      vi.mocked(prisma.raceWeekend.findFirst).mockResolvedValue(null)
      vi.mocked(getRaceResults).mockResolvedValue({ results: [] } as any)

      const result = await getRaceResultsForRound(2025, 1)

      expect(result.source).toBe("provider")
      expect(getRaceResults).toHaveBeenCalledWith(2025, 1)
    })

    it("falls back to provider when weekend has no RACE session", async () => {
      vi.mocked(prisma.raceWeekend.findFirst).mockResolvedValue({
        ...mockWeekend,
        sessions: [mockQualifyingSession],
      } as any)
      vi.mocked(getRaceResults).mockResolvedValue({ results: [] } as any)

      const result = await getRaceResultsForRound(2025, 1)

      expect(result.source).toBe("provider")
      expect(prisma.raceResult.findMany).not.toHaveBeenCalled()
    })
  })

  describe("getQualifyingResultsForRound", () => {
    it("returns source='database' when qualifying results exist in DB", async () => {
      vi.mocked(prisma.raceWeekend.findFirst).mockResolvedValue(mockWeekend as any)
      vi.mocked(prisma.qualifyingResult.findMany).mockResolvedValue([mockQualifyingResult] as any)

      const result = await getQualifyingResultsForRound(2025, 1)

      expect(result.source).toBe("database")
      expect(result.item.results).toHaveLength(1)
      expect(getQualifyingResults).not.toHaveBeenCalled()
    })

    it("falls back to provider when qualifying results are empty in DB", async () => {
      vi.mocked(prisma.raceWeekend.findFirst).mockResolvedValue(mockWeekend as any)
      vi.mocked(prisma.qualifyingResult.findMany).mockResolvedValue([])
      vi.mocked(getQualifyingResults).mockResolvedValue({ results: [] } as any)

      const result = await getQualifyingResultsForRound(2025, 1)

      expect(result.source).toBe("provider")
      expect(getQualifyingResults).toHaveBeenCalledWith(2025, 1)
    })

    it("falls back to provider when weekend does not exist", async () => {
      vi.mocked(prisma.raceWeekend.findFirst).mockResolvedValue(null)
      vi.mocked(getQualifyingResults).mockResolvedValue({ results: [] } as any)

      const result = await getQualifyingResultsForRound(2025, 1)

      expect(result.source).toBe("provider")
    })

    it("falls back to provider when weekend has no QUALIFYING session", async () => {
      vi.mocked(prisma.raceWeekend.findFirst).mockResolvedValue({
        ...mockWeekend,
        sessions: [mockRaceSession],
      } as any)
      vi.mocked(getQualifyingResults).mockResolvedValue({ results: [] } as any)

      const result = await getQualifyingResultsForRound(2025, 1)

      expect(result.source).toBe("provider")
      expect(prisma.qualifyingResult.findMany).not.toHaveBeenCalled()
    })
  })

  describe("getSprintResultsForRound", () => {
    it("returns source='database' when sprint results exist in DB", async () => {
      vi.mocked(prisma.raceWeekend.findFirst).mockResolvedValue(mockWeekend as any)
      vi.mocked(prisma.sprintResult.findMany).mockResolvedValue([mockSprintResult] as any)

      const result = await getSprintResultsForRound(2025, 1)

      expect(result.source).toBe("database")
      expect(result.item.results).toHaveLength(1)
      expect(getSprintResults).not.toHaveBeenCalled()
    })

    it("falls back to provider when sprint results are empty in DB", async () => {
      vi.mocked(prisma.raceWeekend.findFirst).mockResolvedValue(mockWeekend as any)
      vi.mocked(prisma.sprintResult.findMany).mockResolvedValue([])
      vi.mocked(getSprintResults).mockResolvedValue({ results: [] } as any)

      const result = await getSprintResultsForRound(2025, 1)

      expect(result.source).toBe("provider")
      expect(getSprintResults).toHaveBeenCalledWith(2025, 1)
    })

    it("falls back to provider when weekend does not exist", async () => {
      vi.mocked(prisma.raceWeekend.findFirst).mockResolvedValue(null)
      vi.mocked(getSprintResults).mockResolvedValue({ results: [] } as any)

      const result = await getSprintResultsForRound(2025, 1)

      expect(result.source).toBe("provider")
    })

    it("falls back to provider when weekend has no SPRINT session", async () => {
      vi.mocked(prisma.raceWeekend.findFirst).mockResolvedValue({
        ...mockWeekend,
        sessions: [mockRaceSession, mockQualifyingSession],
      } as any)
      vi.mocked(getSprintResults).mockResolvedValue({ results: [] } as any)

      const result = await getSprintResultsForRound(2025, 1)

      expect(result.source).toBe("provider")
      expect(prisma.sprintResult.findMany).not.toHaveBeenCalled()
    })
  })
})
