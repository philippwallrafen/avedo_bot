// ~/website/src/csv-service.ts
import path from 'path';
import fs from 'fs/promises';
import { inspect } from 'util';
import { log } from './server-logger.js';
const dataPath = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(dataPath, 'agents.csv');
const CSV_HEADER = ['surname', 'name', 'inboundoutbound', 'priority', 'skill_ib', 'skill_ob', 'valid'];
// Hilfs-Funktionen
function isValidNumber(val) {
  const num = Number(val);
  return Number.isInteger(num) && num >= 0;
}
function isValidSkill(val) {
  return typeof val === 'boolean';
}
function toBoolean(val) {
  return val === true || val === 'true' || val === 1;
}
/**
 * Liest die CSV-Datei und gibt die Zeilen (ohne Header) als string[] zurück.
 */
export async function loadRowsFromCsv() {
  let csvContent;
  try {
    csvContent = await fs.readFile(FILE_PATH, 'utf8');
  } catch (error) {
    log('error', `❌ Fehler beim Lesen der CSV: ${error}`);
    return [];
  }
  const csvRows = csvContent
    .trim()
    .split('\n')
    .filter((line) => line.trim() !== '');
  if (csvRows.length < 2) {
    log('warn', '⚠️ CSV-Datei ist leer oder enthält nur den Header.');
    return [];
  }
  const dataRows = csvRows.slice(1).filter((row) => {
    const columns = row.split(',').map((field) => field.trim());
    if (columns.length !== CSV_HEADER.length) {
      log('warn', `⚠️ Falsche Anzahl an Spalten: ${columns.length} / ${CSV_HEADER.length}`);
      return false;
    }
    return true;
  });
  return dataRows;
}
/**
 * Konvertiert eine CSV-Zeile in ein Agent-Objekt (oder null, wenn Parsing fehlschlägt).
 */
export function convertCsvRowToAgent(csvRow) {
  const columns = csvRow.split(',').map((field) => field.trim());
  const rowData = Object.fromEntries(CSV_HEADER.map((key, i) => [key, columns[i] ?? '']));
  //   log("debug", `VOR DATEN-UMWANDLUNG: ${JSON.stringify(agentData)}`); // Debugging: Zeigt Werte vor der Umwandlung
  const agentData = {
    surname: rowData['surname'] ?? '',
    name: rowData['name'] ?? '',
    inboundoutbound:
      rowData.inboundoutbound === 'inbound' || rowData.inboundoutbound === 'outbound'
        ? rowData['inboundoutbound']
        : 'inbound',
    priority: Number(rowData['priority']),
    skill_ib: toBoolean(rowData['skill_ib']),
    skill_ob: toBoolean(rowData['skill_ob']),
    valid: true, // default, dann Fehlervalidierung
  };
  //log("debug", `NACH DATEN-UMWANDLUNG: ${JSON.stringify(agentData)}`); // Debugging: Zeigt Werte nach der Umwandlung
  return agentData;
}
/**
 * Prüft, ob ein Agent valide ist und sammelt eventuelle Fehler.
 */
export function validateAgent(agent) {
  const validationErrors = [];
  if (!agent.surname || !agent.name) {
    validationErrors.push('Surname or name missing');
  }
  if (!['inbound', 'outbound'].includes(agent.inboundoutbound)) {
    validationErrors.push(`Invalid inboundoutbound value: "${agent.inboundoutbound}"`);
  }
  if (!isValidNumber(agent.priority)) {
    validationErrors.push(`Invalid priority: "${agent.priority}"`);
  }
  if (!isValidSkill(agent.skill_ib) || !isValidSkill(agent.skill_ob)) {
    validationErrors.push('Invalid skill values');
  }
  return validationErrors;
}
/**
 * Lädt alle Agenten aus der CSV-Datei und markiert ungültige Einträge mit `valid=false`.
 */
export async function loadAndValidateAgents() {
  const rawRows = await loadRowsFromCsv();
  const agents = rawRows.map(convertCsvRowToAgent).filter((agent) => agent !== null);
  agents.forEach((agent) => {
    const errors = validateAgent(agent);
    if (errors.length) {
      log('warn', `⚠️ CSV error for ${agent.surname}, ${agent.name}: ${errors.join(', ')}`);
      agent.valid = false;
    }
  });
  return agents;
}
/**
 * Speichert eine Liste von Agenten in die CSV-Datei.
 */
