import Redis from "ioredis"

import { getEnv } from "@/lib/env"

declare global {
  var __pitwall_redis__: Redis | undefined
}

export const redis =
  global.__pitwall_redis__ ??
  new Redis(getEnv().REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  })

if (process.env.NODE_ENV !== "production") {
  global.__pitwall_redis__ = redis
}
