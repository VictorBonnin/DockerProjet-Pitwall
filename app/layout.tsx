import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "PitWall",
  description: "Socle data F1 backend-first avec routes API et logique de traitement conservees.",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
