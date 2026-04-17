import { prisma } from "@/lib/db/prisma"
import type {
  JolpicaQualifyingResultsPayload,
  JolpicaRaceResultsPayload,
  JolpicaSprintResultsPayload,
} from "@/lib/providers/jolpica"
import {
  getQualifyingResults,
  getRaceResults,
  getSprintResults,
} from "@/lib/providers/jolpica"

type RetryOptions = {
  maxRetries?: number
  baseDelayMs?: number
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

export function parseLapTimeToMilliseconds(value: string | null) {
  if (!value) return null
  const [minutesPart, secondsPart] = value.split(":")
  if (!minutesPart || !secondsPart) return null
  const [seconds, milliseconds = "0"] = secondsPart.split(".")
  const minutes = Number(minutesPart)
  const secondsNumber = Number(seconds)
  const ms = Number(milliseconds.padEnd(3, "0"))

  if ([minutes, secondsNumber, ms].some((part) => Number.isNaN(part))) {
    return null
  }

  return minutes * 60_000 + secondsNumber * 1_000 + ms
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

type SessionResultImportPlan = {
  raceResults: Array<{
    driverProviderJolpicaId: string
    constructorProviderJolpicaId: string
    grid: number | null
    finishPosition: number | null
    classifiedPositionText: string | null
    points: number
    lapsCompleted: number | null
    totalTimeMs: number | null
    status: string | null
  }>
  qualifyingResults: Array<{
    driverProviderJolpicaId: string
    constructorProviderJolpicaId: string
    position: number
    q1Ms: number | null
    q2Ms: number | null
    q3Ms: number | null
  }>
  sprintResults: Array<{
    driverProviderJolpicaId: string
    constructorProviderJolpicaId: string
    position: number | null
    points: number
    lapsCompleted: number | null
    totalTimeMs: number | null
    status: string | null
  }>
}

export function buildSessionResultImportPlan({
  raceResultsPayload,
  qualifyingResultsPayload,
  sprintResultsPayload,
}: {
  year: number
  round: number
  raceResultsPayload: JolpicaRaceResultsPayload | null
  qualifyingResultsPayload: JolpicaQualifyingResultsPayload | null
  sprintResultsPayload: JolpicaSprintResultsPayload | null
}): SessionResultImportPlan {
  const raceEntries =
    raceResultsPayload?.MRData.RaceTable.Races[0] &&
    (asRecord(raceResultsPayload.MRData.RaceTable.Races[0]).Results as unknown[] | undefined)
      ? ((asRecord(raceResultsPayload.MRData.RaceTable.Races[0]).Results as unknown[]) ?? [])
      : []

  const qualifyingEntries =
    qualifyingResultsPayload?.MRData.RaceTable.Races[0] &&
    (asRecord(qualifyingResultsPayload.MRData.RaceTable.Races[0]).QualifyingResults as
      | unknown[]
      | undefined)
      ? ((asRecord(qualifyingResultsPayload.MRData.RaceTable.Races[0]).QualifyingResults as
          unknown[]) ?? [])
      : []

  const sprintEntries =
    sprintResultsPayload?.MRData.RaceTable.Races[0] &&
    (asRecord(sprintResultsPayload.MRData.RaceTable.Races[0]).SprintResults as unknown[] | undefined)
      ? ((asRecord(sprintResultsPayload.MRData.RaceTable.Races[0]).SprintResults as unknown[]) ??
        [])
      : []

  return {
    raceResults: raceEntries.map((entry) => {
      const record = asRecord(entry)
      const driver = asRecord(record.Driver)
      const constructor = asRecord(record.Constructor)
      const time = asRecord(record.Time)

      return {
        driverProviderJolpicaId: asString(driver.driverId) ?? "unknown-driver",
        constructorProviderJolpicaId:
          asString(constructor.constructorId) ?? "unknown-constructor",
        grid: asNumber(record.grid),
        finishPosition: asNumber(record.position),
        classifiedPositionText: asString(record.positionText),
        points: asNumber(record.points) ?? 0,
        lapsCompleted: asNumber(record.laps),
        totalTimeMs: asNumber(time.millis),
        status: asString(record.status),
      }
    }),
    qualifyingResults: qualifyingEntries.map((entry) => {
      const record = asRecord(entry)
      const driver = asRecord(record.Driver)
      const constructor = asRecord(record.Constructor)

      return {
        driverProviderJolpicaId: asString(driver.driverId) ?? "unknown-driver",
        constructorProviderJolpicaId:
          asString(constructor.constructorId) ?? "unknown-constructor",
        position: asNumber(record.position) ?? 0,
        q1Ms: parseLapTimeToMilliseconds(asString(record.Q1)),
        q2Ms: parseLapTimeToMilliseconds(asString(record.Q2)),
        q3Ms: parseLapTimeToMilliseconds(asString(record.Q3)),
      }
    }),
    sprintResults: sprintEntries.map((entry) => {
      const record = asRecord(entry)
      const driver = asRecord(record.Driver)
      const constructor = asRecord(record.Constructor)
      const time = asRecord(record.Time)

      return {
        driverProviderJolpicaId: asString(driver.driverId) ?? "unknown-driver",
        constructorProviderJolpicaId:
          asString(constructor.constructorId) ?? "unknown-constructor",
        position: asNumber(record.position),
        points: asNumber(record.points) ?? 0,
        lapsCompleted: asNumber(record.laps),
        totalTimeMs: asNumber(time.millis),
        status: asString(record.status),
      }
    }),
  }
}

async function syncRoundResults(year: number, round: number) {
  const weekend = await prisma.raceWeekend.findFirst({
    where: {
      round,
      season: {
        year,
      },
    },
    include: {
      sessions: true,
    },
  })

  if (!weekend) {
    return {
      round,
      raceResults: 0,
      qualifyingResults: 0,
      sprintResults: 0,
    }
  }

  const raceResultsPayload = await fetchWithRateLimitRetry(() => getRaceResults(year, round))
  const qualifyingResultsPayload = await fetchWithRateLimitRetry(() =>
    getQualifyingResults(year, round),
  )
  const sprintResultsPayload = await fetchWithRateLimitRetry(
    () => getSprintResults(year, round),
  ).catch(() => null)

  const plan = buildSessionResultImportPlan({
    year,
    round,
    raceResultsPayload,
    qualifyingResultsPayload,
    sprintResultsPayload,
  })

  const raceSession = weekend.sessions.find((session) => session.type === "RACE")
  const qualifyingSession = weekend.sessions.find((session) => session.type === "QUALIFYING")
  const sprintSession = weekend.sessions.find((session) => session.type === "SPRINT")

  if (raceSession) {
    for (const result of plan.raceResults) {
      const driver = await prisma.driver.findUniqueOrThrow({
        where: { providerJolpicaId: result.driverProviderJolpicaId },
      })
      const constructor = await prisma.constructor.findUniqueOrThrow({
        where: { providerJolpicaId: result.constructorProviderJolpicaId },
      })

      await prisma.raceResult.upsert({
        where: {
          sessionId_driverId: {
            sessionId: raceSession.id,
            driverId: driver.id,
          },
        },
        update: {
          constructorId: constructor.id,
          grid: result.grid,
          finishPosition: result.finishPosition,
          classifiedPositionText: result.classifiedPositionText,
          points: result.points,
          lapsCompleted: result.lapsCompleted,
          totalTimeMs: result.totalTimeMs,
          status: result.status,
        },
        create: {
          raceWeekendId: weekend.id,
          sessionId: raceSession.id,
          driverId: driver.id,
          constructorId: constructor.id,
          grid: result.grid,
          finishPosition: result.finishPosition,
          classifiedPositionText: result.classifiedPositionText,
          points: result.points,
          lapsCompleted: result.lapsCompleted,
          totalTimeMs: result.totalTimeMs,
          status: result.status,
        },
      })
    }
  }

  if (qualifyingSession) {
    for (const result of plan.qualifyingResults) {
      const driver = await prisma.driver.findUniqueOrThrow({
        where: { providerJolpicaId: result.driverProviderJolpicaId },
      })
      const constructor = await prisma.constructor.findUniqueOrThrow({
        where: { providerJolpicaId: result.constructorProviderJolpicaId },
      })

      await prisma.qualifyingResult.upsert({
        where: {
          sessionId_driverId: {
            sessionId: qualifyingSession.id,
            driverId: driver.id,
          },
        },
        update: {
          constructorId: constructor.id,
          position: result.position,
          q1Ms: result.q1Ms,
          q2Ms: result.q2Ms,
          q3Ms: result.q3Ms,
        },
        create: {
          sessionId: qualifyingSession.id,
          driverId: driver.id,
          constructorId: constructor.id,
          position: result.position,
          q1Ms: result.q1Ms,
          q2Ms: result.q2Ms,
          q3Ms: result.q3Ms,
        },
      })
    }
  }

  if (sprintSession) {
    for (const result of plan.sprintResults) {
      const driver = await prisma.driver.findUniqueOrThrow({
        where: { providerJolpicaId: result.driverProviderJolpicaId },
      })
      const constructor = await prisma.constructor.findUniqueOrThrow({
        where: { providerJolpicaId: result.constructorProviderJolpicaId },
      })

      await prisma.sprintResult.upsert({
        where: {
          sessionId_driverId: {
            sessionId: sprintSession.id,
            driverId: driver.id,
          },
        },
        update: {
          constructorId: constructor.id,
          position: result.position,
          points: result.points,
          lapsCompleted: result.lapsCompleted,
          totalTimeMs: result.totalTimeMs,
          status: result.status,
        },
        create: {
          sessionId: sprintSession.id,
          driverId: driver.id,
          constructorId: constructor.id,
          position: result.position,
          points: result.points,
          lapsCompleted: result.lapsCompleted,
          totalTimeMs: result.totalTimeMs,
          status: result.status,
        },
      })
    }
  }

  return {
    round,
    raceResults: plan.raceResults.length,
    qualifyingResults: plan.qualifyingResults.length,
    sprintResults: plan.sprintResults.length,
  }
}

export async function syncSessionResultsForYear(year: number) {
  const weekends = await prisma.raceWeekend.findMany({
    where: {
      season: {
        year,
      },
    },
    orderBy: {
      round: "asc",
    },
  })

  let raceResults = 0
  let qualifyingResults = 0
  let sprintResults = 0

  for (const weekend of weekends) {
    const roundResult = await syncRoundResults(year, weekend.round)
    raceResults += roundResult.raceResults
    qualifyingResults += roundResult.qualifyingResults
    sprintResults += roundResult.sprintResults
    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  return {
    raceResults,
    qualifyingResults,
    sprintResults,
  }
}
