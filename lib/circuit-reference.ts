import { existsSync } from "node:fs"
import path from "node:path"

type CircuitReference = {
  lengthKm: string
  officialImagePath: string | null
  tracePath: string
}

type CircuitReferenceDefinition = {
  lengthKm: string
  officialImageSlug: string
  tracePath: string
}

const TRACE_LIBRARY = {
  // Albert Park - anti-clockwise, oval-ish with chicane section on right
  albertPark:
    "M105 22 C130 20 155 28 168 44 C178 56 178 70 170 80 C164 88 158 92 158 92 L162 96 L154 100 L154 96 C140 108 118 114 95 112 C68 110 46 98 36 80 C26 62 32 40 52 28 C68 18 88 18 105 22",

  // Bahrain - clockwise, C-shape, hairpins at sector ends
  bahrain:
    "M60 28 C84 20 114 20 138 30 C154 38 162 52 158 66 L154 70 L162 74 L154 82 L146 76 C136 90 116 100 92 102 C72 104 54 96 44 82 C36 70 36 56 44 44 C50 36 54 30 60 28",

  // Jeddah - clockwise, long coastal straight + narrow chicane section
  jeddah:
    "M40 30 L40 90 C40 102 50 110 62 108 C74 106 80 98 80 86 L80 72 L88 68 L80 64 L80 50 L88 46 L80 42 L80 30 C80 18 90 12 102 14 C160 14 175 24 178 50 C180 70 170 90 155 100 C140 110 118 114 98 112 C76 110 60 104 52 94",

  // Shanghai - clockwise, distinctive 270° sweeping "snail" turn at T1-T2
  shanghai:
    "M42 40 L42 28 L130 28 C155 28 170 40 170 60 C170 80 155 94 132 94 C110 94 96 82 96 62 C96 50 104 42 118 40 C126 38 132 42 134 50 C136 58 130 64 122 62 L96 94 L96 108 L42 108 L42 95",

  // Suzuka - figure-8 with crossover (path crosses itself at ~(105,65))
  suzuka:
    "M68 28 C46 28 30 42 30 60 C30 76 42 88 60 92 C74 94 86 90 92 80 L105 65 L118 80 C126 90 138 96 152 94 C168 90 178 76 178 60 C178 44 166 32 150 30 C134 28 120 40 116 56 L105 65 L92 52 C84 38 78 28 68 28",

  // Miami - clockwise, roughly rectangular, 19 turns
  miami:
    "M44 32 L154 32 C164 32 170 38 170 48 L170 60 L178 64 L170 70 L170 90 C170 102 160 110 148 110 L62 110 C50 110 42 102 42 90 L42 72 L34 66 L42 60 L42 48 C42 38 44 32 44 32",

  // Imola - anti-clockwise, two long straights + narrow twisty middle
  imola:
    "M72 18 L72 50 C72 58 66 64 58 68 L50 72 C44 76 40 82 42 88 C44 96 52 100 62 98 L68 96 C80 92 88 84 88 72 L88 62 L94 56 L100 62 L100 74 C100 88 110 98 124 100 L136 102 C150 104 162 98 168 88 C174 76 170 62 158 56 L148 50 L132 44 C124 40 120 32 122 22 L72 18",

  // Monaco - anti-clockwise, very tight city streets, Loews hairpin + tunnel
  monaco:
    "M78 20 L134 20 L142 28 L142 42 C142 50 148 56 156 56 L164 56 L164 66 L156 70 L140 70 L126 82 C118 90 116 100 120 108 L100 114 L84 108 C72 102 66 90 68 78 L72 64 L64 56 L56 50 L56 38 C56 28 66 20 78 20",

  // Barcelona-Catalunya - clockwise, long main straight + technical sectors
  barcelona:
    "M32 56 L32 40 L148 40 C162 40 172 50 172 62 C172 74 162 84 148 88 L126 88 C112 88 102 96 98 108 L80 108 C66 108 54 100 50 88 L46 80 L54 72 L46 64 L32 56",

  // Circuit Gilles Villeneuve - clockwise, elongated island loop
  gillesVilleneuve:
    "M110 18 L150 18 C162 18 170 26 170 38 L170 50 L160 54 L170 58 L170 76 L150 88 L110 92 L110 104 C110 112 102 118 92 116 C82 114 76 106 76 98 L76 88 L60 82 L40 68 L40 50 C40 38 50 28 62 28 L76 28 L76 18 L110 18",

  // Red Bull Ring - clockwise, very compact, 10 turns, 3 sweeping corners
  redBullRing:
    "M80 30 L110 30 C122 30 130 36 134 46 C138 56 134 66 126 72 L100 84 C92 90 90 98 96 106 C100 112 108 114 116 112 L130 108 C142 104 150 94 148 82 L140 70 L152 60 C160 52 162 40 156 30",

  // Silverstone - clockwise, fast flowing, nearly circular, Maggotts-Becketts complex
  silverstone:
    "M52 34 L100 22 L148 30 C168 36 180 52 178 70 C176 84 166 94 152 98 L138 102 C128 106 120 114 116 118 L88 118 C76 114 70 104 72 92 L70 80 C66 70 58 66 48 68 L38 70 C26 70 20 60 22 48 C24 38 36 30 52 34",

  // Spa-Francorchamps - clockwise, L-shape, La Source at top, Eau Rouge bottom-left, Kemmel straight
  spa:
    "M140 20 C152 20 162 28 164 40 L166 52 L158 56 L166 62 L162 76 C156 90 144 98 128 98 L100 96 L88 106 L80 114 L68 106 C58 98 56 84 62 72 C68 60 80 54 94 56 L104 58 L112 46 C116 36 124 24 140 20",

  // Hungaroring - clockwise, very twisty compact, many slow corners
  hungaroring:
    "M62 28 L100 22 L136 32 C150 38 158 52 154 66 L150 74 L158 80 L148 90 L132 88 L118 98 C110 104 98 106 86 102 L70 94 L64 104 L52 100 C40 96 34 84 38 72 L44 62 L36 54 C30 44 34 32 46 26 L62 28",

  // Zandvoort - clockwise, compact, banked final sector
  zandvoort:
    "M78 24 L122 24 C138 24 150 34 152 50 L152 62 C152 72 160 80 170 82 C178 84 184 90 182 98 C180 108 170 114 158 112 L100 112 C84 112 70 104 64 90 L60 78 L52 74 L60 68 L60 54 C60 38 68 26 78 24",

  // Monza - clockwise, almost oval, two chicane bumps on straights
  monza:
    "M80 22 L124 22 C144 22 158 34 158 52 L158 70 L166 74 L158 80 L158 90 C158 106 144 118 124 118 L80 118 C60 118 46 106 46 90 L46 80 L38 74 L46 68 L46 52 C46 34 60 22 80 22",

  // Baku - clockwise, very long main straight, tight castle section
  baku:
    "M140 18 L158 18 L158 92 L150 92 L150 98 L158 100 L158 108 C158 116 150 120 140 118 L80 116 C64 114 52 104 50 88 L50 74 L42 68 L50 60 L50 44 L42 38 L50 32 L50 18 L100 18 L100 28 L90 34 L82 34 L76 42 L82 50 L94 50 L100 58 L94 66 L82 66 L82 76 L126 76 L126 18 L140 18",

  // Marina Bay (Singapore) - clockwise, complex city circuit, double hairpin at T7-T8
  marinaBay:
    "M60 22 L144 22 L144 34 L134 34 L134 44 L144 44 L144 60 L136 64 L144 70 L144 84 L136 88 L144 94 C144 104 136 112 124 112 L80 112 L80 100 L70 94 L60 100 L48 96 C38 90 34 78 38 66 L48 58 L38 50 L48 42 L48 34 L60 34 L60 22",

  // Lusail (Qatar) - clockwise, flowing high-speed horseshoe
  lusail:
    "M60 24 L150 24 C168 24 180 36 180 54 C180 72 168 88 150 96 L120 106 C102 112 82 112 64 104 L44 90 C30 78 26 60 32 44 C38 30 48 22 60 24",

  // COTA - clockwise, uphill T1 into T2-T3, hairpin at T11, stadium section T12-T15
  cota:
    "M72 20 L72 42 C72 52 78 60 88 62 L108 66 C120 68 130 62 136 52 L140 44 C146 34 158 30 168 36 C178 42 180 56 174 66 L166 74 L174 80 L162 90 L150 82 L130 86 L122 96 L132 102 L130 110 L100 116 L80 106 L64 110 L48 100 C38 92 36 78 42 66 L52 54 L44 46 L52 36 L60 28 L72 20",

  // Mexico (Hermanos Rodriguez) - clockwise, distinctive stadium oval section at T17-T19
  mexico:
    "M60 22 L148 22 C162 22 172 32 172 46 L172 58 L164 62 L172 68 L172 82 C172 90 166 96 158 98 L140 100 C128 102 120 110 118 120 C116 126 108 126 100 124 C92 122 86 116 86 106 C86 98 90 92 98 88 L116 82 C126 76 130 66 128 56 L118 50 L128 42 L118 36 L60 36 C46 36 36 44 36 58 L36 80 C36 94 46 104 60 108",

  // Interlagos (Brazil) - anti-clockwise, distinctive two-loop shape, Senna S at start
  interlagos:
    "M104 22 L128 22 C142 22 152 30 154 44 L154 70 C154 84 142 94 128 94 L110 94 L110 108 C110 116 102 120 92 118 C82 116 76 108 76 98 L76 72 C76 58 64 48 50 48 C38 48 28 58 28 70 C28 82 38 92 50 94 L76 94",

  // Las Vegas - clockwise, very long strip straight, wide 90° corners with single chicane
  lasVegas:
    "M46 36 L164 36 C174 36 180 42 180 52 L180 92 C180 102 174 108 164 108 L46 108 C36 108 30 102 30 92 L30 68 L22 64 L30 60 L30 52 C30 42 36 36 46 36",

  // Yas Marina (Abu Dhabi) - clockwise, "W" marina section + hotel tunnel back straight
  yasMarina:
    "M42 40 L42 28 L130 28 C150 28 164 38 168 54 L168 66 L176 70 L168 76 L168 84 C168 96 158 106 144 108 L120 110 L110 118 L100 110 L90 118 L80 110 L70 110 C56 108 44 96 42 80 L42 66 L34 60 L42 54 L42 40",

  // Generic fallback shapes (kept for unknown circuits)
  balancedB:
    "M22 70 C22 46 37 29 60 29 H86 C100 29 111 24 119 14 C126 5 137 0 151 0 C171 0 186 12 186 30 C186 47 173 59 154 59 H132 C114 59 100 70 96 87 C92 102 78 114 60 114 C38 114 22 96 22 70",
} as const

