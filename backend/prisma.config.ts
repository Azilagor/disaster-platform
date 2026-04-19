import path from "path"
import { defineConfig } from "prisma/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import "dotenv/config"

export default defineConfig({
  earlyAccess: true,
  schema: path.join("prisma", "schema.prisma"),

  // URL для CLI-команд (migrate, studio) — отдельный блок
  datasource: {
    url: process.env.DATABASE_URL!,
  },

  // adapter — для рантайма, migrate его больше не использует в v7
  migrate: {
    adapter: () => {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      })
      return new PrismaPg(pool)
    },
  },
})