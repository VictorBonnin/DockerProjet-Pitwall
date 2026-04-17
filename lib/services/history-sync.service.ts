import { prisma } from "@/lib/db/prisma"
import type {
  JolpicaConstructorStandingsPayload,
  JolpicaDriverStandingsPayload,
  JolpicaSchedulePayload,
} from "@/lib/providers/jolpica"
import {
  getConstructorStandings,
  getDriverStandings,
  getSeasonSchedule,
} from "@/lib/providers/jolpica"
import { syncSessionResultsForYear } from "@/lib/services/session-results-sync.service"
import { syncSessionDetailsForYear } from "@/lib/services/session-details-sync.service"

type ImportPlan = {
  season: {
    year: number
    startsAt: Date | null
    endsAt: Date | null
  }
  circuits: Array<{
    providerJolpicaId: string
    name: string
    country: string
    locality: string | null
    lat: number | null
    lng: number | null
  }>
  raceWeekends: Array<{
    providerRaceUrl: string | null
    round: number
    slug: string
    name: string
    officialName: string | null
    country: string | null
    status: string
    startDate: Date | null
    endDate: Date | null
    circuitProviderJolpicaId: string
  }>
  sessions: Array<{
    raceWeekendSlug: string
    type: string
    name: string
    startsAt: Date | null
    isLiveCapable: boolean
  }>
  drivers: Array<{
    providerJolpicaId: string
    code: string | null
    firstName: string
    lastName: string
    fullName: string
    permanentNumber: number | null
    nationality: string | null
  }>
  constructors: Array<{
    providerJolpicaId: string
    name: string
    slug: string
    nationality: string | null
  }>
  driverStandings: Array<{
    driverProviderJolpicaId: string
    constructorProviderJolpicaId: string | null
    position: number
    points: number
    wins: number
  }>
  constructorStandings: Array<{
    constructorProviderJolpicaId: string
    position: number
    points: number
    wins: number
  }>
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

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
}

function toDate(date: string | null, time?: string | null) {
  if (!date) return null
  return new Date(time ? `${date}T${time}` : `${date}T00:00:00Z`)
}

const sessionDefinitions = [
  ["FirstPractice", "FP1", "Practice 1", false],
  ["SecondPractice", "FP2", "Practice 2", false],
  ["ThirdPractice", "FP3", "Practice 3", false],
  ["SprintQualifying", "SPRINT_QUALIFYING", "Sprint Qualifying", false],
  ["SprintShootout", "SPRINT_SHOOTOUT", "Sprint Shootout", false],
  ["Sprint", "SPRINT", "Sprint", true],
  ["Qualifying", "QUALIFYING", "Qualifying", true],
] as const

