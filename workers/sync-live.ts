import { prisma } from "@/lib/db/prisma"
import {
  getCarDataBySession,
  getDriversBySession,
  getLapsBySession,
  getLocationBySession,
  getPitBySession,
  getStintsBySession,
  getWeatherByLiveSession,
} from "@/lib/providers/openf1"

async function findOpenLiveSession() {
  return prisma.liveSession.findFirst({
    where: { status: "OPEN" },
    include: {
      session: {
        include: { raceWeekend: true },
      },
    },
    orderBy: { openedAt: "desc" },
  })
}

// ── Helpers ───────────────────────────────────────────────────

function asNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v
  if (typeof v === "string" && v !== "") {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function asStr(v: unknown): string | null {
  return typeof v === "string" && v !== "" ? v : null
}

function asDate(v: unknown): Date | null {
  const s = asStr(v)
  if (!s) return null
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

function secToMs(v: unknown): number | null {
  const n = asNum(v)
  return n === null ? null : Math.round(n * 1000)
}

function log(msg: string) {
  console.log(`[sync-live] ${new Date().toISOString()} ${msg}`)
}

// ── Driver number → DB id map ─────────────────────────────────

async function buildDriverMap(providerSessionKey: number): Promise<Map<number, string>> {
  const openf1Drivers = await getDriversBySession(providerSessionKey)
  const map = new Map<number, string>()

  for (const d of openf1Drivers) {
    const num = asNum(d.driver_number)
    if (!num) continue
    const dbDriver = await prisma.driver.findFirst({
      where: { permanentNumber: num },
      select: { id: true },
    })
    if (dbDriver) map.set(num, dbDriver.id)
  }

  log(`driver map: ${map.size} matched out of ${openf1Drivers.length}`)
  return map
}

// ── Persist: GPS positions ────────────────────────────────────

async function persistPositions(sessionId: string, rows: Array<Record<string, unknown>>) {
  if (!rows.length) return

  const data = rows.flatMap((r) => {
    const driverNumber = asNum(r.driver_number)
    const sampledAt = asDate(r.date)
    const x = asNum(r.x)
    const y = asNum(r.y)
    if (driverNumber === null || !sampledAt || x === null || y === null) return []
    return [{ sessionId, driverNumber, sampledAt, x, y, z: asNum(r.z) ?? undefined }]
  })

  if (!data.length) return
  const { count } = await prisma.liveCarPosition.createMany({ data, skipDuplicates: true })
  if (count) log(`positions +${count}`)
}

// ── Persist: car telemetry ────────────────────────────────────

async function persistTelemetry(sessionId: string, rows: Array<Record<string, unknown>>) {
  if (!rows.length) return

  const data = rows.flatMap((r) => {
    const driverNumber = asNum(r.driver_number)
    const sampledAt = asDate(r.date)
    if (driverNumber === null || !sampledAt) return []
    return [{
      sessionId,
      driverNumber,
      sampledAt,
      speedKph: asNum(r.speed) ?? undefined,
      throttle: asNum(r.throttle) ?? undefined,
      brake: asNum(r.brake) ?? undefined,
      gear: asNum(r.n_gear) ?? undefined,
      rpm: asNum(r.rpm) ?? undefined,
      drs: asNum(r.drs) ?? undefined,
    }]
  })

  if (!data.length) return
  const { count } = await prisma.liveCarTelemetry.createMany({ data, skipDuplicates: true })
  if (count) log(`telemetry +${count}`)
}

// ── Persist: weather samples ──────────────────────────────────

async function persistWeather(sessionId: string, rows: Array<Record<string, unknown>>) {
  if (!rows.length) return
  let count = 0

  for (const r of rows) {
    const sampledAt = asDate(r.date)
    if (!sampledAt) continue
    await prisma.weatherSample.upsert({
      where: { sessionId_sampledAt: { sessionId, sampledAt } },
      create: {
        sessionId,
        sampledAt,
        airTemp: asNum(r.air_temperature) ?? undefined,
        trackTemp: asNum(r.track_temperature) ?? undefined,
        humidity: asNum(r.humidity) ?? undefined,
        rainfall: asNum(r.rainfall) ?? undefined,
        pressure: asNum(r.pressure) ?? undefined,
        windSpeed: asNum(r.wind_speed) ?? undefined,
        windDirection: asNum(r.wind_direction) ?? undefined,
      },
      update: {},
    })
    count++
  }
  if (count) log(`weather +${count}`)
}

// ── Persist: stint / tyre data ────────────────────────────────

async function persistStints(sessionId: string, rows: Array<Record<string, unknown>>) {
  if (!rows.length) return
  let count = 0

  for (const r of rows) {
    const driverNumber = asNum(r.driver_number)
    const stintNumber = asNum(r.stint_number)
    if (driverNumber === null || stintNumber === null) continue

    await prisma.liveStint.upsert({
      where: { sessionId_driverNumber_stintNumber: { sessionId, driverNumber, stintNumber } },
      create: {
        sessionId,
        driverNumber,
        stintNumber,
        compound: asStr(r.compound) ?? undefined,
        lapStart: asNum(r.lap_start) ?? undefined,
        lapEnd: asNum(r.lap_end) ?? undefined,
        tyreAgeAtStart: asNum(r.tyre_age_at_start) ?? undefined,
      },
      update: {
        lapEnd: asNum(r.lap_end) ?? undefined,
      },
    })
    count++
  }
  if (count) log(`stints upserted ${count}`)
}

// ── Persist: completed laps ───────────────────────────────────

async function persistLaps(
  sessionId: string,
  rows: Array<Record<string, unknown>>,
  driverMap: Map<number, string>,
) {
  if (!rows.length) return
  let count = 0

  for (const r of rows) {
    const driverNumber = asNum(r.driver_number)
    const lapNumber = asNum(r.lap_number)
    const driverId = driverNumber !== null ? driverMap.get(driverNumber) : undefined
    if (!driverId || lapNumber === null) continue

    await prisma.lap.upsert({
      where: { sessionId_driverId_lapNumber: { sessionId, driverId, lapNumber } },
      create: {
        sessionId,
        driverId,
        lapNumber,
        sampledAt: asDate(r.date_start) ?? undefined,
        lapTimeMs: secToMs(r.lap_duration) ?? undefined,
        sector1Ms: secToMs(r.duration_sector_1) ?? undefined,
        sector2Ms: secToMs(r.duration_sector_2) ?? undefined,
        sector3Ms: secToMs(r.duration_sector_3) ?? undefined,
        isPitOutLap: r.is_pit_out_lap === true,
      },
      update: {
        lapTimeMs: secToMs(r.lap_duration) ?? undefined,
        sector1Ms: secToMs(r.duration_sector_1) ?? undefined,
        sector2Ms: secToMs(r.duration_sector_2) ?? undefined,
        sector3Ms: secToMs(r.duration_sector_3) ?? undefined,
      },
    })
    count++
  }
  if (count) log(`laps upserted ${count}`)
}

// ── Persist: pit stops ────────────────────────────────────────

async function persistPitStops(
  sessionId: string,
  rows: Array<Record<string, unknown>>,
  driverMap: Map<number, string>,
) {
  if (!rows.length) return
  let count = 0

  for (const r of rows) {
    const driverNumber = asNum(r.driver_number)
    const lapNumber = asNum(r.lap_number)
    const driverId = driverNumber !== null ? driverMap.get(driverNumber) : undefined
    if (!driverId || lapNumber === null) continue

    await prisma.pitStop.upsert({
      where: { sessionId_driverId_lapNumber: { sessionId, driverId, lapNumber } },
      create: {
        sessionId,
        driverId,
        lapNumber,
        sampledAt: asDate(r.date) ?? undefined,
        laneDurationMs: secToMs(r.lane_duration) ?? undefined,
        stopDurationMs: secToMs(r.stop_duration) ?? secToMs(r.pit_duration) ?? undefined,
      },
      update: {
        laneDurationMs: secToMs(r.lane_duration) ?? undefined,
        stopDurationMs: secToMs(r.stop_duration) ?? secToMs(r.pit_duration) ?? undefined,
      },
    })
    count++
  }
  if (count) log(`pit stops upserted ${count}`)
}

// ── Ingestion loop ────────────────────────────────────────────

async function ingestLoop(
  liveSessionId: string,
  sessionId: string,
  providerSessionKey: number,
  driverMap: Map<number, string>,
  frequencyMs: number,
) {
  // Recover up to 5 min of data that may have accumulated before the worker started
  let since = new Date(Date.now() - 1000 * 60 * 5)
  let running = true

  const shutdown = () => {
    log("shutdown signal — stopping after current tick")
    running = false
  }
  process.once("SIGTERM", shutdown)
  process.once("SIGINT", shutdown)

  log(`loop started — key=${providerSessionKey} every ${frequencyMs}ms`)

  while (running) {
    const tickStart = Date.now()
    const sinceIso = since.toISOString()
    const nextSince = new Date()

    // Fetch all endpoints in parallel; allSettled never throws
    const [loc, car, wth, laps, pits, stints] = await Promise.allSettled([
      getLocationBySession(providerSessionKey, sinceIso),
      getCarDataBySession(providerSessionKey, sinceIso),
      getWeatherByLiveSession(providerSessionKey, sinceIso),
      getLapsBySession(providerSessionKey, sinceIso),
      getPitBySession(providerSessionKey, sinceIso),
      getStintsBySession(providerSessionKey), // full — stints are low-volume
    ])

    // Log API failures without stopping
    const labels = ["location", "car_data", "weather", "laps", "pit", "stints"]
    ;[loc, car, wth, laps, pits, stints].forEach((r, i) => {
      if (r.status === "rejected") log(`API [${labels[i]}] failed: ${r.reason}`)
    })

    // Persist in parallel; allSettled keeps going even if one DB write fails
    await Promise.allSettled([
      persistPositions(sessionId, loc.status === "fulfilled" ? loc.value : []),
      persistTelemetry(sessionId, car.status === "fulfilled" ? car.value : []),
      persistWeather(sessionId, wth.status === "fulfilled" ? wth.value : []),
      persistLaps(sessionId, laps.status === "fulfilled" ? laps.value : [], driverMap),
      persistPitStops(sessionId, pits.status === "fulfilled" ? pits.value : [], driverMap),
      persistStints(sessionId, stints.status === "fulfilled" ? stints.value : []),
    ])

    since = nextSince

    // Check the LiveSession is still OPEN (could be closed externally)
    const row = await prisma.liveSession.findUnique({
      where: { id: liveSessionId },
      select: { status: true },
    })
    if (!row || row.status !== "OPEN") {
      log("session no longer OPEN — exiting loop")
      break
    }

    // Sleep for the remainder of the interval
    const elapsed = Date.now() - tickStart
    const wait = Math.max(0, frequencyMs - elapsed)
    if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  }

  log("loop ended")
}

// ── Entry point ───────────────────────────────────────────────

async function main() {
  log("worker started")

  const liveSession = await findOpenLiveSession()

  if (!liveSession) {
    log("no OPEN LiveSession found — exiting")
    log("hint: INSERT a LiveSession row with status='OPEN' and a valid providerSessionKey")
    return
  }

  const { id: liveSessionId, sessionId, providerSessionKey, ingestFrequencyMs } = liveSession

  if (!providerSessionKey) {
    log("ERROR: LiveSession.providerSessionKey is null — cannot call OpenF1")
    log("hint: set providerSessionKey = the OpenF1 session_key integer for this race weekend")
    return
  }

  const gpName = liveSession.session.raceWeekend?.name ?? sessionId
  log(`session: "${gpName}" (key=${providerSessionKey}, every ${ingestFrequencyMs}ms)`)

  const driverMap = await buildDriverMap(providerSessionKey)

  await ingestLoop(liveSessionId, sessionId, providerSessionKey, driverMap, ingestFrequencyMs)

  // Auto-close the LiveSession once the loop exits
  await prisma.liveSession.update({
    where: { id: liveSessionId },
    data: { status: "CLOSED", closedAt: new Date() },
  })

  log("session closed — done")
}

main()
  .catch((err) => {
    console.error("[sync-live] fatal:", err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
