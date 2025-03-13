// ~/website/src/client/app.ts
// import Sortable from "sortablejs";
// @ts-expect-error Bundler wird später geadded
import Sortable from "https://cdn.jsdelivr.net/npm/sortablejs@latest/+esm";
import log from "./browserLogger.js"; // Import logging functions
/* Helper functions */
function capitalize(word) {
    return word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase();
}
function getAgentKey(agent) {
    return `${agent.surname}-${agent.name}`;
}
// Alle Farben & Formatierungen zentral verwalten
export const ColorStyles = {
    success: "color: #4caf50; font-weight: bold;", // 🟢
    debugHeading: "color: #2196f3; font-weight: bold;", // 🔵
    agentName: "color: #9c27b0; font-weight: bold;", // 🟣
    updatedData: "color: #ff9800; font-weight: bold;", // 🟠
    error: "color: #ff3333; font-weight: bold;", // 🔴
    unstyled: "color: inherit; font-weight: normal;", // ⚪
};
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
            log("debug", [
                `%c🔄 Detected radio change:%c\n\n  👤 Agent: %c${capitalize(agent.surname)}, ${capitalize(agent.name)}%c\n  📜 Neue Prio: %c${capitalize(selectedRadio.value)}`,
                ColorStyles.debugHeading, // 🔵
                "",
                ColorStyles.agentName, // 🟣
                "",
                ColorStyles.updatedData, // 🟠
            ]);
            updateSkills(selectedRadio, agent);
        });
    });
});
function createAgent(element) {
    const surname = element.dataset.surname || "Unknown";
    const name = element.dataset.name || "Unknown";
    return {
        surname,
        name,
        key: getAgentKey({ surname, name }),
    };
}
async function sendUpdates(url, updates) {
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
        log("info", [`✅ %cServer: Update erfolgreich:`, ColorStyles.success]);
    }
    catch (error) {
        log("error", [`❌ %cError updating data:%c  ${error}`, ColorStyles.error]);
    }
}
async function updatePriorities(list) {
    const updatedPriorities = collectPriorityUpdates(list);
    await sendUpdates("/update-agent-priority", updatedPriorities);
}
async function updateSkills(radio, agent) {
    const updatedSkills = collectSkillUpdates(radio, agent);
    if (!updatedSkills)
        return;
    // Just pass an array with one entry
    await sendUpdates("/update-agent-skills", [updatedSkills]);
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
        log("debug", [
            `%cDetected priority change:%c\n\n  👤 Agent: %c${capitalize(agent.surname ?? "")}, ${capitalize(agent.name ?? "")} %c 📜 Neue Prio: %c${newPriority}`,
            ColorStyles.debugHeading,
            "",
            ColorStyles.agentName,
            "",
            ColorStyles.updatedData,
        ]);
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
    log("debug", [`%c📤 Sending data to server:\n`, ColorStyles.debugHeading, JSON.stringify(updatedSkills, null, 2)]);
    return updatedSkills;
}
