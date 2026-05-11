import { runEnvTests } from "./env.test"
import { runDashboardServiceTests } from "./dashboard.service.test"
import { runCircuitsIndexServiceTests } from "./circuits-index.service.test"
import { runCircuitPageServiceTests } from "./circuit-page.service.test"
import { runDriverPageServiceTests } from "./driver-page.service.test"
import { runHealthRouteTests } from "./health-route.test"
import { runHistorySyncServiceTests } from "./history-sync.service.test"
import { runHomePageServiceTests } from "./home-page.service.test"
import { runHomeLuxuryServiceTests } from "./home-luxury.service.test"
import { runLiveQueryServiceTests } from "./live-query.service.test"
import { runLiveSessionControlServiceTests } from "./live-session-control.service.test"
import { runLivePageServiceTests } from "./live-page.service.test"
import { runRaceWeekendPageServiceTests } from "./race-weekend-page.service.test"
import { runRaceGridLayoutTests } from "./race-grid-layout.test"
import { runRacesIndexServiceTests } from "./races-index.service.test"
import { runSessionDetailsSyncServiceTests } from "./session-details-sync.service.test"
import { runSessionResultsSyncServiceTests } from "./session-results-sync.service.test"
import { runTeamPageServiceTests } from "./team-page.service.test"

async function main() {
  const suites = [
    ["env", runEnvTests],
    ["dashboard-service", runDashboardServiceTests],
    ["circuits-index-service", runCircuitsIndexServiceTests],
    ["circuit-page-service", runCircuitPageServiceTests],
    ["driver-page-service", runDriverPageServiceTests],
    ["health-route", runHealthRouteTests],
    ["history-sync-service", runHistorySyncServiceTests],
    ["home-page-service", runHomePageServiceTests],
    ["home-luxury-service", runHomeLuxuryServiceTests],
    ["live-query-service", runLiveQueryServiceTests],
    ["live-session-control-service", runLiveSessionControlServiceTests],
    ["live-page-service", runLivePageServiceTests],
    ["race-weekend-page-service", runRaceWeekendPageServiceTests],
    ["race-grid-layout", runRaceGridLayoutTests],
    ["races-index-service", runRacesIndexServiceTests],
    ["session-details-sync-service", runSessionDetailsSyncServiceTests],
    ["session-results-sync-service", runSessionResultsSyncServiceTests],
    ["team-page-service", runTeamPageServiceTests],
  ] as const

  for (const [name, run] of suites) {
    await run()
    console.log(`PASS ${name}`)
  }
}

main().catch((error) => {
  console.error("TEST_FAILURE")
  console.error(error)
  process.exitCode = 1
})
