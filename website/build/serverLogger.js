// serverLogger.ts
import winston, { format } from "winston";
import path from "path";
import fs from "fs";
const ALLOWED_LOG_LEVELS = ["error", "warn", "info", "http", "verbose", "debug", "silly"];
const serverLogsPath = path.join(process.cwd(), "data", "logs", "server");
const clientLogsPath = path.join(process.cwd(), "data", "logs", "client");
// Sicherstellen, dass die Log-Verzeichnisse existieren
if (!fs.existsSync(serverLogsPath)) {
    fs.mkdirSync(serverLogsPath, { recursive: true });
}
if (!fs.existsSync(clientLogsPath)) {
    fs.mkdirSync(clientLogsPath, { recursive: true });
}
// Generate log filename with the current date
function getLogFilePath(logType) {
    const currentDate = new Date().toISOString().split("T")?.[0] ?? ""; // Format: YYYY-MM-DD
    let logPath;
    if (logType === "server") {
        logPath = serverLogsPath;
    }
    else if (logType === "client") {
        logPath = clientLogsPath;
    }
    else {
        throw new Error(`Unbekannter Log-Typ: "${logType}".`);
    }
    return path.join(logPath, `${logType}-${currentDate}.log`);
}
const plaintextFileFormat = format.combine(format.uncolorize(), format.timestamp(), format.printf((info) => {
    const timestamp = String(info.timestamp);
    const level = `[${String(info.level).toUpperCase()}]`.padEnd(7, " ");
    const message = String(info.message ?? "");
    const cleanedMessage = message
        .replace(/\r?\n/g, " ") // Ersetzt sowohl "\r\n" (Windows) als auch "\n" (Unix)
        .replace(/%c/g, "") // Entfernt console.log-Styles
        .replace(/(color|font-weight|background|text-decoration):.*?;/g, "") // Entfernt CSS-Styles
        .replace(/\s+/g, " ") // Ersetzt mehrere Leerzeichen durch ein einzelnes
        .trim(); // Entfernt Leerzeichen am Anfang und Ende
    return `[${timestamp}] ${level} ${cleanedMessage}`;
}));
// const jsonFileFormat = format.combine();
const consoleFormat = format.combine(format((info) => {
    info.level = `[${info.level.toUpperCase()}]`.padEnd(7, " ");
    return info;
})(), format.colorize(), format.printf(({ level, message }) => {
    const cleanedMessage = String(message ?? "").trim();
    return `${level} ${cleanedMessage}`;
}));
// Winston-Logger für Server-Logs
const serverLogger = winston.createLogger({
    level: process.env.LOG_LEVEL || "debug", // Globales Log Level
    transports: [
        new winston.transports.Console({ format: consoleFormat }),
        new winston.transports.File({ filename: getLogFilePath("server"), format: plaintextFileFormat }),
    ],
});
// Winston-Logger für Client-Logs
const clientLogger = winston.createLogger({
    level: process.env.LOG_LEVEL || "debug", // Globales Log Level
    transports: [new winston.transports.File({ filename: getLogFilePath("client"), format: plaintextFileFormat })],
});
// Haupt-Logging-Funktion für Server- und Client-Logs. API-Logs werden vorher in der Route automatisch als "client" gesetzt.
function log(level, message, source = "server") {
    const validatedLevel = validateLevel(level);
    if (source === "server") {
        serverLogger.log({ level: validatedLevel, message });
    }
    else if (source === "client") {
        clientLogger.log({ level: validatedLevel, message });
    }
    else {
        console.error(`⚠️ Unbekannte Log-Quelle: "${source}".`);
    }
}
function validateLevel(level) {
    if (level === "log")
        return "info";
    if (level === "trace")
        return "silly";
    if (!ALLOWED_LOG_LEVELS.includes(level)) {
        console.warn(`⚠️ Unbekanntes Client-Log-Level: "${level}". Fallback auf "debug".`);
        return "debug";
    }
    return level;
}
export default log;
