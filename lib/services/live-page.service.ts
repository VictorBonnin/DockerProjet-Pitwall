import { prisma } from "@/lib/db/prisma"
import { getCircuitReference } from "@/lib/circuit-reference"
import {
  getCarDataBySession,
  getDriversBySession,
  getIntervalsBySession,
  getLatestSession,
  getLocationBySession,
  getPositionBySession,
  getRaceControlBySession,
  getStintsBySession,
  getWeatherByLiveSession,
  type OpenF1CarDataPayload,
  type OpenF1DriverPayload,
  type OpenF1IntervalPayload,
  type OpenF1LocationPayload,
  type OpenF1PositionPayload,
  type OpenF1RaceControlPayload,
  type OpenF1SessionPayload,
  type OpenF1StintPayload,
  type OpenF1WeatherPayload,
} from "@/lib/providers/openf1"

type SessionKey = number | "latest"

type FallbackRace = {
  name: string
  circuitName: string
  locationLabel: string
  startsAt: Date | null
} | null

type BuildLivePageModelInput = {
  session: Record<string, unknown> | null
  drivers: OpenF1DriverPayload
  positions: OpenF1PositionPayload
  intervals: OpenF1IntervalPayload
  locations: OpenF1LocationPayload
  stints: OpenF1StintPayload
  carData: OpenF1CarDataPayload
  weather: OpenF1WeatherPayload
  raceControl: OpenF1RaceControlPayload
  fallbackRace: FallbackRace
}

function asRecord(value: unknown) {
  return (value ?? {}) as Record<string, unknown>
}

function asString(value: unknown) {
  return typeof value === "string" ? value : null
}

function asNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value === "string" && value.length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function asDate(value: unknown) {
  const raw = asString(value)
  if (!raw) return null

  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

function latestByDriverNumber<T extends Record<string, unknown>>(items: T[]) {
  const latest = new Map<number, T>()

  for (const item of items) {
    const driverNumber = asNumber(item.driver_number)
    if (!driverNumber) continue

    const currentDate = asDate(item.date)?.getTime() ?? 0
    const previousDate = asDate(latest.get(driverNumber)?.date)?.getTime() ?? -1

    if (!latest.has(driverNumber) || currentDate >= previousDate) {
      latest.set(driverNumber, item)
    }
  }

  return latest
}

function latestStintByDriverNumber(items: OpenF1StintPayload) {
  const latest = new Map<number, Record<string, unknown>>()

  for (const item of items) {
    const record = asRecord(item)
    const driverNumber = asNumber(record.driver_number)
    if (!driverNumber) continue

    const currentStint = asNumber(record.stint_number) ?? 0
    const previousStint = asNumber(latest.get(driverNumber)?.stint_number) ?? -1

    if (!latest.has(driverNumber) || currentStint >= previousStint) {
      latest.set(driverNumber, record)
    }
  }

  return latest
}

function latestRecord(items: Array<Record<string, unknown>>) {
  return [...items].sort((a, b) => (asDate(b.date)?.getTime() ?? 0) - (asDate(a.date)?.getTime() ?? 0))[0] ?? null
}

function formatSeconds(value: unknown, leaderLabel = "Leader") {
  if (value === null || value === undefined || value === "") return leaderLabel
  if (typeof value === "string" && value.includes("LAP")) return value

  const numeric = asNumber(value)
  return numeric === null ? "N/A" : `+${numeric.toFixed(3)}s`
}

function formatTemperature(value: unknown) {
  const numeric = asNumber(value)
  return numeric === null ? "N/A" : `${numeric.toFixed(1)}°C`
}

function formatPercent(value: unknown) {
  const numeric = asNumber(value)
  return numeric === null ? "N/A" : `${Math.round(numeric)}%`
}

function formatPlainNumber(value: unknown, suffix = "") {
  const numeric = asNumber(value)
  return numeric === null ? "N/A" : `${Math.round(numeric)}${suffix}`
}

function formatActiveAero(value: unknown, sessionStartsAt: Date | null) {
  const numeric = asNumber(value)
  if (numeric === null) return "N/A"

  const isLowDragState = [10, 12, 14].includes(numeric)
  const isActiveAeroEra = (sessionStartsAt?.getUTCFullYear() ?? 0) >= 2026

  if (isActiveAeroEra) {
    return isLowDragState ? "Mode ligne droite" : "Mode virage"
  }

  return isLowDragState ? "DRS actif" : "DRS ferme"
}

function normalizeTeamColor(value: unknown) {
  const raw = asString(value)?.replace("#", "").trim()
  return raw && /^[0-9a-f]{6}$/i.test(raw) ? `#${raw}` : "#c9a44a"
}

function formatDateTime(date: Date | null) {
  if (!date) return "Horaire a confirmer"

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(date)
}

function normalizeCoordinate(value: number | null, min: number, max: number) {
  if (value === null) return 50
  if (max === min) return 50

  return 8 + ((value - min) / (max - min)) * 84
}

function isOpenF1SessionCurrentlyLive(session: Record<string, unknown>, now: Date) {
  const startsAt = asDate(session.date_start)
  const endsAt = asDate(session.date_end)
  if (!startsAt) return false

  const nowMs = now.getTime()
  const startsAtMs = startsAt.getTime()
  const endsAtMs = endsAt?.getTime() ?? startsAtMs + 1000 * 60 * 60 * 8

  return nowMs >= startsAtMs && nowMs <= endsAtMs + 1000 * 60 * 45
}

async function safely<T>(operation: () => Promise<T>, fallback: T) {
  try {
    return await operation()
  } catch {
    return fallback
  }
}

async function getFallbackRace() {
  const season = await prisma.season.findFirst({
    orderBy: { year: "desc" },
    include: {
      raceWeekends: {
        include: {
          circuit: true,
        },
        orderBy: { round: "asc" },
      },
    },
  })

  const weekends = season?.raceWeekends ?? []
  const race = weekends.find((weekend) => weekend.status !== "COMPLETED") ?? weekends.at(-1) ?? null
  if (!race) return null

  return {
    name: race.name,
    circuitName: race.circuit.name,
    locationLabel: [race.circuit.locality, race.country ?? race.circuit.country].filter(Boolean).join(", "),
    startsAt: race.startDate,
  }
}

async function getLocalLiveSession() {
  return prisma.liveSession.findFirst({
    where: {
      status: "OPEN",
    },
    include: {
      session: {
        include: {
          raceWeekend: {
            include: {
              circuit: true,
            },
          },
        },
      },
    },
    orderBy: {
      openedAt: "desc",
    },
  })
}

export function buildLivePageModel({
  session,
  drivers,
  positions,
  intervals,
  locations,
  stints,
  carData,
  weather,
  raceControl,
  fallbackRace,
}: BuildLivePageModelInput) {
  const sessionRecord = session ? asRecord(session) : null
  const circuitName =
    asString(sessionRecord?.circuit_short_name) ??
    asString(sessionRecord?.location) ??
    fallbackRace?.circuitName ??
    "Circuit a confirmer"
  const circuitReference = getCircuitReference(fallbackRace?.circuitName ?? circuitName)
  const title = asString(sessionRecord?.meeting_name) ?? fallbackRace?.name ?? "Live PitWall"
  const sessionName = asString(sessionRecord?.session_name) ?? "Veille live"
  const sessionType = asString(sessionRecord?.session_type) ?? "Standby"
  const sessionStartsAt = asDate(sessionRecord?.date_start) ?? fallbackRace?.startsAt ?? null
  const locationLabel =
    [asString(sessionRecord?.location), asString(sessionRecord?.country_name)].filter(Boolean).join(", ") ||
    fallbackRace?.locationLabel ||
    "Lieu a confirmer"

  const latestPositions = latestByDriverNumber(positions)
  const latestIntervals = latestByDriverNumber(intervals)
  const latestLocations = latestByDriverNumber(locations)
  const latestCarData = latestByDriverNumber(carData)
  const latestStints = latestStintByDriverNumber(stints)
  const driversByNumber = new Map<number, Record<string, unknown>>()

  for (const driver of drivers) {
    const record = asRecord(driver)
    const driverNumber = asNumber(record.driver_number)
    if (driverNumber) {
      driversByNumber.set(driverNumber, record)
    }
  }

  const numbers = new Set<number>([
    ...driversByNumber.keys(),
    ...latestPositions.keys(),
    ...latestIntervals.keys(),
    ...latestLocations.keys(),
  ])

  const leaderboard = [...numbers]
    .map((driverNumber) => {
      const driver = driversByNumber.get(driverNumber) ?? {}
      const position = latestPositions.get(driverNumber)
      const interval = latestIntervals.get(driverNumber)
      const stint = latestStints.get(driverNumber)
      const telemetry = latestCarData.get(driverNumber)
      const location = latestLocations.get(driverNumber)
      const currentPosition = asNumber(position?.position) ?? 99

      return {
        driverNumber,
        driverCode: asString(driver.name_acronym) ?? String(driverNumber),
        driverName: asString(driver.full_name) ?? `Pilote ${driverNumber}`,
        teamName: asString(driver.team_name) ?? "Equipe inconnue",
        teamColor: normalizeTeamColor(driver.team_colour),
        headshotUrl: asString(driver.headshot_url),
        position: currentPosition,
        gapToLeader: formatSeconds(interval?.gap_to_leader),
        interval: formatSeconds(interval?.interval, "Leader"),
        tyre: {
          compound: asString(stint?.compound) ?? "A determiner",
          ageLabel: asNumber(stint?.tyre_age_at_start) === null ? "Age inconnu" : `${asNumber(stint?.tyre_age_at_start)} tours`,
        },
        telemetry: {
          speed: formatPlainNumber(telemetry?.speed, " km/h"),
          throttle: formatPercent(telemetry?.throttle),
          brake: formatPercent(telemetry?.brake),
          gear: formatPlainNumber(telemetry?.n_gear ?? telemetry?.gear),
          activeAero: formatActiveAero(telemetry?.drs, sessionStartsAt),
          energy: "N/D OpenF1",
        },
        rawLocation: {
          x: asNumber(location?.x),
          y: asNumber(location?.y),
        },
      }
    })
    .sort((a, b) => a.position - b.position)

  const located = leaderboard.filter((entry) => entry.rawLocation.x !== null && entry.rawLocation.y !== null)
  const xs = located.map((entry) => entry.rawLocation.x ?? 0)
  const ys = located.map((entry) => entry.rawLocation.y ?? 0)
  const minX = Math.min(...xs, 0)
  const maxX = Math.max(...xs, 0)
  const minY = Math.min(...ys, 0)
  const maxY = Math.max(...ys, 0)
  const latestWeather = latestRecord(weather.map(asRecord))

  return {
    isLive: Boolean(sessionRecord),
    session: {
      title,
      name: sessionName,
      type: sessionType,
      statusLabel: sessionRecord ? "Session live" : "Veille live",
      circuitName,
      locationLabel,
      dateLabel: formatDateTime(sessionStartsAt),
    },
    track: {
      circuitName,
      circuitImagePath: circuitReference.officialImagePath,
      tracePath: circuitReference.tracePath,
      markers: located.map((entry) => ({
        driverCode: entry.driverCode,
        driverName: entry.driverName,
        position: entry.position,
        teamColor: entry.teamColor,
        xPercent: normalizeCoordinate(entry.rawLocation.x, minX, maxX),
        yPercent: normalizeCoordinate(entry.rawLocation.y, minY, maxY),
      })),
    },
    leaderboard: leaderboard.map(({ rawLocation: _rawLocation, ...entry }) => entry),
    weather: {
      airTemp: formatTemperature(latestWeather?.air_temperature),
      trackTemp: formatTemperature(latestWeather?.track_temperature),
      rainfall: asNumber(latestWeather?.rainfall) ? "Pluie" : "Sec",
      windSpeed: formatPlainNumber(latestWeather?.wind_speed, " km/h"),
    },
    raceControl: raceControl
      .map(asRecord)
      .sort((a, b) => (asDate(b.date)?.getTime() ?? 0) - (asDate(a.date)?.getTime() ?? 0))
      .slice(0, 6)
      .map((entry) => ({
        category: asString(entry.category) ?? "Info",
        flag: asString(entry.flag),
        message: asString(entry.message) ?? "Message indisponible",
        dateLabel: formatDateTime(asDate(entry.date)),
      })),
    emptyState: {
      title: "Aucune session live active",
      helper: fallbackRace
        ? `Prochaine course: ${fallbackRace.name} - ${formatDateTime(fallbackRace.startsAt)}`
        : "Le live se remplira automatiquement a la prochaine session active.",
    },
  }
}

export async function getLivePageData(now = new Date()) {
  const fallbackRace = await safely(() => getFallbackRace(), null)
  const localLiveSession = await safely(() => getLocalLiveSession(), null)

  let session: Record<string, unknown> | null = null
  let sessionKey: SessionKey | null = null

  if (localLiveSession?.providerSessionKey) {
    sessionKey = localLiveSession.providerSessionKey
    session = {
      session_key: sessionKey,
      meeting_name: localLiveSession.session.raceWeekend.name,
      session_name: localLiveSession.session.name,
      session_type: localLiveSession.session.type,
      location: localLiveSession.session.raceWeekend.circuit.locality,
      country_name: localLiveSession.session.raceWeekend.country,
      circuit_short_name: localLiveSession.session.raceWeekend.circuit.name,
      date_start: localLiveSession.session.startsAt?.toISOString(),
      date_end: localLiveSession.session.endsAt?.toISOString(),
    }
  } else {
    const latestSession = await safely(() => getLatestSession(), [] as OpenF1SessionPayload)
    const candidate = latestSession[0] ? asRecord(latestSession[0]) : null

    if (candidate && isOpenF1SessionCurrentlyLive(candidate, now)) {
      session = candidate
      sessionKey = asNumber(candidate.session_key) ?? "latest"
    }
  }

  if (!session || !sessionKey) {
    return buildLivePageModel({
      session: null,
      drivers: [],
      positions: [],
      intervals: [],
      locations: [],
      stints: [],
      carData: [],
      weather: [],
      raceControl: [],
      fallbackRace,
    })
  }

  const recentSinceIso = new Date(now.getTime() - 1000 * 60 * 8).toISOString()
  const controlSinceIso = new Date(now.getTime() - 1000 * 60 * 60).toISOString()
  const [drivers, positions, intervals, locations, stints, carData, weather, raceControl] = await Promise.all([
    safely(() => getDriversBySession(sessionKey), [] as OpenF1DriverPayload),
    safely(() => getPositionBySession(sessionKey, recentSinceIso), [] as OpenF1PositionPayload),
    safely(() => getIntervalsBySession(sessionKey, recentSinceIso), [] as OpenF1IntervalPayload),
    safely(() => getLocationBySession(sessionKey, recentSinceIso), [] as OpenF1LocationPayload),
    safely(() => getStintsBySession(sessionKey), [] as OpenF1StintPayload),
    safely(() => getCarDataBySession(sessionKey, recentSinceIso), [] as OpenF1CarDataPayload),
    safely(() => getWeatherByLiveSession(sessionKey, recentSinceIso), [] as OpenF1WeatherPayload),
    safely(() => getRaceControlBySession(sessionKey, controlSinceIso), [] as OpenF1RaceControlPayload),
  ])

  return buildLivePageModel({
    session,
    drivers,
    positions,
    intervals,
    locations,
    stints,
    carData,
    weather,
    raceControl,
    fallbackRace,
  })
}

export type LivePageData = Awaited<ReturnType<typeof getLivePageData>>
