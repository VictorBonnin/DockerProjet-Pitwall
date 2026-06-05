import { describe, it, expect } from "vitest"
import { buildRacesIndexModel } from "../lib/services/races-index.service"

describe("races-index service", () => {
  it("uses Unknown as fallback when country is null", () => {
    const model = buildRacesIndexModel({
      year: 2025,
      weekends: [
        {
          round: 1,
          name: "Test Grand Prix",
          slug: "2025-01-test",
          status: "SCHEDULED",
          country: null as unknown as string,
          startDate: new Date("2025-03-14T00:00:00Z"),
          circuit: { name: "Test Circuit", locality: "Melbourne" },
        },
      ],
    })
    expect(model.items[0]?.locationLabel).toBe("Melbourne, Unknown")
  })

  it("returns 'Date a confirmer' when startDate is null", () => {
    const model = buildRacesIndexModel({
      year: 2025,
      weekends: [
        {
          round: 1,
          name: "Test Grand Prix",
          slug: "2025-01-test",
          status: "SCHEDULED",
          country: "Australia",
          startDate: null,
          circuit: { name: "Test Circuit", locality: "Melbourne" },
        },
      ],
    })
    expect(model.items[0]?.dateLabel).toBe("Date a confirmer")
  })

  it("omits locality when it is null", () => {
    const model = buildRacesIndexModel({
      year: 2025,
      weekends: [
        {
          round: 1,
          name: "Test Grand Prix",
          slug: "2025-01-test",
          status: "SCHEDULED",
          country: "Australia",
          startDate: null,
          circuit: { name: "Test Circuit", locality: null },
        },
      ],
    })
    expect(model.items[0]?.locationLabel).toBe("Australia")
  })

  it("sorts weekends by round when input is unordered", () => {
    const model = buildRacesIndexModel({
      year: 2025,
      weekends: [
        { round: 3, name: "GP C", slug: "c", status: "SCHEDULED", country: "C", startDate: null, circuit: { name: "C", locality: null } },
        { round: 1, name: "GP A", slug: "a", status: "SCHEDULED", country: "A", startDate: null, circuit: { name: "A", locality: null } },
      ],
    })
    expect(model.items[0]?.round).toBe(1)
    expect(model.items[1]?.round).toBe(3)
  })

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
