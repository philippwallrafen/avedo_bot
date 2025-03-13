// app.ts
// import Sortable from "sortablejs";
import Sortable from "https://cdn.jsdelivr.net/npm/sortablejs@latest/+esm";
import log from "./browserLogger.js"; // Import logging functions
const debugLogSkills = new Map();
const debugLogPriorities = new Map();
/* Helper functions */
function capitalize(word) {
    return word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase();
}
function getAgentKey(agent) {
    return `${agent.surname}-${agent.name}`;
}
// Alle Farben & Formatierungen zentral verwalten
export const ColorStyles = {
    success: "color: #4caf50; font-weight: bold;",
    debugHeading: "color: #2196f3; font-weight: bold;",
    agentName: "color: #9c27b0; font-weight: bold;",
    updatedData: "color: #ff9800; font-weight: bold;",
    error: "color: #ff3333; font-weight: bold;",
    unstyled: "color: inherit; font-weight: normal;",
};
/**
 * Fügt einen Log-Eintrag in eine Map ein,
 * ohne überall das gleiche "if (!map.has(key)) ..." schreiben zu müssen
 */
function debugLogPushEntry(logMap, key, entry) {
    if (!logMap.has(key)) {
        logMap.set(key, []);
    }
    logMap.get(key).push(entry);
}
/**
 * Loggt Änderungen (Priority, Skill, etc.) einheitlich und nutzt die passende Map.
 * @param logMap  Entweder debugLogSkills oder debugLogPriorities
 * @param heading Überschrift (z. B. "Detected Skill Change")
 * @param agent   Der betroffene Agent
 * @param detail  Zusätzliche Info (z. B. "Neuer Skill: inbound" oder "Neue Prio: 3")
 */
