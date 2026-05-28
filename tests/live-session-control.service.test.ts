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

  it("parses open request body and adds default source name", () => {
    const options = parseLiveOpenRequestBody({ sessionKey: "next", ingestFrequencyMs: 6000 })
    expect(options.sessionKey).toBe("next")
    expect(options.ingestFrequencyMs).toBe(6000)
    expect(options.sourceName).toBe("status-page")
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
