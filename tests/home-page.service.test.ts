import assert from "node:assert/strict"

const completedWeekend = {
  id: "w1",
  round: 1,
  name: "Australian Grand Prix",
  country: "Australia",
  status: "COMPLETED",
  startDate: new Date("2025-03-14T00:00:00Z"),
  endDate: new Date("2025-03-16T00:00:00Z"),
  circuit: {
    name: "Albert Park",
    country: "Australia",
    locality: "Melbourne",
  },
  sessions: [
    {
      id: "race-1",
      type: "RACE",
      name: "Race",
      startsAt: new Date("2025-03-16T04:00:00Z"),
    },
  ],
} as const

const scheduledWeekend = {
  id: "w2",
  round: 2,
  name: "Monaco Grand Prix",
  country: "Monaco",
  status: "SCHEDULED",
  startDate: new Date("2025-05-23T00:00:00Z"),
  endDate: new Date("2025-05-25T00:00:00Z"),
  circuit: {
    name: "Circuit de Monaco",
    country: "Monaco",
    locality: "Monte-Carlo",
  },
  sessions: [
    {
      id: "fp1-2",
      type: "FP1",
      name: "Practice 1",
      startsAt: new Date("2025-05-23T11:30:00Z"),
    },
    {
      id: "race-2",
      type: "RACE",
      name: "Race",
      startsAt: new Date("2025-05-25T13:00:00Z"),
    },
  ],
} as const

export async function runHomePageServiceTests() {
  const { buildHomePageModel, pickNextRaceWeekend } = await import("../lib/services/home-page.service")

  const next = pickNextRaceWeekend([completedWeekend, scheduledWeekend])
  assert.equal(next?.id, "w2")

  const fallback = pickNextRaceWeekend([completedWeekend])
  assert.equal(fallback?.id, "w1")

  const model = buildHomePageModel({
    year: 2025,
    raceWeekends: [completedWeekend, scheduledWeekend],
    driverStandings: [
      {
        position: 1,
        points: 133,
        wins: 3,
        driver: { fullName: "Lando Norris", code: "NOR" },
        constructor: { name: "McLaren", slug: "mclaren", logoPath: null },
      },
    ],
    constructorStandings: [
      {
        position: 1,
        points: 241,
        wins: 5,
        constructor: { name: "McLaren", slug: "mclaren", logoPath: null },
        drivers: [
          { fullName: "Lando Norris", code: "NOR" },
          { fullName: "Oscar Piastri", code: "PIA" },
        ],
      },
    ],
    liveSession: {
      status: "OPEN",
      session: {
        type: "RACE",
        name: "Race",
        raceWeekend: {
          name: "Monaco Grand Prix",
        },
      },
    },
  })

  assert.equal(model.nextGrandPrix.name, "Monaco Grand Prix")
  assert.equal(model.nextGrandPrix.roundLabel, "Round 2")
  assert.equal(model.nextGrandPrix.href, "/races/2025/2")
  assert.equal(model.nextGrandPrix.nextSessionLabel, "Practice 1")
  assert.equal(model.nextGrandPrix.countdownTargetIso, "2025-05-23T00:00:00.000Z")
  assert.match(model.nextGrandPrix.countdownDateLabel, /mai 2025/i)
  assert.equal(model.live.isActive, true)
  assert.equal(model.live.label, "Race")
  assert.equal(model.live.context, "Monaco Grand Prix")
  assert.equal(model.standings.drivers[0]?.driverName, "Lando Norris")
  assert.equal(model.standings.drivers[0]?.constructorName, "McLaren")
  assert.equal(model.standings.drivers[0]?.href, "/drivers/NOR")
  assert.equal(model.standings.drivers[0]?.imagePath, null)
  assert.equal(model.standings.drivers[0]?.teamColor, "#ff8000")
  assert.equal(model.standings.constructors[0]?.constructorName, "McLaren")
  assert.equal(model.standings.constructors[0]?.href, "/teams/mclaren")
  assert.equal(model.standings.constructors[0]?.logoPath, null)
  assert.equal(model.standings.constructors[0]?.teamColor, "#ff8000")
  assert.deepEqual(model.standings.constructors[0]?.drivers, [
    { fullName: "Lando Norris", code: "NOR" },
    { fullName: "Oscar Piastri", code: "PIA" },
  ])

  const idleModel = buildHomePageModel({
    year: 2025,
    raceWeekends: [scheduledWeekend],
    driverStandings: [],
    constructorStandings: [],
    liveSession: null,
  })

  assert.equal(idleModel.live.isActive, false)
  assert.equal(idleModel.live.label, "Aucune session live")
}
