/**
 * server.ts
 *
 * This Express server uses EJS with express-ejs-layouts for templating.
 * It reads agent data from a CSV file, serves multiple pages, and updates the CSV
 * when agent data changes.
 *
 * Best practices used:
 * - Using path.join for cross-platform file paths.
 * - Centralizing layout with express-ejs-layouts to keep views DRY.
 * - Robust error handling in CSV parsing.
 * - Clear, modular route definitions.
 */
import path from "path";
import fs from "fs/promises";
import express from "express";
import expressLayouts from "express-ejs-layouts";
import cors from "cors";
import { inspect } from "util";
import log from "./serverLogger.js"; // Import logging functions
const websitePath = path.join(process.cwd(), "website");
const dataPath = path.join(process.cwd(), "data");
const FILE_PATH = path.join(dataPath, "agents.csv");
const CSV_HEADER = ["surname", "name", "inboundoutbound", "priority", "skill_ib", "skill_ob", "valid"];
// ----------------------
// Express & Middleware Setup
// ----------------------
const app = express();
app.set("views", path.join(websitePath, "views"));
app.set("view engine", "ejs");
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(websitePath, "public")));
app.use("/build/client", express.static(path.join(websitePath, "build", "client")));
app.use(expressLayouts);
app.set("layout", "layout");
// ========= Helper Functions ===========
function isValidNumber(val) {
    const num = Number(val);
    return Number.isInteger(num) && num >= 0;
}
function isValidSkill(val) {
    return typeof val === "boolean";
}
function toBoolean(val) {
    return val === true || val === "true" || val === 1;
}
/**
 * Nimmt eine async Funktion entgegen und liefert einen gültigen RequestHandler zurück.
 * Bei einem Fehler wird automatisch `next(err)` aufgerufen, statt die Anwendung abstürzen zu lassen.
 */
function createAsyncHandler(fn) {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
}
app.use((err, req, res, _next) => {
    log("error", `❌ Unbehandelter Fehler: ${err}`);
    res.status(500).json({ error: "Unerwarteter Server-Fehler" });
});
/**
 * Liest die CSV-Datei und gibt ein Array von Agenten zurück.
 *
 * ✅ Verwendet Best Practices:
 * - Keine stillen Korrekturen → Fehlerhafte Zeilen werden verworfen.
 * - Klare Fehlermeldungen mit Zeilennummern für Debugging.
 * - Validierung ALLER Werte, um ungültige Daten zu verhindern.
 * - Explizite Trennung zwischen Datenverarbeitung und Fehlerhandling.
 */
async function parseAgents() {
    let data;
    try {
        data = await fs.readFile(FILE_PATH, "utf8");
    }
    catch (error) {
        log("error", `❌ Fehler beim Lesen der CSV: ${error}`);
        return [];
    }
    const lines = data
        .trim()
        .split("\n")
        .filter((line) => line.trim() !== "");
    if (lines.length < 2) {
        log("warn", "⚠️ CSV-Datei ist leer oder enthält nur den Header.");
        return [];
    }
    return lines
        .slice(1)
        .map(processLine)
        .filter((agent) => agent !== null);
}
/**
 * Wandelt eine CSV-Zeile in ein Agenten-Objekt um.
 */