function logFormat(heading, agent, detail) {
    return [
        `%c${heading}%c\n\n  👤 Agent: %c${capitalize(agent.surname)}, ${capitalize(agent.name)}%c\n  📞 Neuer Skill: %c${capitalize(detail)}`,
        ColorStyles.debugHeading,
        ColorStyles.unstyled,
        ColorStyles.agentName,
        ColorStyles.unstyled,
        ColorStyles.updatedData,
    ];
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
            const selectedRadio = event.target;
            const parentLi = selectedRadio.closest("li");
            if (!parentLi)
                return;
            const agent = createAgent(parentLi);
            if (!agent)
                return;
            ensureLogEntryArrayExists(debugLogSkills, agent.key);
            // debugLogPushEntry(
            //   debugLogSkills,
            //   agent.key,
            //   logFormat("🔄 Detected skill change:", agent, `${selectedRadio.value}`)
            // );
            // debugLogSkills.get(agent.key)!.push([
            //   `%c🔄 Detected skill change:%c\n\n  👤 Agent: %c${capitalize(agent.surname ?? "")}, ${capitalize(
            //     agent.name ?? ""
            //   )}%c\n  📜 Neue Prio: %c${capitalize(selectedRadio.value)}`,
            //   ColorStyles.debugHeading, // 🔵 Blue for detection
            //   "",
            //   ColorStyles.agentName, // 🟣 Purple for agent info
            //   "",
            //   ColorStyles.updatedData, // 🟠 Orange for priority update
            // ]);
            log("debug", [
                `%c🔄 Detected skill change:%c\n\n  👤 Agent: %c${capitalize(agent.surname ?? "")}, ${capitalize(agent.name ?? "")}%c\n  📜 Neue Prio: %c${capitalize(selectedRadio.value)}`,
                ColorStyles.debugHeading, // 🔵 Blue for detection
                "",
                ColorStyles.agentName, // 🟣 Purple for agent info
                "",
                ColorStyles.updatedData, // 🟠 Orange for priority update
            ]);
            debugLogSkills.get(agent.key)?.forEach((log) => console.debug(...log));
            // debugLogSkills.get(agent.key)?.forEach((logEntry) => log("debug", ...logEntry));
            // debugLogSkills.get(agent.key)?.forEach((log) => log("debug", ...log));
            // updateSkills(selectedRadio, agent);
        });
    });
});
function ensureLogEntryArrayExists(logMap, key) {
    if (!logMap.has(key)) {
        logMap.set(key, []);
    }
}
function createAgent(element) {
    if (!element) {
        console.error("Fehler: Element ist null oder nicht vorhanden!");
        return null;
    }
    const surname = element.dataset.surname;
    const name = element.dataset.name;
    if (!surname || !name) {
        console.error("Fehler: Agent-Daten fehlen!", { surname, name, element });
        return null;
    }
    return {
        surname,
        name,
        key: getAgentKey({ surname, name }),
    };
}
async function sendUpdates(url, updates, onError, onSuccess, clearLogs) {
    if (updates.length === 0)
        return;
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
        });
        if (!response.ok) {
            const errorResponse = await response.json().catch(() => ({ error: "Unknown server error" }));
            throw new Error(`${errorResponse.error}: ${errorResponse.details || "No additional details"}`);
        }
        onSuccess(updates);
    }
    catch (error) {
        onError(error, updates);
    }
    finally {
        clearLogs(updates);
    }
}
async function updatePriorities(list) {
    const updatedPriorities = collectPriorityUpdates(list);
    await sendUpdates("/update-agent-priority", updatedPriorities, logErrorDebug, logSuccess, clearLogs);
}
async function updateSkills(radio, agent) {
    const updatedSkills = collectSkillUpdates(radio, agent);
    if (!updatedSkills)
        return;
    // Just pass an array with one entry
    await sendUpdates("/update-agent-skills", [updatedSkills], logErrorDebug, logSuccess, clearLogs);
}
function logErrorDebug(error, updated) {
    // Print existing logs for each item:
    updated.forEach(({ agent }) => {
        debugLogPriorities.get(agent.key)?.forEach((log) => console.debug(...log));
        debugLogSkills.get(agent.key)?.forEach((log) => console.debug(...log));
        // debugLogSkills.get(agent.key)?.forEach((logEntry) => log("debug", ...logEntry));
        // debugLogSkills.get(agent.key)?.forEach((log) => log("debug", ...log));
    });
    if (error instanceof Error) {
        console.error(`%c❌ Error updating data:%c\n  ${error.message}`, "color: #ff3333; font-weight: bold;", "");
    }
    else {
        console.error("Unknown error:", error);
    }
    alert("Fehler beim Aktualisieren der Agenten-Daten.");
}
function logSuccess(updated) {
    // Determine the longest full name for padding purposes
    const maxNameLength = Math.max(...updated.map(({ agent }) => agent.surname.length + agent.name.length + 2));
    let logMessage = `✅ %cServer: Update erfolgreich\n\n`;
    const logStyles = ["color: #4caf50; font-weight: bold;"];
    updated.forEach(({ agent }) => {
        const fullName = `${capitalize(agent.surname)}, ${capitalize(agent.name)}`.padEnd(maxNameLength);
        logMessage += `  👤 %cAgent: %c${fullName}%c\n`;
        logStyles.push("", "color: #9c27b0; font-weight: bold;", "");
    });
    console.log(logMessage, ...logStyles);
}
function clearLogs(updated) {
    updated.forEach(({ agent }) => {
        debugLogPriorities.delete(agent.key);
        debugLogSkills.delete(agent.key);
    });
}
function collectPriorityUpdates(list) {
    const liElements = list.querySelectorAll("li");
    const listType = list.id === "outboundList" ? "outbound" : "inbound";
    const offset = listType === "outbound" ? document.querySelectorAll("#inboundList li").length : 0;
    const updatedPriorities = [];
    liElements.forEach((li, index) => {
        const newPriority = index + 1 + offset;
        li.dataset.priority = newPriority.toString();
        const agent = createAgent(li);
        if (!agent)
            return;
        // EINZENTRALE Log-Funktion
        debugLogPushEntry(debugLogPriorities, agent.key, logFormat("Detected priority change", agent, `📜 Neue Prio: ${newPriority}`));
        updatedPriorities.push({ agent, priority: newPriority });
    });
    return updatedPriorities;
}
function collectSkillUpdates(radio, agent) {
    const listItem = document.querySelector(`li[data-surname="${agent.surname}"][data-name="${agent.name}"]`);
    if (!listItem)
        return null;
    const isInbound = radio.value === "inbound";
    listItem.dataset.skill_ib = isInbound ? "true" : "false";
    listItem.dataset.skill_ob = isInbound ? "false" : "true";
    const updatedSkills = {
        agent,
        skill_ib: listItem.dataset.skill_ib === "true",
        skill_ob: listItem.dataset.skill_ob === "true",
    };
    debugLogPushEntry(debugLogSkills, agent.key, [
        `%c📤 Sending data to server:\n`,
        ColorStyles.debugHeading,
        JSON.stringify(updatedSkills, null, 2),
    ]);
    return updatedSkills;
}
