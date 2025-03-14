// ~/website/src/utils/global-error-handler.ts
import { log } from "../server-logger.js";
export function globalErrorHandler(err, req, res, _next) {
    log("error", `❌ Fehler in ${req.method} ${req.url}: ${String(err)}`);
    res.status(500).json({ error: "Interner Serverfehler", details: String(err) });
}
