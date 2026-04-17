import assert from "node:assert/strict"

export async function runLiveQueryServiceTests() {
  const { getCurrentLiveSession } = await import("@/lib/services/live-query.service")
  const result = await getCurrentLiveSession({
    findCurrentLiveSession: async () => null,
  })

  assert.equal(result, null)
}
