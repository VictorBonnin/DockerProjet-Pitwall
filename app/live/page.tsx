import { getLivePageData } from "@/lib/services/live-page.service"
import LiveDashboard from "./LiveDashboard"

export const dynamic = "force-dynamic"

export default async function LivePage() {
  const initial = await getLivePageData()
  return <LiveDashboard initial={initial} />
}
