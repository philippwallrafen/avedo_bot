/*******************************
 * Initialize the List (Drag-and-Drop)
 *******************************/
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".agent-list").forEach((list) => {
    if (list.querySelector("img.slider-icon")) {
      Sortable.create(list, {
        animation: 150,
        handle: ".slider-icon",
        onEnd: () => updatePriorities(list),
      });
    }
  });
});

/**
 * Aktualisiert die Priorität der Agenten und sendet die Änderungen an den Server.
 * @param {HTMLElement} list - Die Liste, die aktualisiert wurde.
 */
async function updatePriorities(list) {
  const allLists = {
    inbound: document.querySelectorAll("#inboundList li"),
    outbound: document.querySelectorAll("#outboundList li"),
  };

  // Bestimmen, ob die aktualisierte Liste inbound oder outbound ist
  const listType = list.id === "outboundList" ? "outbound" : "inbound";
  const offset = listType === "outbound" ? allLists.inbound.length : 0;

  const updatedPriorities = [];

  list.querySelectorAll("li").forEach((li, index) => {
    const newPriority = index + 1 + offset;
    li.dataset.priority = newPriority;

    updatedPriorities.push({
      name: li.dataset.name,
      surname: li.dataset.surname,
      priority: newPriority,
    });
  });

  try {
    const response = await fetch("/update-agent-priority", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedPriorities),
    });

    if (!response.ok) throw new Error("Server-Antwort fehlgeschlagen");
    console.log("Agenten-Prioritäten erfolgreich aktualisiert!");
  } catch (error) {
    console.error("Fehler beim Speichern der Prioritäten:", error);
  }
}

/*******************************
 * Skill-Änderungen Handhaben
 *******************************/
/**
 * Aktualisiert die Skill-Daten eines Agenten im UI.
 * @param {HTMLElement} radio - Das angeklickte Radio-Element.
 * @param {string} name - Vorname des Agenten.
 * @param {string} surname - Nachname des Agenten.
 */
function updateSkill(radio, name, surname) {
  const listItem = document.querySelector(`li[data-name="${name}"][data-surname="${surname}"]`);
  if (!listItem) return;

  const isInbound = radio.value === "inbound";
  listItem.dataset.skill_ib = isInbound ? 1 : 0;
  listItem.dataset.skill_ob = isInbound ? 0 : 1;
}

/*******************************
 * Agenten-Daten speichern
 *******************************/
async function saveSkills() {
  const agentLists = {
    inbound: [...document.querySelectorAll("#inboundList li:not(.error-agent)")],
    outbound: [...document.querySelectorAll("#outboundList li:not(.error-agent)")],
  };

  if (!agentLists.inbound.length && !agentLists.outbound.length) {
    alert("❌ Keine gültigen Agenten gefunden!");
    return;
  }

  const updatedAgents = [];

  Object.entries(agentLists).forEach(([type, list]) => {
    list.forEach((li, index) => {
      updatedAgents.push({
        name: li.dataset.name,
        surname: li.dataset.surname,
        inboundoutbound: type,
        priority: type === "outbound" ? index + 1 + agentLists.inbound.length : index + 1,
        skill_ib: li.dataset.skill_ib === "1" ? 1 : 0,
        skill_ob: li.dataset.skill_ob === "1" ? 1 : 0,
      });
    });
  });

  console.log("📤 Sende folgende Daten:", updatedAgents);

  try {
    const response = await fetch("/update-agent-skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedAgents),
    });

    if (!response.ok) throw new Error("Fehlerhafte Server-Antwort");

    alert("Agentendaten erfolgreich aktualisiert!");
  } catch (error) {
    console.error("Fehler beim Aktualisieren der Agentendaten:", error);
    alert("Fehler beim Aktualisieren der Agentendaten.");
  }
}
