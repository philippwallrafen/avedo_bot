// logger.ts
import loglevel from "loglevel";
import winston, { format } from "winston";
import path from "path";
import fs from "fs/promises";
const dataPath = path.join(process.cwd(), "data");
const logPath = path.join(dataPath, "logs");
const isBrowser = typeof window !== "undefined";
let log;
// Ensure the log directory exists
async function ensureLogDirectory(directory) {
    try {
        await fs.mkdir(directory, { recursive: true });
    }
    catch (error) {
        console.error("❌ Could not create log directory:", error);
    }
}
await ensureLogDirectory(logPath);
// Generate log filename with the current date
function getLogFilePath() {
    const date = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
    return path.join(logPath, `server-${date}.log`);
}
// winston.addColors({
//   error: "red",
//   warn: "yellow",
//   info: "green",
//   verbose: "cyan",
//   debug: "blue",
//   silly: "magenta",
// });
// Browser Logger (using loglevel)
if (isBrowser) {
    const browserLogger = loglevel.getLogger("browser");
    browserLogger.setLevel(loglevel.levels.DEBUG);
    log = (level, message) => {
        switch (level) {
            case "info":
                browserLogger.info(message);
                break;
            case "warn":
                browserLogger.warn(message);
                break;
            case "error":
                browserLogger.error(message);
                break;
            default:
                browserLogger.debug(message);
        }
    };
}
else {
    const fileFormat = format.combine(format.uncolorize(), format.timestamp(), format.printf(({ timestamp, level, message }) => {
        // Replace newlines with a space, then collapse multiple spaces and trim the result.
        const singleLineMessage = message.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
        return `[${timestamp}] [${level.toUpperCase()}] ${singleLineMessage}`;
    }));
    const consoleFormat = format.combine(format((info) => {
        // Modify the level to include brackets and uppercase it.
        info.level = `[${info.level.toUpperCase()}]`;
        return info;
    })(), 
    // Colorize all text (not only the level property)
    format.colorize(), format.printf(({ level, message }) => `${level} ${message}`));
    // Server Logger (using winston)
    const serverLogger = winston.createLogger({
        level: process.env.LOG_LEVEL || "debug", // use environment variable to control log level
        transports: [
            // Console transport with colorized output
            new winston.transports.Console({ format: consoleFormat }),
            // File transport to log file
            new winston.transports.File({ filename: getLogFilePath(), format: fileFormat }),
        ],
    });
    log = (level, message) => {
        serverLogger.log({ level, message });
    };
}
export default log;
