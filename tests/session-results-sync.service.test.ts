import assert from "node:assert/strict"

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
              Time: {
                millis: "5400000",
              },
              Driver: {
                driverId: "norris",
                code: "NOR",
                givenName: "Lando",
                familyName: "Norris",
              },
              Constructor: {
                constructorId: "mclaren",
                name: "McLaren",
              },
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
              Driver: {
                driverId: "norris",
                code: "NOR",
                givenName: "Lando",
                familyName: "Norris",
              },
              Constructor: {
                constructorId: "mclaren",
                name: "McLaren",
              },
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
              Time: {
                millis: "1800000",
              },
              Driver: {
                driverId: "hamilton",
                code: "HAM",
                givenName: "Lewis",
                familyName: "Hamilton",
              },
              Constructor: {
                constructorId: "ferrari",
                name: "Ferrari",
              },
            },
          ],
        },
      ],
    },
  },
}

export async function runSessionResultsSyncServiceTests() {
  const {
    buildSessionResultImportPlan,
    fetchWithRateLimitRetry,
    parseLapTimeToMilliseconds,
  } = await import("../lib/services/session-results-sync.service")

  const plan = buildSessionResultImportPlan({
    year: 2025,
    round: 1,
    raceResultsPayload,
    qualifyingResultsPayload,
    sprintResultsPayload,
  })

  assert.equal(parseLapTimeToMilliseconds("1:15.096"), 75096)
  assert.equal(plan.raceResults.length, 1)
  assert.equal(plan.raceResults[0]?.driverProviderJolpicaId, "norris")
  assert.equal(plan.raceResults[0]?.totalTimeMs, 5400000)
  assert.equal(plan.qualifyingResults[0]?.q3Ms, 75096)
  assert.equal(plan.sprintResults[0]?.constructorProviderJolpicaId, "ferrari")
  assert.equal(plan.sprintResults[0]?.points, 8)

  let calls = 0
  const waits: number[] = []
  const retryValue = await fetchWithRateLimitRetry(
    async () => {
      calls += 1
      if (calls === 1) {
        const error = new Error("Too Many Requests") as Error & { status?: number }
        error.status = 429
        throw error
      }
      return "ok"
    },
    {
      maxRetries: 2,
      baseDelayMs: 5,
      sleep: async (delay) => {
        waits.push(delay)
      },
    },
  )

  assert.equal(retryValue, "ok")
  assert.equal(calls, 2)
  assert.equal(waits[0], 5)
}
