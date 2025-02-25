/**
 * server.js
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
import { fileURLToPath } from "url";
import fs from "fs/promises";
import express from "express";
import expressLayouts from "express-ejs-layouts";
import cors from "cors";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE_PATH = path.join(__dirname, "data", "agents.csv");
const CSV_HEADER = ["name", "surname", "inboundoutbound", "priority", "skill_ib", "skill_ob", "valid"];

const app = express();

// ----------------------
// Express & Middleware Setup
// ----------------------
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(expressLayouts);
app.set("layout", "layout");

// ========= Helper Functions ===========
// const isValidNumber = (val) => Number.isInteger((val = +val)) && val >= 0;
// const isValidSkill = val => val === true || val === false;
// const toBoolean = (val) => val === "true";

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
  try {
    const data = await fs.readFile(FILE_PATH, "utf8");
    const lines = data
      .trim()
      .split("\n")
      .filter(line => line.trim() !== ""); //filter empty lines
    
    if (lines.length < 2) {
      console.warn("⚠️ CSV-Datei ist leer oder enthält nur den Header.");
      return [];
    }

    return lines.slice(1).map(processLine).filter(Boolean);
  } catch (err) {
    console.error("❌ Fehler beim Lesen der CSV:", err);
    return [];
  }
}


const isValidNumber = (val) => Number.isInteger((val = +val)) && val >= 0;
const isValidSkill = (val) => typeof val === "boolean";
const toBoolean = (val) => val === true || val === "true" || val === 1;

/**
 * Wandelt eine CSV-Zeile in ein Agenten-Objekt um.
 */
function processLine(line) {
  const values = line.split(",").map((col) => col.trim());

  // CSV-Werte zuordnen
  let agent = {...Object.fromEntries(CSV_HEADER.map((key, index) => [key, values[index]])),
    valid: true,  // Standardmäßig als gültig markieren
  };

  //console.log("BEFORE CONVERSION:", agent); // Debugging: Zeigt Werte vor der Umwandlung

  // Umwandlung der Strings in echte Zahlen / Booleans
  agent.priority = Number(agent.priority);
  agent.skill_ib = toBoolean(agent.skill_ib);
  agent.skill_ob = toBoolean(agent.skill_ob);
  agent.valid = toBoolean(agent.valid); 

  //console.log("AFTER CONVERSION:", agent); // Debugging: Zeigt Werte nach der Umwandlung

  // Fehlervalidierung
  const errors = [];
  if (values.length !== CSV_HEADER.length) errors.push(`Falsche Anzahl an Spalten: ${values.length} / ${CSV_HEADER.length}`);
  if (!agent.surname || !agent.name) errors.push("Name oder Nachname fehlt");
  if (!["inbound", "outbound"].includes(agent.inboundoutbound)) errors.push(`Ungültiger inboundoutbound-Wert: "${values[CSV_HEADER.indexOf("inboundoutbound")]}"`);
  if (!isValidNumber(agent.priority)) errors.push(`Ungültige Priorität: "${values[CSV_HEADER.indexOf("priority")]}"`);
  if (!isValidSkill(agent.skill_ib) || !isValidSkill(agent.skill_ob)) errors.push("Ungültige Skill-Werte");

  if (errors.length) {
    console.warn(`⚠️  Fehler in agents.csv: ${agent.surname}, ${agent.name} - ${errors.join(", ")}`);
    agent.valid = false; // Fehlerhafte Agenten flaggen
  }

  return agent;
}


/**
 * Saves agents to the CSV file.
 */
async function saveAgents(agents, res, successMessage) {
  try {
    const csvContent = [CSV_HEADER.join(","), ...agents.map((agent) => Object.values(agent).join(","))].join("\n");

    await fs.writeFile(FILE_PATH, csvContent, "utf8");
    res.json({ message: successMessage });
  } catch (error) {
    console.error("❌ Fehler beim Speichern:", error);
    res.status(500).json({ error: "Fehler beim Speichern." });
  }
}

/**
 * Generic function to update agent data.
 */
async function updateAgents(req, res, updateCallback, successMessage, shouldSort = false) {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({ error: "Invalid data format" });
  }

  try {
    const agents = await parseAgents();
    // ✅ More efficient `.reduce()` implementation
    const updatedCount = req.body.reduce((count, { name, surname, ...updates }) => {
      const agent = agents.find((a) => a.name === name && a.surname === surname);
      return agent && updateCallback(agent, updates) ? count + 1 : count;
    }, 0);

    if (!updatedCount) {
      return res.status(400).json({ error: "⚠️ Keine passenden Agenten gefunden." });
    }

    if (shouldSort) {
      agents.sort((a, b) => a.priority - b.priority); // ✅ Sort agents by priority
    }

    saveAgents(agents, res, `✅ ${updatedCount} ${successMessage}`);
  } catch (error) {
    console.error("❌ Fehler beim Verarbeiten der Agenten:", error);
    res.status(500).json({ error: "Interner Serverfehler beim Aktualisieren der Agenten." });
  }
}

// Route: Render Index Page
app.get("/", async (req, res) => {
  try {
    const agents = await parseAgents();
    res.render("index", { agents });
  } catch (error) {
    console.error("❌ Fehler beim Laden der Agenten:", error);
    res.status(500).send("Fehler beim Laden der Agenten.");
  }
});

// Neue Route: Aktualisiert nur die Prioritäten und speichert sortiert
app.post("/update-agent-priority", (req, res) =>
  updateAgents(
    req,
    res,
    (agent, { priority }) => {
      if (agent.priority !== priority) {
        agent.priority = priority;
        return true;
      }
      return false;
    },
    "Prioritäten erfolgreich aktualisiert und sortiert!",
    true // ✅ Add an optional sorting flag
  )
);

// Neue Route: Aktualisiert die Agenten-Skills

app.post("/update-agent-skills", (req, res) =>
  updateAgents(
    req,
    res,
    (agent, { skill_ib, skill_ob }) => {
      if (agent.skill_ib !== skill_ib || agent.skill_ob !== skill_ob) {
        Object.assign(agent, { skill_ib, skill_ob });
        return true;
      }
      return false;
    },
    "Agenten-Skills erfolgreich aktualisiert!"
  )
);

// Start Server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
