import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

import { prisma } from "@/lib/db/prisma"
import {
  OFFICIAL_CIRCUIT_ASSETS,
  OFFICIAL_DRIVER_ASSETS,
  OFFICIAL_TEAM_ASSETS,
} from "@/lib/assets/f1-official-assets"

const TEAM_LOGO_PATTERN = (officialSlug: string) =>
  new RegExp(
    `https:\\/\\/media\\.formula1\\.com\\/image\\/upload\\/[^"' ]*common\\/f1\\/\\d{4}\\/${officialSlug}\\/\\d{4}${officialSlug}logowhite\\.(?:svg|webp)`,
    "i",
  )

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "PitWall Asset Backfill/1.0",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }

  return response.text()
}

async function fetchTextWithFallback(url: string) {
  try {
    return await fetchText(url)
  } catch (error) {
    if (!url.endsWith("/circuit")) {
      throw error
    }

    const fallbackUrl = url.replace(/\/circuit$/, "")
    return fetchText(fallbackUrl)
  }
}

async function downloadFile(url: string, outputPath: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "PitWall Asset Backfill/1.0",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  await writeFile(outputPath, buffer)
}

function extractFirstMatch(html: string, pattern: RegExp) {
  const matches = html.match(pattern)
  return matches?.[0] ?? null
}

