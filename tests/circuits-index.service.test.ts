import { describe, it, expect } from "vitest"
import { buildCircuitsIndexModel } from "../lib/services/circuits-index.service"

describe("circuits-index service", () => {
  it("builds a circuits index model for a standard circuit", () => {
    const model = buildCircuitsIndexModel({
      year: 2025,
      weekends: [
        {
          round: 1,
          name: "Australian Grand Prix",
          country: "Australia",
          startDate: new Date("2025-03-14T00:00:00Z"),
          circuit: {
            name: "Albert Park Grand Prix Circuit",
            locality: "Melbourne",
          },
        },
      ],
    })

    expect(model.year).toBe(2025)
    expect(model.items[0]?.href).toBe("/circuits/albert-park-grand-prix-circuit")
    expect(model.items[0]?.latestRaceHref).toBe("/races/2025/1")
    expect(model.items[0]?.circuitSlug).toBe("albert-park-grand-prix-circuit")
    expect(model.items[0]?.locationLabel).toBe("Melbourne, Australia")
    expect(model.items[0]?.officialImagePath).toBe("/assets/circuits/australia.webp")
    expect(model.items[0]?.lengthLabel).toBe("5.278 km")
  })

  it("maps country aliases to correct official images", () => {
    const model = buildCircuitsIndexModel({
      year: 2025,
      weekends: [
        {
          round: 16,
          name: "Italian Grand Prix",
          country: "Italy",
          startDate: new Date("2025-09-05T00:00:00Z"),
          circuit: { name: "Autodromo Nazionale di Monza", locality: "Monza" },
        },
        {
          round: 18,
          name: "Mexico City Grand Prix",
          country: "Mexico",
          startDate: new Date("2025-10-24T00:00:00Z"),
          circuit: { name: "Autódromo Hermanos Rodríguez", locality: "Mexico City" },
        },
        {
          round: 21,
          name: "Sao Paulo Grand Prix",
          country: "Brazil",
          startDate: new Date("2025-11-07T00:00:00Z"),
          circuit: { name: "Autódromo José Carlos Pace", locality: "Sao Paulo" },
        },
        {
          round: 23,
          name: "Qatar Grand Prix",
          country: "Qatar",
          startDate: new Date("2025-11-28T00:00:00Z"),
          circuit: { name: "Losail International Circuit", locality: "Lusail" },
        },
      ],
    })

    expect(model.items[0]?.officialImagePath).toBe("/assets/circuits/italy.webp")
    expect(model.items[1]?.officialImagePath).toBe("/assets/circuits/mexico.webp")
    expect(model.items[2]?.officialImagePath).toBe("/assets/circuits/brazil.webp")
    expect(model.items[3]?.officialImagePath).toBe("/assets/circuits/qatar.webp")
  })
})