export async function saveAgents(agents) {
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
      ].join(',')
    );
    const csvContent = [CSV_HEADER.join(','), ...csvLines].join('\n');
    await fs.writeFile(FILE_PATH, csvContent, 'utf8');
  } catch (error) {
    log('error', `❌ Fehler beim Speichern der Agenten: ${error}`);
    throw new Error('Fehler beim Speichern der Agenten in die CSV-Datei.');
  }
}
/**
 * Universelle Funktion, um Agent-Daten zu aktualisieren und anschließend zu speichern.
 */
export async function updateAgents(
  bodyData, // Inhalt aus dem Request-Body
  updateCallback, // Was genau bei jedem Agenten aktualisiert wird
  successMessage, // Erfolgsmeldung
  shouldSort = false // Ob nach priority sortiert werden soll
) {
  // 1) Prüfe, ob bodyData ein Array ist
  if (!Array.isArray(bodyData)) {
    throw new Error('Invalid data format (expected array)');
  }
  // 2) Agenten laden und validieren
  let agents;
  try {
    agents = await loadAndValidateAgents();
  } catch (error) {
    log('error', `❌ Fehler beim Einlesen der Agenten: ${error}`);
    throw new Error('Interner Serverfehler beim Einlesen der Agenten.');
  }
  log('debug', `🔍 Erhaltene Agenten zur Aktualisierung: ${inspect(bodyData, { colors: true, depth: null })}`);
  // 3) Updates durchführen
  const updatedCount = bodyData.reduce((count, { surname, name, ...updates }) => {
    log('debug', `🔎 Suche nach Agent: ${surname}, ${name}`);
    const agent = agents.find((a) => a.surname === surname && a.name === name);
    if (!agent) {
      log('warn', `⚠️ Kein Match gefunden für: ${surname}, ${name}`);
      return count;
    }
    log('debug', `✅ Gefundener Agent: ${agent.surname}, ${agent.name}`);
    return updateCallback(agent, updates) ? count + 1 : count;
  }, 0);
  // 4) Falls kein Agent aktualisiert wurde
  if (!updatedCount) {
    log('error', '❌ Fehler: Kein Agent wurde aktualisiert.');
    throw new Error('Keine passenden Agenten gefunden.');
  }
  // 5) Optional sortieren (z. B. nach priority)
  if (shouldSort) {
    agents.sort((a, b) => a.priority - b.priority);
  }
  log('debug', `✅ Erfolgreich aktualisierte Agenten: ${updatedCount}`);
  // 6) Speichern
  try {
    await saveAgents(agents);
    return { updatedCount, message: `${updatedCount} ${successMessage}` };
  } catch (error) {
    log('error', `❌ Fehler beim Speichern der Agenten: ${error}`);
    throw new Error('Fehler beim Speichern.');
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3N2LXNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvY3N2LXNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsK0JBQStCO0FBRS9CLE9BQU8sSUFBSSxNQUFNLE1BQU0sQ0FBQztBQUN4QixPQUFPLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDN0IsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUMvQixPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFFekMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDbEQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUM7QUFFcEQsTUFBTSxVQUFVLEdBQUcsQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLGlCQUFpQixFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLE9BQU8sQ0FBVSxDQUFDO0FBWWhILG1CQUFtQjtBQUNuQixTQUFTLGFBQWEsQ0FBQyxHQUFZO0lBQ2pDLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN4QixPQUFPLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQztBQUMzQyxDQUFDO0FBQ0QsU0FBUyxZQUFZLENBQUMsR0FBWTtJQUNoQyxPQUFPLE9BQU8sR0FBRyxLQUFLLFNBQVMsQ0FBQztBQUNsQyxDQUFDO0FBQ0QsU0FBUyxTQUFTLENBQUMsR0FBWTtJQUM3QixPQUFPLEdBQUcsS0FBSyxJQUFJLElBQUksR0FBRyxLQUFLLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDO0FBQ3JELENBQUM7QUFFRDs7R0FFRztBQUNILE1BQU0sQ0FBQyxLQUFLLFVBQVUsZUFB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
