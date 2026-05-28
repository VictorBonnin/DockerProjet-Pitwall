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
})
