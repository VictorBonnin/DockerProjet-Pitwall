import type { Metadata } from "next"
import Link from "next/link"
import "./globals.css"

export const metadata: Metadata = {
  title: "PitWall | Strategy Room",
  description: "Dashboard historique F1 backend-first pour analyser la saison depuis une base locale consolidée.",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className="pitwall-shell">
        <header className="sticky top-0 z-50 border-b border-[rgba(255,255,255,0.08)] bg-[rgba(4,5,7,0.78)] backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--home-cyan)]"
            >
              PitWall
            </Link>

            <nav className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/"
                className="rounded-full border border-[rgba(255,255,255,0.08)] px-4 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.2em] text-[var(--home-muted-strong)] transition hover:border-[rgba(77,214,255,0.2)] hover:text-white"
              >
                Home
              </Link>
              <Link
                href="/races"
                className="rounded-full border border-[rgba(255,255,255,0.08)] px-4 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.2em] text-[var(--home-muted-strong)] transition hover:border-[rgba(77,214,255,0.2)] hover:text-white"
              >
                Races
              </Link>
              <Link
                href="/circuits"
                className="rounded-full border border-[rgba(255,255,255,0.08)] px-4 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.2em] text-[var(--home-muted-strong)] transition hover:border-[rgba(77,214,255,0.2)] hover:text-white"
              >
                Circuits
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  )
}
