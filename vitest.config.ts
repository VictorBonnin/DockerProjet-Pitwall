import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      exclude: [
        "node_modules/**",
        ".next/**",
        "app/**",
        "workers/**",
        "scripts/**",
        "prisma/**",
        "public/**",
        "tests/**",
        "vitest.config.ts",
        "next.config.ts",
        "postcss.config.mjs",
        "tailwind.config.*",
      ],
      include: ["lib/**/*.ts"],
    },
  },
})
