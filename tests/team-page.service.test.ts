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
})