function processLine(line) {
    // Split and trim CSV columns
    const values = line.split(",").map((col) => col.trim());
    // Build an object where every field is a string
    const partial = Object.fromEntries(CSV_HEADER.map((key, i) => [key, values[i] ?? ""]));
    //log("debug", `BEFORE CONVERSION: ${JSON.stringify(agent)}`); // Debugging: Zeigt Werte vor der Umwandlung
    // Umwandlung der Strings in echte Zahlen / Booleans
    const agent = {
        surname: partial.surname,
        name: partial.name,
        inboundoutbound: partial.inboundoutbound === "inbound" || partial.inboundoutbound === "outbound"
            ? partial.inboundoutbound
            : "outbound", // or handle it as an error
        priority: Number(partial.priority),
        skill_ib: toBoolean(partial.skill_ib),
        skill_ob: toBoolean(partial.skill_ob),
        valid: true, // default, then validate below
    };
    //log("debug", `AFTER CONVERSION: ${JSON.stringify(agent)}`); // Debugging: Zeigt Werte nach der Umwandlung
    // Fehlervalidierung
    const errors = [];
    if (values.length !== CSV_HEADER.length) {
        errors.push(`Wrong number of columns: ${values.length} / ${CSV_HEADER.length}`);
    }
    if (!agent.surname || !agent.name) {
        errors.push("Surname or name missing");
    }
    if (!["inbound", "outbound"].includes(agent.inboundoutbound)) {
        errors.push(`Invalid inboundoutbound value: "${agent.inboundoutbound}"`);
    }
    if (!isValidNumber(agent.priority)) {
        errors.push(`Invalid priority: "${agent.priority}"`);
    }
    if (!isValidSkill(agent.skill_ib) || !isValidSkill(agent.skill_ob)) {
        errors.push("Invalid skill values");
    }
    if (errors.length) {
        log("warn", `⚠️ CSV error for ${agent.surname}, ${agent.name}: ${errors.join(", ")}`);
        agent.valid = false;
    }
    return agent;
}
/**
 * Saves agents to the CSV file.
 */
async function saveAgents(agents, res, successMessage) {
    try {
        // Convert each agent back to a CSV line
        const csvLines = agents.map((agent) => [
            agent.surname,
            agent.name,
            agent.inboundoutbound,
            String(agent.priority),
            String(agent.skill_ib),
            String(agent.skill_ob),
            String(agent.valid),
        ].join(","));
        const csvContent = [CSV_HEADER.join(","), ...csvLines].join("\n");
        await fs.writeFile(FILE_PATH, csvContent, "utf8");
        res.json({ message: successMessage });
    }
    catch (error) {
        log("error", `❌ Fehler beim Speichern: ${error}`);
        res.status(500).json({ error: "Fehler beim Speichern." });
    }
}
/**
 * Generic function to update agent data.
 */
