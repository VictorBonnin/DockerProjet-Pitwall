import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    season: { findUnique: vi.fn() },
    driverStanding: { findMany: vi.fn() },
    constructorStanding: { findMany: vi.fn() },
  },
}))

vi.mock("@/lib/providers/jolpica", () => ({
  getDriverStandings: vi.fn(),
  getConstructorStandings: vi.fn(),
}))

import { prisma } from "@/lib/db/prisma"
import { getConstructorStandings, getDriverStandings } from "@/lib/providers/jolpica"
import { getConstructorStandingsForYear, getDriverStandingsForYear } from "@/lib/services/standings.service"

const mockSeason = { id: "season-1", year: 2025 }

const mockDriverStanding = {
  id: "ds1",
  position: 1,
  points: 25,
  wins: 1,
  driver: { id: "d1", fullName: "Max Verstappen", code: "VER" },
  constructor: { id: "c1", name: "Red Bull" },
}

const mockConstructorStanding = {
  id: "cs1",
  position: 1,
  points: 50,
  wins: 2,
  constructor: { id: "c1", name: "Red Bull" },
}

describe("standings service", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe("getDriverStandingsForYear", () => {
    it("returns source='database' when standings exist in DB", async () => {
      vi.mocked(prisma.season.findUnique).mockResolvedValue(mockSeason as any)
      vi.mocked(prisma.driverStanding.findMany).mockResolvedValue([mockDriverStanding] as any)

      const result = await getDriverStandingsForYear(2025)

      expect(result.source).toBe("database")
      expect(result.year).toBe(2025)
      expect(result.items).toHaveLength(1)
      expect(getDriverStandings).not.toHaveBeenCalled()
    })

    it("falls back to provider when season exists but no driver standings in DB", async () => {
      vi.mocked(prisma.season.findUnique).mockResolvedValue(mockSeason as any)
      vi.mocked(prisma.driverStanding.findMany).mockResolvedValue([])
      vi.mocked(getDriverStandings).mockResolvedValue([mockDriverStanding] as any)

      const result = await getDriverStandingsForYear(2025)

      expect(result.source).toBe("provider")
      expect(result.year).toBe(2025)
      expect(getDriverStandings).toHaveBeenCalledWith(2025)
    })

    it("falls back to provider when season does not exist in DB", async () => {
      vi.mocked(prisma.season.findUnique).mockResolvedValue(null)
      vi.mocked(getDriverStandings).mockResolvedValue([mockDriverStanding] as any)

      const result = await getDriverStandingsForYear(2025)

      expect(result.source).toBe("provider")
      expect(getDriverStandings).toHaveBeenCalledWith(2025)
    })
  })

  describe("getConstructorStandingsForYear", () => {
    it("returns source='database' when standings exist in DB", async () => {
      vi.mocked(prisma.season.findUnique).mockResolvedValue(mockSeason as any)
      vi.mocked(prisma.constructorStanding.findMany).mockResolvedValue([mockConstructorStanding] as any)

      const result = await getConstructorStandingsForYear(2025)

      expect(result.source).toBe("database")
      expect(result.year).toBe(2025)
      expect(result.items).toHaveLength(1)
      expect(getConstructorStandings).not.toHaveBeenCalled()
    })

    it("falls back to provider when season exists but no constructor standings in DB", async () => {
      vi.mocked(prisma.season.findUnique).mockResolvedValue(mockSeason as any)
      vi.mocked(prisma.constructorStanding.findMany).mockResolvedValue([])
      vi.mocked(getConstructorStandings).mockResolvedValue([mockConstructorStanding] as any)

      const result = await getConstructorStandingsForYear(2025)

      expect(result.source).toBe("provider")
      expect(result.year).toBe(2025)
      expect(getConstructorStandings).toHaveBeenCalledWith(2025)
    })

    it("falls back to provider when season does not exist in DB", async () => {
      vi.mocked(prisma.season.findUnique).mockResolvedValue(null)
      vi.mocked(getConstructorStandings).mockResolvedValue([mockConstructorStanding] as any)

      const result = await getConstructorStandingsForYear(2025)

      expect(result.source).toBe("provider")
      expect(getConstructorStandings).toHaveBeenCalledWith(2025)
    })
  })
})
