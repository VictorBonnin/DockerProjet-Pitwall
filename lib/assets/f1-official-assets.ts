export type OfficialDriverAsset = {
  code: string
  profileSlug: string
  pageUrl: string
}

export type OfficialTeamAsset = {
  localSlug: string
  officialSlug: string
  pageUrl: string
}

export type OfficialCircuitAsset = {
  circuitName: string
  raceSlug: string
  pageUrl: string
}

export const OFFICIAL_DRIVER_ASSETS: OfficialDriverAsset[] = [
  { code: "ALB", profileSlug: "alexander-albon", pageUrl: "https://www.formula1.com/en/drivers/alexander-albon.html" },
  { code: "ALO", profileSlug: "fernando-alonso", pageUrl: "https://www.formula1.com/en/drivers/fernando-alonso.html" },
  { code: "ANT", profileSlug: "kimi-antonelli", pageUrl: "https://www.formula1.com/en/drivers/kimi-antonelli.html" },
  { code: "BEA", profileSlug: "oliver-bearman", pageUrl: "https://www.formula1.com/en/drivers/oliver-bearman.html" },
  { code: "BOR", profileSlug: "gabriel-bortoleto", pageUrl: "https://www.formula1.com/en/drivers/gabriel-bortoleto.html" },
  { code: "COL", profileSlug: "franco-colapinto", pageUrl: "https://www.formula1.com/en/drivers/franco-colapinto.html" },
  { code: "DOO", profileSlug: "jack-doohan", pageUrl: "https://www.formula1.com/en/drivers/jack-doohan.html" },
  { code: "GAS", profileSlug: "pierre-gasly", pageUrl: "https://www.formula1.com/en/drivers/pierre-gasly.html" },
  { code: "HAD", profileSlug: "isack-hadjar", pageUrl: "https://www.formula1.com/en/drivers/isack-hadjar.html" },
  { code: "HAM", profileSlug: "lewis-hamilton", pageUrl: "https://www.formula1.com/en/drivers/lewis-hamilton.html" },
  { code: "HUL", profileSlug: "nico-hulkenberg", pageUrl: "https://www.formula1.com/en/drivers/nico-hulkenberg.html" },
  { code: "LAW", profileSlug: "liam-lawson", pageUrl: "https://www.formula1.com/en/drivers/liam-lawson.html" },
  { code: "LEC", profileSlug: "charles-leclerc", pageUrl: "https://www.formula1.com/en/drivers/charles-leclerc.html" },
  { code: "NOR", profileSlug: "lando-norris", pageUrl: "https://www.formula1.com/en/drivers/lando-norris.html" },
  { code: "OCO", profileSlug: "esteban-ocon", pageUrl: "https://www.formula1.com/en/drivers/esteban-ocon.html" },
  { code: "PIA", profileSlug: "oscar-piastri", pageUrl: "https://www.formula1.com/en/drivers/oscar-piastri.html" },
  { code: "RUS", profileSlug: "george-russell", pageUrl: "https://www.formula1.com/en/drivers/george-russell.html" },
  { code: "SAI", profileSlug: "carlos-sainz", pageUrl: "https://www.formula1.com/en/drivers/carlos-sainz.html" },
  { code: "STR", profileSlug: "lance-stroll", pageUrl: "https://www.formula1.com/en/drivers/lance-stroll.html" },
  { code: "TSU", profileSlug: "yuki-tsunoda", pageUrl: "https://www.formula1.com/en/drivers/yuki-tsunoda.html" },
  { code: "VER", profileSlug: "max-verstappen", pageUrl: "https://www.formula1.com/en/drivers/max-verstappen.html" },
]

export const OFFICIAL_TEAM_ASSETS: OfficialTeamAsset[] = [
  { localSlug: "alpine-f1-team", officialSlug: "alpine", pageUrl: "https://www.formula1.com/en/teams/alpine/" },
  { localSlug: "aston-martin", officialSlug: "astonmartin", pageUrl: "https://www.formula1.com/en/teams/aston-martin" },
  { localSlug: "ferrari", officialSlug: "ferrari", pageUrl: "https://www.formula1.com/en/teams/ferrari" },
  { localSlug: "haas-f1-team", officialSlug: "haas", pageUrl: "https://www.formula1.com/en/teams/haas" },
  { localSlug: "mclaren", officialSlug: "mclaren", pageUrl: "https://www.formula1.com/en/teams/mclaren" },
  { localSlug: "mercedes", officialSlug: "mercedes", pageUrl: "https://www.formula1.com/en/teams/mercedes" },
  { localSlug: "rb-f1-team", officialSlug: "racingbulls", pageUrl: "https://www.formula1.com/en/teams/racing-bulls" },
  { localSlug: "red-bull", officialSlug: "redbullracing", pageUrl: "https://www.formula1.com/en/teams/red-bull-racing" },
  { localSlug: "sauber", officialSlug: "audi", pageUrl: "https://www.formula1.com/en/teams/audi" },
  { localSlug: "williams", officialSlug: "williams", pageUrl: "https://www.formula1.com/en/teams/williams" },
]

