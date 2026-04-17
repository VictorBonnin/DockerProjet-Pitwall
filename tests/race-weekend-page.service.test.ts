import assert from "node:assert/strict"

const weekendFixture = {
  id: "weekend-1",
  round: 1,
  name: "Australian Grand Prix",
  country: "Australia",
  startDate: new Date("2025-03-14T01:30:00Z"),
  endDate: new Date("2025-03-16T04:00:00Z"),
  circuit: {
    id: "circuit-1",
    name: "Albert Park Grand Prix Circuit",
    country: "Australia",
    locality: "Melbourne",
  },
} as const

export async function runRaceWeekendPageServiceTests() {
  const {
    buildRaceWeekendPageModel,
    buildStartingGridRows,
  } = await import("../lib/services/race-weekend-page.service")

  const gridRows = buildStartingGridRows([
    {
      position: 1,
      driver: { fullName: "Lando Norris", code: "NOR" },
      constructor: { name: "McLaren", slug: "mclaren" },
      q3Ms: 75096,
    },
    {
      position: 2,
      driver: { fullName: "Max Verstappen", code: "VER" },
      constructor: { name: "Red Bull", slug: "red-bull" },
      q3Ms: 75210,
    },
    {
      position: 3,
      driver: { fullName: "Oscar Piastri", code: "PIA" },
      constructor: { name: "McLaren", slug: "mclaren" },
      q3Ms: 75301,
    },
  ])

  assert.equal(gridRows.length, 2)
  assert.equal(gridRows[0]?.left?.driverName, "Lando Norris")
  assert.equal(gridRows[0]?.right?.driverName, "Max Verstappen")
  assert.equal(gridRows[1]?.left?.driverCode, "PIA")
  assert.equal(gridRows[0]?.left?.constructorSlug, "mclaren")
  assert.equal(gridRows[0]?.left?.qualifyingTimeLabel, "1:15.096")
  assert.equal(gridRows[0]?.left?.gapToPoleLabel, "Pole")
  assert.equal(gridRows[0]?.right?.gapToPoleLabel, "+0.114s")
  assert.equal(gridRows[1]?.left?.gapToAheadLabel, "+0.091s")
  assert.equal(gridRows[1]?.right, null)

  const tiedGridRows = buildStartingGridRows([
    {
      position: 14,
      driver: { fullName: "Driver Fourteen", code: "D14" },
      constructor: { name: "Williams", slug: "williams" },
      q2Ms: 81234,
    },
    {
      position: 15,
      driver: { fullName: "Driver Fifteen", code: "D15" },
      constructor: { name: "Alpine", slug: "alpine-f1-team" },
      q2Ms: 81234,
    },
  ])

  assert.equal(tiedGridRows[0]?.left?.gapToPoleLabel, "Pole")
  assert.equal(tiedGridRows[0]?.right?.gapToAheadLabel, "+0.000s")

  const reversedDeltaGridRows = buildStartingGridRows([
    {
      position: 15,
      driver: { fullName: "Driver Fifteen", code: "D15" },
      constructor: { name: "Haas F1 Team", slug: "haas-f1-team" },
      q1Ms: 73074,
      q2Ms: 73315,
    },
    {
      position: 16,
      driver: { fullName: "Driver Sixteen", code: "D16" },
      constructor: { name: "Sauber", slug: "sauber" },
      q1Ms: 73190,
    },
  ])

  assert.equal(reversedDeltaGridRows[0]?.left?.qualifyingTimeLabel, "1:13.074")
  assert.equal(reversedDeltaGridRows[0]?.right?.gapToAheadLabel, "+0.116s")

  const model = buildRaceWeekendPageModel({
    year: 2025,
    weekend: weekendFixture,
    sessions: [
      {
        type: "RACE",
        startsAt: new Date("2025-03-16T04:00:00Z"),
        endsAt: new Date("2025-03-16T05:32:03Z"),
      },
    ],
    raceResults: [
      {
        finishPosition: 1,
        points: 25,
        status: "Finished",
        lapsCompleted: 58,
        totalTimeMs: 5523000,
        driver: { fullName: "Lando Norris", code: "NOR" },
        constructor: { name: "McLaren" },
      },
      {
        finishPosition: 2,
        points: 18,
        status: "Finished",
        lapsCompleted: 58,
        totalTimeMs: 5538000,
        driver: { fullName: "Max Verstappen", code: "VER" },
        constructor: { name: "Red Bull" },
      },
      {
        finishPosition: 4,
        points: 12,
        status: "Finished",
        lapsCompleted: 58,
        totalTimeMs: 5601000,
        driver: { fullName: "George Russell", code: "RUS" },
        constructor: { name: "Mercedes" },
      },
    ],
    qualifyingResults: [
      {
        position: 1,
        driver: { fullName: "Lando Norris", code: "NOR" },
        constructor: { name: "McLaren", slug: "mclaren" },
        q3Ms: 75096,
      },
      {
        position: 2,
        driver: { fullName: "Max Verstappen", code: "VER" },
        constructor: { name: "Red Bull", slug: "red-bull" },
        q3Ms: 75210,
      },
    ],
    sprintResults: [
      {
        position: 1,
        points: 8,
        status: "Finished",
        driver: { fullName: "Oscar Piastri", code: "PIA" },
        constructor: { name: "McLaren" },
      },
      {
        position: 4,
        points: 5,
        status: "Finished",
        driver: { fullName: "Charles Leclerc", code: "LEC" },
        constructor: { name: "Ferrari" },
      },
    ],
    bestKnownLap: {
      lapTimeMs: 78123,
      driver: { fullName: "Charles Leclerc", code: "LEC" },
      session: {
        name: "Race",
        raceWeekend: {
          name: "Australian Grand Prix",
          season: {
            year: 2024,
          },
        },
      },
    },
  })

  assert.equal(model.hero.grandPrixTitle, "Australian Grand Prix")
  assert.equal(model.hero.circuitName, "Albert Park Grand Prix Circuit")
  assert.equal(model.circuit.lengthLabel, "5.278 km")
  assert.equal(model.circuit.officialImagePath, "/assets/circuits/australia.webp")
  assert.equal(model.circuit.bestLapLabel, "1:18.123")
  assert.equal(model.circuit.bestLapDriverName, "Charles Leclerc")
  assert.equal(model.circuit.raceLapsLabel, "58 tours")
  assert.equal(model.circuit.raceDurationLabel, "1h 32m 03s")
  assert.equal(model.qualifying.hasData, true)
  assert.equal(model.qualifying.gridRows[0]?.left?.qualifyingTimeLabel, "1:15.096")
  assert.equal(model.qualifying.gridRows[0]?.right?.gapToPoleLabel, "+0.114s")
  assert.equal(model.race.podium.length, 2)
  assert.equal(model.race.podium[0]?.driverName, "Lando Norris")
  assert.equal(model.race.classification[0]?.position, 4)
  assert.equal(model.sprint.hasData, true)
  assert.equal(model.sprint.podium[0]?.driverCode, "PIA")
  assert.equal(model.sprint.classification[0]?.driverCode, "LEC")
}
