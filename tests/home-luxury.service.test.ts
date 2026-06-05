import { describe, it, expect } from "vitest"
import {
  buildDisplayGrandPrixName,
  isRaceWeekendFinished,
  normalizeGrandPrixLocation,
  pickNextRaceWeekend,
} from "@/lib/services/home-luxury.service"

const pastScheduledWeekend = {
  round: 4,
  status: "SCHEDULED",
  startDate: new Date("2026-05-03T20:00:00.000Z"),
  endDate: new Date("2026-05-03T20:00:00.000Z"),
}

const futureScheduledWeekend = {
  round: 5,
  status: "SCHEDULED",
  startDate: new Date("2026-05-24T20:00:00.000Z"),
  endDate: new Date("2026-05-24T20:00:00.000Z"),
}

const now = new Date("2026-05-04T12:00:00.000Z")

describe("home-luxury service", () => {
  it("picks the next upcoming race weekend", () => {
    const next = pickNextRaceWeekend([pastScheduledWeekend, futureScheduledWeekend], now)
    expect(next?.round).toBe(5)
  })

  it("correctly identifies finished vs upcoming weekends", () => {
    expect(isRaceWeekendFinished(pastScheduledWeekend, now)).toBe(true)
    expect(isRaceWeekendFinished(futureScheduledWeekend, now)).toBe(false)
  })

  it("normalizes grand prix location to country", () => {
    expect(
      normalizeGrandPrixLocation("Canadian Grand Prix", "Circuit Gilles Villeneuve", "Canada"),
    ).toBe("Canada")
  })

  it("builds a display grand prix name in French", () => {
    expect(buildDisplayGrandPrixName("Canada")).toBe("Grand Prix du Canada")
  })

  it("returns fallback name when location is empty", () => {
    expect(buildDisplayGrandPrixName("")).toBe("Grand Prix a confirmer")
  })

  it("builds name with d' prefix for vowel-starting location", () => {
    expect(buildDisplayGrandPrixName("Australie")).toBe("Grand Prix d’Australie")
  })

  it("builds name with 'de' prefix for consonant-starting location", () => {
    expect(buildDisplayGrandPrixName("Monaco")).toBe("Grand Prix de Monaco")
  })

  it("returns true when weekend status is COMPLETED", () => {
    expect(isRaceWeekendFinished({ status: "COMPLETED" })).toBe(true)
  })

  it("returns false when both endDate and startDate are null", () => {
    expect(isRaceWeekendFinished({ status: "SCHEDULED", endDate: null, startDate: null }, now)).toBe(false)
  })

  it("returns null when weekends array is empty", () => {
    expect(pickNextRaceWeekend([])).toBeNull()
  })

  it("returns last weekend when all are COMPLETED", () => {
    const w1 = { round: 1, status: "COMPLETED", startDate: null, endDate: null }
    const w2 = { round: 2, status: "COMPLETED", startDate: null, endDate: null }
    const result = pickNextRaceWeekend([w1, w2], now)
    expect(result?.round).toBe(2)
  })

  it("normalizes location to 'A venir' when all inputs are null/undefined", () => {
    expect(normalizeGrandPrixLocation(null, null, null)).toBe("A venir")
  })

  it("falls back to circuitName when name and country are null", () => {
    expect(normalizeGrandPrixLocation(null, "Albert Park", null)).toBe("Albert Park")
  })

  it("falls back to country when name is null", () => {
    expect(normalizeGrandPrixLocation(null, null, "Australia")).toBe("Australia")
  })

  it("strips sponsor and year tokens from race name", () => {
    const result = normalizeGrandPrixLocation("Formula 1 AWS 2025 Grand Prix de Monaco", null, "Monaco")
    expect(result).toBe("Monaco")
  })
})