export const OFFICIAL_CIRCUIT_ASSETS: OfficialCircuitAsset[] = [
  {
    circuitName: "Albert Park Grand Prix Circuit",
    raceSlug: "australia",
    pageUrl: "https://www.formula1.com/en/racing/2025/australia/circuit",
  },
  {
    circuitName: "Bahrain International Circuit",
    raceSlug: "bahrain",
    pageUrl: "https://www.formula1.com/en/racing/2025/bahrain/circuit",
  },
  {
    circuitName: "Jeddah Corniche Circuit",
    raceSlug: "saudi-arabia",
    pageUrl: "https://www.formula1.com/en/racing/2025/saudi-arabia/circuit",
  },
  {
    circuitName: "Shanghai International Circuit",
    raceSlug: "china",
    pageUrl: "https://www.formula1.com/en/racing/2025/china/circuit",
  },
  {
    circuitName: "Suzuka Circuit",
    raceSlug: "japan",
    pageUrl: "https://www.formula1.com/en/racing/2025/japan/circuit",
  },
  {
    circuitName: "Miami International Autodrome",
    raceSlug: "miami",
    pageUrl: "https://www.formula1.com/en/racing/2025/miami/circuit",
  },
  {
    circuitName: "Autodromo Enzo e Dino Ferrari",
    raceSlug: "emilia-romagna",
    pageUrl: "https://www.formula1.com/en/racing/2025/emiliaromagna/news?page=24",
  },
  {
    circuitName: "Circuit de Monaco",
    raceSlug: "monaco",
    pageUrl: "https://www.formula1.com/en/racing/2025/monaco/circuit",
  },
  {
    circuitName: "Circuit de Barcelona-Catalunya",
    raceSlug: "spain",
    pageUrl: "https://www.formula1.com/en/racing/2025/spain/circuit",
  },
  {
    circuitName: "Circuit Gilles Villeneuve",
    raceSlug: "canada",
    pageUrl: "https://www.formula1.com/en/racing/2025/canada/circuit",
  },
  {
    circuitName: "Red Bull Ring",
    raceSlug: "austria",
    pageUrl: "https://www.formula1.com/en/racing/2025/austria/circuit",
  },
  {
    circuitName: "Silverstone Circuit",
    raceSlug: "great-britain",
    pageUrl: "https://www.formula1.com/en/racing/2025/great-britain/circuit",
  },
  {
    circuitName: "Circuit de Spa-Francorchamps",
    raceSlug: "belgium",
    pageUrl: "https://www.formula1.com/en/racing/2025/belgium/circuit",
  },
  {
    circuitName: "Hungaroring",
    raceSlug: "hungary",
    pageUrl: "https://www.formula1.com/en/racing/2025/hungary/circuit",
  },
  {
    circuitName: "Circuit Park Zandvoort",
    raceSlug: "netherlands",
    pageUrl: "https://www.formula1.com/en/racing/2025/netherlands/circuit",
  },
  {
    circuitName: "Autodromo Nazionale Monza",
    raceSlug: "italy",
    pageUrl: "https://www.formula1.com/en/racing/2025/italy/circuit",
  },
  {
    circuitName: "Baku City Circuit",
    raceSlug: "azerbaijan",
    pageUrl: "https://www.formula1.com/en/racing/2025/azerbaijan/circuit",
  },
  {
    circuitName: "Marina Bay Street Circuit",
    raceSlug: "singapore",
    pageUrl: "https://www.formula1.com/en/racing/2025/singapore/circuit",
  },
  {
    circuitName: "Lusail International Circuit",
    raceSlug: "qatar",
    pageUrl: "https://www.formula1.com/en/racing/2025/qatar/circuit",
  },
  {
    circuitName: "Circuit of the Americas",
    raceSlug: "united-states",
    pageUrl: "https://www.formula1.com/en/racing/2025/united-states/circuit",
  },
  {
    circuitName: "Autodromo Hermanos Rodriguez",
    raceSlug: "mexico",
    pageUrl: "https://www.formula1.com/en/racing/2025/mexico/circuit",
  },
  {
    circuitName: "Autodromo Jose Carlos Pace",
    raceSlug: "brazil",
    pageUrl: "https://www.formula1.com/en/racing/2025/brazil/circuit",
  },
  {
    circuitName: "Las Vegas Strip Street Circuit",
    raceSlug: "las-vegas",
    pageUrl: "https://www.formula1.com/en/racing/2025/las-vegas/circuit",
  },
  {
    circuitName: "Las Vegas Street Circuit",
    raceSlug: "las-vegas",
    pageUrl: "https://www.formula1.com/en/racing/2025/las-vegas/circuit",
  },
  {
    circuitName: "Yas Marina Circuit",
    raceSlug: "united-arab-emirates",
    pageUrl: "https://www.formula1.com/en/racing/2025/united-arab-emirates/",
  },
]

export function getOfficialDriverAsset(code: string | null | undefined) {
  if (!code) return null
  return OFFICIAL_DRIVER_ASSETS.find((entry) => entry.code === code) ?? null
}

export function getOfficialTeamAsset(slug: string | null | undefined) {
  if (!slug) return null
  return OFFICIAL_TEAM_ASSETS.find((entry) => entry.localSlug === slug) ?? null
}

export function getOfficialCircuitAsset(circuitName: string | null | undefined) {
  if (!circuitName) return null
  return OFFICIAL_CIRCUIT_ASSETS.find((entry) => entry.circuitName === circuitName) ?? null
}