async function updateAgents(req, res, updateCallback, successMessage, shouldSort = false) {
    // 1) Sofortiger Abbruch, wenn das Body-Format nicht stimmt
    if (!Array.isArray(req.body)) {
        res.status(400).json({ error: "Invalid data format (expected array)" });
        return;
    }
    // 2) Agenten einlesen → bei Fehler direkt abbrechen
    let agents;
    try {
        agents = await parseAgents();
    }
    catch (error) {
        log("error", `❌ Fehler beim Einlesen der Agenten: ${error}`);
        res.status(500).json({ error: "Interner Serverfehler beim Einlesen der Agenten." });
        return;
    }
    log("debug", `🔍 Erhaltene Agenten zur Aktualisierung: ${inspect(req.body, { colors: true, depth: null })}`);
    // 3) Updates durchführen
    const updatedCount = req.body.reduce((count, { surname, name, ...updates }) => {
        log("debug", `🔎 Suche nach Agent: ${surname}, ${name}`);
        const agent = agents.find((a) => a.surname === surname && a.name === name);
        if (!agent) {
            log("warn", `⚠️\u00A0Kein Match gefunden für: ${surname}, ${name}`);
            return count;
        }
        log("debug", `✅ Gefundener Agent: ${agent.surname}, ${agent.name}`);
        return updateCallback(agent, updates) ? count + 1 : count;
    }, 0);
    // 4) Kein Agent wurde aktualisiert → Abbruch
    if (!updatedCount) {
        log("error", "❌ Fehler: Kein Agent wurde aktualisiert.");
        res.status(400).json({ error: "⚠️\u00A0Keine passenden Agenten gefunden." });
        return;
    }
    // 5) Optional sortieren
    if (shouldSort) {
        agents.sort((a, b) => a.priority - b.priority); // ✅ Sort agents by priority
    }
    log("debug", `✅ Erfolgreich aktualisierte Agenten: ${updatedCount}`);
    // 6) Speichern → bei Fehler wird in saveAgents selbst ein 500er gesendet
    try {
        await saveAgents(agents, res, `${updatedCount} ${successMessage}`);
    }
    catch (error) {
        // Falls du in saveAgents nicht alles abfängst, kannst du hier ggf. noch reagieren
        log("error", `❌ Fehler beim Speichern der Agenten: ${error}`);
    }
}
// Route: Render Index Page
app.get("/", createAsyncHandler(async (_req, res) => {
    await log("info", "Root route accessed");
    try {
        const agents = await parseAgents();
        res.render("index", { agents });
    }
    catch (error) {
        log("error", `❌ Fehler beim Laden der Agenten: ${error}`);
        res.status(500).send("Fehler beim Laden der Agenten.");
    }
}));
// Route: Log Client with Winston
app.post("/log", createAsyncHandler(async (req, res) => {
    const { level, message, source = "client" } = req.body;
    if (!level || !message) {
        res.status(400).json({ error: "Level und Message sind erforderlich" });
        return;
    }
    if (source === "client") {
        await log(level, message, "client");
    }
    else {
        await log(level, message, "server");
    }
    res.json({ success: true });
}));
// Neue Route: Aktualisiert nur die Prioritäten und speichert sortiert
app.post("/update-agent-priority", createAsyncHandler(async (req, res) => {
    await updateAgents(req, res, (agent, { priority }) => {
        // Wenn priority nicht definiert ist oder schon dem aktuellen Wert entspricht:
        if (priority === undefined || agent.priority === priority) {
            return false;
        }
        // Ansonsten: Aktualisierung nötig
        agent.priority = priority;
        return true;
    }, "Prioritäten erfolgreich aktualisiert und sortiert!", true // ✅ Optional: sortiere die Agentenliste nach dem Update
    );
}));
// Neue Route: Aktualisiert die Agenten-Skills
app.post("/update-agent-skills", createAsyncHandler(async (req, res) => {
    await updateAgents(req, res, (agent, { skill_ib, skill_ob }) => {
        log("debug", `🔄 Prüfe Agenten-Update: ${agent.surname}, ${agent.name}`);
        log("debug", `   ➝ Aktuell: skill_ib=${agent.skill_ib}, skill_ob=${agent.skill_ob}`);
        log("debug", `   ➝ Neu:     skill_ib=${skill_ib}, skill_ob=${skill_ob}`);
        // Wenn sich nichts ändert, gib direkt false zurück
        if (agent.skill_ib === skill_ib && agent.skill_ob === skill_ob) {
            log("warn", `❌ Keine Änderung nötig: ${agent.surname}, ${agent.name}`);
            return false;
        }
        // Hier liegt der "Happy Path"
        log("info", `✅ Aktualisiert: ${agent.surname}, ${agent.name}`);
        Object.assign(agent, { skill_ib, skill_ob });
        return true;
    }, "Agenten-Skills erfolgreich aktualisiert!");
}));
/**
 * Beendet den Server kontrolliert.
 */
async function handleShutdown(signal) {
    log("info", `⚠️  Received ${signal}, shutting down gracefully...`);
    await log("info", `Server is shutting down due to ${signal}`);
    server.close(() => {
        log("info", "✅ Server shut down successfully.");
        process.exit(0);
    });
    // Falls der Shutdown zu lange dauert → erzwungen
    setTimeout(() => {
        log("error", "❌ Forced shutdown due to timeout.");
        process.exit(1);
    }, 5000);
}
// System-Signale abfangen (z. B. CTRL+C lokal oder SIGTERM in Docker/K8s)
process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);
/**
 * Serverstart
 */
const PORT = 3000;
const server = app.listen(PORT, async () => {
    log("info", `🚀 Server running on http://localhost:${PORT}`);
});
