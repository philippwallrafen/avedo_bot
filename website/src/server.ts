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
import express, { Request, Response, NextFunction, RequestHandler } from "express";
import expressLayouts from "express-ejs-layouts";
import cors from "cors";
import { inspect } from "util";

import log from "./serverLogger.js"; // Import logging functions

const websitePath = path.join(process.cwd(), "website");
const dataPath = path.join(process.cwd(), "data");

const FILE_PATH = path.join(dataPath, "agents.csv");
const CSV_HEADER = ["surname", "name", "inboundoutbound", "priority", "skill_ib", "skill_ob", "valid"] as const;

// Represent a single agent row
interface Agent {
  surname: string;
  name: string;
  inboundoutbound: "inbound" | "outbound";
  priority: number;
  skill_ib: boolean;
  skill_ob: boolean;
  valid: boolean;
}

interface LogPostBody {
  level: string;
  message: string;
  source?: "server" | "client";
}

interface UpdateAgentPriorityPostBody {
  surname: string;
  name: string;
  priority: number;
}

interface UpdateAgentSkillsPostBody {
  surname: string;
  name: string;
  skill_ib: boolean;
  skill_ob: boolean;
}

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
function isValidNumber(val: unknown): boolean {
  const num = Number(val);
  return Number.isInteger(num) && num >= 0;
}
function isValidSkill(val: unknown): boolean {
  return typeof val === "boolean";
}
function toBoolean(val: unknown): boolean {
  return val === true || val === "true" || val === 1;
}

/**
 * Nimmt eine async Funktion entgegen und liefert einen gültigen RequestHandler zurück.
 * Bei einem Fehler wird automatisch `next(err)` aufgerufen, statt die Anwendung abstürzen zu lassen.
 */
function createHandler<T extends object = object>(
  handler: RequestHandler<Record<string, string>, unknown, T>
): RequestHandler {
  return (req, res, next) =>
    Promise.resolve()
      .then(() => handler(req, res, next))
      .catch(next);
}

function globalErrorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  log("error", `❌ Fehler in ${req.method} ${req.url}: ${String(err)}`);
  res.status(500).json({ error: "Interner Serverfehler", details: String(err) });
}
app.use(globalErrorHandler);

async function loadAndValidateAgents(): Promise<Agent[]> {
  const rawRows = await loadRowsFromCsv();
  const agents = rawRows.map(convertCsvRowToAgent).filter((agent): agent is Agent => agent !== null);

  agents.forEach((agent) => {
    const errors = validateAgent(agent);
    if (errors.length) {
      log("warn", `⚠️ CSV error for ${agent.surname}, ${agent.name}: ${errors.join(", ")}`);
      agent.valid = false;
    }
  });

  return agents;
}

async function loadRowsFromCsv(): Promise<string[]> {
  let csvContent: string;
  try {
    csvContent = await fs.readFile(FILE_PATH, "utf8");
  } catch (error) {
    log("error", `❌ Fehler beim Lesen der CSV: ${error}`);
    return [];
  }

  const csvRows = csvContent
    .trim()
    .split("\n")
    .filter((line) => line.trim() !== "");

  if (csvRows.length < 2) {
    log("warn", "⚠️ CSV-Datei ist leer oder enthält nur den Header.");
    return [];
  }

  const dataRows = csvRows.slice(1).filter((row) => {
    const columns = row.split(",").map((field) => field.trim());
    if (columns.length !== CSV_HEADER.length) {
      log("warn", `⚠️ Falsche Anzahl an Spalten: ${columns.length} / ${CSV_HEADER.length}`);
      return false;
    }
    return true;
  });

  return dataRows;
  // .map(convertCsvRowToAgent)
  // .filter((agent): agent is Agent => agent !== null);
}

function convertCsvRowToAgent(csvRow: string): Agent | null {
  // Split and trim CSV columns
  const columns = csvRow.split(",").map((field) => field.trim());

  // Build an object where every field is a string
  const rowData = Object.fromEntries(CSV_HEADER.map((key, i) => [key, columns[i] ?? ""])) as Record<string, string>;

  //log("debug", `BEFORE CONVERSION: ${JSON.stringify(agentData)}`); // Debugging: Zeigt Werte vor der Umwandlung

  // Umwandlung der Strings in echte Zahlen / Booleans
  const agentData: Agent = {
    surname: rowData.surname,
    name: rowData.name,
    inboundoutbound:
      rowData.inboundoutbound === "inbound" || rowData.inboundoutbound === "outbound"
        ? (rowData.inboundoutbound as "inbound" | "outbound")
        : "inbound", // or handle it as an error
    priority: Number(rowData.priority),
    skill_ib: toBoolean(rowData.skill_ib),
    skill_ob: toBoolean(rowData.skill_ob),
    valid: true, // default, then validate below
  };

  //log("debug", `AFTER CONVERSION: ${JSON.stringify(agentData)}`); // Debugging: Zeigt Werte nach der Umwandlung

  return agentData;
}

function validateAgent(agent: Agent): string[] {
  const validationErrors: string[] = [];
  if (!agent.surname || !agent.name) {
    validationErrors.push("Surname or name missing");
  }
  if (!["inbound", "outbound"].includes(agent.inboundoutbound)) {
    validationErrors.push(`Invalid inboundoutbound value: "${agent.inboundoutbound}"`);
  }
  if (!isValidNumber(agent.priority)) {
    validationErrors.push(`Invalid priority: "${agent.priority}"`);
  }
  if (!isValidSkill(agent.skill_ib) || !isValidSkill(agent.skill_ob)) {
    validationErrors.push("Invalid skill values");
  }

  return validationErrors;
}

