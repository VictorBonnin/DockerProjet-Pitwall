import { describe, it, expect } from "vitest"
import { buildHistoricalImportPlan } from "../lib/services/history-sync.service"

const jolpicaSchedulePayload = {
  MRData: {
    RaceTable: {
      season: "2025",
      Races: [
        {
          season: "2025",
          round: "1",
          raceName: "Australian Grand Prix",
          url: "https://example.com/race",
          date: "2025-03-16",
          time: "04:00:00Z",
          Circuit: {
            circuitId: "albert_park",
            url: "https://example.com/circuit",
            circuitName: "Albert Park Grand Prix Circuit",
            Location: {
              lat: "-37.8497",
              long: "144.968",
              locality: "Melbourne",
              country: "Australia",
            },
          },
          FirstPractice: { date: "2025-03-14", time: "01:30:00Z" },
          Qualifying: { date: "2025-03-15", time: "05:00:00Z" },
          Sprint: { date: "2025-03-15", time: "01:00:00Z" },
        },
      ],
    },
  },
}

const jolpicaDriverStandingsPayload = {
  MRData: {
    StandingsTable: {
      season: "2025",
      StandingsLists: [
        {
          season: "2025",
          round: "1",
          DriverStandings: [
            {
              position: "1",
              points: "25",
              wins: "1",
              Driver: {
                driverId: "max_verstappen",
                permanentNumber: "1",
                code: "VER",
                givenName: "Max",
                familyName: "Verstappen",
                nationality: "Dutch",
              },
              Constructors: [{ constructorId: "red_bull", name: "Red Bull", nationality: "Austrian" }],
            },
          ],
        },
      ],
    },
  },
}

const jolpicaConstructorStandingsPayload = {
  MRData: {
    StandingsTable: {
      season: "2025",
      StandingsLists: [
        {
          season: "2025",
          round: "1",
          ConstructorStandings: [
            {
              position: "1",
              points: "25",
              wins: "1",
              Constructor: { constructorId: "red_bull", name: "Red Bull", nationality: "Austrian" },
            },
          ],
        },
      ],
    },
  },
}

describe("history-sync service", () => {
  it("builds a historical import plan from Jolpica payloads", () => {
    const plan = buildHistoricalImportPlan({
      year: 2025,
      schedulePayload: jolpicaSchedulePayload,
      driverStandingsPayload: jolpicaDriverStandingsPayload,
      constructorStandingsPayload: jolpicaConstructorStandingsPayload,
    })

    expect(plan.season.year).toBe(2025)
    expect(plan.circuits[0]?.providerJolpicaId).toBe("albert_park")
    expect(plan.raceWeekends[0]?.round).toBe(1)
    expect(plan.sessions.length).toBe(3)
    expect(plan.drivers[0]?.code).toBe("VER")
    expect(plan.constructors[0]?.providerJolpicaId).toBe("red_bull")
    expect(plan.driverStandings[0]?.points).toBe(25)
    expect(plan.constructorStandings[0]?.wins).toBe(1)
    expect(plan.raceWeekends[0]?.status).toBe("COMPLETED")
  })

  it("marks future race weekends as SCHEDULED", () => {
    const futurePlan = buildHistoricalImportPlan({
      year: 2099,
      schedulePayload: {
        MRData: {
          RaceTable: {
            season: "2099",
            Races: [{ ...jolpicaSchedulePayload.MRData.RaceTable.Races[0], season: "2099", date: "2099-03-16" }],
          },
        },
      },
      driverStandingsPayload: {
        MRData: { StandingsTable: { season: "2099", StandingsLists: [] } },
      },
      constructorStandingsPayload: {
        MRData: { StandingsTable: { season: "2099", StandingsLists: [] } },
      },
    })

    expect(futurePlan.raceWeekends[0]?.status).toBe("SCHEDULED")
  })
})
