// logger.ts
import loglevel from "loglevel";
import winston, { format } from "winston";
import path from "path";
import fs from "fs/promises";

const dataPath: string = path.join(process.cwd(), "data");
const logPath: string = path.join(dataPath, "logs");
const isBrowser: boolean = typeof window !== "undefined";

let log: (level: string, message: string) => void;

// Ensure the log directory exists
async function ensureLogDirectory(directory: string): Promise<void> {
  try {
    await fs.mkdir(directory, { recursive: true });
  } catch (error: unknown) {
    console.error("❌ Could not create log directory:", error);
  }
}
await ensureLogDirectory(logPath);

// Generate log filename with the current date
function getLogFilePath(): string {
  const date: string = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
  return path.join(logPath, `server-${date}.log`);
}

// Browser Logger (loglevel Library)
if (isBrowser) {
  const browserLogger = loglevel.getLogger("browser");
  browserLogger.setLevel(loglevel.levels.DEBUG);

  log = (level: string, message: string): void => {
    switch (level) {
      case "error":
        browserLogger.error(message);
        break;
      case "warn":
        browserLogger.warn(message);
        break;
      case "info":
        browserLogger.info(message);
        break;
      case "debug":
        browserLogger.debug(message);
        break;
      case "trace":
        browserLogger.trace(message);
        break;
      default:
        console.warn(`Unbekanntes Log-Level: ${level}, benutze 'debug' als Fallback.`);
        browserLogger.debug(message);
    }
  };
} else {
  // Server Logger (winston Library)

  const fileFormat = format.combine(
    format.uncolorize(),
    format.timestamp(),
    format.printf(({ timestamp, level, message }: winston.Logform.TransformableInfo): string => {
      // Logs immer als Einzeiler speichern
      const singleLineMessage = (message as string).replace(/\n/g, " ").replace(/\s+/g, " ").trim();
      return `[${timestamp}] [${level.toUpperCase()}] ${singleLineMessage}`;
    })
  );

  const consoleFormat = format.combine(
    format((info) => {
      info.level = `[${info.level.toUpperCase()}]`;
      return info;
    })(),
    format.colorize(),
    format.printf(({ level, message }) => `${level} ${message}`)
  );

  const serverLogger = winston.createLogger({
    level: process.env.LOG_LEVEL || "debug", // Globales Log Level
    transports: [
      // Console transport
      new winston.transports.Console({ format: consoleFormat }),
      // File transport
      new winston.transports.File({ filename: getLogFilePath(), format: fileFormat }),
    ],
  });

  log = (level: string, message: string): void => {
    serverLogger.log({ level, message });
  };
}

export default log;