function resolveOfficialCircuitImagePath(slug: string) {
  const extensions = [".avif", ".webp", ".png", ".jpg", ".jpeg"]

  for (const extension of extensions) {
    const absolutePath = path.join(process.cwd(), "public", "assets", "circuits", `${slug}${extension}`)
    if (existsSync(absolutePath)) {
      return `/assets/circuits/${slug}${extension}`
    }
  }

  return null
}

function defineCircuitReference(definition: CircuitReferenceDefinition): CircuitReference {
  return {
    lengthKm: definition.lengthKm,
    officialImagePath: resolveOfficialCircuitImagePath(definition.officialImageSlug),
    tracePath: definition.tracePath,
  }
}

const CIRCUIT_REFERENCES: Record<string, CircuitReferenceDefinition> = {
  "Albert Park Grand Prix Circuit": {
    lengthKm: "5.278 km",
    officialImageSlug: "australia",
    tracePath: TRACE_LIBRARY.albertPark,
  },
  "Bahrain International Circuit": {
    lengthKm: "5.412 km",
    officialImageSlug: "bahrain",
    tracePath: TRACE_LIBRARY.bahrain,
  },
  "Jeddah Corniche Circuit": {
    lengthKm: "6.174 km",
    officialImageSlug: "saudi-arabia",
    tracePath: TRACE_LIBRARY.jeddah,
  },
  "Shanghai International Circuit": {
    lengthKm: "5.451 km",
    officialImageSlug: "china",
    tracePath: TRACE_LIBRARY.shanghai,
  },
  "Suzuka Circuit": {
    lengthKm: "5.807 km",
    officialImageSlug: "japan",
    tracePath: TRACE_LIBRARY.suzuka,
  },
  "Miami International Autodrome": {
    lengthKm: "5.412 km",
    officialImageSlug: "miami",
    tracePath: TRACE_LIBRARY.miami,
  },
  "Autodromo Enzo e Dino Ferrari": {
    lengthKm: "4.909 km",
    officialImageSlug: "emilia-romagna",
    tracePath: TRACE_LIBRARY.imola,
  },
  "Circuit de Monaco": {
    lengthKm: "3.337 km",
    officialImageSlug: "monaco",
    tracePath: TRACE_LIBRARY.monaco,
  },
  "Circuit de Barcelona-Catalunya": {
    lengthKm: "4.657 km",
    officialImageSlug: "spain",
    tracePath: TRACE_LIBRARY.barcelona,
  },
  "Circuit Gilles Villeneuve": {
    lengthKm: "4.361 km",
    officialImageSlug: "canada",
    tracePath: TRACE_LIBRARY.gillesVilleneuve,
  },
  "Red Bull Ring": {
    lengthKm: "4.318 km",
    officialImageSlug: "austria",
    tracePath: TRACE_LIBRARY.redBullRing,
  },
  "Silverstone Circuit": {
    lengthKm: "5.891 km",
    officialImageSlug: "great-britain",
    tracePath: TRACE_LIBRARY.silverstone,
  },
  "Circuit de Spa-Francorchamps": {
    lengthKm: "7.004 km",
    officialImageSlug: "belgium",
    tracePath: TRACE_LIBRARY.spa,
  },
  Hungaroring: {
    lengthKm: "4.381 km",
    officialImageSlug: "hungary",
    tracePath: TRACE_LIBRARY.hungaroring,
  },
  "Circuit Park Zandvoort": {
    lengthKm: "4.259 km",
    officialImageSlug: "netherlands",
    tracePath: TRACE_LIBRARY.zandvoort,
  },
  "Autodromo Nazionale Monza": {
    lengthKm: "5.793 km",
    officialImageSlug: "italy",
    tracePath: TRACE_LIBRARY.monza,
  },
  "Autodromo Nazionale di Monza": {
    lengthKm: "5.793 km",
    officialImageSlug: "italy",
    tracePath: TRACE_LIBRARY.monza,
  },
  "Baku City Circuit": {
    lengthKm: "6.003 km",
    officialImageSlug: "azerbaijan",
    tracePath: TRACE_LIBRARY.baku,
  },
  "Marina Bay Street Circuit": {
    lengthKm: "4.940 km",
    officialImageSlug: "singapore",
    tracePath: TRACE_LIBRARY.marinaBay,
  },
  "Lusail International Circuit": {
    lengthKm: "5.419 km",
    officialImageSlug: "qatar",
    tracePath: TRACE_LIBRARY.lusail,
  },
  "Losail International Circuit": {
    lengthKm: "5.419 km",
    officialImageSlug: "qatar",
    tracePath: TRACE_LIBRARY.lusail,
  },
  "Circuit of the Americas": {
    lengthKm: "5.513 km",
    officialImageSlug: "united-states",
    tracePath: TRACE_LIBRARY.cota,
  },
  "Autodromo Hermanos Rodriguez": {
    lengthKm: "4.304 km",
    officialImageSlug: "mexico",
    tracePath: TRACE_LIBRARY.mexico,
  },
  "Autódromo Hermanos Rodríguez": {
    lengthKm: "4.304 km",
    officialImageSlug: "mexico",
    tracePath: TRACE_LIBRARY.mexico,
  },
  "Autódromo Hermanos Rodriguez": {
    lengthKm: "4.304 km",
    officialImageSlug: "mexico",
    tracePath: TRACE_LIBRARY.mexico,
  },
  "Autodromo Jose Carlos Pace": {
    lengthKm: "4.309 km",
    officialImageSlug: "brazil",
    tracePath: TRACE_LIBRARY.interlagos,
  },
  "Autódromo José Carlos Pace": {
    lengthKm: "4.309 km",
    officialImageSlug: "brazil",
    tracePath: TRACE_LIBRARY.interlagos,
  },
  "Autódromo Jose Carlos Pace": {
    lengthKm: "4.309 km",
    officialImageSlug: "brazil",
    tracePath: TRACE_LIBRARY.interlagos,
  },
  "Las Vegas Strip Street Circuit": {
    lengthKm: "6.201 km",
    officialImageSlug: "las-vegas",
    tracePath: TRACE_LIBRARY.lasVegas,
  },
  "Las Vegas Street Circuit": {
    lengthKm: "6.201 km",
    officialImageSlug: "las-vegas",
    tracePath: TRACE_LIBRARY.lasVegas,
  },
  "Yas Marina Circuit": {
    lengthKm: "5.281 km",
    officialImageSlug: "united-arab-emirates",
    tracePath: TRACE_LIBRARY.yasMarina,
  },
}

const FALLBACK_REFERENCE: CircuitReference = {
  lengthKm: "Longueur a confirmer",
  officialImagePath: null,
  tracePath: TRACE_LIBRARY.balancedB,
}

export function getCircuitReference(circuitName: string | null | undefined) {
  if (!circuitName) return FALLBACK_REFERENCE

  const definition = CIRCUIT_REFERENCES[circuitName]
  if (!definition) return FALLBACK_REFERENCE

  return defineCircuitReference(definition)
}
