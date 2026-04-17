import assert from "node:assert/strict"

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

export async function runSessionDetailsSyncServiceTests() {
  const {
    buildSessionDetailsImportPlan,
    fetchWithRateLimitRetry,
    createRequestScheduler,
    matchOpenF1SessionToInternalSession,
  } = await import("../lib/services/session-details-sync.service")

  const match = matchOpenF1SessionToInternalSession({
    internalSessions: [
      {
        id: "session-1",
        type: "RACE",
        name: "Race",
        startsAt: new Date("2025-03-16T04:00:00Z"),
        raceWeekend: {
          name: "Australian Grand Prix",
        },
      },
      {
        id: "session-2",
        type: "SPRINT",
        name: "Sprint",
        startsAt: new Date("2025-03-22T03:00:00Z"),
        raceWeekend: {
          name: "Chinese Grand Prix",
        },
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

  assert.equal(match[0]?.internalSessionId, "session-1")
  assert.equal(match[0]?.providerSessionKey, 9971)
  assert.equal(match[1]?.internalSessionId, "session-2")
  assert.equal(match[1]?.providerSessionKey, 9993)

  const plan = buildSessionDetailsImportPlan({
    lapsPayload: openF1LapsPayload,
    pitPayload: openF1PitPayload,
    weatherPayload: openF1WeatherPayload,
    driverNumberMap: new Map([[4, "norris"]]),
  })

  assert.equal(plan.laps[0]?.driverProviderJolpicaId, "norris")
  assert.equal(plan.laps[0]?.lapTimeMs, 92345)
  assert.equal(plan.pitStops[0]?.laneDurationMs, 21456)
  assert.equal(plan.weatherSamples[0]?.trackTemp, 37.2)

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
    {
      maxRetries: 2,
      baseDelayMs: 5,
      sleep: async (delay) => {
        waits.push(delay)
      },
    },
  )

  assert.equal(value, "ok")
  assert.equal(calls, 2)
  assert.equal(waits[0], 5)

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

  assert.equal(schedulerWaits[0], 10)
}
