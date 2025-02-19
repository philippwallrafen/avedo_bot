// --- Reusable debounceRaf function ---
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

// --- Fetch Agents from the Server ---
async function fetchAgents() {
  const response = await fetch("http://localhost:3000/agents");
  return response.json();
}

// --- Create the Agent List in the DOM ---
function createList(items) {
  const list = document.getElementById("agentList");
  if (!list) return;
  list.innerHTML = "";
  items.forEach((item, index) => {
    const li = document.createElement("li");
    li.dataset.priority = index + 1;
    li.dataset.name = item.name;
    li.dataset.surname = item.surname;
    li.dataset.inboundoutbound = item.inboundoutbound;

    // Create the slider icon image
    const sliderIcon = document.createElement("img");
    sliderIcon.src = "/images/icons/drag_indicator.svg"; // Use absolute path
    sliderIcon.alt = "Slider Icon";
    sliderIcon.className = "slider-icon";
    li.appendChild(sliderIcon);

    // Append a span with the agent's name and surname
    const textSpan = document.createElement("span");
    textSpan.textContent = ` ${item.name} ${item.surname}`;
    li.appendChild(textSpan);

    list.appendChild(li);
  });
}

// --- Initialize SortableJS and Build the List ---
document.addEventListener("DOMContentLoaded", async function () {
  // Optionally, check if the list is empty before fetching
  const list = document.getElementById("agentList");
  if (!list.innerHTML.trim()) {
    const agents = await fetchAgents();
    createList(agents);
  }
  // Initialize SortableJS on the agent list
  if (list) {
    Sortable.create(list, {
      animation: 150, // Smooth animation during drag
      onEnd: function () {
        updatePriorities();
        // Optionally, auto-save the new order by calling saveOrder();
      },
    });
  }
});

// --- Update Priorities After Reordering ---
function updatePriorities() {
  const listItems = document.querySelectorAll("#agentList li");
  listItems.forEach((li, index) => {
    li.dataset.priority = index + 1;
  });
}

// --- Save the New Order to the Server ---
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

// --- (Optional) Location Text Update Code ---
// ... (your location text code remains here) ...
