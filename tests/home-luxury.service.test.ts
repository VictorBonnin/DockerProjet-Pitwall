import assert from "node:assert/strict"

const pastScheduledWeekend = {
  round: 4,
  status: "SCHEDULED",
  startDate: new Date("2026-05-03T20:00:00.000Z"),
  endDate: new Date("2026-05-03T20:00:00.000Z"),
}

const futureScheduledWeekend = {
  round: 5,
  status: "SCHEDULED",
  startDate: new Date("2026-05-24T20:00:00.000Z"),
  endDate: new Date("2026-05-24T20:00:00.000Z"),
}

export async function runHomeLuxuryServiceTests() {
  const { buildDisplayGrandPrixName, isRaceWeekendFinished, normalizeGrandPrixLocation, pickNextRaceWeekend } = await import(
    "@/lib/services/home-luxury.service"
  )

  const now = new Date("2026-05-04T12:00:00.000Z")
  const next = pickNextRaceWeekend([pastScheduledWeekend, futureScheduledWeekend], now)

  assert.equal(next?.round, 5)
  assert.equal(isRaceWeekendFinished(pastScheduledWeekend, now), true)
  assert.equal(isRaceWeekendFinished(futureScheduledWeekend, now), false)
  assert.equal(normalizeGrandPrixLocation("Canadian Grand Prix", "Circuit Gilles Villeneuve", "Canada"), "Canada")
  assert.equal(buildDisplayGrandPrixName("Canada"), "Grand Prix du Canada")
}
