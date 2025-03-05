/* Helper functions */
function capitalize(word) {
  return word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase();
}

const debugLogSkills = new Map(); // 📝 Stores logs for skill updates
const debugLogPriorities = new Map(); // 📝 Stores logs for priority updates

/*******************************
 * Initialize the List (Drag-and-Drop)
 *******************************/
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".agent-list").forEach((list) => {
    Sortable.create(list, {
      direction: "vertical",
      animation: 300,
      handle: ".slider-icon",
      forceFallback: true,
      fallbackClass: "dragging",
      onStart: (evt) => {
        evt.item.classList.add("dragging"); // Fügt die Klasse hinzu
      },
      onEnd: (evt) => {
        evt.item.classList.remove("dragging"); // Entfernt die Klasse nach dem Drag
        updatePriorities(list); // Update priorities after dragging
      },
    });
  });
});

/***********************
 * Radio Event Listener
 ***********************/
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('input[name^="skill_"]').forEach((radio) => {
    radio.addEventListener("change", (event) => {
      const parentLi = event.target.closest("li");
      if (!parentLi) return;

      const surname = parentLi.dataset.surname;
      const name = parentLi.dataset.name;
      const key = `${surname}-${name}`; // 🔑 Unique key per agent

      if (!debugLogSkills.has(key)) {
        debugLogSkills.set(key, []);
      }

      debugLogSkills
        .get(key)
        .push([
          `%c🔄 Detected Skill Change:%c\n👤 Agent: %c${capitalize(surname)}, ${capitalize(
            name
          )}%c\n📞 New Skill: %c${capitalize(event.target.value)}`,
          "color: #2196f3; font-weight: bold;",
          "",
          "color: #9c27b0; font-weight: bold;",
          "",
          "color: #ff9800; font-weight: bold;",
        ]);

      updateSkills(event.target, surname, name);
    });
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
      surname: li.dataset.surname,
      name: li.dataset.name,
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
 * @param {string} surname - Nachname des Agenten.
 * @param {string} name - Vorname des Agenten.
 */
async function updateSkills(radio, surname, name) {
  const listItem = document.querySelector(`li[data-surname="${surname}"][data-name="${name}"]`);
  if (!listItem) return;

  const isInbound = radio.value === "inbound";
  listItem.dataset.skill_ib = isInbound ? "true" : "false";
  listItem.dataset.skill_ob = isInbound ? "false" : "true";

  const updatedSkills = {
    surname: listItem.dataset.surname,
    name: listItem.dataset.name,
    skill_ib: listItem.dataset.skill_ib === "true",
    skill_ob: listItem.dataset.skill_ob === "true",
  };

  const key = `${surname}-${name}`; // 🔑 Unique key per agent

  // 📝 Ensure an array exists before pushing
  if (!debugLogSkills.has(key)) {
    debugLogSkills.set(key, []);
  }

  // 📝 Store another debug message in the queue for data sending
  debugLogSkills.get(key).push([
    `%c📤 Sending Data to Server:%c\n${JSON.stringify(updatedSkills, null, 2)}`,
    "color: #2196f3; font-weight: bold;", // 🔵 Blue for sending data
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
      `%c✅ Skill Successfully Updated:%c\n👤 Agent: %c${capitalize(surname)}, ${capitalize(
        name
      )}%c\n📞 New Skill: %c${skillType}`,
      "color: #4caf50; font-weight: bold;", // 🟢 Green for final success
      "",
      "color: #9c27b0; font-weight: bold;", // 🟣 Purple for agent info
      "",
      "color: #ff9800; font-weight: bold;" // 🟠 Orange for skill update
    );

    debugLogSkills.delete(key); // 🧹 Remove log after success
  } catch (error) {
    debugLogSkills.get(key).forEach((log) => console.log(...log));

    console.error(
      `%c❌ Error updating agent skills:%c\n${error.message}`,
      "color: #ff3333; font-weight: bold;", // 🔴 Red for errors
      ""
    );

    // 🛑 Only log previous messages from the queue if an error occurs
    // debugLogQueue.forEach(log => console.log(...log));
    // debugLogQueue.length = 0;

    alert("Fehler beim Aktualisieren der Agentendaten.");
    debugLogSkills.delete(key); // 🧹 Remove log after success
  }
}
