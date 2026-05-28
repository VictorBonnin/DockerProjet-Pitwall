import { describe, it, expect } from "vitest"
import { buildCircuitPageModel } from "../lib/services/circuit-page.service"

describe("circuit-page service", () => {
  it("builds a circuit page model with correct history and most wins", () => {
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
            { finishPosition: 1, driver: { fullName: "Carlos Sainz", code: "SAI" }, constructor: { name: "Ferrari" } },
          ],
        },
        {
          round: 1,
          name: "Australian Grand Prix",
          startDate: new Date("2025-03-16T00:00:00Z"),
          season: { year: 2025 },
          raceResults: [
            { finishPosition: 1, driver: { fullName: "Lando Norris", code: "NOR" }, constructor: { name: "McLaren" } },
          ],
        },
        {
          round: 1,
          name: "Australian Grand Prix",
          startDate: new Date("2023-04-02T00:00:00Z"),
          season: { year: 2023 },
          raceResults: [
            { finishPosition: 1, driver: { fullName: "Max Verstappen", code: "VER" }, constructor: { name: "Red Bull" } },
          ],
        },
        {
          round: 1,
          name: "Australian Grand Prix",
          startDate: new Date("2022-04-10T00:00:00Z"),
          season: { year: 2022 },
          raceResults: [
            { finishPosition: 1, driver: { fullName: "Charles Leclerc", code: "LEC" }, constructor: { name: "Ferrari" } },
          ],
        },
        {
          round: 1,
          name: "Australian Grand Prix",
          startDate: new Date("2019-03-17T00:00:00Z"),
          season: { year: 2019 },
          raceResults: [
            { finishPosition: 1, driver: { fullName: "Valtteri Bottas", code: "BOT" }, constructor: { name: "Mercedes" } },
          ],
        },
        {
          round: 1,
          name: "Australian Grand Prix",
          startDate: new Date("2018-03-25T00:00:00Z"),
          season: { year: 2018 },
          raceResults: [
            { finishPosition: 1, driver: { fullName: "Sebastian Vettel", code: "VET" }, constructor: { name: "Ferrari" } },
          ],
        },
        {
          round: 1,
          name: "Australian Grand Prix",
          startDate: new Date("2017-03-26T00:00:00Z"),
          season: { year: 2017 },
          raceResults: [
            { finishPosition: 1, driver: { fullName: "Sebastian Vettel", code: "VET" }, constructor: { name: "Ferrari" } },
          ],
        },
      ],
    })

    expect(model.hero.circuitName).toBe("Albert Park Grand Prix Circuit")
    expect(model.hero.officialImagePath).toBe("/assets/circuits/australia.webp")
    expect(model.hero.editionsCount).toBe(7)
    expect(model.mostWins[0]?.driverName).toBe("Sebastian Vettel")
    expect(model.mostWins[0]?.wins).toBe(2)
    expect(model.history[0]?.year).toBe(2025)
    expect(model.history[0]?.winnerName).toBe("Lando Norris")
    expect(model.history[0]?.href).toBe("/races/2025/1")
  })
})
