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
  flowingA:
    "M24 68 C24 40 46 22 73 22 C96 22 114 32 122 47 C128 57 138 62 154 62 C171 62 184 70 184 84 C184 97 171 104 156 104 C139 104 127 98 121 87 C115 77 104 72 88 72 C70 72 56 82 56 95 C56 105 49 112 39 112 C29 112 22 105 22 94 C22 84 31 76 41 76 C48 76 55 73 60 68",
  flowingB:
    "M30 95 C20 73 24 46 45 32 C64 20 90 22 109 35 C124 46 139 46 152 34 C164 23 181 24 188 37 C194 49 188 61 176 67 C164 72 156 79 155 91 C154 104 144 112 130 112 C117 112 108 106 103 95 C98 84 88 79 74 79 C59 79 50 86 47 98 C44 108 35 113 27 109 C19 105 16 97 20 88",
  technicalA:
    "M28 86 L28 42 C28 28 39 20 53 20 H104 C121 20 132 29 132 44 C132 57 124 66 109 70 L88 75 L88 92 C88 104 97 112 110 112 H154 C172 112 184 101 184 84 C184 68 172 57 154 57 H136",
  technicalB:
    "M34 98 C23 87 22 66 37 54 L69 30 C84 19 105 20 118 31 L140 49 C148 56 159 58 170 54 L183 49 L183 66 L170 71 C159 75 151 84 149 96 L147 109 L128 109 L131 95 C133 82 127 72 116 66 L91 54 C80 49 66 50 56 58 L34 77",
  cityA:
    "M32 28 H86 V44 H56 V63 H122 V28 H171 V47 H144 V92 H172 V110 H112 V77 H56 V110 H32 Z",
  cityB:
    "M26 34 H74 V24 H124 V44 H99 V62 H152 V82 H121 V98 H176 V112 H84 V94 H104 V78 H52 V58 H26 Z",
  fastA:
    "M24 78 C24 48 51 22 90 22 C123 22 150 39 165 65 C172 77 178 82 188 82 C194 82 198 86 198 92 C198 99 193 104 186 104 C172 104 161 97 152 83 C140 63 118 50 92 50 C64 50 46 66 46 91",
  fastB:
    "M26 86 C26 59 42 37 69 30 L131 14 C148 10 164 18 171 33 C178 48 172 63 157 70 L89 100 C74 107 58 106 45 98 C34 91 28 82 26 69",
  compactA:
    "M72 24 C45 24 26 42 26 68 C26 94 45 112 71 112 C90 112 104 102 111 86 C117 72 129 63 147 60 C165 58 178 48 178 35 C178 25 170 18 158 18 C146 18 137 24 132 34 C126 46 116 52 100 52 C93 52 87 49 84 43 C81 30 78 24 72 24",
  compactB:
    "M56 26 C34 26 20 42 20 64 C20 86 34 102 56 102 H132 C153 102 168 88 168 68 C168 50 158 38 141 34 L112 28 C104 26 98 20 95 14 C92 8 86 4 78 4 C68 4 60 12 60 22 C60 24 59 25 56 26",
  balancedA:
    "M30 84 C22 59 36 31 64 24 L108 12 C136 7 162 20 172 46 C181 68 170 93 146 103 L110 118 C82 128 49 118 36 97 C33 92 31 88 30 84",
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
    tracePath: TRACE_LIBRARY.flowingA,
  },
  "Bahrain International Circuit": {
    lengthKm: "5.412 km",
    officialImageSlug: "bahrain",
    tracePath: TRACE_LIBRARY.flowingB,
  },
  "Jeddah Corniche Circuit": {
    lengthKm: "6.174 km",
    officialImageSlug: "saudi-arabia",
    tracePath: TRACE_LIBRARY.fastA,
  },
  "Shanghai International Circuit": {
    lengthKm: "5.451 km",
    officialImageSlug: "china",
    tracePath: TRACE_LIBRARY.technicalA,
  },
  "Suzuka Circuit": {
    lengthKm: "5.807 km",
    officialImageSlug: "japan",
    tracePath: TRACE_LIBRARY.balancedA,
  },
  "Miami International Autodrome": {
    lengthKm: "5.412 km",
    officialImageSlug: "miami",
    tracePath: TRACE_LIBRARY.cityA,
  },
  "Autodromo Enzo e Dino Ferrari": {
    lengthKm: "4.909 km",
    officialImageSlug: "emilia-romagna",
    tracePath: TRACE_LIBRARY.flowingB,
  },
  "Circuit de Monaco": {
    lengthKm: "3.337 km",
    officialImageSlug: "monaco",
    tracePath: TRACE_LIBRARY.cityB,
  },
  "Circuit de Barcelona-Catalunya": {
    lengthKm: "4.657 km",
    officialImageSlug: "spain",
    tracePath: TRACE_LIBRARY.technicalB,
  },
  "Circuit Gilles Villeneuve": {
    lengthKm: "4.361 km",
    officialImageSlug: "canada",
    tracePath: TRACE_LIBRARY.fastB,
  },
  "Red Bull Ring": {
    lengthKm: "4.318 km",
    officialImageSlug: "austria",
    tracePath: TRACE_LIBRARY.compactA,
  },
  "Silverstone Circuit": {
    lengthKm: "5.891 km",
    officialImageSlug: "great-britain",
    tracePath: TRACE_LIBRARY.flowingA,
  },
  "Circuit de Spa-Francorchamps": {
    lengthKm: "7.004 km",
    officialImageSlug: "belgium",
    tracePath: TRACE_LIBRARY.fastA,
  },
  Hungaroring: {
    lengthKm: "4.381 km",
    officialImageSlug: "hungary",
    tracePath: TRACE_LIBRARY.compactB,
  },
  "Circuit Park Zandvoort": {
    lengthKm: "4.259 km",
    officialImageSlug: "netherlands",
    tracePath: TRACE_LIBRARY.balancedB,
  },
  "Autodromo Nazionale Monza": {
    lengthKm: "5.793 km",
    officialImageSlug: "italy",
    tracePath: TRACE_LIBRARY.fastB,
  },
  "Autodromo Nazionale di Monza": {
    lengthKm: "5.793 km",
    officialImageSlug: "italy",
    tracePath: TRACE_LIBRARY.fastB,
  },
  "Baku City Circuit": {
    lengthKm: "6.003 km",
    officialImageSlug: "azerbaijan",
    tracePath: TRACE_LIBRARY.cityA,
  },
  "Marina Bay Street Circuit": {
    lengthKm: "4.940 km",
    officialImageSlug: "singapore",
    tracePath: TRACE_LIBRARY.cityB,
  },
  "Lusail International Circuit": {
    lengthKm: "5.419 km",
    officialImageSlug: "qatar",
    tracePath: TRACE_LIBRARY.balancedA,
  },
  "Losail International Circuit": {
    lengthKm: "5.419 km",
    officialImageSlug: "qatar",
    tracePath: TRACE_LIBRARY.balancedA,
  },
  "Circuit of the Americas": {
    lengthKm: "5.513 km",
    officialImageSlug: "united-states",
    tracePath: TRACE_LIBRARY.flowingA,
  },
  "Autodromo Hermanos Rodriguez": {
    lengthKm: "4.304 km",
    officialImageSlug: "mexico",
    tracePath: TRACE_LIBRARY.technicalB,
  },
  "Autódromo Hermanos Rodríguez": {
    lengthKm: "4.304 km",
    officialImageSlug: "mexico",
    tracePath: TRACE_LIBRARY.technicalB,
  },
  "Autódromo Hermanos Rodriguez": {
    lengthKm: "4.304 km",
    officialImageSlug: "mexico",
    tracePath: TRACE_LIBRARY.technicalB,
  },
  "Autodromo Jose Carlos Pace": {
    lengthKm: "4.309 km",
    officialImageSlug: "brazil",
    tracePath: TRACE_LIBRARY.compactA,
  },
  "Autódromo José Carlos Pace": {
    lengthKm: "4.309 km",
    officialImageSlug: "brazil",
    tracePath: TRACE_LIBRARY.compactA,
  },
  "Autódromo Jose Carlos Pace": {
    lengthKm: "4.309 km",
    officialImageSlug: "brazil",
    tracePath: TRACE_LIBRARY.compactA,
  },
  "Las Vegas Strip Street Circuit": {
    lengthKm: "6.201 km",
    officialImageSlug: "las-vegas",
    tracePath: TRACE_LIBRARY.cityB,
  },
  "Las Vegas Street Circuit": {
    lengthKm: "6.201 km",
    officialImageSlug: "las-vegas",
    tracePath: TRACE_LIBRARY.cityB,
  },
  "Yas Marina Circuit": {
    lengthKm: "5.281 km",
    officialImageSlug: "united-arab-emirates",
    tracePath: TRACE_LIBRARY.flowingB,
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
