import assert from "node:assert/strict"

export async function runCircuitPageServiceTests() {
  const { buildCircuitPageModel } = await import("../lib/services/circuit-page.service")

  const model = buildCircuitPageModel({
    circuit: {
      id: "circuit-1",
      name: "Albert Park Grand Prix Circuit",
      country: "Australia",
      locality: "Melbourne",
    },
    weekends: [
      {
        round: 1,
        name: "Australian Grand Prix",
        startDate: new Date("2024-03-24T00:00:00Z"),
        season: { year: 2024 },
        raceResults: [
          {
            finishPosition: 1,
            driver: { fullName: "Carlos Sainz", code: "SAI" },
            constructor: { name: "Ferrari" },
          },
        ],
      },
      {
        round: 1,
        name: "Australian Grand Prix",
        startDate: new Date("2025-03-16T00:00:00Z"),
        season: { year: 2025 },
        raceResults: [
          {
            finishPosition: 1,
            driver: { fullName: "Lando Norris", code: "NOR" },
            constructor: { name: "McLaren" },
          },
        ],
      },
      {
        round: 1,
        name: "Australian Grand Prix",
        startDate: new Date("2023-04-02T00:00:00Z"),
        season: { year: 2023 },
        raceResults: [
          {
            finishPosition: 1,
            driver: { fullName: "Max Verstappen", code: "VER" },
            constructor: { name: "Red Bull" },
          },
        ],
      },
      {
        round: 1,
        name: "Australian Grand Prix",
        startDate: new Date("2022-04-10T00:00:00Z"),
        season: { year: 2022 },
        raceResults: [
          {
            finishPosition: 1,
            driver: { fullName: "Charles Leclerc", code: "LEC" },
            constructor: { name: "Ferrari" },
          },
        ],
      },
      {
        round: 1,
        name: "Australian Grand Prix",
        startDate: new Date("2019-03-17T00:00:00Z"),
        season: { year: 2019 },
        raceResults: [
          {
            finishPosition: 1,
            driver: { fullName: "Valtteri Bottas", code: "BOT" },
            constructor: { name: "Mercedes" },
          },
        ],
      },
      {
        round: 1,
        name: "Australian Grand Prix",
        startDate: new Date("2018-03-25T00:00:00Z"),
        season: { year: 2018 },
        raceResults: [
          {
            finishPosition: 1,
            driver: { fullName: "Sebastian Vettel", code: "VET" },
            constructor: { name: "Ferrari" },
          },
        ],
      },
      {
        round: 1,
        name: "Australian Grand Prix",
        startDate: new Date("2017-03-26T00:00:00Z"),
        season: { year: 2017 },
        raceResults: [
          {
            finishPosition: 1,
            driver: { fullName: "Sebastian Vettel", code: "VET" },
            constructor: { name: "Ferrari" },
          },
        ],
      },
    ],
  })

  assert.equal(model.hero.circuitName, "Albert Park Grand Prix Circuit")
  assert.equal(model.hero.officialImagePath, "/assets/circuits/australia.webp")
  assert.equal(model.hero.editionsCount, 7)
  assert.equal(model.mostWins[0]?.driverName, "Sebastian Vettel")
  assert.equal(model.mostWins[0]?.wins, 2)
  assert.equal(model.history[0]?.year, 2025)
  assert.equal(model.history[0]?.winnerName, "Lando Norris")
  assert.equal(model.history[0]?.href, "/races/2025/1")
}
