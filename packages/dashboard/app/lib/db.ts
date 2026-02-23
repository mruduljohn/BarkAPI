import { getDb } from "@barkapi/core";
import path from "path";

export function getDashboardDb() {
  const dbPath =
    process.env.BARKAPI_DB_PATH ||
    path.join(process.cwd(), ".barkapi", "barkapi.db");
  return getDb(dbPath);
}
