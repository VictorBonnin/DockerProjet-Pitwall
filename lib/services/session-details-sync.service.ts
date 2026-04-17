import { prisma } from "@/lib/db/prisma"
import {
  getLapsBySession,
  getPitBySession,
  getSessionsByYear,
  getWeatherBySession,
  type OpenF1LapPayload,
  type OpenF1PitPayload,
  type OpenF1SessionPayload,
  type OpenF1WeatherPayload,
} from "@/lib/providers/openf1"

type RetryOptions = {
  maxRetries?: number
  baseDelayMs?: number
  sleep?: (delayMs: number) => Promise<void>
}

type SchedulerOptions = {
  minIntervalMs?: number
  now?: () => number
  sleep?: (delayMs: number) => Promise<void>
}

function asRecord(value: unknown) {
  return (value ?? {}) as Record<string, unknown>
}

function asString(value: unknown) {
  return typeof value === "string" ? value : null
}

function asNumber(value: unknown) {
  if (typeof value === "number") return value
  if (typeof value === "string" && value.length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function sessionTypeToInternal(value: string | null) {
  switch ((value ?? "").toLowerCase()) {
    case "race":
      return "RACE"
    case "qualifying":
      return "QUALIFYING"
    case "sprint":
      return "SPRINT"
    case "practice 1":
      return "FP1"
    case "practice 2":
      return "FP2"
    case "practice 3":
      return "FP3"
    default:
      return null
  }
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[^\w\s-]/g, "")
    .toLowerCase()
    .trim()
}

function toDate(value: string | null) {
  return value ? new Date(value) : null
}

function isRateLimitError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status?: unknown }).status === 429
  )
}

export async function fetchWithRateLimitRetry<T>(
  operation: () => Promise<T>,
  {
    maxRetries = 3,
    baseDelayMs = 750,
    sleep = (delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs)),
  }: RetryOptions = {},
): Promise<T> {
  let attempt = 0

  while (true) {
    try {
      return await operation()
    } catch (error) {
      if (!isRateLimitError(error) || attempt >= maxRetries) {
        throw error
      }

      const delayMs = baseDelayMs * 2 ** attempt
      attempt += 1
      await sleep(delayMs)
    }
  }
}

export function createRequestScheduler({
  minIntervalMs = 2500,
  now = () => Date.now(),
  sleep = (delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs)),
}: SchedulerOptions = {}) {
  let nextAvailableAt = now()

  return async function schedule<T>(operation: () => Promise<T>) {
    const current = now()
    const waitMs = Math.max(0, nextAvailableAt - current)
    if (waitMs > 0) {
      await sleep(waitMs)
    }

    const result = await operation()
    nextAvailableAt = now() + minIntervalMs
    return result
  }
}

const scheduleOpenF1Request = createRequestScheduler()

export function matchOpenF1SessionToInternalSession({
  internalSessions,
  openF1Sessions,
}: {
  internalSessions: Array<{
    id: string
    type: string
    name: string
    startsAt: Date | null
    raceWeekend: { name: string }
  }>
  openF1Sessions: OpenF1SessionPayload
}) {
  const matches: Array<{ internalSessionId: string; providerSessionKey: number }> = []

  for (const openF1Session of openF1Sessions) {
    const record = asRecord(openF1Session)
    const providerSessionKey = asNumber(record.session_key)
    const sessionName = asString(record.session_name)
    const sessionType = asString(record.session_type)
    const type =
      normalize(sessionName ?? "") === "sprint"
        ? "SPRINT"
        : sessionTypeToInternal(sessionType ?? sessionName)
    const meetingHints = [
      asString(record.meeting_name),
      asString(record.location),
      asString(record.country_name),
      asString(record.circuit_short_name),
    ]
      .filter((value): value is string => Boolean(value))
      .map((value) => normalize(value))
    const startsAt = toDate(asString(record.date_start))

    if (!providerSessionKey || !type || !startsAt) continue

    const candidates = internalSessions
      .filter((session) => {
        const delta = Math.abs((session.startsAt?.getTime() ?? 0) - startsAt.getTime())
        return session.type === type && delta <= 1000 * 60 * 60 * 12
      })
      .map((session) => {
        const weekendName = normalize(session.raceWeekend.name)
        const hasNameHint = meetingHints.some(
          (hint) =>
            weekendName.includes(hint) ||
            hint.includes(weekendName.replace("grand prix", "").trim()) ||
            weekendName.includes(hint.replace("grand prix", "").trim()),
        )
        const delta = Math.abs((session.startsAt?.getTime() ?? 0) - startsAt.getTime())

        return {
          session,
          hasNameHint,
          delta,
        }
      })
      .sort((a, b) => {
        if (a.hasNameHint !== b.hasNameHint) {
          return a.hasNameHint ? -1 : 1
        }
        return a.delta - b.delta
      })

    const match = candidates[0]?.session

    if (match) {
      matches.push({
        internalSessionId: match.id,
        providerSessionKey,
      })
    }
  }

  return matches
}

