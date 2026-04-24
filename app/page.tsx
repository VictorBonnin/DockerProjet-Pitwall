import { HomeLuxury } from "./home-luxury"
import { getHomeLuxuryData } from "@/lib/services/home-luxury.service"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const home = await getHomeLuxuryData()

  return <HomeLuxury home={home} />
}