/**
 * Saves agents to the CSV file.
 */
async function saveAgents(agents: Agent[], res: Response, successMessage: string): Promise<void> {
  try {
    // Convert each agent back to a CSV line
    const csvLines = agents.map((agent) =>
      [
        agent.surname,
        agent.name,
        agent.inboundoutbound,
        String(agent.priority),
        String(agent.skill_ib),
        String(agent.skill_ob),
        String(agent.valid),
      ].join(",")
    );

    const csvContent = [CSV_HEADER.join(","), ...csvLines].join("\n");
    await fs.writeFile(FILE_PATH, csvContent, "utf8");
    res.json({ message: successMessage });
  } catch (error) {
    log("error", `❌ Fehler beim Speichern: ${error}`);
    res.status(500).json({ error: "Fehler beim Speichern." });
  }
}

/**
 * Callback type for agent updates
 */
type AgentUpdateCallback = (agent: Agent, updates: Partial<Agent>) => boolean;

/**
 * Generic function to update agent data.
 */
async function updateAgents(
  req: Request,
  res: Response,
  updateCallback: AgentUpdateCallback,
  successMessage: string,
  shouldSort = false
): Promise<void> {
  // 1) Sofortiger Abbruch, wenn das Body-Format nicht stimmt
  if (!Array.isArray(req.body)) {
    res.status(400).json({ error: "Invalid data format (expected array)" });
    return;
  }

  // 2) Agenten einlesen → bei Fehler direkt abbrechen
  let agents: Agent[];
  try {
    agents = await loadAndValidateAgents();
  } catch (error) {
    log("error", `❌ Fehler beim Einlesen der Agenten: ${error}`);
    res.status(500).json({ error: "Interner Serverfehler beim Einlesen der Agenten." });
    return;
  }

  log("debug", `🔍 Erhaltene Agenten zur Aktualisierung: ${inspect(req.body, { colors: true, depth: null })}`);

  // 3) Updates durchführen
  const updatedCount = req.body.reduce((count: number, { surname, name, ...updates }) => {
    log("debug", `🔎 Suche nach Agent: ${surname}, ${name}`);
    const agent = agents.find((a) => a.surname === surname && a.name === name);

    if (!agent) {
      log("warn", `⚠️ Kein Match gefunden für: ${surname}, ${name}`);
      return count;
    }

    log("debug", `✅ Gefundener Agent: ${agent.surname}, ${agent.name}`);
    return updateCallback(agent, updates as Partial<Agent>) ? count + 1 : count;
  }, 0);

  // 4) Kein Agent wurde aktualisiert → Abbruch
  if (!updatedCount) {
    log("error", "❌ Fehler: Kein Agent wurde aktualisiert.");
    res.status(400).json({ error: "⚠️ Keine passenden Agenten gefunden." });
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
  } catch (error) {
    // Falls du in saveAgents nicht alles abfängst, kannst du hier ggf. noch reagieren
    log("error", `❌ Fehler beim Speichern der Agenten: ${error}`);
  }
}

// Route: Render Index Page
app.get(
  "/",
  createHandler(async (_req, res) => {
    await log("info", "Root route accessed");
    try {
      const agents = await loadAndValidateAgents();
      res.render("index", { agents });
    } catch (error) {
      log("error", `❌ Fehler beim Laden der Agenten: ${error}`);
      res.status(500).send("Fehler beim Laden der Agenten.");
    }
  })
);

// Route: Log Client with Winston
app.post(
  "/log",
  createHandler<LogPostBody>(async (req, res) => {
    const { level, message, source = "client" } = req.body;
    if (!level || !message) {
      res.status(400).json({ error: "Level und Message sind erforderlich" });
      return;
    }

    await log(level, message, "client");

    res.json({ success: true });
  })
);

// Neue Route: Aktualisiert nur die Prioritäten und speichert sortiert
app.post(
  "/update-agent-priority",
  createHandler<UpdateAgentPriorityPostBody[]>(async (req, res) => {
    await updateAgents(
      req,
      res,
      (agent: Agent, { priority }: { priority?: number }) => {
        // Wenn priority nicht definiert ist oder schon dem aktuellen Wert entspricht:
        if (priority === undefined || agent.priority === priority) {
          return false;
        }
        // Ansonsten: Aktualisierung nötig
        agent.priority = priority;
        return true;
      },
      "Prioritäten erfolgreich aktualisiert und sortiert!",
      true // ✅ Optional: sortiere die Agentenliste nach dem Update
    );
  })
);

// Neue Route: Aktualisiert die Agenten-Skills
app.post(
  "/update-agent-skills",
  createHandler<UpdateAgentSkillsPostBody>(async (req, res) => {
    await updateAgents(
      req,
      res,
      (agent: Agent, { skill_ib, skill_ob }: { skill_ib?: boolean; skill_ob?: boolean }) => {
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
      },
      "Agenten-Skills erfolgreich aktualisiert!"
    );
  })
);

/**
 * Beendet den Server kontrolliert.
 */
async function handleShutdown(signal: string): Promise<void> {
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