export function buildSessionDetailsImportPlan({
  lapsPayload,
  pitPayload,
  weatherPayload,
  driverNumberMap,
}: {
  lapsPayload: OpenF1LapPayload
  pitPayload: OpenF1PitPayload
  weatherPayload: OpenF1WeatherPayload
  driverNumberMap: Map<number, string>
}) {
  return {
    laps: lapsPayload
      .map((entry) => {
        const record = asRecord(entry)
        const driverNumber = asNumber(record.driver_number)
        const driverProviderJolpicaId = driverNumber ? driverNumberMap.get(driverNumber) : null
        if (!driverProviderJolpicaId) return null

        return {
          driverProviderJolpicaId,
          lapNumber: asNumber(record.lap_number) ?? 0,
          sampledAt: toDate(asString(record.date_start)),
          lapTimeMs: Math.round((asNumber(record.lap_duration) ?? 0) * 1000) || null,
          sector1Ms: Math.round((asNumber(record.duration_sector_1) ?? 0) * 1000) || null,
          sector2Ms: Math.round((asNumber(record.duration_sector_2) ?? 0) * 1000) || null,
          sector3Ms: Math.round((asNumber(record.duration_sector_3) ?? 0) * 1000) || null,
          isPitOutLap: Boolean(record.is_pit_out_lap),
        }
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
    pitStops: pitPayload
      .map((entry) => {
        const record = asRecord(entry)
        const driverNumber = asNumber(record.driver_number)
        const driverProviderJolpicaId = driverNumber ? driverNumberMap.get(driverNumber) : null
        if (!driverProviderJolpicaId) return null

        return {
          driverProviderJolpicaId,
          lapNumber: asNumber(record.lap_number),
          sampledAt: toDate(asString(record.date)),
          laneDurationMs: Math.round((asNumber(record.lane_duration) ?? 0) * 1000) || null,
          stopDurationMs: Math.round((asNumber(record.stop_duration) ?? 0) * 1000) || null,
        }
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
    weatherSamples: weatherPayload.map((entry) => {
      const record = asRecord(entry)

      return {
        sampledAt: toDate(asString(record.date)) ?? new Date(),
        airTemp: asNumber(record.air_temperature),
        trackTemp: asNumber(record.track_temperature),
        humidity: asNumber(record.humidity),
        rainfall: asNumber(record.rainfall),
        pressure: asNumber(record.pressure),
        windSpeed: asNumber(record.wind_speed),
        windDirection: asNumber(record.wind_direction),
      }
    }),
  }
}

async function syncOpenF1SessionKeys(year: number) {
  if (year < 2023) return 0

  const [internalSessions, openF1Sessions] = await Promise.all([
    prisma.session.findMany({
      where: {
        raceWeekend: {
          season: {
            year,
          },
        },
      },
      include: {
        raceWeekend: true,
      },
    }),
    fetchWithRateLimitRetry(() => scheduleOpenF1Request(() => getSessionsByYear(year))),
  ])

  const matches = matchOpenF1SessionToInternalSession({
    internalSessions,
    openF1Sessions,
  })

  for (const match of matches) {
    await prisma.session.update({
      where: { id: match.internalSessionId },
      data: {
        providerSessionKey: match.providerSessionKey,
      },
    })
  }

  return matches.length
}

export async function syncSessionDetailsForYear(year: number) {
  if (year < 2023) {
    return {
      matchedSessions: 0,
      laps: 0,
      pitStops: 0,
      weatherSamples: 0,
    }
  }

  const matchedSessions = await syncOpenF1SessionKeys(year)

  const sessions = await prisma.session.findMany({
    where: {
      type: "RACE",
      providerSessionKey: {
        not: null,
      },
      raceWeekend: {
        season: {
          year,
        },
      },
    },
    include: {
      raceWeekend: true,
    },
  })

  const drivers = await prisma.driver.findMany({
    where: {
      permanentNumber: {
        not: null,
      },
    },
  })

  const driverNumberMap = new Map<number, string>()
  for (const driver of drivers) {
    if (driver.permanentNumber && driver.providerJolpicaId) {
      driverNumberMap.set(driver.permanentNumber, driver.providerJolpicaId)
    }
  }

  let laps = 0
  let pitStops = 0
  let weatherSamples = 0

  for (const session of sessions) {
    const sessionKey = session.providerSessionKey
    if (!sessionKey) continue

    const lapsPayload = await fetchWithRateLimitRetry(() =>
      scheduleOpenF1Request(() => getLapsBySession(sessionKey)),
    )
    const pitPayload = await fetchWithRateLimitRetry(() =>
      scheduleOpenF1Request(() => getPitBySession(sessionKey)),
    )
    const weatherPayload = await fetchWithRateLimitRetry(() =>
      scheduleOpenF1Request(() => getWeatherBySession(sessionKey)),
    )

    const plan = buildSessionDetailsImportPlan({
      lapsPayload,
      pitPayload,
      weatherPayload,
      driverNumberMap,
    })

    for (const lap of plan.laps) {
      const driver = await prisma.driver.findUniqueOrThrow({
        where: { providerJolpicaId: lap.driverProviderJolpicaId },
      })

      await prisma.lap.upsert({
        where: {
          sessionId_driverId_lapNumber: {
            sessionId: session.id,
            driverId: driver.id,
            lapNumber: lap.lapNumber,
          },
        },
        update: {
          sampledAt: lap.sampledAt,
          lapTimeMs: lap.lapTimeMs,
          sector1Ms: lap.sector1Ms,
          sector2Ms: lap.sector2Ms,
          sector3Ms: lap.sector3Ms,
          isPitOutLap: lap.isPitOutLap,
        },
        create: {
          sessionId: session.id,
          driverId: driver.id,
          lapNumber: lap.lapNumber,
          sampledAt: lap.sampledAt,
          lapTimeMs: lap.lapTimeMs,
          sector1Ms: lap.sector1Ms,
          sector2Ms: lap.sector2Ms,
          sector3Ms: lap.sector3Ms,
          isPitOutLap: lap.isPitOutLap,
        },
      })
    }

    for (const pitStop of plan.pitStops) {
      const driver = await prisma.driver.findUniqueOrThrow({
        where: { providerJolpicaId: pitStop.driverProviderJolpicaId },
      })

      await prisma.pitStop.upsert({
        where: {
          sessionId_driverId_lapNumber: {
            sessionId: session.id,
            driverId: driver.id,
            lapNumber: pitStop.lapNumber ?? -1,
          },
        },
        update: {
          sampledAt: pitStop.sampledAt,
          laneDurationMs: pitStop.laneDurationMs,
          stopDurationMs: pitStop.stopDurationMs,
        },
        create: {
          sessionId: session.id,
          driverId: driver.id,
          lapNumber: pitStop.lapNumber ?? -1,
          sampledAt: pitStop.sampledAt,
          laneDurationMs: pitStop.laneDurationMs,
          stopDurationMs: pitStop.stopDurationMs,
        },
      })
    }

    for (const sample of plan.weatherSamples) {
      await prisma.weatherSample.upsert({
        where: {
          sessionId_sampledAt: {
            sessionId: session.id,
            sampledAt: sample.sampledAt,
          },
        },
        update: sample,
        create: {
          sessionId: session.id,
          ...sample,
        },
      })
    }

    laps += plan.laps.length
    pitStops += plan.pitStops.length
    weatherSamples += plan.weatherSamples.length
  }

  return {
    matchedSessions,
    laps,
    pitStops,
    weatherSamples,
  }
}
