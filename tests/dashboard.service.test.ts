import { describe, it, expect } from "vitest"
import {
  buildHistoricalDashboardModel,
  buildWeekendCompletion,
  pickFeaturedWeekend,
} from "../lib/services/dashboard.service"

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

describe("dashboard service", () => {
  it("picks the completed weekend as featured", () => {
    const featured = pickFeaturedWeekend([scheduledWeekend, completedWeekend])
    expect(featured?.id).toBe("weekend-completed")
  })

  it("builds weekend completion with correct scores", () => {
    const completion = buildWeekendCompletion({
      sessions: completedWeekend.sessions,
      raceResultCount: 20,
      qualifyingResultCount: 20,
      sprintResultCount: 18,
      lapCount: 1120,
      pitStopCount: 41,
      weatherSampleCount: 160,
    })

    expect(completion.race).toBe(true)
    expect(completion.qualifying).toBe(true)
    expect(completion.sprint).toBe(true)
    expect(completion.details).toBe(true)
    expect(completion.score).toBe(4)
  })

  it("builds a full historical dashboard model", () => {
    const model = buildHistoricalDashboardModel({
      season: { year: 2025 },
      driverStandings: [
        {
          position: 1,
          points: 77,
          wins: 2,
          driver: { fullName: "Lando Norris", code: "NOR" },
          constructor: { name: "McLaren" },
        },
      ],
      constructorStandings: [
        {
          position: 1,
          points: 151,
          wins: 3,
          constructor: { name: "McLaren" },
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
        { finishPosition: 1, driver: { fullName: "Max Verstappen", code: "VER" }, constructor: { name: "Red Bull" } },
        { finishPosition: 2, driver: { fullName: "Lando Norris", code: "NOR" }, constructor: { name: "McLaren" } },
        { finishPosition: 3, driver: { fullName: "Charles Leclerc", code: "LEC" }, constructor: { name: "Ferrari" } },
      ],
      featuredQualifyingResults: [
        { position: 1, driver: { fullName: "George Russell", code: "RUS" }, constructor: { name: "Mercedes" } },
      ],
      featuredSprintResults: [
        { position: 1, driver: { fullName: "Lewis Hamilton", code: "HAM" }, constructor: { name: "Ferrari" } },
      ],
    })

    expect(model.hero.year).toBe(2025)
    expect(model.hero.kpis.totalWeekends).toBe(2)
    expect(model.hero.kpis.completedWeekends).toBe(1)
    expect(model.hero.kpis.totalLaps).toBe(1120)
    expect(model.hero.kpis.totalPitStops).toBe(41)
    expect(model.hero.kpis.totalWeatherSamples).toBe(160)
    expect(model.standings.drivers[0]?.driverName).toBe("Lando Norris")
    expect(model.calendar[0]?.round).toBe(3)
    expect(model.calendar[0]?.completionLabel).toBe("4/4")
    expect(model.calendar[1]?.round).toBe(4)
    expect(model.calendar[1]?.completionLabel).toBe("1/4")
    expect(model.focus.weekendName).toBe("Japanese Grand Prix")
    expect(model.focus.podium[0]?.driverName).toBe("Max Verstappen")
    expect(model.focus.pole.driverName).toBe("George Russell")
    expect(model.focus.sprintWinner?.driverName).toBe("Lewis Hamilton")
    expect(model.focus.detailCounts.laps).toBe(1120)
    expect(model.focus.detailCounts.pitStops).toBe(41)
    expect(model.focus.detailCounts.weatherSamples).toBe(160)
  })
})
