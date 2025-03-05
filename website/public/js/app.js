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
          `%c🔄 Detected Skill Change%c\n\n  👤 Agent: %c${capitalize(surname)}, ${capitalize(
            name
          )}%c\n  📞 Neuer Skill: %c${capitalize(event.target.value)}`,
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

    const surname = li.dataset.surname;
    const name = li.dataset.name;
    const key = `${surname}-${name}`; // 🔑 Unique key per agent

    // 📝 Ensure an array exists before pushing
    if (!debugLogPriorities.has(key)) {
      debugLogPriorities.set(key, []);
    }

    debugLogPriorities.get(key).push([
      `%c🔄 Detected Priority Change:%c\n👤 Agent: %c${capitalize(surname)}, ${capitalize(
        name
      )}%c\n🏆 New Priority: %c${newPriority}`,
      "color: #2196f3; font-weight: bold;", // 🔵 Blue for detection
      "",
      "color: #9c27b0; font-weight: bold;", // 🟣 Purple for agent info
      "",
      "color: #ff9800; font-weight: bold;", // 🟠 Orange for priority update
    ]);

    updatedPriorities.push({
      surname,
      name,
      priority: newPriority,
    });
  });

  try {
    const response = await fetch("/update-agent-priority", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedPriorities),
    });

    if (!response.ok) {
      const errorResponse = await response.json().catch(() => ({ error: "Unknown server error" }));
      throw new Error(`${errorResponse.error}: ${errorResponse.details || "No additional details"}`);
    }

    const maxNameLength = Math.max(
      ...updatedPriorities.map(({ surname, name }) => surname.length + name.length + 3) // +2 für ", "
    );

    const logMessage = [
      `✅ %cServer: Prioritäten erfolgreich aktualisiert\n\n`,
      "color: #4caf50; font-weight: bold;", // 🟢 Grün für Erfolg
    ];

    updatedPriorities.forEach(({ surname, name, priority }) => {
      const nameBlock = `${capitalize(surname)}, ${capitalize(name)}`.padEnd(maxNameLength);

      logMessage[0] += `%c  👤 Agent: %c${nameBlock}%c 📜 Neue Prio: %c${priority}%c\n`;
      logMessage.push(
        "",
        "color: #9c27b0; font-weight: bold;", // 🟣 Lila für Namen
        "", // Reset after Namen
        "color: #ff9800; font-weight: bold;", // 🟠 Orange für Priorität
        "" // Reset formatting after priority
      );
    });

    console.log(...logMessage);

    // 🧹 Remove logs after success
    updatedPriorities.forEach(({ surname, name }) => {
      const key = `${surname}-${name}`;
      debugLogPriorities.delete(key);
    });
  } catch (error) {
    console.error(
      `%c❌ Error updating agent priorities:%c\n${error.message}`,
      "color: #ff3333; font-weight: bold;", // 🔴 Red for errors
      ""
    );

    // 🔥 Print all stored logs for this failed request
    updatedPriorities.forEach(({ surname, name }) => {
      const key = `${surname}-${name}`;
      if (debugLogPriorities.has(key)) {
        debugLogPriorities.get(key).forEach((log) => console.log(...log));
      }
    });

    alert("Fehler beim Aktualisieren der Agenten-Prioritäten.");
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
    `📤 %cSending Data to Server%c\n${JSON.stringify(updatedSkills, null, 2)}`,
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
    debugLogSkills.get(key).forEach((log) => console.log(...log));

    console.error(
      `%c❌ Error updating agent skills:%c\n${error.message}`,
      "color: #ff3333; font-weight: bold;", // 🔴 Red for errors
      ""
    );

    alert("Fehler beim Aktualisieren der Agentendaten.");
    debugLogSkills.delete(key); // 🧹 Remove log after success
  }
}
