import assert from "node:assert/strict"

const completedWeekend = {
  id: "weekend-completed",
  round: 3,
  name: "Japanese Grand Prix",
  country: "Japan",
  status: "COMPLETED",
  startDate: new Date("2025-04-04T00:00:00Z"),
  endDate: new Date("2025-04-06T00:00:00Z"),
  circuit: {
    name: "Suzuka Circuit",
    country: "Japan",
    locality: "Suzuka",
  },
  sessions: [
    { id: "race-3", type: "RACE", name: "Race" },
    { id: "quali-3", type: "QUALIFYING", name: "Qualifying" },
    { id: "sprint-3", type: "SPRINT", name: "Sprint" },
  ],
} as const

const scheduledWeekend = {
  id: "weekend-scheduled",
  round: 4,
  name: "Bahrain Grand Prix",
  country: "Bahrain",
  status: "SCHEDULED",
  startDate: new Date("2025-04-11T00:00:00Z"),
  endDate: new Date("2025-04-13T00:00:00Z"),
  circuit: {
    name: "Bahrain International Circuit",
    country: "Bahrain",
    locality: "Sakhir",
  },
  sessions: [{ id: "race-4", type: "RACE", name: "Race" }],
} as const

export async function runDashboardServiceTests() {
  const {
    buildHistoricalDashboardModel,
    buildWeekendCompletion,
    pickFeaturedWeekend,
  } = await import("../lib/services/dashboard.service")

  const featured = pickFeaturedWeekend([scheduledWeekend, completedWeekend])
  assert.equal(featured?.id, "weekend-completed")

  const completion = buildWeekendCompletion({
    sessions: completedWeekend.sessions,
    raceResultCount: 20,
    qualifyingResultCount: 20,
    sprintResultCount: 18,
    lapCount: 1120,
    pitStopCount: 41,
    weatherSampleCount: 160,
  })

  assert.equal(completion.race, true)
  assert.equal(completion.qualifying, true)
  assert.equal(completion.sprint, true)
  assert.equal(completion.details, true)
  assert.equal(completion.score, 4)

  const model = buildHistoricalDashboardModel({
    season: {
      year: 2025,
    },
    driverStandings: [
      {
        position: 1,
        points: 77,
        wins: 2,
        driver: {
          fullName: "Lando Norris",
          code: "NOR",
        },
        constructor: {
          name: "McLaren",
        },
      },
    ],
    constructorStandings: [
      {
        position: 1,
        points: 151,
        wins: 3,
        constructor: {
          name: "McLaren",
        },
      },
    ],
    raceWeekends: [scheduledWeekend, completedWeekend],
    featuredWeekendId: "weekend-completed",
    resultCountsBySessionId: {
      "race-3": { race: 20, qualifying: 0, sprint: 0, laps: 1120, pitStops: 41, weatherSamples: 160 },
      "quali-3": { race: 0, qualifying: 20, sprint: 0, laps: 0, pitStops: 0, weatherSamples: 0 },
      "sprint-3": { race: 0, qualifying: 0, sprint: 18, laps: 0, pitStops: 0, weatherSamples: 0 },
      "race-4": { race: 0, qualifying: 0, sprint: 0, laps: 0, pitStops: 0, weatherSamples: 0 },
    },
    featuredRaceResults: [
      {
        finishPosition: 1,
        driver: {
          fullName: "Max Verstappen",
          code: "VER",
        },
        constructor: {
          name: "Red Bull",
        },
      },
      {
        finishPosition: 2,
        driver: {
          fullName: "Lando Norris",
          code: "NOR",
        },
        constructor: {
          name: "McLaren",
        },
      },
      {
        finishPosition: 3,
        driver: {
          fullName: "Charles Leclerc",
          code: "LEC",
        },
        constructor: {
          name: "Ferrari",
        },
      },
    ],
    featuredQualifyingResults: [
      {
        position: 1,
        driver: {
          fullName: "George Russell",
          code: "RUS",
        },
        constructor: {
          name: "Mercedes",
        },
      },
    ],
    featuredSprintResults: [
      {
        position: 1,
        driver: {
          fullName: "Lewis Hamilton",
          code: "HAM",
        },
        constructor: {
          name: "Ferrari",
        },
      },
    ],
  })

  assert.equal(model.hero.year, 2025)
  assert.equal(model.hero.kpis.totalWeekends, 2)
  assert.equal(model.hero.kpis.completedWeekends, 1)
  assert.equal(model.hero.kpis.totalLaps, 1120)
  assert.equal(model.hero.kpis.totalPitStops, 41)
  assert.equal(model.hero.kpis.totalWeatherSamples, 160)
  assert.equal(model.standings.drivers[0]?.driverName, "Lando Norris")
  assert.equal(model.calendar[0]?.round, 3)
  assert.equal(model.calendar[0]?.completionLabel, "4/4")
  assert.equal(model.calendar[1]?.round, 4)
  assert.equal(model.calendar[1]?.completionLabel, "1/4")
  assert.equal(model.focus.weekendName, "Japanese Grand Prix")
  assert.equal(model.focus.podium[0]?.driverName, "Max Verstappen")
  assert.equal(model.focus.pole.driverName, "George Russell")
  assert.equal(model.focus.sprintWinner?.driverName, "Lewis Hamilton")
  assert.equal(model.focus.detailCounts.laps, 1120)
  assert.equal(model.focus.detailCounts.pitStops, 41)
  assert.equal(model.focus.detailCounts.weatherSamples, 160)
}
