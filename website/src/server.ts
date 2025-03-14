// ~/website/src/server.ts

import path from "path";
import express from "express";
import expressLayouts from "express-ejs-layouts";
import cors from "cors";

import { log } from "./server-logger.js";
import { router } from "./routes/index.js";
import { globalErrorHandler } from "./utils/global-error-handler.js";

const websitePath = path.join(process.cwd(), "website");

// ======================
// Express & Middleware Setup
// ======================
const app = express();

app.set("views", path.join(websitePath, "views"));
app.set("view engine", "ejs");
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(websitePath, "public")));
app.use("/build/client", express.static(path.join(websitePath, "build", "client")));
app.use(expressLayouts);
app.set("layout", "layout");
app.use(router);
app.use(globalErrorHandler);

// ======================
// Server-Shutdown
// ======================
async function handleShutdown(signal: string): Promise<void> {
  log("info", `⚠️  Received ${signal}, shutting down gracefully...`);
  await log("info", `Server is shutting down due to ${signal}`);

  server.close(() => {
    log("info", "✅ Server shut down successfully.");
    process.exit(0);
  });

  setTimeout(() => {
    log("error", "❌ Forced shutdown due to timeout.");
    process.exit(1);
  }, 5000);
}

// System-Signale abfangen (z. B. CTRL+C lokal oder SIGTERM in Docker/K8s)
process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);

// ======================
// Server starten
// ======================
const PORT = 3000;
const server = app.listen(PORT, async () => {
  log("info", `🚀 Server läuft auf http://localhost:${PORT}`);
});
