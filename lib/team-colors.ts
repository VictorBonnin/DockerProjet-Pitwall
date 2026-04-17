const TEAM_COLORS: Record<string, string> = {
  "alpine-f1-team": "#ff5ab7",
  "aston-martin": "#229971",
  ferrari: "#ff3b30",
  "haas-f1-team": "#b6b9c0",
  mclaren: "#ff8000",
  mercedes: "#00d2be",
  "rb-f1-team": "#6692ff",
  "red-bull": "#1e5bff",
  sauber: "#00e66a",
  williams: "#64c4ff",
}

export function getTeamColor(teamSlug: string | null | undefined) {
  if (!teamSlug) return "#4dd6ff"
  return TEAM_COLORS[teamSlug] ?? "#4dd6ff"
}

export function withAlpha(hexColor: string, alpha: number) {
  const normalized = hexColor.replace("#", "")
  if (normalized.length !== 6) {
    return `rgba(77,214,255,${alpha})`
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16)
  const green = Number.parseInt(normalized.slice(2, 4), 16)
  const blue = Number.parseInt(normalized.slice(4, 6), 16)

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}
