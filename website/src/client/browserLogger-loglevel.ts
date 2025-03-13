// ~/website/src/client/browserLogger-loglevel.ts

// import loglevel from "loglevel";
// @ts-expect-error Bundler wird später geadded
import loglevel from "https://cdn.skypack.dev/loglevel";

const ALLOWED_LOG_LEVELS = ["error", "warn", "info", "debug", "trace"] as const;
type LogLevel = (typeof ALLOWED_LOG_LEVELS)[number];

// `loglevel`-Logger für Client
const browserLogger = loglevel.getLogger("browser");
browserLogger.setLevel(loglevel.levels.DEBUG);

// Lookup-Table für die Log-Methoden
const logFunctionMap: Record<LogLevel, (message: string, ...optionalParams: unknown[]) => void> = {
  error: browserLogger.error.bind(browserLogger),
  warn: browserLogger.warn.bind(browserLogger),
  info: browserLogger.info.bind(browserLogger),
  debug: browserLogger.debug.bind(browserLogger),
  trace: browserLogger.trace.bind(browserLogger),
};

// Logging-Funktion
function log(level: string, message: string): void {
  const validatedLevel = ALLOWED_LOG_LEVELS.includes(level as LogLevel)
    ? (level as LogLevel)
    : (console.error(`⚠️ Unbekanntes Log-Level: "${level}". Fallback auf "debug".`), "debug");

  logFunctionMap[validatedLevel](message);

  sendLogToServer(validatedLevel, message);
}

async function sendLogToServer(level: LogLevel, message: string): Promise<void> {
  if (!navigator.onLine) {
    console.warn("📴 Kein Internet – Log wird nicht gesendet.");
    return;
  }

  try {
    await fetch("/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, message }),
    });
  } catch (error) {
    console.error("❌ Fehler beim Senden des Logs an den Server:", error);
  }
}

export default log;
