import { getTaskStats } from "./task-service.js";

// Здесь создаётся DOM, но не изменяется состояние приложения.
// Обработчиков событий в этом модуле нет: они навешены один раз в main.js.

const PRIORITY_LABELS = { low: "Низкий", medium: "Средний", high: "Высокий" };

function createButton(action, label, extra = {}) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.action = action;
  for (const [name, value] of Object.entries(extra)) button.setAttribute(name, value);
  const text = document.createElement("span");
  text.className = "action-label";
  text.textContent = label;
  button.append(text);
  return button;
}

export function createTaskElement(task) {
  const card = document.createElement("li");
  card.className = "task-card";
  if (task.completed) card.classList.add("is-completed");
  card.dataset.taskId = String(task.id);

  // Название только через textContent: разметка в названии остаётся текстом.
  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.title;

  const status = document.createElement("span");
  status.className = "task-status";
  status.textContent = task.completed ? "Выполнена" : "В работе";

  const priority = document.createElement("span");
  priority.className = "task-priority";
  priority.textContent = PRIORITY_LABELS[task.priority] ?? task.priority;

  const actions = document.createElement("div");
  actions.className = "task-actions";
  actions.append(
    createButton("toggle", "Выполнена", { "aria-pressed": String(task.completed) }),
    createButton("edit", "Изменить"),
    createButton("delete", "Удалить"),
  );

  card.append(title, status, priority, actions);
  return card;
}

export function renderTaskList(listElement, tasks) {
  // replaceChildren заменяет только содержимое: сам ul и его обработчик остаются.
  listElement.replaceChildren(...tasks.map(createTaskElement));
}

export function renderSummary(summaryElement, tasks, visibleCount) {
  // tasks — весь текущий массив, visibleCount — длина отфильтрованного списка.
  const { total, completed, pending, progress } = getTaskStats(tasks);
  const values = {
    total: String(total),
    completed: String(completed),
    pending: String(pending),
    progress: `${progress.toFixed(1)}%`,
    visible: String(visibleCount),
  };
  for (const [name, value] of Object.entries(values)) {
    summaryElement.querySelector(`[data-stat="${name}"]`).textContent = value;
  }
}

export function renderEmptyState(messageElement, total, visibleCount) {
  if (total === 0) {
    messageElement.textContent = "Список задач пуст.";
    messageElement.hidden = false;
  } else if (visibleCount === 0) {
    messageElement.textContent = "Нет задач по выбранному фильтру.";
    messageElement.hidden = false;
  } else {
    messageElement.textContent = "";
    messageElement.hidden = true;
  }
}
