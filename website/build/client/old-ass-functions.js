// // ~/website/src/client/old-ass-functions.ts
export {};
// type LogEntry = string[];
// const debugLogSkills: Map<string, LogEntry[]> = new Map();
// const debugLogPriorities: Map<string, LogEntry[]> = new Map();
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
// /**
//  * Aktualisiert die Priorität der Agenten und sendet die Änderungen an den Server.
//  * @param {HTMLElement} list - Die Liste, die aktualisiert wurde.
//  */
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
// /**
//  * Protokolliert den Erfolg der Aktualisierung.
//  */
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
// /**
//  * Einheitliche Fehlerbehandlung für das Update.
//  */
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
// /*******************************
//  * Skill-Änderungen Handhaben
//  *******************************/
// /**
//  * Aktualisiert die Skill-Daten eines Agenten im UI.
//  * @param {HTMLElement} radio - Das angeklickte Radio-Element.
//  * @param {string} surname - Nachname des Agenten.
//  * @param {string} name - Vorname des Agenten.
//  */
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
// /**
//  * Fügt einen Log-Eintrag in eine Map ein,
//  * ohne überall das gleiche "if (!map.has(key)) ..." schreiben zu müssen
//  */
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
// log("debug", [
//   `🔄 %cDetected priority change:%c\n\n  👤 Agent: %c${capitalize(agent.surname ?? "")}, ${capitalize(
//     agent.name ?? ""
//   )} %c 📜 Neue Prio: %c${newPriority}`,
//   ColorStyles.debugHeading,
//   "",
//   ColorStyles.agentName,
//   "",
//   ColorStyles.updatedData,
// ]);
// log("debug", [`%c📤 Sending data to server:\n`, ColorStyles.debugHeading, JSON.stringify(updatedSkills, null, 2)]);
// log("debug", [
//   `%c🔄 Detected radio change:%c\n\n  👤 Agent: %c${capitalize(agent.surname)}, ${capitalize(
//     agent.name
//   )}%c\n  📜 Neue Prio: %c${capitalize(selectedRadio.value)}`,
//   ColorStyles.debugHeading,
//   "",
//   ColorStyles.agentName,
//   "",
//   ColorStyles.updatedData,
// ]);
// function capitalize(word: string): string {
//   return word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase();
// }
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2xkLWFzcy1mdW5jdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY2xpZW50L29sZC1hc3MtZnVuY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLCtDQUErQzs7QUFFL0MsNEJBQTRCO0FBQzVCLDZEQUE2RDtBQUM3RCxpRUFBaUU7QUFFakUsMkZBQTJGO0FBQzNGLDRCQUE0QjtBQUM1QiwyQkFBMkI7QUFDM0IsTUFBTTtBQUNOLElBQUk7QUFFSixxRUFBcUU7QUFDckUsNkNBQTZDO0FBQzdDLDZDQUE2QztBQUM3QywyQ0FBMkM7QUFDM0MsUUFBUTtBQUNSLElBQUk7QUFFSixNQUFNO0FBQ04scUZBQXFGO0FBQ3JGLG9FQUFvRTtBQUNwRSxNQUFNO0FBQ04seUVBQXlFO0FBQ3pFLG1FQUFtRTtBQUNuRSx5Q0FBeUM7QUFFekMsdUJBQXVCO0FBQ3ZCLDRFQUE0RTtBQUM1RSw4RUFBOEU7QUFDOUUsT0FBTztBQUVQLHVFQUF1RTtBQUN2RSwwRUFBMEU7QUFDMUUsMEVBQTBFO0FBRTFFLHlEQUF5RDtBQUV6RCx3Q0FBd0M7QUFDeEMsOENBQThDO0FBQzlDLG9EQUFvRDtBQUVwRCwwQ0FBMEM7QUFDMUMsb0NBQW9DO0FBQ3BDLDZFQUE2RTtBQUU3RSxrREFBa0Q7QUFDbEQsK0NBQStDO0FBQy9DLDhDQUE4QztBQUM5QyxRQUFRO0FBRVIsMkNBQTJDO0FBQzNDLGtHQUFrRztBQUNsRyxpQkFBaUI7QUFDakIsNkNBQTZDO0FBQzdDLG1FQUFtRTtBQUNuRSxRQUFRO0FBQ1Isc0VBQXNFO0FBQ3RFLFFBQVE7QUFDUiwyRUFBMkU7QUFDM0UsTUFBTTtBQUVOLCtCQUErQjtBQUMvQixvRUFBb0U7QUFDcEUsMEJBQTBCO0FBQzFCLCtCQUErQjtBQUMvQixVQUFVO0FBQ1YsUUFBUTtBQUVSLHFFQUFxRTtBQUNyRSxnREFBZ0Q7QUFFaEQsVUFBVTtBQUNWLCtEQUErRDtBQUMvRCx3QkFBd0I7QUFDeEIseURBQXlEO0FB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
