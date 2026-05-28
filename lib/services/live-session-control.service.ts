import { prisma } from "@/lib/db/prisma"
import {
  getLatestSession,
  getSessionByKey,
  type OpenF1SessionPayload,
} from "@/lib/providers/openf1"
import { matchOpenF1SessionToInternalSession } from "@/lib/services/session-details-sync.service"

type SessionKeyOption = "latest" | "next" | number

type InternalSession = {
  id: string
  type: string
  name: string
  startsAt: Date | null
  providerSessionKey?: number | null
  raceWeekend: { name: string }
}

type ExistingLiveSession = {
  id: string
  sessionId: string
  providerSessionKey: number | null
  ingestFrequencyMs: number
  status: string
}

type LiveSessionCreateInput = {
  sessionId: string
  providerSessionKey: number
  status: "OPEN"
  sourceName: string
  ingestFrequencyMs: number
  openedAt: Date
}

export type OpenLiveSessionOptions = {
  sessionKey?: SessionKeyOption
  ingestFrequencyMs?: number
  sourceName?: string
}

export type OpenLiveSessionDependencies = {
  now?: () => Date
  fetchOpenF1Session?: (sessionKey: SessionKeyOption) => Promise<OpenF1SessionPayload>
  findExistingOpenLiveSession?: () => Promise<ExistingLiveSession | null>
  findNextOpenableSession?: (now: Date) => Promise<InternalSession | null>
  findSessionByProviderKey?: (providerSessionKey: number) => Promise<InternalSession | null>
  findCandidateSessions?: (openF1Session: Record<string, unknown>) => Promise<InternalSession[]>
  updateSessionProviderKey?: (sessionId: string, providerSessionKey: number) => Promise<void>
  createLiveSession?: (data: LiveSessionCreateInput) => Promise<ExistingLiveSession>
}

export type CloseLiveSessionDependencies = {
  now?: () => Date
  findExistingOpenLiveSession?: () => Promise<ExistingLiveSession | null>
  closeLiveSessionById?: (id: string, closedAt: Date) => Promise<ExistingLiveSession>
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function asString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null
}

function asDate(value: unknown) {
  const stringValue = asString(value)
  if (!stringValue) return null
  const date = new Date(stringValue)
  return Number.isNaN(date.getTime()) ? null : date
}

function requirePositiveInteger(value: string, label: string) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${label}: ${value}`)
  }
  return parsed
}

function positiveIntegerFromUnknown(value: unknown, label: string) {
  const parsed = asNumber(value)
  if (parsed === null || !Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${label}: ${String(value)}`)
  }
  return parsed
}

export function parseLiveOpenRequestBody(body: unknown): Required<OpenLiveSessionOptions> {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {}
  const rawSessionKey = record.sessionKey ?? "latest"
  const sessionKey =
    rawSessionKey === "latest" || rawSessionKey === "next"
      ? rawSessionKey
      : positiveIntegerFromUnknown(rawSessionKey, "sessionKey")
  const ingestFrequencyMs = positiveIntegerFromUnknown(
    record.ingestFrequencyMs ?? record.frequencyMs ?? 5000,
    "ingestFrequencyMs",
  )
  const sourceName = asString(record.sourceName) ?? "status-page"

  return { sessionKey, ingestFrequencyMs, sourceName }
}

function requireArgValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1]
  if (!value) throw new Error(`Missing value for ${flag}`)
  return value
}

