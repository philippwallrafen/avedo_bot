// serverLogger.ts
import winston, { format } from "winston";
import path from "path";
import fs from "fs";
const ALLOWED_SERVER_LOG_LEVELS = ["error", "warn", "info", "http", "verbose", "debug", "silly"];
const ALLOWED_CLIENT_LOG_LEVELS = ["error", "warn", "info", "log", "debug", "trace"];
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
    const currentDate = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
    // prettier-ignore
    const logPath = logType === "server"
        ? serverLogsPath
        : logType === "client"
            ? clientLogsPath
            : "unknown log type";
    return path.join(logPath, `${logType}-${currentDate}.log`);
}
// Winston Log Format
const fileFormat = format.combine(format.uncolorize(), format.timestamp(), format.printf((info) => {
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
}));
// Winston Konsolen Format
const consoleFormat = format.combine(format((info) => {
    info.level = `[${info.level.toUpperCase()}]`;
    return info;
})(), format.colorize(), format.printf(({ level, message }) => `${level} ${message}`));
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
/**
 * Haupt-Logging-Funktion für Server- und Client-Logs.
 *
 * @param {string} level - Die Log Stufe (z. B. "error", "warn", "info").
 * @param {string} message - Die Nachricht, die geloggt werden soll.
 * @param {string} [source="server"] - Die Quelle des Logs. Standardwert ist "server". API-Logs werden in der Route automatisch als "client" gesetzt.
 */
function log(level, message, source = "server") {
    if (source === "server") {
        const validatedLevel = ALLOWED_SERVER_LOG_LEVELS.includes(level)
            ? level
            : (console.error(`⚠️ Unbekanntes Log-Level: "${level}". Fallback auf "debug".`), "debug");
        try {
            serverLogger.log({ level: validatedLevel, message });
        }
        catch (error) {
            console.error("❌ Fehler beim Loggen:", error);
        }
    }
    else if (source === "client") {
        const validatedLevel = ALLOWED_CLIENT_LOG_LEVELS.includes(level)
            ? level
            : (console.error(`⚠️ Unbekanntes Log-Level: "${level}". Fallback auf "log".`), "log");
        try {
            clientLogger.log({ level: validatedLevel, message });
        }
        catch (error) {
            console.error("❌ Fehler beim Loggen:", error);
        }
    }
    else {
        console.error(`⚠️ Unbekannte Log-Quelle: "${source}".`);
    }
}
export default log;
