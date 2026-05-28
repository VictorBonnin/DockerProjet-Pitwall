import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
}))

import { existsSync } from "node:fs"

describe("getCircuitReference", () => {
  beforeEach(() => {
    vi.mocked(existsSync).mockReset()
  })

  it("returns the fallback reference when circuit name is null", async () => {
    vi.mocked(existsSync).mockReturnValue(false)
    const { getCircuitReference } = await import("../lib/circuit-reference")

    const ref = getCircuitReference(null)

    expect(ref.lengthKm).toBe("Longueur a confirmer")
    expect(ref.officialImagePath).toBeNull()
    expect(ref.tracePath).toBeTruthy()
  })

  it("returns the fallback reference for an unknown circuit name", async () => {
    vi.mocked(existsSync).mockReturnValue(false)
    const { getCircuitReference } = await import("../lib/circuit-reference")

    const ref = getCircuitReference("Unknown Circuit XYZ")

    expect(ref.lengthKm).toBe("Longueur a confirmer")
    expect(ref.officialImagePath).toBeNull()
  })

  it("returns the correct length for Albert Park", async () => {
    vi.mocked(existsSync).mockReturnValue(false)
    const { getCircuitReference } = await import("../lib/circuit-reference")

    const ref = getCircuitReference("Albert Park Grand Prix Circuit")

    expect(ref.lengthKm).toBe("5.278 km")
    expect(ref.tracePath).toBeTruthy()
  })

  it("returns the correct length for Monaco", async () => {
    vi.mocked(existsSync).mockReturnValue(false)
    const { getCircuitReference } = await import("../lib/circuit-reference")

    const ref = getCircuitReference("Circuit de Monaco")

    expect(ref.lengthKm).toBe("3.337 km")
  })

  it("resolves the official image path when the file exists", async () => {
    vi.mocked(existsSync).mockReturnValue(true)
    vi.resetModules()
    const { getCircuitReference } = await import("../lib/circuit-reference")

    const ref = getCircuitReference("Albert Park Grand Prix Circuit")

    expect(ref.officialImagePath).toMatch(/^\/assets\/circuits\/australia/)
  })

  it("handles accent variants of the same circuit (Mexico)", async () => {
    vi.mocked(existsSync).mockReturnValue(false)
    const { getCircuitReference } = await import("../lib/circuit-reference")

    const ref1 = getCircuitReference("Autodromo Hermanos Rodriguez")
    const ref2 = getCircuitReference("Autódromo Hermanos Rodríguez")

    expect(ref1.lengthKm).toBe("4.304 km")
    expect(ref2.lengthKm).toBe("4.304 km")
  })

  it("handles accent variants of the same circuit (Brazil)", async () => {
    vi.mocked(existsSync).mockReturnValue(false)
    const { getCircuitReference } = await import("../lib/circuit-reference")

    const ref1 = getCircuitReference("Autodromo Jose Carlos Pace")
    const ref2 = getCircuitReference("Autódromo José Carlos Pace")

    expect(ref1.lengthKm).toBe("4.309 km")
    expect(ref2.lengthKm).toBe("4.309 km")
  })
})
