// type LogEntry = string[];
// const debugLogSkills: Map<string, LogEntry[]> = new Map();
// const debugLogPriorities: Map<string, LogEntry[]> = new Map();
export {};
// function ensureLogEntryArrayExists(logMap: Map<string, LogEntry[]>, key: string): void {
//   if (!logMap.has(key)) {
//     logMap.set(key, []);
//   }
// }
// function clearPriorityLogs(updates: AgentPriorityUpdate[]): void {
//   updates.forEach(({ surname, name }) => {
//     const agentKey = `${surname}-${name}`;
//     debugLogPriorities.delete(agentKey);
//   });
// }
/**
 * Aktualisiert die Priorität der Agenten und sendet die Änderungen an den Server.
 * @param {HTMLElement} list - Die Liste, die aktualisiert wurde.
 */
// async function OLDupdatePriorities(list: HTMLElement): Promise<void> {
//   const liElements = list.querySelectorAll<HTMLLIElement>("li");
//   if (liElements.length === 0) return;
//   const allLists = {
//     inbound: document.querySelectorAll<HTMLLIElement>("#inboundList li"),
//     outbound: document.querySelectorAll<HTMLLIElement>("#outboundList li"),
//   };
//   // Bestimmen, ob die aktualisierte Liste inbound oder outbound ist
//   const listType = list.id === "outboundList" ? "outbound" : "inbound";
//   const offset = listType === "outbound" ? allLists.inbound.length : 0;
//   const updatedPriorities: AgentPriorityUpdate[] = [];
//   liElements.forEach((li, index) => {
//     const newPriority = index + 1 + offset;
//     li.dataset.priority = newPriority.toString();
//     const surname = li.dataset.surname;
//     const name = li.dataset.name;
//     const agentKey = `${surname}-${name}`; // 🔑 Unique agentKey per agent
//     // 📝 Ensure an array exists before pushing
//     if (!debugLogPriorities.has(agentKey)) {
//       debugLogPriorities.set(agentKey, []);
//     }
// debugLogPriorities.get(agentKey)!.push([
//   `%c🔄 Detected Priority Change%c\n\n  👤 Agent: %c${capitalize(surname ?? "")}, ${capitalize(
//     name ?? ""
//   )}%c\n  📜 Neue Prio: %c${newPriority}`,
//   "color: #2196f3; font-weight: bold;", // 🔵 Blue for detection
//   "",
//   "color: #9c27b0; font-weight: bold;", // 🟣 Purple for agent info
//   "",
//   "color: #ff9800; font-weight: bold;", // 🟠 Orange for priority update
// ]);
//     updatedPriorities.push({
//       surname: surname ?? "", // Falls undefined, wird "" gesetzt
//       name: name ?? "",
//       priority: newPriority,
//     });
//   });
//   // Early return, wenn keine Aktualisierungen vorgenommen wurden:
//   if (updatedPriorities.length === 0) return;
//   try {
//     const response = await fetch("/update-agent-priority", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(updatedPriorities),
//     });
//     if (!response.ok) {
//       const errorResponse = await response.json().catch(() => ({ error: "Unknown server error" }));
//       // Übergib den Fehler und die Updates an die Fehlerbehandlung
//       return handleUpdateError(
//         updatedPriorities,
//         new Error(`${errorResponse.error}: ${errorResponse.details || "No additional details"}`)
//       );
//     }
//     logSuccess(updatedPriorities);
//   } catch (error: unknown) {
//     handleUpdateError(updatedPriorities, error);
//   } finally {
//     // Egal ob Erfolg oder Fehler, löschen wir die Debug-Logs
//     clearPriorityLogs(updatedPriorities);
//   }
// }
/**
 * Protokolliert den Erfolg der Aktualisierung.
 */
// function OLDlogSuccess(updated: AgentPriorityUpdate[]): void {
//   const maxNameLength = Math.max(...updated.map(({ surname, name }) => surname.length + name.length + 3));
//   let logMessage = `✅ %cServer: Prioritäten erfolgreich aktualisiert\n\n`;
//   const logStyles = ["color: #4caf50; font-weight: bold;"];
//   updated.forEach(({ surname, name, priority }) => {
//     const nameBlock = `${capitalize(surname)}, ${capitalize(name)}`.padEnd(maxNameLength);
//     logMessage += `%c  👤 Agent: %c${nameBlock}%c 📜 Neue Prio: %c${priority}%c\n`;
//     logStyles.push("", "color: #9c27b0; font-weight: bold;", "", "color: #ff9800; font-weight: bold;", "");
//   });
//   console.log(logMessage, ...logStyles);
// }
/**
 * Einheitliche Fehlerbehandlung für das Update.
 */
// function OLDhandleUpdateError(updated: AgentPriorityUpdate[], error: unknown): void {
//   if (error instanceof Error) {
//     console.error(
//       `%c❌ Error updating agent priorities:%c\n  ${error.message}`,
//       "color: #ff3333; font-weight: bold;",
//       ""
//     );
//   } else {
//     console.error("Unknown error", error);
//   }
//   updated.forEach(({ surname, name }) => {
//     const agentKey = `${surname}-${name}`;
//     debugLogPriorities.get(agentKey)?.forEach((log) => console.log(...log));
//   });
//   alert("Fehler beim Aktualisieren der Agenten-Prioritäten.");
// }
/*******************************
 * Skill-Änderungen Handhaben
 *******************************/
