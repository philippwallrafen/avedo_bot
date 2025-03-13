// app.ts

// import Sortable from "sortablejs";
// @ts-expect-error Bundler wird später geadded
import Sortable from "https://cdn.jsdelivr.net/npm/sortablejs@latest/+esm";

import log from "./browserLogger.js"; // Import logging functions

interface Agent {
  surname: string;
  name: string;
  key: string;
}
// Interface for priority update
interface AgentPriorityUpdate {
  agent: Agent;
  priority: number;
}

// Interface for skills update
interface AgentSkillsUpdate {
  agent: Agent;
  skill_ib: boolean;
  skill_ob: boolean;
}

/* Helper functions */
function capitalize(word: string): string {
  return word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase();
}

function getAgentKey(agent: Pick<Agent, "surname" | "name">): string {
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
  const agentLists = document.querySelectorAll<HTMLElement>(".agent-list");
  agentLists.forEach((list) => {
    // Assuming Sortable is available globally.
    Sortable.create(list, {
      direction: "vertical",
      animation: 300,
      handle: ".slider-icon",
      forceFallback: true,
      fallbackClass: "dragging",
      onStart: (evt: Sortable.SortableEvent) => {
        evt.item.classList.add("dragging");
      },
      onEnd: (evt: Sortable.SortableEvent) => {
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
  const radios = document.querySelectorAll<HTMLInputElement>('input[name^="skill_"]');
  radios.forEach((radio) => {
    radio.addEventListener("change", (event: Event) => {
      const selectedRadio = event.target as HTMLInputElement;
      const parentLi = selectedRadio.closest("li") as HTMLElement | null;
      if (!parentLi) return;

      const agent = createAgent(parentLi);
      if (!agent) return;

      log("debug", [
        `%c🔄 Detected radio change:%c\n\n  👤 Agent: %c${capitalize(agent.surname)}, ${capitalize(
          agent.name
        )}%c\n  📜 Neue Prio: %c${capitalize(selectedRadio.value)}`,
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

function createAgent(element: HTMLElement): Agent {
  const surname = element.dataset.surname || "Unknown";
  const name = element.dataset.name || "Unknown";
  return {
    surname,
    name,
    key: getAgentKey({ surname, name }),
  };
}

type UpdateData<T> = T[];

async function sendUpdates<T>(url: string, updates: UpdateData<T>): Promise<void> {
  if (updates.length === 0) return;

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
  } catch (error: unknown) {
    log("error", [`❌ %cError updating data:%c  ${error}`, ColorStyles.error]);
  }
}

async function updatePriorities(list: HTMLElement): Promise<void> {
  const updatedPriorities = collectPriorityUpdates(list);

  await sendUpdates<AgentPriorityUpdate>("/update-agent-priority", updatedPriorities);
}

async function updateSkills(radio: HTMLInputElement, agent: Agent): Promise<void> {
  const updatedSkills = collectSkillUpdates(radio, agent);
  if (!updatedSkills) return;

  // Just pass an array with one entry
  await sendUpdates<AgentSkillsUpdate>("/update-agent-skills", [updatedSkills]);
}

function collectPriorityUpdates(list: HTMLElement): AgentPriorityUpdate[] {
  const liElements = list.querySelectorAll<HTMLLIElement>("li");
  const listType = list.id === "outboundList" ? "outbound" : "inbound";
  const offset = listType === "outbound" ? document.querySelectorAll("#inboundList li").length : 0;

  const updatedPriorities: AgentPriorityUpdate[] = [];

  liElements.forEach((li, index) => {
    const newPriority = index + 1 + offset;
    li.dataset.priority = newPriority.toString();

    const agent = createAgent(li);
    if (!agent) return;

    log("debug", [
      `%cDetected priority change:%c\n\n  👤 Agent: %c${capitalize(agent.surname ?? "")}, ${capitalize(
        agent.name ?? ""
      )} %c 📜 Neue Prio: %c${newPriority}`,
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

function collectSkillUpdates(radio: HTMLInputElement, agent: Agent): AgentSkillsUpdate | null {
  const listItem = document.querySelector<HTMLLIElement>(
    `li[data-surname="${agent.surname}"][data-name="${agent.name}"]`
  );
  if (!listItem) return null;

  const isInbound = radio.value === "inbound";
  listItem.dataset.skill_ib = isInbound ? "true" : "false";
  listItem.dataset.skill_ob = isInbound ? "false" : "true";

  const updatedSkills: AgentSkillsUpdate = {
    agent,
    skill_ib: listItem.dataset.skill_ib === "true",
    skill_ob: listItem.dataset.skill_ob === "true",
  };

  log("debug", [`%c📤 Sending data to server:\n`, ColorStyles.debugHeading, JSON.stringify(updatedSkills, null, 2)]);

  return updatedSkills;
}
