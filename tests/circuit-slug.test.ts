import { describe, it, expect } from "vitest"
import { toCircuitSlug } from "../lib/circuit-slug"

describe("toCircuitSlug", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(toCircuitSlug("Albert Park Grand Prix Circuit")).toBe("albert-park-grand-prix-circuit")
  })

  it("strips accents from characters", () => {
    expect(toCircuitSlug("Autódromo Hermanos Rodríguez")).toBe("autodromo-hermanos-rodriguez")
    expect(toCircuitSlug("Autódromo José Carlos Pace")).toBe("autodromo-jose-carlos-pace")
  })

  it("replaces multiple consecutive non-alphanumeric characters with a single hyphen", () => {
    expect(toCircuitSlug("Circuit de Spa-Francorchamps")).toBe("circuit-de-spa-francorchamps")
    expect(toCircuitSlug("Circuit  de  Monaco")).toBe("circuit-de-monaco")
  })

  it("trims leading and trailing hyphens", () => {
    expect(toCircuitSlug("-Silverstone-")).toBe("silverstone")
  })

  it("handles a plain lowercase name without changes", () => {
    expect(toCircuitSlug("monza")).toBe("monza")
  })

  it("handles an empty string", () => {
    expect(toCircuitSlug("")).toBe("")
  })
})
