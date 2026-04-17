import { PrismaClient } from "@prisma/client"

declare global {
  var __pitwall_prisma__: PrismaClient | undefined
}

export const prisma =
  global.__pitwall_prisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  global.__pitwall_prisma__ = prisma
}
