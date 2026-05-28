import Redis from "ioredis"

import { getEnv } from "@/lib/env"

declare global {
  // eslint-disable-next-line no-var
  var __pitwall_redis__: Redis | undefined
}

export const redis =
  globalThis.__pitwall_redis__ ??
  new Redis(getEnv().REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  })

if (process.env.NODE_ENV !== "production") {
  globalThis.__pitwall_redis__ = redis
}