export function parseLiveOpenArgs(args: string[]): Required<OpenLiveSessionOptions> {
  let sessionKey: SessionKeyOption = "latest"
  let ingestFrequencyMs = 5000
  let sourceName = "manual"

  for (let index = 0; index < args.length; index++) {
    const arg = args[index]

    if (arg === "--session-key") {
      const value = requireArgValue(args, index, "--session-key")
      sessionKey = value === "latest" || value === "next" ? value : requirePositiveInteger(value, "--session-key")
      index += 1
    } else if (arg === "--frequency-ms") {
      ingestFrequencyMs = requirePositiveInteger(requireArgValue(args, index, "--frequency-ms"), "--frequency-ms")
      index += 1
    } else if (arg === "--source") {
      sourceName = requireArgValue(args, index, "--source")
      index += 1
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  return { sessionKey, ingestFrequencyMs, sourceName }
}

async function defaultFetchOpenF1Session(sessionKey: SessionKeyOption) {
  if (sessionKey === "next") return getLatestSession()
  return sessionKey === "latest" ? getLatestSession() : getSessionByKey(sessionKey)
}

/* v8 ignore start */
function buildDefaultDependencies(): Required<OpenLiveSessionDependencies> {
  return {
    now: () => new Date(),
    fetchOpenF1Session: defaultFetchOpenF1Session,
    findExistingOpenLiveSession: () =>
      prisma.liveSession.findFirst({
        where: { status: "OPEN" },
        orderBy: { openedAt: "desc" },
        select: {
          id: true,
          sessionId: true,
          providerSessionKey: true,
          ingestFrequencyMs: true,
          status: true,
        },
      }),
    findNextOpenableSession: (now) =>
      prisma.session.findFirst({
        where: {
          type: "RACE",
          startsAt: {
            gte: new Date(now.getTime() - 1000 * 60 * 60 * 12),
          },
          providerSessionKey: {
            not: null,
          },
        },
        include: { raceWeekend: true },
        orderBy: { startsAt: "asc" },
      }),
    findSessionByProviderKey: (providerSessionKey) =>
      prisma.session.findUnique({
        where: { providerSessionKey },
        include: { raceWeekend: true },
      }),
    findCandidateSessions: (openF1Session) => {
      const startsAt = asDate(openF1Session.date_start)
      const windowMs = 1000 * 60 * 60 * 36
      const startsAtFilter = startsAt
        ? {
            gte: new Date(startsAt.getTime() - windowMs),
            lte: new Date(startsAt.getTime() + windowMs),
          }
        : undefined

      return prisma.session.findMany({
        where: startsAtFilter ? { startsAt: startsAtFilter } : undefined,
        include: { raceWeekend: true },
        orderBy: { startsAt: "asc" },
        take: 100,
      })
    },
    updateSessionProviderKey: async (sessionId, providerSessionKey) => {
      await prisma.session.update({
        where: { id: sessionId },
        data: { providerSessionKey, isLiveCapable: true },
      })
    },
    createLiveSession: (data) =>
      prisma.liveSession.create({
        data,
        select: {
          id: true,
          sessionId: true,
          providerSessionKey: true,
          ingestFrequencyMs: true,
          status: true,
        },
      }),
  }
}

/* v8 ignore stop */

/* v8 ignore start */
function buildDefaultCloseDependencies(): Required<CloseLiveSessionDependencies> {
  return {
    now: () => new Date(),
    findExistingOpenLiveSession: () =>
      prisma.liveSession.findFirst({
        where: { status: "OPEN" },
        orderBy: { openedAt: "desc" },
        select: {
          id: true,
          sessionId: true,
          providerSessionKey: true,
          ingestFrequencyMs: true,
          status: true,
        },
      }),
    closeLiveSessionById: (id, closedAt) =>
      prisma.liveSession.update({
        where: { id },
        data: {
          status: "CLOSED",
          closedAt,
        },
        select: {
          id: true,
          sessionId: true,
          providerSessionKey: true,
          ingestFrequencyMs: true,
          status: true,
        },
      }),
  }
}
/* v8 ignore stop */

function firstOpenF1Session(payload: OpenF1SessionPayload) {
  const session = payload[0]
  if (!session) {
    throw new Error("OpenF1 did not return a session for this session key")
  }
  return session
}

function findMatchedSession(
  providerSessionKey: number,
  openF1Payload: OpenF1SessionPayload,
  candidates: InternalSession[],
) {
  const matches = matchOpenF1SessionToInternalSession({
    internalSessions: candidates,
    openF1Sessions: openF1Payload,
  })
  const match = matches.find((entry) => entry.providerSessionKey === providerSessionKey)
  return candidates.find((candidate) => candidate.id === match?.internalSessionId) ?? null
}

async function createOpenLiveSession({
  internalSession,
  providerSessionKey,
  options,
  dependencies,
}: {
  internalSession: InternalSession
  providerSessionKey: number
  options: OpenLiveSessionOptions
  dependencies: Required<OpenLiveSessionDependencies>
}) {
  const existingOpenSession = await dependencies.findExistingOpenLiveSession()
  if (existingOpenSession) {
    if (existingOpenSession.providerSessionKey === providerSessionKey) {
      return existingOpenSession
    }

    throw new Error(
      `A LiveSession is already OPEN with providerSessionKey=${existingOpenSession.providerSessionKey}`,
    )
  }

  await dependencies.updateSessionProviderKey(internalSession.id, providerSessionKey)

  return dependencies.createLiveSession({
    sessionId: internalSession.id,
    providerSessionKey,
    status: "OPEN",
    sourceName: options.sourceName ?? "manual",
    ingestFrequencyMs: options.ingestFrequencyMs ?? 5000,
    openedAt: dependencies.now(),
  })
}

export async function openLiveSession(
  options: OpenLiveSessionOptions,
  dependencies: OpenLiveSessionDependencies = {},
) {
  const deps = { ...buildDefaultDependencies(), ...dependencies }
  const sessionKey = options.sessionKey ?? "latest"

  if (sessionKey === "next") {
    const nextSession = await deps.findNextOpenableSession(deps.now())
    const providerSessionKey = nextSession?.providerSessionKey ?? null

    if (nextSession && providerSessionKey) {
      return createOpenLiveSession({
        internalSession: nextSession,
        providerSessionKey,
        options,
        dependencies: deps,
      })
    }
  }

  const openF1Payload = await deps.fetchOpenF1Session(sessionKey)
  const openF1Session = firstOpenF1Session(openF1Payload)
  const providerSessionKey = asNumber(openF1Session.session_key)

  if (!providerSessionKey) {
    throw new Error("OpenF1 session payload does not contain a valid session_key")
  }

  let internalSession = await deps.findSessionByProviderKey(providerSessionKey)
  if (!internalSession) {
    const candidates = await deps.findCandidateSessions(openF1Session)
    internalSession = findMatchedSession(providerSessionKey, openF1Payload, candidates)
  }

  if (!internalSession) {
    const meetingName = asString(openF1Session.meeting_name) ?? "unknown meeting"
    const sessionName = asString(openF1Session.session_name) ?? "unknown session"
    throw new Error(
      `Could not match OpenF1 ${meetingName} / ${sessionName} to an internal Session`,
    )
  }

  return createOpenLiveSession({
    internalSession,
    providerSessionKey,
    options,
    dependencies: deps,
  })
}

export async function closeLiveSession(dependencies: CloseLiveSessionDependencies = {}) {
  const deps = { ...buildDefaultCloseDependencies(), ...dependencies }
  const existingOpenSession = await deps.findExistingOpenLiveSession()

  if (!existingOpenSession) {
    return null
  }

  return deps.closeLiveSessionById(existingOpenSession.id, deps.now())
}