export function buildHistoricalImportPlan({
  year,
  schedulePayload,
  driverStandingsPayload,
  constructorStandingsPayload,
}: {
  year: number
  schedulePayload: JolpicaSchedulePayload
  driverStandingsPayload: JolpicaDriverStandingsPayload
  constructorStandingsPayload: JolpicaConstructorStandingsPayload
}): ImportPlan {
  const races = schedulePayload.MRData.RaceTable.Races ?? []

  const circuits = new Map<string, ImportPlan["circuits"][number]>()
  const raceWeekends: ImportPlan["raceWeekends"] = []
  const sessions: ImportPlan["sessions"] = []

  for (const race of races) {
    const raceRecord = asRecord(race)
    const circuit = asRecord(raceRecord.Circuit)
    const location = asRecord(circuit.Location)
    const circuitProviderJolpicaId = asString(circuit.circuitId) ?? "unknown-circuit"
    const country = asString(location.country)
    const raceName = asString(raceRecord.raceName) ?? "Unnamed race"
    const round = asNumber(raceRecord.round) ?? 0
    const slug = `${year}-${String(round).padStart(2, "0")}-${slugify(raceName)}`

    circuits.set(circuitProviderJolpicaId, {
      providerJolpicaId: circuitProviderJolpicaId,
      name: asString(circuit.circuitName) ?? circuitProviderJolpicaId,
      country: country ?? "Unknown",
      locality: asString(location.locality),
      lat: asNumber(location.lat),
      lng: asNumber(location.long),
    })

    const raceDate = asString(raceRecord.date)
    raceWeekends.push({
      providerRaceUrl: asString(raceRecord.url),
      round,
      slug,
      name: raceName,
      officialName: asString(raceRecord.raceName),
      country,
      status: "COMPLETED",
      startDate: toDate(raceDate, asString(raceRecord.time)),
      endDate: toDate(raceDate, asString(raceRecord.time)),
      circuitProviderJolpicaId,
    })

    for (const [providerKey, type, name, isLiveCapable] of sessionDefinitions) {
      const session = asRecord(raceRecord[providerKey])
      const sessionDate = asString(session.date)
      if (!sessionDate) continue

      sessions.push({
        raceWeekendSlug: slug,
        type,
        name,
        startsAt: toDate(sessionDate, asString(session.time)),
        isLiveCapable,
      })
    }
  }

  const drivers = new Map<string, ImportPlan["drivers"][number]>()
  const constructors = new Map<string, ImportPlan["constructors"][number]>()
  const driverStandings: ImportPlan["driverStandings"] = []

  const driverStandingList =
    driverStandingsPayload.MRData.StandingsTable.StandingsLists[0]?.DriverStandings ?? []

  for (const entry of driverStandingList) {
    const record = asRecord(entry)
    const driver = asRecord(record.Driver)
    const constructor = asRecord((record.Constructors as unknown[] | undefined)?.[0])
    const driverProviderJolpicaId = asString(driver.driverId) ?? "unknown-driver"
    const constructorProviderJolpicaId = asString(constructor.constructorId)

    drivers.set(driverProviderJolpicaId, {
      providerJolpicaId: driverProviderJolpicaId,
      code: asString(driver.code),
      firstName: asString(driver.givenName) ?? "Unknown",
      lastName: asString(driver.familyName) ?? "Driver",
      fullName: `${asString(driver.givenName) ?? "Unknown"} ${asString(driver.familyName) ?? "Driver"}`,
      permanentNumber: asNumber(driver.permanentNumber),
      nationality: asString(driver.nationality),
    })

    if (constructorProviderJolpicaId) {
      constructors.set(constructorProviderJolpicaId, {
        providerJolpicaId: constructorProviderJolpicaId,
        name: asString(constructor.name) ?? constructorProviderJolpicaId,
        slug: slugify(asString(constructor.name) ?? constructorProviderJolpicaId),
        nationality: asString(constructor.nationality),
      })
    }

    driverStandings.push({
      driverProviderJolpicaId,
      constructorProviderJolpicaId,
      position: asNumber(record.position) ?? 0,
      points: asNumber(record.points) ?? 0,
      wins: asNumber(record.wins) ?? 0,
    })
  }

  const constructorStandings: ImportPlan["constructorStandings"] = []
  const constructorStandingList =
    constructorStandingsPayload.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings ??
    []

  for (const entry of constructorStandingList) {
    const record = asRecord(entry)
    const constructor = asRecord(record.Constructor)
    const constructorProviderJolpicaId = asString(constructor.constructorId) ?? "unknown-constructor"

    constructors.set(constructorProviderJolpicaId, {
      providerJolpicaId: constructorProviderJolpicaId,
      name: asString(constructor.name) ?? constructorProviderJolpicaId,
      slug: slugify(asString(constructor.name) ?? constructorProviderJolpicaId),
      nationality: asString(constructor.nationality),
    })

    constructorStandings.push({
      constructorProviderJolpicaId,
      position: asNumber(record.position) ?? 0,
      points: asNumber(record.points) ?? 0,
      wins: asNumber(record.wins) ?? 0,
    })
  }

  const startsAt = raceWeekends[0]?.startDate ?? null
  const endsAt = raceWeekends.at(-1)?.endDate ?? null

  return {
    season: {
      year,
      startsAt,
      endsAt,
    },
    circuits: [...circuits.values()],
    raceWeekends,
    sessions,
    drivers: [...drivers.values()],
    constructors: [...constructors.values()],
    driverStandings,
    constructorStandings,
  }
}

