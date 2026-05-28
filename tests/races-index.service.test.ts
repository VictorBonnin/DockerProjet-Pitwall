import { describe, it, expect } from "vitest"
import { buildRacesIndexModel } from "../lib/services/races-index.service"

describe("races-index service", () => {
  it("builds a races index model with correct href and location label", () => {
    const model = buildRacesIndexModel({
      year: 2025,
      weekends: [
        {
          round: 1,
          name: "Australian Grand Prix",
          slug: "2025-01-australian-grand-prix",
          status: "COMPLETED",
          country: "Australia",
          startDate: new Date("2025-03-14T00:00:00Z"),
          circuit: { name: "Albert Park", locality: "Melbourne" },
        },
      ],
    })

    expect(model.year).toBe(2025)
    expect(model.items[0]?.href).toBe("/races/2025/1")
    expect(model.items[0]?.locationLabel).toBe("Melbourne, Australia")
  })
})
