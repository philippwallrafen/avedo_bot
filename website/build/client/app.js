// app.ts
// import Sortable from "sortablejs";
import Sortable from "https://cdn.jsdelivr.net/npm/sortablejs@latest/+esm";
const debugLogSkills = new Map();
const debugLogPriorities = new Map();
/* Helper functions */
function capitalize(word) {
  return word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase();
}
function clearPriorityLogs(updates) {
  updates.forEach(({ surname, name }) => {
    const key = `${surname}-${name}`;
    debugLogPriorities.delete(key);
  });
}
/*******************************
 * Drag & Drop Event Listener
 *******************************/
document.addEventListener("DOMContentLoaded", () => {
  const agentLists = document.querySelectorAll(".agent-list");
  agentLists.forEach((list) => {
    // Assuming Sortable is available globally.
    Sortable.create(list, {
      direction: "vertical",
      animation: 300,
      handle: ".slider-icon",
      forceFallback: true,
      fallbackClass: "dragging",
      onStart: (evt) => {
        evt.item.classList.add("dragging");
      },
      onEnd: (evt) => {
        evt.item.classList.remove("dragging");
        updatePriorities(list);
      },
    });
  });
});
/***********************
 * Radio Event Listener
 ***********************/
document.addEventListener("DOMContentLoaded", () => {
  const radios = document.querySelectorAll('input[name^="skill_"]');
  radios.forEach((radio) => {
    radio.addEventListener("change", (event) => {
      const target = event.target;
      const parentLi = target.closest("li");
      if (!parentLi) return;
      const surname = parentLi.dataset.surname ?? "";
      const name = parentLi.dataset.name ?? "";
      const key = `${surname}-${name}`; // Unique key per agent
      if (!debugLogSkills.has(key)) {
        debugLogSkills.set(key, []);
      }
      debugLogSkills
        .get(key)
        .push([
          `%c🔄 Detected Skill Change%c\n\n  👤 Agent: %c${capitalize(surname)}, ${capitalize(
            name
          )}%c\n  📞 Neuer Skill: %c${capitalize(target.value)}`,
          "color: #2196f3; font-weight: bold;",
          "",
          "color: #9c27b0; font-weight: bold;",
          "",
          "color: #ff9800; font-weight: bold;",
        ]);
      updateSkills(target, surname, name);
    });
  });
});
/**
 * Aktualisiert die Priorität der Agenten und sendet die Änderungen an den Server.
 * @param {HTMLElement} list - Die Liste, die aktualisiert wurde.
 */
async function updatePriorities(list) {
  const liElements = list.querySelectorAll("li");
  if (liElements.length === 0) return;
  const allLists = {
    inbound: document.querySelectorAll("#inboundList li"),
    outbound: document.querySelectorAll("#outboundList li"),
  };
  // Bestimmen, ob die aktualisierte Liste inbound oder outbound ist
  const listType = list.id === "outboundList" ? "outbound" : "inbound";
  const offset = listType === "outbound" ? allLists.inbound.length : 0;
  const updatedPriorities = [];
  liElements.forEach((li, index) => {
    const newPriority = index + 1 + offset;
    li.dataset.priority = newPriority.toString();
    const surname = li.dataset.surname;
    const name = li.dataset.name;
    const key = `${surname}-${name}`; // 🔑 Unique key per agent
    // 📝 Ensure an array exists before pushing
    if (!debugLogPriorities.has(key)) {
      debugLogPriorities.set(key, []);
    }
    debugLogPriorities.get(key).push([
      `%c🔄 Detected Priority Change%c\n\n  👤 Agent: %c${capitalize(surname ?? "")}, ${capitalize(
        name ?? ""
      )}%c\n  📜 Neue Prio: %c${newPriority}`,
      "color: #2196f3; font-weight: bold;", // 🔵 Blue for detection
      "",
      "color: #9c27b0; font-weight: bold;", // 🟣 Purple for agent info
      "",
      "color: #ff9800; font-weight: bold;", // 🟠 Orange for priority update
    ]);
    updatedPriorities.push({
      surname: surname ?? "", // Falls undefined, wird "" gesetzt
      name: name ?? "",
      priority: newPriority,
    });
  });
  // Early return, wenn keine Aktualisierungen vorgenommen wurden:
  if (updatedPriorities.length === 0) return;
  try {
    const response = await fetch("/update-agent-priority", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedPriorities),
    });
    if (!response.ok) {
      const errorResponse = await response.json().catch(() => ({ error: "Unknown server error" }));
      // Übergib den Fehler und die Updates an die Fehlerbehandlung
      return handleUpdateError(
        updatedPriorities,
        new Error(`${errorResponse.error}: ${errorResponse.details || "No additional details"}`)
      );
    }
    logSuccess(updatedPriorities);
  } catch (error) {
    handleUpdateError(updatedPriorities, error);
  } finally {
    // Egal ob Erfolg oder Fehler, löschen wir die Debug-Logs
    clearPriorityLogs(updatedPriorities);
  }
}
/**
 * Protokolliert den Erfolg der Aktualisierung.
 */
