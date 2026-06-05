import { describe, it, expect } from "vitest"
import { buildTeamPageModel } from "../lib/services/team-page.service"

describe("team-page service", () => {
  it("builds a team page model with correct hero and driver data", () => {
    const model = buildTeamPageModel({
      team: {
        name: "McLaren",
        slug: "mclaren",
        logoPath: "/assets/teams/mclaren.webp",
        nationality: "British",
      },
      standing: { position: 1, points: 241, wins: 5 },
      drivers: [
        { code: "NOR", fullName: "Lando Norris", imagePath: "/assets/drivers/nor.webp" },
      ],
    })

    expect(model.hero.name).toBe("McLaren")
    expect(model.hero.logoPath).toBe("/assets/teams/mclaren.webp")
    expect(model.summary.position).toBe(1)
    expect(model.drivers[0]?.href).toBe("/drivers/NOR")
  })

  it("returns null position and zero points/wins when standing is null", () => {
    const model = buildTeamPageModel({
      team: { name: "McLaren", slug: "mclaren", logoPath: null, nationality: "British" },
      standing: null,
      drivers: [],
    })

    expect(model.summary.position).toBeNull()
    expect(model.summary.points).toBe(0)
    expect(model.summary.wins).toBe(0)
  })

  it("returns null href when driver code is null", () => {
    const model = buildTeamPageModel({
      team: { name: "McLaren", slug: "mclaren", logoPath: null, nationality: null },
      standing: null,
      drivers: [{ code: null, fullName: "Unknown Driver", imagePath: null }],
    })

    expect(model.drivers[0]?.href).toBeNull()
  })

  it("returns null logo and nationality when not set on team", () => {
    const model = buildTeamPageModel({
      team: { name: "McLaren", slug: null, logoPath: null, nationality: null },
      standing: null,
      drivers: [],
    })

    expect(model.hero.logoPath).toBeNull()
    expect(model.hero.nationality).toBeNull()
  })
})
