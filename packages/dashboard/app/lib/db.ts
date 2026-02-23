import { getDb } from "@barkapi/core";
import path from "path";

export function getDashboardDb() {
  const dbPath =
    process.env.BARKAPI_DB_PATH ||
    path.join(
      process.env.BARKAPI_PROJECT_DIR || process.cwd(),
      ".barkapi",
      "barkapi.db"
    );
  return getDb(dbPath);
}
