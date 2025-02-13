// --- Reusable debounceRaf function (from app.js 2) ---
function debounceRaf(fn) {
  if (typeof fn !== "function") {
    throw new TypeError("Expected a function");
  }
  let rafId;
  return function (...args) {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => fn.apply(this, args));
  };
}

// --- Sortable Agent List code (from app.js 1) ---

async function fetchAgents() {
  const response = await fetch("http://localhost:3000/agents");
  return response.json();
}

function createList(items) {
  const list = document.getElementById("agentList");
  list.innerHTML = "";
  items.forEach((item, index) => {
    const li = document.createElement("li");

    // Create the slider.svg image element
    const sliderIcon = document.createElement("img");
    sliderIcon.src = "public/images/icons/drag_indicator.svg";
    sliderIcon.alt = "Slider Icon";
    sliderIcon.className = "slider-icon"; // optional: for styling

    // Insert the slider icon at the beginning of the list item
    li.appendChild(sliderIcon);

    // Append a text node or a span with the agent name and surname
    const textSpan = document.createElement("span");
    textSpan.textContent = ` ${item.name} ${item.surname}`;
    li.appendChild(textSpan);

    li.dataset.priority = index + 1;
    li.dataset.name = item.name;
    li.dataset.surname = item.surname;
    li.dataset.inboundoutbound = item.inboundoutbound;
    li.draggable = true;

    li.addEventListener("dragstart", handleDragStart);
    li.addEventListener("dragover", debounceRaf(handleDragOver));
    li.addEventListener("drop", handleDrop);
    li.addEventListener("dragend", handleDragEnd);

    list.appendChild(li);
  });
}

let draggedItem = null;

function handleDragStart(event) {
  draggedItem = event.target;
  event.target.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
}

function handleDragOver(event) {
  event.preventDefault();
  const list = document.getElementById("agentList");
  const items = [...list.children];
  const draggingIndex = items.indexOf(draggedItem);
  const targetIndex = items.indexOf(event.target);

  if (draggingIndex !== targetIndex) {
    list.insertBefore(
      draggedItem,
      targetIndex > draggingIndex ? event.target.nextSibling : event.target
    );
  }
}

function handleDrop(event) {
  event.preventDefault();
}

function handleDragEnd() {
  draggedItem.classList.remove("dragging");
  updatePriorities();
}

function updatePriorities() {
  document.querySelectorAll("#agentList li").forEach((li, index) => {
    li.dataset.priority = index + 1;
  });
}

async function saveOrder() {
  const listItems = [...document.querySelectorAll("#agentList li")];
  const updatedAgents = listItems.map((li, index) => ({
    name: li.dataset.name,
    surname: li.dataset.surname,
    inboundoutbound: li.dataset.inboundoutbound,
    priority: index + 1,
  }));

  await fetch("http://localhost:3000/update-agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedAgents),
  });

  alert("CSV file updated!");
}

// Initialize agent list on page load
document.addEventListener("DOMContentLoaded", () => {
  fetchAgents().then(createList);
});

// --- Location Text update code (from app.js 2) ---

(function () {
  const locationText = document.getElementById("location-text");
  if (!locationText) return;

  function updateLocationText() {
    const rawHash = window.location.hash.slice(1);
    if (!rawHash) {
      locationText.textContent = "Start";
      return;
    }
    // Inline sanitization
    const div = document.createElement("div");
    div.textContent = rawHash;
    const sanitized = div.innerHTML;
    // Encode and capitalize
    const encoded = encodeURIComponent(sanitized);
    locationText.textContent =
      encoded.charAt(0).toUpperCase() + encoded.slice(1);
  }

  document.addEventListener("DOMContentLoaded", updateLocationText, {
    once: true,
  });

  window.addEventListener("hashchange", debounceRaf(updateLocationText));
})();
