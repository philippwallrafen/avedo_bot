// serverLogger.ts

import winston, { format } from "winston";
import path from "path";
import fs from "fs";

const ALLOWED_LOG_LEVELS = ["error", "warn", "info", "http", "verbose", "debug", "silly"] as const;
type LogLevel = (typeof ALLOWED_LOG_LEVELS)[number];

const dataPath: string = path.join(process.cwd(), "data");
const logPath: string = path.join(dataPath, "logs");

// Sicherstellen, dass das Log-Verzeichnis existiert
if (!fs.existsSync(logPath)) {
  fs.mkdirSync(logPath, { recursive: true });
}

// Generate log filename with the current date
function getLogFilePath(): string {
  const date: string = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
  return path.join(logPath, `server-${date}.log`);
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
// Server Logger (winston Library)
const serverLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || "debug", // Globales Log Level
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    new winston.transports.File({ filename: getLogFilePath(), format: fileFormat }),
  ],
});

function log(level: string, message: string): void {
  const validatedLevel =
    level === "log"
      ? "info"
      : level === "trace"
      ? "silly"
      : ALLOWED_LOG_LEVELS.includes(level as LogLevel)
      ? (level as LogLevel)
      : (console.error(`⚠️ Unbekanntes Log-Level: "${level}". Fallback auf "debug".`), "debug");

  try {
    serverLogger.log({ level: validatedLevel, message });
  } catch (error: unknown) {
    console.error("❌ Fehler beim Loggen:", error);
  }
}

export default log;
