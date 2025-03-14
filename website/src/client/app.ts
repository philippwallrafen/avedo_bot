// ~/website/src/client/app.ts

// @ts-expect-error Bundler wird später geadded
import Sortable from "https://cdn.jsdelivr.net/npm/sortablejs@latest/+esm";
// import Sortable from "sortablejs";

import { log } from "./browser-logger.js"; // Import logging functions

/*************
 * Interfaces
 *************/
interface Agent {
  surname: string;
  name: string;
  key: string;
}
// Interface for priority update
interface AgentPriorityUpdate {
  surname: string;
  name: string;
  priority: number;
}

// Interface for skills update
interface AgentSkillsUpdate {
  surname: string;
  name: string;
  skill_ib: boolean;
  skill_ob: boolean;
}

/*****************
 * Helfer Funktionen
 *****************/
function capitalize(word: string): string {
  return word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase();
}

function getAgentKey(agent: Pick<Agent, "surname" | "name">): string {
  return `${agent.surname}-${agent.name}`;
}

function createAgent(element: HTMLElement): Agent {
  const surname = element.dataset.surname || "Unknown";
  const name = element.dataset.name || "Unknown";
  return {
    surname,
    name,
    key: getAgentKey({ surname, name }),
  };
}

function hasPriorityChanged(li: HTMLLIElement, newPriority: number): boolean {
  const oldPriority = parseInt(li.dataset.priority ?? "0", 10);
  return oldPriority !== newPriority;
}

/***********************
 * Color & Style Config
 ***********************/
export const ColorStyles = {
  success: "color: #4caf50; font-weight: bold;", // 🟢
  debugHeading: "color: #2196f3; font-weight: bold;", // 🔵
  agentName: "color: #9c27b0; font-weight: bold;", // 🟣
  updatedData: "color: #ff9800; font-weight: bold;", // 🟠
  error: "color: #ff3333; font-weight: bold;", // 🔴
  unstyled: "color: inherit; font-weight: normal;", // ⚪
};

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

    log("info", [`✅ %cServer: Update erfolgreich`, ColorStyles.success]);
  } catch (error: unknown) {
    log("error", [`❌ %cError updating data:%c  ${error}`, ColorStyles.error]);
  }
}

function collectPriorityUpdates(list: HTMLElement): AgentPriorityUpdate[] | null {
  const liElements = list.querySelectorAll<HTMLLIElement>("li");
  const listType = list.id === "outboundList" ? "outbound" : "inbound";
  const offset = listType === "outbound" ? document.querySelectorAll("#inboundList li").length : 0;
  const updatedPriorities: AgentPriorityUpdate[] = [];

  liElements.forEach((li, index) => {
    const newPriority = index + 1 + offset;

    if (!hasPriorityChanged(li, newPriority)) {
      return;
    }

    li.dataset.priority = newPriority.toString();

    const agent = createAgent(li);
    if (!agent) return;

    log("debug", [
      `🔄 %cDetected priority change:%c\n\n  👤 Agent: %c${capitalize(agent.surname ?? "")}, ${capitalize(
        agent.name ?? ""
      )} %c 📜 Neue Prio: %c${newPriority}`,
      ColorStyles.debugHeading,
      "",
      ColorStyles.agentName,
      "",
      ColorStyles.updatedData,
    ]);

    updatedPriorities.push({ surname: agent.surname, name: agent.name, priority: newPriority });
  });

  return updatedPriorities.length > 0 ? updatedPriorities : null;
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
    surname: agent.surname,
    name: agent.name,
    skill_ib: listItem.dataset.skill_ib === "true",
    skill_ob: listItem.dataset.skill_ob === "true",
  };

  log("debug", [`%c📤 Sending data to server:\n`, ColorStyles.debugHeading, JSON.stringify(updatedSkills, null, 2)]);

  return updatedSkills;
}
/***********************
 * Event Handlers
 ***********************/
// Handler for drag & drop end event
async function handleDragEnd(list: HTMLElement): Promise<void> {
  const updatedPriorities = collectPriorityUpdates(list);
  if (!updatedPriorities) return;
  await sendUpdates<AgentPriorityUpdate>("/agents/update-priority", updatedPriorities);
}

// Handler for radio change event
async function handleRadioChange(event: Event): Promise<void> {
  const selectedRadio = event.target as HTMLInputElement;
  const parentLi = selectedRadio.closest("li") as HTMLElement | null;
  if (!parentLi) return;
  const agent = createAgent(parentLi);
  log("debug", [
    `%c🔄 Detected radio change:%c\n\n  👤 Agent: %c${capitalize(agent.surname)}, ${capitalize(
      agent.name
    )}%c\n  📜 Neue Prio: %c${capitalize(selectedRadio.value)}`,
    ColorStyles.debugHeading,
    "",
    ColorStyles.agentName,
    "",
    ColorStyles.updatedData,
  ]);

  const updatedSkills = collectSkillUpdates(selectedRadio, agent);
  if (!updatedSkills) return;

  await sendUpdates<AgentSkillsUpdate>("/agents/update-skills", [updatedSkills]);
}

function handleReloadButton(): void {
  console.log("Reload Button wurde geklickt!");
}

/**********************
 * Setup Funktionen
 **********************/
function setupDragAndDrop(): void {
  const agentLists = document.querySelectorAll<HTMLElement>(".agent-list");
  agentLists.forEach((list) => {
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
        handleDragEnd(list);
      },
    });
  });
}

function setupRadioListeners(): void {
  const radios = document.querySelectorAll<HTMLInputElement>('input[name^="skill_"]');
  radios.forEach((radio) => {
    radio.addEventListener("change", handleRadioChange);
  });
}

function setupReloadListener(): void {
  const reloadButton = document.getElementById("reloadButton");
  if (reloadButton) {
    reloadButton.addEventListener("click", handleReloadButton);
  }
}

/***********************
 * Application Startup
 ***********************/
function initializeApp(): void {
  setupDragAndDrop();
  setupRadioListeners();
  setupReloadListener();
}

document.addEventListener("DOMContentLoaded", initializeApp);