export async function syncHistoricalSeason(year: number) {
  const [schedulePayload, driverStandingsPayload, constructorStandingsPayload] =
    await Promise.all([
      getSeasonSchedule(year),
      getDriverStandings(year),
      getConstructorStandings(year),
    ])

  const plan = buildHistoricalImportPlan({
    year,
    schedulePayload,
    driverStandingsPayload,
    constructorStandingsPayload,
  })

  const season = await prisma.season.upsert({
    where: { year: plan.season.year },
    update: {
      startsAt: plan.season.startsAt,
      endsAt: plan.season.endsAt,
    },
    create: plan.season,
  })

  for (const circuit of plan.circuits) {
    await prisma.circuit.upsert({
      where: { providerJolpicaId: circuit.providerJolpicaId },
      update: circuit,
      create: circuit,
    })
  }

  for (const constructor of plan.constructors) {
    await prisma.constructor.upsert({
      where: { providerJolpicaId: constructor.providerJolpicaId },
      update: constructor,
      create: constructor,
    })
  }

  for (const driver of plan.drivers) {
    await prisma.driver.upsert({
      where: { providerJolpicaId: driver.providerJolpicaId },
      update: driver,
      create: driver,
    })
  }

  for (const weekend of plan.raceWeekends) {
    const circuit = await prisma.circuit.findUniqueOrThrow({
      where: { providerJolpicaId: weekend.circuitProviderJolpicaId },
    })

    await prisma.raceWeekend.upsert({
      where: {
        seasonId_round: {
          seasonId: season.id,
          round: weekend.round,
        },
      },
      update: {
        providerRaceUrl: weekend.providerRaceUrl,
        slug: weekend.slug,
        name: weekend.name,
        officialName: weekend.officialName,
        country: weekend.country,
        status: weekend.status,
        startDate: weekend.startDate,
        endDate: weekend.endDate,
        circuitId: circuit.id,
      },
      create: {
        seasonId: season.id,
        circuitId: circuit.id,
        providerRaceUrl: weekend.providerRaceUrl,
        round: weekend.round,
        slug: weekend.slug,
        name: weekend.name,
        officialName: weekend.officialName,
        country: weekend.country,
        status: weekend.status,
        startDate: weekend.startDate,
        endDate: weekend.endDate,
      },
    })
  }

  for (const session of plan.sessions) {
    const weekend = await prisma.raceWeekend.findUniqueOrThrow({
      where: { slug: session.raceWeekendSlug },
    })

    await prisma.session.upsert({
      where: {
        raceWeekendId_type: {
          raceWeekendId: weekend.id,
          type: session.type,
        },
      },
      update: {
        name: session.name,
        startsAt: session.startsAt,
        isLiveCapable: session.isLiveCapable,
      },
      create: {
        raceWeekendId: weekend.id,
        type: session.type,
        name: session.name,
        startsAt: session.startsAt,
        isLiveCapable: session.isLiveCapable,
      },
    })
  }

  for (const weekend of plan.raceWeekends) {
    const dbWeekend = await prisma.raceWeekend.findUniqueOrThrow({
      where: { slug: weekend.slug },
    })

    await prisma.session.upsert({
      where: {
        raceWeekendId_type: {
          raceWeekendId: dbWeekend.id,
          type: "RACE",
        },
      },
      update: {
        name: "Race",
        startsAt: weekend.endDate,
        isLiveCapable: true,
      },
      create: {
        raceWeekendId: dbWeekend.id,
        type: "RACE",
        name: "Race",
        startsAt: weekend.endDate,
        isLiveCapable: true,
      },
    })
  }

  for (const standing of plan.driverStandings) {
    const driver = await prisma.driver.findUniqueOrThrow({
      where: { providerJolpicaId: standing.driverProviderJolpicaId },
    })
    const constructor = standing.constructorProviderJolpicaId
      ? await prisma.constructor.findUnique({
          where: { providerJolpicaId: standing.constructorProviderJolpicaId },
        })
      : null

    await prisma.driverStanding.upsert({
      where: {
        seasonId_driverId: {
          seasonId: season.id,
          driverId: driver.id,
        },
      },
      update: {
        constructorId: constructor?.id ?? null,
        position: standing.position,
        points: standing.points,
        wins: standing.wins,
      },
      create: {
        seasonId: season.id,
        driverId: driver.id,
        constructorId: constructor?.id ?? null,
        position: standing.position,
        points: standing.points,
        wins: standing.wins,
      },
    })
  }

  for (const standing of plan.constructorStandings) {
    const constructor = await prisma.constructor.findUniqueOrThrow({
      where: { providerJolpicaId: standing.constructorProviderJolpicaId },
    })

    await prisma.constructorStanding.upsert({
      where: {
        seasonId_constructorId: {
          seasonId: season.id,
          constructorId: constructor.id,
        },
      },
      update: {
        position: standing.position,
        points: standing.points,
        wins: standing.wins,
      },
      create: {
        seasonId: season.id,
        constructorId: constructor.id,
        position: standing.position,
        points: standing.points,
        wins: standing.wins,
      },
    })
  }

  const sessionResults = await syncSessionResultsForYear(year)
  const sessionDetails = await syncSessionDetailsForYear(year)

  return {
    year,
    seasonId: season.id,
    circuits: plan.circuits.length,
    raceWeekends: plan.raceWeekends.length,
    sessions: plan.sessions.length,
    drivers: plan.drivers.length,
    constructors: plan.constructors.length,
    driverStandings: plan.driverStandings.length,
    constructorStandings: plan.constructorStandings.length,
    raceResults: sessionResults.raceResults,
    qualifyingResults: sessionResults.qualifyingResults,
    sprintResults: sessionResults.sprintResults,
    matchedOpenF1Sessions: sessionDetails.matchedSessions,
    laps: sessionDetails.laps,
    pitStops: sessionDetails.pitStops,
    weatherSamples: sessionDetails.weatherSamples,
  }
}
