// browserLogger.ts

const ALLOWED_LOG_LEVELS = ["error", "warn", "info", "log", "debug", "trace"] as const;
type LogLevel = (typeof ALLOWED_LOG_LEVELS)[number];

// Lookup-Table für die Log-Methoden
const logFunctionMap: Record<LogLevel, (message: string, ...optionalParams: unknown[]) => void> = {
  error: console.error,
  warn: console.warn,
  info: console.info,
  log: console.log,
  debug: console.debug,
  trace: console.trace,
};

// Logging-Funktion
function log(level: string, message: string | string[], sendToServer: boolean = true): void {
  if (!ALLOWED_LOG_LEVELS.includes(level as LogLevel)) {
    console.error(`⚠️ Unbekanntes Log-Level: "${level}". Fallback auf "log".`);
    level = "log";
  }
  const validatedLevel = level as LogLevel;
  let flattenedMessage: string;

  if (Array.isArray(message)) {
    logFunctionMap[validatedLevel](...message);
    flattenedMessage = message.join(" ");
  } else {
    logFunctionMap[validatedLevel](message);
    flattenedMessage = message;
  }

  if (!sendToServer) {
    return;
  }
  sendLogToServer(validatedLevel, flattenedMessage);
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
      body: JSON.stringify({ level, message, source: "client" }),
    });
  } catch (error) {
    console.error("❌ Fehler beim Senden des Logs an den Server:", error);
  }
}

export default log;
