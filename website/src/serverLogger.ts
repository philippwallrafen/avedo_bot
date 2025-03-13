// serverLogger.ts

import winston, { format } from "winston";
import path from "path";
import fs from "fs";

const ALLOWED_LOG_LEVELS = ["error", "warn", "info", "http", "verbose", "debug", "silly"] as const;
type LogLevel = (typeof ALLOWED_LOG_LEVELS)[number];

const serverLogsPath: string = path.join(process.cwd(), "data", "logs", "server");
const clientLogsPath: string = path.join(process.cwd(), "data", "logs", "client");

// Sicherstellen, dass die Log-Verzeichnisse existieren
if (!fs.existsSync(serverLogsPath)) {
  fs.mkdirSync(serverLogsPath, { recursive: true });
}
if (!fs.existsSync(clientLogsPath)) {
  fs.mkdirSync(clientLogsPath, { recursive: true });
}

// Generate log filename with the current date
function getLogFilePath(logType: "server" | "client"): string {
  const currentDate: string = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

  let logPath: string;
  if (logType === "server") {
    logPath = serverLogsPath;
  }
  if (logType === "client") {
    logPath = clientLogsPath;
  }
  if (logType !== "server" && logType !== "client") {
    throw new Error(`Unbekannter Log-Typ: "${logType}".`);
  }

  return path.join(logPath, `${logType}-${currentDate}.log`);
}

// Winston Log Format
const fileFormat = format.combine(
  format.uncolorize(),
  format.timestamp(),
  format.printf((info: winston.Logform.TransformableInfo): string => {
    const timestamp = String(info.timestamp);
    const level = String(info.level).toUpperCase();
    const message = String(info.message ?? "");
    // Logs immer als Einzeiler speichern
    // prettier-ignore
    const singleLineMessage = message
      .replace(/\r\n/g, " ")
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return `[${timestamp}] [${level}] ${singleLineMessage}`;
  })
);
// Winston Konsolen Format
const consoleFormat = format.combine(
  format((info) => {
    info.level = `[${info.level.toUpperCase()}]`;
    return info;
  })(),
  format.colorize(),
  format.printf(({ level, message }) => `${level} ${message}`)
);
// Winston-Logger für Server-Logs
const serverLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || "debug", // Globales Log Level
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    new winston.transports.File({ filename: getLogFilePath("server"), format: fileFormat }),
  ],
});
// Winston-Logger für Client-Logs
const clientLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || "debug", // Globales Log Level
  transports: [new winston.transports.File({ filename: getLogFilePath("client"), format: fileFormat })],
});

// Haupt-Logging-Funktion für Server- und Client-Logs. API-Logs werden vorher in der Route automatisch als "client" gesetzt.
function log(level: string, message: string, source: string = "server"): void {
  const validatedLevel = validateLevel(level);
  if (source === "server") {
    serverLogger.log({ level: validatedLevel, message });
  } else if (source === "client") {
    clientLogger.log({ level: validatedLevel, message });
  } else {
    console.error(`⚠️ Unbekannte Log-Quelle: "${source}".`);
  }
}

function validateLevel(level: string): LogLevel {
  if (level === "log") return "info";
  if (level === "trace") return "silly";

  if (!ALLOWED_LOG_LEVELS.includes(level as LogLevel)) {
    console.warn(`⚠️ Unbekanntes Client-Log-Level: "${level}". Fallback auf "debug".`);
    return "debug";
  }
  return level as LogLevel;
}

export default log;
