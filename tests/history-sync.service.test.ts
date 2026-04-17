import assert from "node:assert/strict"

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
          FirstPractice: {
            date: "2025-03-14",
            time: "01:30:00Z",
          },
          Qualifying: {
            date: "2025-03-15",
            time: "05:00:00Z",
          },
          Sprint: {
            date: "2025-03-15",
            time: "01:00:00Z",
          },
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
              Constructors: [
                {
                  constructorId: "red_bull",
                  name: "Red Bull",
                  nationality: "Austrian",
                },
              ],
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
              Constructor: {
                constructorId: "red_bull",
                name: "Red Bull",
                nationality: "Austrian",
              },
            },
          ],
        },
      ],
    },
  },
}

export async function runHistorySyncServiceTests() {
  const { buildHistoricalImportPlan } = await import("../lib/services/history-sync.service")

  const plan = buildHistoricalImportPlan({
    year: 2025,
    schedulePayload: jolpicaSchedulePayload,
    driverStandingsPayload: jolpicaDriverStandingsPayload,
    constructorStandingsPayload: jolpicaConstructorStandingsPayload,
  })

  assert.equal(plan.season.year, 2025)
  assert.equal(plan.circuits[0]?.providerJolpicaId, "albert_park")
  assert.equal(plan.raceWeekends[0]?.round, 1)
  assert.equal(plan.sessions.length, 3)
  assert.equal(plan.drivers[0]?.code, "VER")
  assert.equal(plan.constructors[0]?.providerJolpicaId, "red_bull")
  assert.equal(plan.driverStandings[0]?.points, 25)
  assert.equal(plan.constructorStandings[0]?.wins, 1)
}
