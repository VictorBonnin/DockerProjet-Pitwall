import assert from "node:assert/strict"

export async function runLiveSessionControlServiceTests() {
  const { closeLiveSession, openLiveSession, parseLiveOpenArgs } = await import(
    "@/lib/services/live-session-control.service"
  )
  const { parseLiveOpenRequestBody } = await import(
    "@/lib/services/live-session-control.service"
  )

  const parsed = parseLiveOpenArgs(["--session-key", "latest", "--frequency-ms", "7000"])
  assert.equal(parsed.sessionKey, "latest")
  assert.equal(parsed.ingestFrequencyMs, 7000)

  const requestOptions = parseLiveOpenRequestBody({
    sessionKey: "next",
    ingestFrequencyMs: 6000,
  })
  assert.equal(requestOptions.sessionKey, "next")
  assert.equal(requestOptions.ingestFrequencyMs, 6000)
  assert.equal(requestOptions.sourceName, "status-page")

  const locallyCreatedRows: Array<Record<string, unknown>> = []
  const localOpened = await openLiveSession(
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

  assert.equal(localOpened.id, "local-live-session-id")
  assert.equal(localOpened.sessionId, "local-miami-race")
  assert.equal(localOpened.providerSessionKey, 11280)
  assert.equal(locallyCreatedRows[0]?.sourceName, "status-page")

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

  assert.equal(opened.id, "live-session-id")
  assert.equal(opened.sessionId, "internal-race-session")
  assert.equal(opened.providerSessionKey, 12345)
  assert.deepEqual(updatedProviderKeys, [
    { sessionId: "internal-race-session", providerSessionKey: 12345 },
  ])
  assert.equal(createdRows[0]?.status, "OPEN")
  assert.equal(createdRows[0]?.sourceName, "test")

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

  assert.equal(closed?.status, "CLOSED")
  assert.deepEqual(closedRows, ["live-session-id:2026-05-03T22:00:00.000Z"])
}
