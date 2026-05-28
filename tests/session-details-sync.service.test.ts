import { describe, it, expect } from "vitest"
import {
  buildSessionDetailsImportPlan,
  fetchWithRateLimitRetry,
  createRequestScheduler,
  matchOpenF1SessionToInternalSession,
} from "../lib/services/session-details-sync.service"

const openF1SessionsPayload = [
  {
    session_key: 9971,
    session_name: "Race",
    session_type: "Race",
    date_start: "2025-03-16T04:00:00+00:00",
    meeting_name: "Australian Grand Prix",
  },
]

const openF1LapsPayload = [
  {
    session_key: 9971,
    driver_number: 4,
    lap_number: 1,
    lap_duration: 92.345,
    duration_sector_1: 28.123,
    duration_sector_2: 32.111,
    duration_sector_3: 32.111,
    is_pit_out_lap: false,
    date_start: "2025-03-16T04:02:00+00:00",
  },
]

const openF1PitPayload = [
  {
    session_key: 9971,
    driver_number: 4,
    lap_number: 22,
    lane_duration: 21.456,
    stop_duration: 2.4,
    date: "2025-03-16T05:10:00+00:00",
  },
]

const openF1WeatherPayload = [
  {
    session_key: 9971,
    air_temperature: 24.5,
    track_temperature: 37.2,
    humidity: 61,
    rainfall: 0,
    pressure: 1012,
    wind_speed: 3.2,
    wind_direction: 140,
    date: "2025-03-16T04:15:00+00:00",
  },
]

describe("session-details-sync service", () => {
  it("matches OpenF1 sessions to internal sessions", () => {
    const match = matchOpenF1SessionToInternalSession({
      internalSessions: [
        {
          id: "session-1",
          type: "RACE",
          name: "Race",
          startsAt: new Date("2025-03-16T04:00:00Z"),
          raceWeekend: { name: "Australian Grand Prix" },
        },
        {
          id: "session-2",
          type: "SPRINT",
          name: "Sprint",
          startsAt: new Date("2025-03-22T03:00:00Z"),
          raceWeekend: { name: "Chinese Grand Prix" },
        },
      ],
      openF1Sessions: [
        ...openF1SessionsPayload,
        {
          session_key: 9993,
          session_type: "Race",
          session_name: "Sprint",
          date_start: "2025-03-22T03:00:00+00:00",
          country_name: "China",
          location: "Shanghai",
        },
      ],
    })

    expect(match[0]?.internalSessionId).toBe("session-1")
    expect(match[0]?.providerSessionKey).toBe(9971)
    expect(match[1]?.internalSessionId).toBe("session-2")
    expect(match[1]?.providerSessionKey).toBe(9993)
  })

  it("builds a session details import plan from OpenF1 payloads", () => {
    const plan = buildSessionDetailsImportPlan({
      lapsPayload: openF1LapsPayload,
      pitPayload: openF1PitPayload,
      weatherPayload: openF1WeatherPayload,
      driverNumberMap: new Map([[4, "norris"]]),
    })

    expect(plan.laps[0]?.driverProviderJolpicaId).toBe("norris")
    expect(plan.laps[0]?.lapTimeMs).toBe(92345)
    expect(plan.pitStops[0]?.laneDurationMs).toBe(21456)
    expect(plan.weatherSamples[0]?.trackTemp).toBe(37.2)
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

  it("throttles requests to respect minimum interval", async () => {
    const schedulerWaits: number[] = []
    let now = 100
    const schedule = createRequestScheduler({
      minIntervalMs: 10,
      now: () => now,
      sleep: async (delay) => {
        schedulerWaits.push(delay)
        now += delay
      },
    })

    await schedule(async () => "first")
    await schedule(async () => "second")

    expect(schedulerWaits[0]).toBe(10)
  })
})
