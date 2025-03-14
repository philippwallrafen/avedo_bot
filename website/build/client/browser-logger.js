// ~/website/src/client/browser-logger.ts
const ALLOWED_LOG_LEVELS = ["error", "warn", "info", "log", "debug", "trace"];
// Lookup-Table für die Log-Methoden
const logFunctionMap = {
    error: console.error,
    warn: console.warn,
    info: console.info,
    log: console.log,
    debug: console.debug,
    trace: console.trace,
};
// Logging-Funktion
export function log(level, message, sendToServer = true) {
    if (!ALLOWED_LOG_LEVELS.includes(level)) {
        console.error(`⚠️ Unbekanntes Log-Level: "${level}". Fallback auf "log".`);
        level = "log";
    }
    const validatedLevel = level;
    let flattenedMessage;
    if (Array.isArray(message)) {
        logFunctionMap[validatedLevel](...message);
        flattenedMessage = message.join(" ");
    }
    else {
        logFunctionMap[validatedLevel](message);
        flattenedMessage = message;
    }
    if (!sendToServer) {
        return;
    }
    sendLogToServer(validatedLevel, flattenedMessage);
}
async function sendLogToServer(level, message) {
    if (!navigator.onLine) {
        console.warn("📴 Kein Internet – Log wird nicht gesendet.");
        return;
    }
    try {
        const response = await fetch("/logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ level, message, source: "client" }),
        });
        if (!response.ok) {
            throw new Error(`❌ Server antwortete mit Status ${response.status}`);
        }
    }
    catch (error) {
        console.error("❌ Fehler beim Senden des Logs an den Server:", error);
    }
}
