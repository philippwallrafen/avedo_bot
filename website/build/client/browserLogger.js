// browserLogger.ts
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
function log(level, message) {
    const validatedLevel = ALLOWED_LOG_LEVELS.includes(level)
        ? level
        : (console.error(`⚠️ Unbekanntes Log-Level: "${level}". Fallback auf "log".`), "log");
    if (Array.isArray(message)) {
        console.log("Detected array");
        logFunctionMap[validatedLevel](...message);
        sendLogToServer(validatedLevel, message.join(" "));
    }
    else {
        console.log("Detected normal message");
        logFunctionMap[validatedLevel](message);
        sendLogToServer(validatedLevel, message);
    }
}
async function sendLogToServer(level, message) {
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
    }
    catch (error) {
        console.error("❌ Fehler beim Senden des Logs an den Server:", error);
    }
}
export default log;
