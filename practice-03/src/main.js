import { demoTasks, variantTasks, variantNumber } from "./data.js";
import { findTaskById, setTaskCompleted, removeTask } from "./task-service.js";
import { getVisibleTasks, filterByPriority, STATUS_FILTERS, PRIORITY_FILTERS } from "./task-selectors.js";
import { renderTaskList, renderSummary, renderEmptyState } from "./task-view.js";

const elements = {
  list: document.querySelector("#task-list"),
  filters: document.querySelector("#task-filters"),
  priorityFilters: document.querySelector("#priority-filters"),
  summary: document.querySelector("#task-summary"),
  empty: document.querySelector("#empty-message"),
  message: document.querySelector("#operation-message"),
  datasetLabel: document.querySelector("#dataset-label"),
};

// Готовая служебная часть: ?dataset=variant включает данные своего варианта.
// Наборы не смешиваются, редактировать код для переключения не требуется.
const isVariant = new URLSearchParams(window.location.search).get("dataset") === "variant";
const initialTasks = isVariant ? variantTasks : demoTasks;
let currentTasks = initialTasks.map((task) => ({ ...task }));
let currentFilter = "all";
let currentPriority = "all"; // расширение: фильтр по приоритету

elements.datasetLabel.textContent = isVariant
  ? `Индивидуальный вариант: ${variantNumber ?? "не указан"}`
  : "Общий контрольный набор";

function showMessage(text) {
  elements.message.textContent = text;
}

// Обновляет is-active и aria-pressed у группы кнопок-фильтров.
function markActive(container, attribute, activeValue) {
  for (const button of container.querySelectorAll(`button[${attribute}]`)) {
    const isActive = button.getAttribute(attribute) === activeValue;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }
}

// Перерисовывает всё по текущему состоянию. currentTasks здесь только читается,
// подписки на события не создаются.
function renderApp() {
  const visibleTasks = filterByPriority(getVisibleTasks(currentTasks, currentFilter), currentPriority);
  renderTaskList(elements.list, visibleTasks);
  renderSummary(elements.summary, currentTasks, visibleTasks.length);
  renderEmptyState(elements.empty, currentTasks.length, visibleTasks.length);
  markActive(elements.filters, "data-filter", currentFilter);
  markActive(elements.priorityFilters, "data-priority-filter", currentPriority);
}

function handleTaskListClick(event) {
  // Клик мог прийти на вложенный span внутри кнопки, поэтому ищем кнопку через closest().
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button[data-action]");
  if (button === null || !elements.list.contains(button)) return;

  const action = button.dataset.action;
  if (action !== "toggle" && action !== "delete") return; // неизвестное действие игнорируется

  // id берём из карточки. dataset даёт строку, поэтому Number + проверка.
  // parseInt не используется: "4abc" не должно превращаться в 4.
  const card = button.closest("li[data-task-id]");
  if (card === null) return;
  const id = Number(card.dataset.taskId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    showMessage(`Некорректный id задачи: ${JSON.stringify(card.dataset.taskId)}`);
    return;
  }

  let result;
  if (action === "toggle") {
    const task = findTaskById(currentTasks, id);
    if (task === undefined) {
      showMessage(`Задача с id ${id} не найдена`);
      return;
    }
    result = setTaskCompleted(currentTasks, id, !task.completed);
  } else {
    result = removeTask(currentTasks, id);
  }

  // Состояние заменяется только при успехе.
  if (!result.ok) {
    showMessage(result.error);
    return;
  }
  currentTasks = result.tasks;
  showMessage("");
  renderApp();
  restoreTaskFocus(id, action);
}

function handleFilterClick(event) {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button[data-filter]");
  if (button === null || !elements.filters.contains(button)) return;
  const mode = button.dataset.filter;
  if (!STATUS_FILTERS.includes(mode)) return; // неизвестное значение игнорируется
  currentFilter = mode; // меняется только фильтр, currentTasks остаётся прежним
  showMessage("");
  renderApp();
}

// Расширение (вариант А): отдельная группа фильтров по приоритету, работает вместе с фильтром статуса.
function handlePriorityFilterClick(event) {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button[data-priority-filter]");
  if (button === null || !elements.priorityFilters.contains(button)) return;
  const value = button.dataset.priorityFilter;
  if (!PRIORITY_FILTERS.includes(value)) return;
  currentPriority = value;
  showMessage("");
  renderApp();
}

// Готовая вспомогательная функция. Сохраняет понятную позицию клавиатурного фокуса
// после замены карточек. Если карточки больше нет, фокус получает активный фильтр.
function restoreTaskFocus(id, action) {
  const actionButton = elements.list.querySelector(
    `[data-task-id="${id}"] button[data-action="${action}"]`,
  );
  const filterButton = elements.filters.querySelector(`[data-filter="${currentFilter}"]`);
  (actionButton ?? filterButton)?.focus();
}

// Подписки выполняются один раз. Эти контейнеры не заменяются при перерисовке.
elements.list.addEventListener("click", handleTaskListClick);
elements.filters.addEventListener("click", handleFilterClick);
elements.priorityFilters.addEventListener("click", handlePriorityFilterClick);

// До реализации renderApp ожидается сообщение о заглушке.
// try/catch здесь — готовая диагностика старта, а не замена проверки result.ok.
try {
  renderApp();
} catch (error) {
  elements.message.textContent = `Ошибка запуска: ${error.message}`;
  console.error(error);
}
