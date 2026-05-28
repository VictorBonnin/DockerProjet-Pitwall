import { describe, it, expect } from "vitest"
import { buildHomePageModel, pickNextRaceWeekend } from "../lib/services/home-page.service"

const completedWeekend = {
  id: "w1",
  round: 1,
  name: "Australian Grand Prix",
  country: "Australia",
  status: "COMPLETED",
  startDate: new Date("2025-03-14T00:00:00Z"),
  endDate: new Date("2025-03-16T00:00:00Z"),
  circuit: { name: "Albert Park", country: "Australia", locality: "Melbourne" },
  sessions: [
    { id: "race-1", type: "RACE", name: "Race", startsAt: new Date("2025-03-16T04:00:00Z") },
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
  circuit: { name: "Circuit de Monaco", country: "Monaco", locality: "Monte-Carlo" },
  sessions: [
    { id: "fp1-2", type: "FP1", name: "Practice 1", startsAt: new Date("2025-05-23T11:30:00Z") },
    { id: "race-2", type: "RACE", name: "Race", startsAt: new Date("2025-05-25T13:00:00Z") },
  ],
} as const

describe("home-page service", () => {
  it("picks the next upcoming weekend", () => {
    expect(pickNextRaceWeekend([completedWeekend, scheduledWeekend])?.id).toBe("w2")
  })

  it("falls back to the last completed weekend when no scheduled weekend exists", () => {
    expect(pickNextRaceWeekend([completedWeekend])?.id).toBe("w1")
  })

  it("builds a full home page model with live session", () => {
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
        session: { type: "RACE", name: "Race", raceWeekend: { name: "Monaco Grand Prix" } },
      },
    })

    expect(model.nextGrandPrix.name).toBe("Monaco Grand Prix")
    expect(model.nextGrandPrix.roundLabel).toBe("Round 2")
    expect(model.nextGrandPrix.href).toBe("/races/2025/2")
    expect(model.nextGrandPrix.nextSessionLabel).toBe("Practice 1")
    expect(model.nextGrandPrix.countdownTargetIso).toBe("2025-05-23T00:00:00.000Z")
    expect(model.nextGrandPrix.countdownDateLabel).toMatch(/mai 2025/i)
    expect(model.live.isActive).toBe(true)
    expect(model.live.label).toBe("Race")
    expect(model.live.context).toBe("Monaco Grand Prix")
    expect(model.standings.drivers[0]?.driverName).toBe("Lando Norris")
    expect(model.standings.drivers[0]?.constructorName).toBe("McLaren")
    expect(model.standings.drivers[0]?.href).toBe("/drivers/NOR")
    expect(model.standings.drivers[0]?.teamColor).toBe("#ff8000")
    expect(model.standings.constructors[0]?.constructorName).toBe("McLaren")
    expect(model.standings.constructors[0]?.href).toBe("/teams/mclaren")
    expect(model.standings.constructors[0]?.drivers).toEqual([
      { fullName: "Lando Norris", code: "NOR" },
      { fullName: "Oscar Piastri", code: "PIA" },
    ])
  })

  it("shows idle state when no live session is active", () => {
    const model = buildHomePageModel({
      year: 2025,
      raceWeekends: [scheduledWeekend],
      driverStandings: [],
      constructorStandings: [],
      liveSession: null,
    })

    expect(model.live.isActive).toBe(false)
    expect(model.live.label).toBe("Aucune session live")
  })
})