function sanitizeMediaUrl(url: string) {
  return url.replace(/\/b_rgb:[^/]*\//i, "/")
}

function normalizeTeamLogoUrl(url: string, officialSlug: string) {
  const sanitized = sanitizeMediaUrl(url)
  const yearMatch = sanitized.match(/common\/f1\/(\d{4})\//i)
  const year = yearMatch?.[1]

  if (!year) {
    return sanitized
  }

  return `https://media.formula1.com/image/upload/common/f1/${year}/${officialSlug}/${year}${officialSlug}logowhite.svg`
}

function extractTeamLogoUrl(html: string, officialSlug: string) {
  const directMatch = extractFirstMatch(html, TEAM_LOGO_PATTERN(officialSlug))

  if (directMatch) {
    return normalizeTeamLogoUrl(directMatch, officialSlug)
  }

  const fallbackPatterns = [
    new RegExp(`Image:\\s*\\d{4}${officialSlug}logowhite\\.svg`, "i"),
    new RegExp(`\\d{4}${officialSlug}logowhite\\.svg`, "i"),
  ]

  for (const pattern of fallbackPatterns) {
    const match = html.match(pattern)?.[0]

    if (match) {
      const yearMatch = match.match(/(\d{4})/)
      const year = yearMatch?.[1]

      if (year) {
        return `https://media.formula1.com/image/upload/common/f1/${year}/${officialSlug}/${year}${officialSlug}logowhite.svg`
      }
    }
  }

  return null
}

function extractDriverImageUrl(html: string) {
  const metaPatterns = [
    /<meta property="og:image" content="([^"]*common\/f1\/\d{4}\/[^"]*right\.(?:jpg|webp))"/i,
    /<meta name="twitter:image" content="([^"]*common\/f1\/\d{4}\/[^"]*right\.(?:jpg|webp))"/i,
  ]

  for (const pattern of metaPatterns) {
    const match = html.match(pattern)
    if (match?.[1]) {
      return sanitizeMediaUrl(match[1])
    }
  }

  return null
}

function extractDriverHeroImageUrl(html: string) {
  const patterns = [
    /https:\/\/media\.formula1\.com\/image\/upload\/c_fill,w_720\/q_auto\/[^"' ]*common\/f1\/\d{4}\/[^"' ]*right\.webp/gi,
    /https:\/\/media\.formula1\.com\/image\/upload\/c_fill,w_720\/q_auto\/[^"' ]*common\/f1\/\d{4}\/[^"' ]*right\.(?:jpg|webp)/gi,
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)?.[0]
    if (match) {
      return sanitizeMediaUrl(match)
    }
  }

  return null
}

function extractCircuitImageUrl(html: string, raceSlug: string) {
  const fullUrlPatterns = [
    /https:\/\/media\.formula1\.com\/image\/upload\/[^"' ]*?[A-Za-z0-9_-]+_Circuit\.(?:png|webp|avif)/gi,
    /https:\/\/media\.formula1\.com\/content\/dam\/fom-website\/manual\/[^"' ]*?[A-Za-z0-9_-]+_Circuit\.(?:png|webp|avif)/gi,
  ]

  for (const pattern of fullUrlPatterns) {
    const matches = html.match(pattern)
    const matchingUrl = matches?.find((url) => url.toLowerCase().includes("_circuit."))

    if (matchingUrl) {
      return sanitizeMediaUrl(matchingUrl)
    }
  }

  const assetNameMatch = html.match(/([A-Za-z0-9_-]+_Circuit\.(?:png|webp|avif))/i)?.[1]
  if (assetNameMatch) {
    return `https://media.formula1.com/content/dam/fom-website/manual/Misc/${assetNameMatch}`
  }

  const slugBasedMatch = html.match(
    new RegExp(`([A-Za-z0-9_-]*${raceSlug.replace(/-/g, "[-_]?")}[A-Za-z0-9_-]*_Circuit\\.(?:png|webp|avif))`, "i"),
  )?.[1]

  if (slugBasedMatch) {
    return `https://media.formula1.com/content/dam/fom-website/manual/Misc/${slugBasedMatch}`
  }

  return null
}

function getFileExtension(url: string) {
  const cleanUrl = url.split("?")[0] ?? url
  const extension = path.extname(cleanUrl)
  return extension || ".jpg"
}

async function backfillDrivers() {
  const outputDir = path.join(process.cwd(), "public", "assets", "drivers")
  const heroOutputDir = path.join(outputDir, "hero")
  await mkdir(outputDir, { recursive: true })
  await mkdir(heroOutputDir, { recursive: true })

  let updated = 0

  for (const asset of OFFICIAL_DRIVER_ASSETS) {
    const driver = await prisma.driver.findUnique({
      where: { code: asset.code },
    })

    if (!driver) continue

    const html = await fetchText(asset.pageUrl)
    const imageUrl = extractDriverImageUrl(html)
    const heroImageUrl = extractDriverHeroImageUrl(html)

    if (!imageUrl) {
      console.warn(`[assets] missing driver image for ${asset.code}`)
      continue
    }

    const fileName = `${asset.code.toLowerCase()}${getFileExtension(imageUrl)}`
    const outputPath = path.join(outputDir, fileName)
    const localPath = `/assets/drivers/${fileName}`
    const heroFileName = `${asset.code.toLowerCase()}${getFileExtension(heroImageUrl ?? imageUrl)}`
    const heroOutputPath = path.join(heroOutputDir, heroFileName)
    const heroLocalPath = `/assets/drivers/hero/${heroFileName}`

    await downloadFile(imageUrl, outputPath)
    await downloadFile(heroImageUrl ?? imageUrl, heroOutputPath)

    await prisma.driver.update({
      where: { id: driver.id },
      data: {
        profileSlug: asset.profileSlug,
        imagePath: localPath,
        heroImagePath: heroLocalPath,
      },
    })

    updated += 1
    console.log(`[assets] driver ${asset.code} -> ${localPath}`)
  }

  return updated
}

async function backfillTeams() {
  const outputDir = path.join(process.cwd(), "public", "assets", "teams")
  await mkdir(outputDir, { recursive: true })

  let updated = 0

  for (const asset of OFFICIAL_TEAM_ASSETS) {
    const team = await prisma.constructor.findUnique({
      where: { slug: asset.localSlug },
    })

    if (!team) continue

    const html = await fetchText(asset.pageUrl)
    const logoUrl = extractTeamLogoUrl(html, asset.officialSlug)

    if (!logoUrl) {
      console.warn(`[assets] missing team logo for ${asset.localSlug}`)
      continue
    }

    const fileName = `${asset.localSlug}${getFileExtension(logoUrl)}`
    const outputPath = path.join(outputDir, fileName)
    const localPath = `/assets/teams/${fileName}`

    await downloadFile(logoUrl, outputPath)

    await prisma.constructor.update({
      where: { id: team.id },
      data: {
        logoPath: localPath,
      },
    })

    updated += 1
    console.log(`[assets] team ${asset.localSlug} -> ${localPath}`)
  }

  return updated
}

async function backfillCircuits() {
  const outputDir = path.join(process.cwd(), "public", "assets", "circuits")
  await mkdir(outputDir, { recursive: true })

  let updated = 0

  for (const asset of OFFICIAL_CIRCUIT_ASSETS) {
    let html: string

    try {
      html = await fetchTextWithFallback(asset.pageUrl)
    } catch (error) {
      console.warn(`[assets] missing circuit page for ${asset.circuitName}`)
      continue
    }

    const imageUrl = extractCircuitImageUrl(html, asset.raceSlug)

    if (!imageUrl) {
      console.warn(`[assets] missing circuit image for ${asset.circuitName}`)
      continue
    }

    const fileName = `${asset.raceSlug}${getFileExtension(imageUrl)}`
    const outputPath = path.join(outputDir, fileName)

    await downloadFile(imageUrl, outputPath)

    updated += 1
    console.log(`[assets] circuit ${asset.circuitName} -> /assets/circuits/${fileName}`)
  }

  return updated
}

async function main() {
  const drivers = await backfillDrivers()
  const teams = await backfillTeams()
  const circuits = await backfillCircuits()

  console.log(
    JSON.stringify(
      {
        circuits,
        drivers,
        teams,
      },
      null,
      2,
    ),
  )
}

main()
  .catch((error) => {
    console.error("[assets] failed", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
