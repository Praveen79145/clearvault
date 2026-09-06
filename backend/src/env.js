// Minimal .env loader (no dependency) — import FIRST in any entry file.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const envFile = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".env");

if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