function logSuccess(updated) {
  const maxNameLength = Math.max(...updated.map(({ surname, name }) => surname.length + name.length + 3));
  let logMessage = `✅ %cServer: Prioritäten erfolgreich aktualisiert\n\n`;
  const logStyles = ["color: #4caf50; font-weight: bold;"];
  updated.forEach(({ surname, name, priority }) => {
    const nameBlock = `${capitalize(surname)}, ${capitalize(name)}`.padEnd(maxNameLength);
    logMessage += `%c  👤 Agent: %c${nameBlock}%c 📜 Neue Prio: %c${priority}%c\n`;
    logStyles.push("", "color: #9c27b0; font-weight: bold;", "", "color: #ff9800; font-weight: bold;", "");
  });
  console.log(logMessage, ...logStyles);
}
/**
 * Einheitliche Fehlerbehandlung für das Update.
 */
function handleUpdateError(updated, error) {
  if (error instanceof Error) {
    console.error(
      `%c❌ Error updating agent priorities:%c\n  ${error.message}`,
      "color: #ff3333; font-weight: bold;",
      ""
    );
  } else {
    console.error("Unknown error", error);
  }
  updated.forEach(({ surname, name }) => {
    const key = `${surname}-${name}`;
    debugLogPriorities.get(key)?.forEach((log) => console.log(...log));
  });
  alert("Fehler beim Aktualisieren der Agenten-Prioritäten.");
}
/*******************************
 * Skill-Änderungen Handhaben
 *******************************/
/**
 * Aktualisiert die Skill-Daten eines Agenten im UI.
 * @param {HTMLElement} radio - Das angeklickte Radio-Element.
 * @param {string} surname - Nachname des Agenten.
 * @param {string} name - Vorname des Agenten.
 */
async function updateSkills(radio, surname, name) {
  const listItem = document.querySelector(`li[data-surname="${surname}"][data-name="${name}"]`);
  if (!listItem) return;
  const input = radio;
  const isInbound = input.value === "inbound";
  listItem.dataset.skill_ib = isInbound ? "true" : "false";
  listItem.dataset.skill_ob = isInbound ? "false" : "true";
  const updatedSkills = {
    surname: listItem.dataset.surname ?? "",
    name: listItem.dataset.name ?? "",
    skill_ib: listItem.dataset.skill_ib === "true",
    skill_ob: listItem.dataset.skill_ob === "true",
  };
  const key = `${surname}-${name}`; // Unique key per agent
  // 📝 Ensure an array exists before pushing
  if (!debugLogSkills.has(key)) {
    debugLogSkills.set(key, []);
  }
  // 📝 Store another debug message in the queue for data sending
  debugLogSkills
    .get(key)
    .push([
      `📤 %cSending Data to Server%c\n${JSON.stringify(updatedSkills, null, 2)}`,
      "color: #2196f3; font-weight: bold;",
      "",
    ]);
  // 3. Sende die gesammelten Daten an den Server
  try {
    const response = await fetch("/update-agent-skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([updatedSkills]),
    });
    if (!response.ok) throw new Error("Fehlerhafte Server-Antwort");
    const skillType = updatedSkills.skill_ib ? "Inbound" : "Outbound";
    console.log(
      `%c✅ Server: Skill erfolgreich aktualisiert%c\n\n  👤 Agent: %c${capitalize(surname)}, ${capitalize(
        name
      )}%c\n  📞 Neuer Skill: %c${skillType}`,
      "color: #4caf50; font-weight: bold;", // 🟢 Green for final success
      "",
      "color: #9c27b0; font-weight: bold;", // 🟣 Purple for agent info
      "",
      "color: #ff9800; font-weight: bold;" // 🟠 Orange for skill update
    );
    debugLogSkills.delete(key); // 🧹 Remove log after success
  } catch (error) {
    if (!(error instanceof Error)) {
      console.error("Unknown error", error);
      alert("Fehler beim Aktualisieren der Agentendaten.");
      return;
    }
    debugLogSkills.get(key)?.forEach((log) => console.log(...log));
    console.error(`%c❌ Error updating agent skills:%c\n${error.message}`, "color: #ff3333; font-weight: bold;", "");
    alert("Fehler beim Aktualisieren der Agentendaten.");
  } finally {
    debugLogSkills.delete(key); // 🧹 Remove log after success or failure
  }
}
