import { describe, it, expect } from "vitest"
import {
  closeLiveSession,
  openLiveSession,
  parseLiveOpenArgs,
  parseLiveOpenRequestBody,
} from "@/lib/services/live-session-control.service"

describe("live-session-control service", () => {
  it("parses CLI open args", () => {
    const parsed = parseLiveOpenArgs(["--session-key", "latest", "--frequency-ms", "7000"])
    expect(parsed.sessionKey).toBe("latest")
    expect(parsed.ingestFrequencyMs).toBe(7000)
  })

  it("parses the --source argument", () => {
    const parsed = parseLiveOpenArgs(["--session-key", "next", "--frequency-ms", "3000", "--source", "dashboard"])
    expect(parsed.sessionKey).toBe("next")
    expect(parsed.sourceName).toBe("dashboard")
  })

  it("parses a numeric session key", () => {
    const parsed = parseLiveOpenArgs(["--session-key", "9971", "--frequency-ms", "5000"])
    expect(parsed.sessionKey).toBe(9971)
  })

  it("throws on an unknown argument", () => {
    expect(() => parseLiveOpenArgs(["--unknown-flag"])).toThrow("Unknown argument")
  })

  it("throws when --session-key has no value", () => {
    expect(() => parseLiveOpenArgs(["--session-key"])).toThrow("Missing value for --session-key")
  })

  it("throws when --frequency-ms has no value", () => {
    expect(() => parseLiveOpenArgs(["--frequency-ms"])).toThrow("Missing value for --frequency-ms")
  })

  it("uses all defaults when request body is null", () => {
    const options = parseLiveOpenRequestBody(null)
    expect(options.sessionKey).toBe("latest")
    expect(options.ingestFrequencyMs).toBe(5000)
    expect(options.sourceName).toBe("status-page")
  })

  it("parses open request body and adds default source name", () => {
    const options = parseLiveOpenRequestBody({ sessionKey: "next", ingestFrequencyMs: 6000 })
    expect(options.sessionKey).toBe("next")
    expect(options.ingestFrequencyMs).toBe(6000)
    expect(options.sourceName).toBe("status-page")
  })

  it("parses open request body with a numeric session key", () => {
    const options = parseLiveOpenRequestBody({ sessionKey: 9971, ingestFrequencyMs: 5000 })
    expect(options.sessionKey).toBe(9971)
  })

  it("falls back to frequencyMs when ingestFrequencyMs is absent", () => {
    const options = parseLiveOpenRequestBody({ frequencyMs: 3000 })
    expect(options.ingestFrequencyMs).toBe(3000)
  })

  it("opens a live session using a local next-session key without calling OpenF1", async () => {
    const locallyCreatedRows: Array<Record<string, unknown>> = []

    const opened = await openLiveSession(
      { sessionKey: "next", ingestFrequencyMs: 3000, sourceName: "status-page" },
      {
        now: () => new Date("2026-05-03T16:55:00.000Z"),
        fetchOpenF1Session: async () => {
          throw new Error("OpenF1 should not be called when local next session has a key")
        },
        findExistingOpenLiveSession: async () => null,
        findNextOpenableSession: async () => ({
          id: "local-miami-race",
          type: "RACE",
          name: "Race",
          startsAt: new Date("2026-05-03T17:00:00.000Z"),
          providerSessionKey: 11280,
          raceWeekend: { name: "Miami Grand Prix" },
        }),
        findSessionByProviderKey: async () => null,
        findCandidateSessions: async () => [],
        updateSessionProviderKey: async () => {},
        createLiveSession: async (data) => {
          locallyCreatedRows.push(data)
          return {
            id: "local-live-session-id",
            sessionId: data.sessionId,
            providerSessionKey: data.providerSessionKey,
            ingestFrequencyMs: data.ingestFrequencyMs,
            status: data.status,
          }
        },
      },
    )

    expect(opened.id).toBe("local-live-session-id")
    expect(opened.sessionId).toBe("local-miami-race")
    expect(opened.providerSessionKey).toBe(11280)
    expect(locallyCreatedRows[0]?.sourceName).toBe("status-page")
  })

  it("opens a live session by fetching the latest session from OpenF1", async () => {
    const createdRows: Array<Record<string, unknown>> = []
    const updatedProviderKeys: Array<{ sessionId: string; providerSessionKey: number }> = []

    const opened = await openLiveSession(
      { sessionKey: "latest", ingestFrequencyMs: 5000, sourceName: "test" },
      {
        now: () => new Date("2026-05-03T20:00:00.000Z"),
        fetchOpenF1Session: async () => [
          {
            session_key: 12345,
            session_name: "Race",
            session_type: "Race",
            meeting_name: "Miami Grand Prix",
            date_start: "2026-05-03T20:00:00+00:00",
          },
        ],
        findExistingOpenLiveSession: async () => null,
        findSessionByProviderKey: async () => null,
        findCandidateSessions: async () => [
          {
            id: "internal-race-session",
            type: "RACE",
            name: "Race",
            startsAt: new Date("2026-05-03T20:00:00.000Z"),
            raceWeekend: { name: "Miami Grand Prix" },
          },
        ],
        updateSessionProviderKey: async (sessionId, providerSessionKey) => {
          updatedProviderKeys.push({ sessionId, providerSessionKey })
        },
        createLiveSession: async (data) => {
          createdRows.push(data)
          return {
            id: "live-session-id",
            sessionId: data.sessionId,
            providerSessionKey: data.providerSessionKey,
            ingestFrequencyMs: data.ingestFrequencyMs,
            status: data.status,
          }
        },
      },
    )

    expect(opened.id).toBe("live-session-id")
    expect(opened.sessionId).toBe("internal-race-session")
    expect(opened.providerSessionKey).toBe(12345)
    expect(updatedProviderKeys).toEqual([{ sessionId: "internal-race-session", providerSessionKey: 12345 }])
    expect(createdRows[0]?.status).toBe("OPEN")
    expect(createdRows[0]?.sourceName).toBe("test")
  })

  it("returns null when closing with no open session", async () => {
    const closed = await closeLiveSession({
      now: () => new Date(),
      findExistingOpenLiveSession: async () => null,
      closeLiveSessionById: async () => { throw new Error("should not be called") },
    })

    expect(closed).toBeNull()
  })

  it("throws when OpenF1 returns an empty payload", async () => {
    await expect(
      openLiveSession(
        { sessionKey: "latest", ingestFrequencyMs: 5000, sourceName: "test" },
        {
          now: () => new Date(),
          fetchOpenF1Session: async () => [],
          findExistingOpenLiveSession: async () => null,
          findSessionByProviderKey: async () => null,
          findCandidateSessions: async () => [],
          updateSessionProviderKey: async () => {},
          createLiveSession: async () => { throw new Error("should not be called") },
        },
      ),
    ).rejects.toThrow("OpenF1 did not return a session")
  })

  it("returns the existing session when already open with same provider key", async () => {
    const internalSession = { id: "internal-race", type: "RACE", name: "Race", startsAt: new Date(), raceWeekend: { name: "GP" } }
    const existingLiveSession = { id: "existing-session", sessionId: "internal-race", providerSessionKey: 12345, ingestFrequencyMs: 5000, status: "OPEN" }

    const result = await openLiveSession(
      { sessionKey: "latest", ingestFrequencyMs: 5000, sourceName: "test" },
      {
        now: () => new Date(),
        fetchOpenF1Session: async () => [{ session_key: 12345, session_name: "Race", meeting_name: "GP", date_start: "2026-01-01T00:00:00+00:00" }],
        findSessionByProviderKey: async () => internalSession,
        findExistingOpenLiveSession: async () => existingLiveSession,
        findCandidateSessions: async () => [],
        updateSessionProviderKey: async () => {},
        createLiveSession: async () => { throw new Error("should not be called") },
      },
    )

    expect(result.id).toBe("existing-session")
  })

  it("throws when a different live session is already open", async () => {
    const internalSession = { id: "internal-race", type: "RACE", name: "Race", startsAt: new Date(), raceWeekend: { name: "GP" } }

    await expect(
      openLiveSession(
        { sessionKey: "latest", ingestFrequencyMs: 5000, sourceName: "test" },
        {
          now: () => new Date(),
          fetchOpenF1Session: async () => [{ session_key: 99999, session_name: "Race", meeting_name: "GP", date_start: "2026-01-01T00:00:00+00:00" }],
          findSessionByProviderKey: async () => internalSession,
          findExistingOpenLiveSession: async () => ({ id: "other-session", sessionId: "other-race", providerSessionKey: 11111, ingestFrequencyMs: 5000, status: "OPEN" }),
          findCandidateSessions: async () => [],
          updateSessionProviderKey: async () => {},
          createLiveSession: async () => { throw new Error("should not be called") },
        },
      ),
    ).rejects.toThrow("already OPEN")
  })

  it("throws when OpenF1 payload has no valid session_key", async () => {
    await expect(
      openLiveSession(
        { sessionKey: "latest", ingestFrequencyMs: 5000, sourceName: "test" },
        {
          now: () => new Date(),
          fetchOpenF1Session: async () => [{ session_key: null, session_name: "Race", meeting_name: "GP" }],
          findExistingOpenLiveSession: async () => null,
          findSessionByProviderKey: async () => null,
          findCandidateSessions: async () => [],
          updateSessionProviderKey: async () => {},
          createLiveSession: async () => { throw new Error("should not be called") },
        },
      ),
    ).rejects.toThrow("does not contain a valid session_key")
  })

  it("throws when OpenF1 session cannot be matched to an internal session", async () => {
    await expect(
      openLiveSession(
        { sessionKey: "latest", ingestFrequencyMs: 5000, sourceName: "test" },
        {
          now: () => new Date(),
          fetchOpenF1Session: async () => [
            { session_key: 99999, session_name: "Race", session_type: "Race", meeting_name: "Unknown GP", date_start: "2099-01-01T00:00:00+00:00" },
          ],
          findExistingOpenLiveSession: async () => null,
          findSessionByProviderKey: async () => null,
          findCandidateSessions: async () => [],
          updateSessionProviderKey: async () => {},
          createLiveSession: async () => { throw new Error("should not be called") },
        },
      ),
    ).rejects.toThrow("Could not match OpenF1")
  })

  it("closes an open live session", async () => {
    const closedRows: string[] = []

    const closed = await closeLiveSession({
      now: () => new Date("2026-05-03T22:00:00.000Z"),
      findExistingOpenLiveSession: async () => ({
        id: "live-session-id",
        sessionId: "internal-race-session",
        providerSessionKey: 12345,
        ingestFrequencyMs: 5000,
        status: "OPEN",
      }),
      closeLiveSessionById: async (id, closedAt) => {
        closedRows.push(`${id}:${closedAt.toISOString()}`)
        return {
          id,
          sessionId: "internal-race-session",
          providerSessionKey: 12345,
          ingestFrequencyMs: 5000,
          status: "CLOSED",
        }
      },
    })

    expect(closed?.status).toBe("CLOSED")
    expect(closedRows).toEqual(["live-session-id:2026-05-03T22:00:00.000Z"])
  })
})
