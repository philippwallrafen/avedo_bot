// ~/website/src/client/app.ts
// @ts-expect-error Bundler wird später geadded
import Sortable from 'https://cdn.jsdelivr.net/npm/sortablejs@latest/+esm';
// import Sortable from "sortablejs";
import { log } from './browser-logger.js'; // Import logging functions
/*****************
 * Helfer Funktionen
 *****************/
function generateAgentKey(agent) {
  return `${agent.surname}-${agent.name}`;
}
function getAgentFromElement(element) {
  const surname = element.dataset['surname'] ?? 'Unknown';
  const name = element.dataset['name'] ?? 'Unknown';
  return {
    surname,
    name,
    key: generateAgentKey({ surname, name }),
  };
}
function hasPriorityChanged(li, newPriority) {
  const oldPriority = parseInt(li.dataset['priority'] ?? '0', 10);
  return oldPriority !== newPriority;
}
/***********************
 * Color & Style Config
 ***********************/
export const ColorStyles = {
  success: 'color: #4caf50; font-weight: bold;', // 🟢
  debugHeading: 'color: #2196f3; font-weight: bold;', // 🔵
  agentName: 'color: #9c27b0; font-weight: bold;', // 🟣
  updatedData: 'color: #ff9800; font-weight: bold;', // 🟠
  error: 'color: #ff3333; font-weight: bold;', // 🔴
  unstyled: 'color: inherit; font-weight: normal;', // ⚪
};
async function sendUpdates(url, updates) {
  if (updates.length === 0) return;
  log('debug', [`%c📤 Sending data to server:\n`, ColorStyles.debugHeading, JSON.stringify(updates, null, 2)]);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      const errorResponse = await response.json().catch(() => ({ error: 'Unknown server error' }));
      throw new Error(`${errorResponse.error}: ${errorResponse.details || 'No additional details'}`);
    }
    log('info', [`✅ %cServer: '${url}'-Update erfolgreich`, ColorStyles.success]);
  } catch (error) {
    log('error', [`❌ %cError updating data:%c  ${error}`, ColorStyles.error]);
  }
}
function collectPriorityChanges(list) {
  const liElements = list.querySelectorAll('li');
  const listType = list.id === 'outboundList' ? 'outbound' : 'inbound';
  const offset = listType === 'outbound' ? document.querySelectorAll('#inboundList li').length : 0;
  const updatedPriorities = [];
  liElements.forEach((li, index) => {
    const newPriority = index + 1 + offset;
    if (!hasPriorityChanged(li, newPriority)) {
      return;
    }
    li.dataset['priority'] = newPriority.toString();
    const agent = getAgentFromElement(li);
    updatedPriorities.push({ surname: agent.surname, name: agent.name, priority: newPriority });
  });
  return updatedPriorities.length > 0 ? updatedPriorities : null;
}
function collectSkillUpdates(radio, agent) {
  const listItem = document.querySelector(`li[data-surname="${agent.surname}"][data-name="${agent.name}"]`);
  if (!listItem) return null;
  const isInbound = radio.value === 'inbound';
  listItem.dataset['skill_ib'] = isInbound ? 'true' : 'false';
  listItem.dataset['skill_ob'] = isInbound ? 'false' : 'true';
  const updatedSkills = {
    surname: agent.surname,
    name: agent.name,
    skill_ib: listItem.dataset['skill_ib'] === 'true',
    skill_ob: listItem.dataset['skill_ob'] === 'true',
  };
  return updatedSkills;
}
/***********************
 * Event Handlers
 ***********************/
// Handler for drag & drop end event
async function handleDragEnd(list) {
  const updatedPriorities = collectPriorityChanges(list);
  if (!updatedPriorities) return;
  await sendUpdates('/agents/priority', updatedPriorities);
}
// Handler for radio change event
async function handleRadioChange(event) {
  const selectedRadio = event.target;
  const parentLi = selectedRadio.closest('li');
  if (!parentLi) return;
  const agent = getAgentFromElement(parentLi);
  const updatedSkills = collectSkillUpdates(selectedRadio, agent);
  if (!updatedSkills) return;
  await sendUpdates('/agents/skills', [updatedSkills]);
}
function handleReloadButton() {
  console.log('Reload Button wurde geklickt!');
}
/**********************
 * Setup Funktionen
 **********************/
function setupDragAndDrop() {
  const agentLists = document.querySelectorAll('.agent-list');
  agentLists.forEach((list) => {
    Sortable.create(list, {
      direction: 'vertical',
      animation: 300,
      handle: '.slider-icon',
      forceFallback: true,
      fallbackClass: 'dragging',
      onStart: (evt) => {
        evt.item.classList.add('dragging');
      },
      onEnd: (evt) => {
        evt.item.classList.remove('dragging');
        handleDragEnd(list);
      },
    });
  });
}
function setupRadioListeners() {
  const radios = document.querySelectorAll('input[name^="skill_"]');
  radios.forEach((radio) => {
    radio.addEventListener('change', handleRadioChange);
  });
}
function setupReloadListener() {
  const reloadButton = document.getElementById('reloadButton');
  if (reloadButton) {
    reloadButton.addEventListener('click', handleReloadButton);
  }
}
/***********************
 * Application Startup
 ***********************/
function initializeApp() {
  setupDragAndDrop();
  setupRadioListeners();
  setupReloadListener();
}
document.addEventListener('DOMContentLoaded', initializeApp);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NsaWVudC9hcHAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsOEJBQThCO0FBRTlCLCtDQUErQztBQUMvQyxPQUFPLFFBQVEsTUFBTSxxREFBcUQsQ0FBQztBQUMzRSxxQ0FBcUM7QUFFckMsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLHFCQUFxQixDQUFDLENBQUMsMkJBQTJCO0FBeUJ0RTs7bUJBRW1CO0FBQ25CLFNBQVMsZ0JBQWdCLENBQUMsS0FBc0M7SUFDOUQsT0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLElBQUksS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQzFDLENBQUM7QUFFRCxTQUFTLG1CQUFtQixDQUFDLE9BQW9CO0lBQy9DLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksU0FBUyxDQUFDO0lBQ3hELE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksU0FBUyxDQUFDO0lBQ2xELE9BQU87UUFDTCxPQUFPO1FBQ1AsSUFBSTtRQUNKLEdBQUcsRUFBRSxnQkFBZ0IsQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQztLQUN6QyxDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsa0JBQWtCLENBQUMsRUFBaUIsRUFBRSxXQUFtQjtJQUNoRSxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDaEUsT0FBTyxXQUFXLEtBQUssV0FBVyxDQUFDO0FBQ3JDLENBQUM7QUFFRDs7eUJBRXlCO0FBQ3pCLE1BQU0sQ0FBQyxNQUFNLFdBQVcsR0FBRztJQUN6QixPQUFPLEVBQUUsb0NBQW9DLEVBQUUsS0FBSztJQUNwRCxZQUFZLEVBQUUsb0NBQW9DLEVBQUUsS0FBSztJ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
