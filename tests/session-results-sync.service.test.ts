import { describe, it, expect } from "vitest"
import {
  buildSessionResultImportPlan,
  fetchWithRateLimitRetry,
  parseLapTimeToMilliseconds,
} from "../lib/services/session-results-sync.service"

const raceResultsPayload = {
  MRData: {
    RaceTable: {
      season: "2025",
      round: "1",
      Races: [
        {
          season: "2025",
          round: "1",
          raceName: "Australian Grand Prix",
          Results: [
            {
              number: "4",
              position: "1",
              positionText: "1",
              points: "25",
              grid: "1",
              laps: "58",
              status: "Finished",
              Time: { millis: "5400000" },
              Driver: { driverId: "norris", code: "NOR", givenName: "Lando", familyName: "Norris" },
              Constructor: { constructorId: "mclaren", name: "McLaren" },
            },
          ],
        },
      ],
    },
  },
}

const qualifyingResultsPayload = {
  MRData: {
    RaceTable: {
      season: "2025",
      round: "1",
      Races: [
        {
          QualifyingResults: [
            {
              number: "4",
              position: "1",
              Q1: "1:16.003",
              Q2: "1:15.415",
              Q3: "1:15.096",
              Driver: { driverId: "norris", code: "NOR", givenName: "Lando", familyName: "Norris" },
              Constructor: { constructorId: "mclaren", name: "McLaren" },
            },
          ],
        },
      ],
    },
  },
}

const sprintResultsPayload = {
  MRData: {
    RaceTable: {
      season: "2025",
      round: "2",
      Races: [
        {
          SprintResults: [
            {
              position: "1",
              points: "8",
              laps: "19",
              status: "Finished",
              Time: { millis: "1800000" },
              Driver: { driverId: "hamilton", code: "HAM", givenName: "Lewis", familyName: "Hamilton" },
              Constructor: { constructorId: "ferrari", name: "Ferrari" },
            },
          ],
        },
      ],
    },
  },
}

describe("session-results-sync service", () => {
  it("parses lap time string to milliseconds", () => {
    expect(parseLapTimeToMilliseconds("1:15.096")).toBe(75096)
  })

  it("builds a session result import plan from Jolpica payloads", () => {
    const plan = buildSessionResultImportPlan({
      year: 2025,
      round: 1,
      raceResultsPayload,
      qualifyingResultsPayload,
      sprintResultsPayload,
    })

    expect(plan.raceResults.length).toBe(1)
    expect(plan.raceResults[0]?.driverProviderJolpicaId).toBe("norris")
    expect(plan.raceResults[0]?.totalTimeMs).toBe(5400000)
    expect(plan.qualifyingResults[0]?.q3Ms).toBe(75096)
    expect(plan.sprintResults[0]?.constructorProviderJolpicaId).toBe("ferrari")
    expect(plan.sprintResults[0]?.points).toBe(8)
  })

  it("retries on 429 rate limit error", async () => {
    let calls = 0
    const waits: number[] = []

    const value = await fetchWithRateLimitRetry(
      async () => {
        calls += 1
        if (calls === 1) {
          const error = new Error("Too Many Requests") as Error & { status?: number }
          error.status = 429
          throw error
        }
        return "ok"
      },
      { maxRetries: 2, baseDelayMs: 5, sleep: async (delay) => { waits.push(delay) } },
    )

    expect(value).toBe("ok")
    expect(calls).toBe(2)
    expect(waits[0]).toBe(5)
  })
})
