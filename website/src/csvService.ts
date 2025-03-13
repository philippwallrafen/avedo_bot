// ~/website/src/csvService.ts

import path from "path";
import fs from "fs/promises";
import { inspect } from "util";
import { log } from "./serverLogger.js";

const dataPath = path.join(process.cwd(), "data");
const FILE_PATH = path.join(dataPath, "agents.csv");

const CSV_HEADER = ["surname", "name", "inboundoutbound", "priority", "skill_ib", "skill_ob", "valid"] as const;

export interface Agent {
  surname: string;
  name: string;
  inboundoutbound: "inbound" | "outbound";
  priority: number;
  skill_ib: boolean;
  skill_ob: boolean;
  valid: boolean;
}

// Hilfs-Funktionen
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
 * Liest die CSV-Datei und gibt die Zeilen (ohne Header) als string[] zurück.
 */
export async function loadRowsFromCsv(): Promise<string[]> {
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
}

/**
 * Konvertiert eine CSV-Zeile in ein Agent-Objekt (oder null, wenn Parsing fehlschlägt).
 */
export function convertCsvRowToAgent(csvRow: string): Agent | null {
  const columns = csvRow.split(",").map((field) => field.trim());

  const rowData = Object.fromEntries(CSV_HEADER.map((key, i) => [key, columns[i] ?? ""])) as Record<string, string>;

  //   log("debug", `VOR DATEN-UMWANDLUNG: ${JSON.stringify(agentData)}`); // Debugging: Zeigt Werte vor der Umwandlung

  const agentData: Agent = {
    surname: rowData.surname ?? "",
    name: rowData.name ?? "",
    inboundoutbound:
      rowData.inboundoutbound === "inbound" || rowData.inboundoutbound === "outbound"
        ? (rowData.inboundoutbound as "inbound" | "outbound")
        : "inbound",
    priority: Number(rowData.priority),
    skill_ib: toBoolean(rowData.skill_ib),
    skill_ob: toBoolean(rowData.skill_ob),
    valid: true, // default, dann Fehlervalidierung
  };

  //log("debug", `NACH DATEN-UMWANDLUNG: ${JSON.stringify(agentData)}`); // Debugging: Zeigt Werte nach der Umwandlung

  return agentData;
}

/**
 * Prüft, ob ein Agent valide ist und sammelt eventuelle Fehler.
 */
export function validateAgent(agent: Agent): string[] {
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
 * Lädt alle Agenten aus der CSV-Datei und markiert ungültige Einträge mit `valid=false`.
 */
export async function loadAndValidateAgents(): Promise<Agent[]> {
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

/**
 * Speichert eine Liste von Agenten in die CSV-Datei.
 */
export async function saveAgents(agents: Agent[]): Promise<void> {
  try {
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
  } catch (error) {
    log("error", `❌ Fehler beim Speichern der Agenten: ${error}`);
    throw new Error("Fehler beim Speichern der Agenten in die CSV-Datei.");
  }
}

/**
 * Callback-Typ, um Updates an einem Agenten zu vollziehen.
 */
export type AgentUpdateCallback = (agent: Agent, updates: Partial<Agent>) => boolean;

/**
 * Universelle Funktion, um Agent-Daten zu aktualisieren und anschließend zu speichern.
 */
export async function updateAgents(
  bodyData: unknown, // Inhalt aus dem Request-Body
  updateCallback: AgentUpdateCallback, // Was genau bei jedem Agenten aktualisiert wird
  successMessage: string, // Erfolgsmeldung
  shouldSort = false // Ob nach priority sortiert werden soll
): Promise<{ updatedCount: number; message: string }> {
  // 1) Prüfe, ob bodyData ein Array ist
  if (!Array.isArray(bodyData)) {
    throw new Error("Invalid data format (expected array)");
  }

  // 2) Agenten laden und validieren
  let agents: Agent[];
  try {
    agents = await loadAndValidateAgents();
  } catch (error) {
    log("error", `❌ Fehler beim Einlesen der Agenten: ${error}`);
    throw new Error("Interner Serverfehler beim Einlesen der Agenten.");
  }

  log("debug", `🔍 Erhaltene Agenten zur Aktualisierung: ${inspect(bodyData, { colors: true, depth: null })}`);

  // 3) Updates durchführen
  const updatedCount = bodyData.reduce((count: number, { surname, name, ...updates }) => {
    log("debug", `🔎 Suche nach Agent: ${surname}, ${name}`);
    const agent = agents.find((a) => a.surname === surname && a.name === name);

    if (!agent) {
      log("warn", `⚠️ Kein Match gefunden für: ${surname}, ${name}`);
      return count;
    }

    log("debug", `✅ Gefundener Agent: ${agent.surname}, ${agent.name}`);
    return updateCallback(agent, updates as Partial<Agent>) ? count + 1 : count;
  }, 0);

  // 4) Falls kein Agent aktualisiert wurde
  if (!updatedCount) {
    log("error", "❌ Fehler: Kein Agent wurde aktualisiert.");
    throw new Error("Keine passenden Agenten gefunden.");
  }

  // 5) Optional sortieren (z. B. nach priority)
  if (shouldSort) {
    agents.sort((a, b) => a.priority - b.priority);
  }

  log("debug", `✅ Erfolgreich aktualisierte Agenten: ${updatedCount}`);

  // 6) Speichern
  try {
    await saveAgents(agents);
    return { updatedCount, message: `${updatedCount} ${successMessage}` };
  } catch (error) {
    log("error", `❌ Fehler beim Speichern der Agenten: ${error}`);
    throw new Error("Fehler beim Speichern.");
  }
}
