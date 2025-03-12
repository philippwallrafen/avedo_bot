// serverLogger.ts
import winston, { format } from "winston";
import path from "path";
import fs from "fs";
const dataPath = path.join(process.cwd(), "data");
const logPath = path.join(dataPath, "logs");
// Sicherstellen, dass das Log-Verzeichnis existiert
if (!fs.existsSync(logPath)) {
    fs.mkdirSync(logPath, { recursive: true });
}
// Generate log filename with the current date
function getLogFilePath() {
    const date = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
    return path.join(logPath, `server-${date}.log`);
}
// Server Logger (winston Library)
const fileFormat = format.combine(format.uncolorize(), format.timestamp(), format.printf(({ timestamp, level, message }) => {
    // Logs immer als Einzeiler speichern
    const singleLineMessage = message.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    return `[${timestamp}] [${level.toUpperCase()}] ${singleLineMessage}`;
}));
const consoleFormat = format.combine(format((info) => {
    info.level = `[${info.level.toUpperCase()}]`;
    return info;
})(), format.colorize(), format.printf(({ level, message }) => `${level} ${message}`));
const serverLogger = winston.createLogger({
    level: process.env.LOG_LEVEL || "debug", // Globales Log Level
    transports: [
        new winston.transports.Console({ format: consoleFormat }),
        new winston.transports.File({ filename: getLogFilePath(), format: fileFormat }),
    ],
});
const log = (level, message) => {
    try {
        serverLogger.log({ level, message });
    }
    catch (error) {
        console.error("❌ Fehler beim Loggen:", error);
    }
};
export default log;
