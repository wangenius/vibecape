import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config();

function getConfig() {
  return {
    schema: "./src/services/database/schema.ts",
    out: "./drizzle/postgres",
    dialect: "postgresql" as const,
    dbCredentials: {
      url: process.env.DATABASE_URL!,
    },
  };
}

export default defineConfig(getConfig());
