// app.ts
// import Sortable from "sortablejs";
import Sortable from "https://cdn.jsdelivr.net/npm/sortablejs@latest/+esm";
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
};
/**
 * Fügt einen Log-Eintrag in eine Map ein,
 * ohne überall das gleiche "if (!map.has(key)) ..." schreiben zu müssen
 */
function pushDebugLog(logMap, key, entry) {
    if (!logMap.has(key)) {
        logMap.set(key, []);
    }
    logMap.get(key).push(entry);
}
// Kleine Helper-Funktion für gefärbte Texte
function colored(text, style) {
    // Liefert zwei Einträge: einmal '%c...' und einmal den style
    return [`%c${text}`, style];
}
/**
 * Loggt Änderungen (Priority, Skill, etc.) einheitlich und nutzt die passende Map.
 * @param logMap  Entweder debugLogSkills oder debugLogPriorities
 * @param heading Überschrift (z. B. "Detected Skill Change")
 * @param agent   Der betroffene Agent
 * @param detail  Zusätzliche Info (z. B. "Neuer Skill: inbound" oder "Neue Prio: 3")
 */
function logRouteChange(logMap, heading, agent, detail) {
    const entry = [
        ...colored(`🔄 ${heading}\n\n`, ColorStyles.debugHeading),
        "  👤 Agent: ",
        ...colored(`${capitalize(agent.surname)}, ${capitalize(agent.name)}`, ColorStyles.agentName),
        "\n  ", // Zeilenumbruch
        ...colored(detail, ColorStyles.updatedData),
    ];
    pushDebugLog(logMap, agent.key, entry);
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
            const surname = parentLi.dataset.surname ?? "";
            const name = parentLi.dataset.name ?? "";
            const agent = {
                surname,
                name,
                key: getAgentKey({ surname, name }),
            };
            logRouteChange(debugLogSkills, // Map für Skills
            "Detected Skill Change", // Überschrift
            agent, `📞 Neuer Skill: ${selectedRadio.value}` // Detail
            );
            updateSkills(selectedRadio, agent);
        });
    });
});
function logSkillChange(debugLogSkills, agent, newSkill) {
    if (!debugLogSkills.has(agent.key)) {
        debugLogSkills.set(agent.key, []);
    }
    debugLogSkills
        .get(agent.key)
        .push([
        `%c🔄 Detected Skill Change%c\n\n  👤 Agent: %c${capitalize(agent.surname)}, ${capitalize(agent.name)}%c\n  📞 Neuer Skill: %c${capitalize(newSkill)}`,
        "color: #2196f3; font-weight: bold;",
        "",
        "color: #9c27b0; font-weight: bold;",
        "",
        "color: #ff9800; font-weight: bold;",
    ]);
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
    if (error instanceof Error) {
        console.error(`%c❌ Error updating data:%c\n  ${error.message}`, "color: #ff3333; font-weight: bold;", "");
    }
    else {
        console.error("Unknown error:", error);
    }
    // 🛠 Print existing logs for each item (mit korrektem `...`)
    updated.forEach(({ agent }) => {
        const skillLogs = debugLogSkills.get(agent.key) ?? [];
        const priorityLogs = debugLogPriorities.get(agent.key) ?? [];
        skillLogs.forEach((log) => console.log(...log)); // ✅ Mit Spread-Operator
        priorityLogs.forEach((log) => console.log(...log)); // ✅ Mit Spread-Operator
    });
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
        const surname = li.dataset.surname ?? "";
        const name = li.dataset.name ?? "";
        const agent = {
            surname,
            name,
            key: getAgentKey({ surname, name }),
        };
        // EINZENTRALE Log-Funktion
        logRouteChange(debugLogPriorities, // Map für Priorities
        "Detected Priority Change", // heading
        agent, `📜 Neue Prio: ${newPriority}` // detail
        );
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
    // // debug logs
    // if (!debugLogSkills.has(agent.key)) {
    //   debugLogSkills.set(agent.key, []);
    // }
    // debugLogSkills
    //   .get(agent.key)!
    //   .push([
    //     `📤 %cSending Data to Server%c\n${JSON.stringify(updatedSkills, null, 2)}`,
    //     "color: #2196f3; font-weight: bold;",
    //     "",
    //   ]);
    // Optional: Logge zusätzlich (nur beim Absenden an den Server) separat, ohne doppelte Logs zu erzeugen
    pushDebugLog(debugLogSkills, agent.key, [
        `%c📤 Sending Data to Server\n`,
        ColorStyles.debugHeading,
        JSON.stringify(updatedSkills, null, 2),
    ]);
    // Zentrales Logging für die erkannte Änderung:
    logRouteChange(debugLogSkills, "Detected Skill Change", agent, `📞 Neuer Skill: ${capitalize(radio.value)}`);
    return updatedSkills;
}