/**
 * Aktualisiert die Skill-Daten eines Agenten im UI.
 * @param {HTMLElement} radio - Das angeklickte Radio-Element.
 * @param {string} surname - Nachname des Agenten.
 * @param {string} name - Vorname des Agenten.
 */
// async function OLDupdateSkills(radio: HTMLInputElement, surname: string, name: string): Promise<void> {
//   const listItem = document.querySelector<HTMLLIElement>(`li[data-surname="${surname}"][data-name="${name}"]`);
//   if (!listItem) return;
//   const input = radio as HTMLInputElement;
//   const isInbound = input.value === "inbound";
//   listItem.dataset.skill_ib = isInbound ? "true" : "false";
//   listItem.dataset.skill_ob = isInbound ? "false" : "true";
//   const updatedSkills: AgentSkillsUpdate = {
//     surname: listItem.dataset.surname ?? "",
//     name: listItem.dataset.name ?? "",
//     skill_ib: listItem.dataset.skill_ib === "true",
//     skill_ob: listItem.dataset.skill_ob === "true",
//   };
//   const agentKey = `${surname}-${name}`; // Unique agentKey per agent
//   // 📝 Ensure an array exists before pushing
//   if (!debugLogSkills.has(agentKey)) {
//     debugLogSkills.set(agentKey, []);
//   }
//   // 📝 Store another debug message in the queue for data sending
//   debugLogSkills
//     .get(agentKey)!
//     .push([
//       `📤 %cSending Data to Server%c\n${JSON.stringify(updatedSkills, null, 2)}`,
//       "color: #2196f3; font-weight: bold;",
//       "",
//     ]);
//   // 3. Sende die gesammelten Daten an den Server
//   try {
//     const response = await fetch("/update-agent-skills", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify([updatedSkills]),
//     });
//     if (!response.ok) throw new Error("Fehlerhafte Server-Antwort");
//     const skillType = updatedSkills.skill_ib ? "Inbound" : "Outbound";
//     console.log(
//       `%c✅ Server: Skill erfolgreich aktualisiert%c\n\n  👤 Agent: %c${capitalize(surname)}, ${capitalize(
//         name
//       )}%c\n  📞 Neuer Skill: %c${skillType}`,
//       "color: #4caf50; font-weight: bold;", // 🟢 Green for final success
//       "",
//       "color: #9c27b0; font-weight: bold;", // 🟣 Purple for agent info
//       "",
//       "color: #ff9800; font-weight: bold;" // 🟠 Orange for skill update
//     );
//     debugLogSkills.delete(agentKey); // 🧹 Remove log after success
//   } catch (error: unknown) {
//     if (!(error instanceof Error)) {
//       console.error("Unknown error", error);
//       alert("Fehler beim Aktualisieren der Agentendaten.");
//       return;
//     }
//     debugLogSkills.get(agentKey)?.forEach((log) => console.log(...log));
//     console.error(`%c❌ Error updating agent skills:%c\n${error.message}`, "color: #ff3333; font-weight: bold;", "");
//     alert("Fehler beim Aktualisieren der Agentendaten.");
//   } finally {
//     debugLogSkills.delete(agentKey); // 🧹 Remove log after success or failure
//   }
// }
// function OLDcollectPriorityUpdates(list: HTMLElement): AgentPriorityUpdate[] {
//   const liElements = list.querySelectorAll<HTMLLIElement>("li");
//   const listType = list.id === "outboundList" ? "outbound" : "inbound";
//   const offset = listType === "outbound" ? document.querySelectorAll("#inboundList li").length : 0;
//   return Array.from(liElements).map((li, index) => {
//     const newPriority = index + 1 + offset;
//     li.dataset.priority = newPriority.toString();
//     return {
//       surname: li.dataset.surname ?? "",
//       name: li.dataset.name ?? "",
//       priority: newPriority,
//     };
//   });
// }
/**
 * Fügt einen Log-Eintrag in eine Map ein,
 * ohne überall das gleiche "if (!map.has(key)) ..." schreiben zu müssen
 */
// function debugLogPushEntry(logMap: Map<string, LogEntry[]>, key: string, entry: LogEntry) {
//     if (!logMap.has(key)) {
//       logMap.set(key, []);
//     }
//     logMap.get(key)!.push(entry);
//   }
// function clearLogs<T extends { agent: Agent }>(updated: UpdateData<T>): void {
//     updated.forEach(({ agent }) => {
//       debugLogPriorities.delete(agent.key);
//       debugLogSkills.delete(agent.key);
//     });
//   }
// function logFormat(heading: string, agent: Agent, change: string, detail: string): LogEntry {
//     console.log("logFormat called with:", { heading, agent, detail });
//     return [
//       `%c${heading}%c\n\n  👤 Agent: %c${capitalize(agent.surname)}, ${capitalize(
//         agent.name
//       )}%c\n  ${change} %c${capitalize(detail)}`,
//       ColorStyles.debugHeading,
//       ColorStyles.unstyled,
//       ColorStyles.agentName,
//       ColorStyles.unstyled,
//       ColorStyles.updatedData,
//     ];
//   }
