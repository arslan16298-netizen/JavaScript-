// Мои собственные браузерные проверки ПР3 (дополняют готовые checks/browser.checks.js).
// Открывать checks-own.html через локальный сервер. Ожидания записаны до запуска.
import { getVisibleTasks, filterByPriority } from "../src/task-selectors.js";
import { createTaskElement, renderTaskList } from "../src/task-view.js";
import { demoTasks as parentDemoTasks } from "../src/data.js";

const results = document.querySelector("#check-results");
const log = document.querySelector("#check-log");
const summary = document.querySelector("#check-summary");
const fixtureRoot = document.querySelector("#test-fixture");
const frame = document.querySelector("#test-frame");
let passed = 0;
let failed = 0;
let loadNumber = 0;
let appErrors = [];
const transcript = [];

function assert(condition, message = "Условие не выполнено") {
  if (!condition) throw new Error(message);
}
function same(actual, expected, message = "Результаты отличаются") {
  assert(JSON.stringify(actual) === JSON.stringify(expected),
    `${message}: получено ${JSON.stringify(actual)}, ожидалось ${JSON.stringify(expected)}`);
}
async function check(name, action) {
  fixtureRoot.replaceChildren();
  const item = document.createElement("li");
  try {
    await action();
    passed += 1;
    item.className = "check-pass";
    item.textContent = `OK: ${name}`;
  } catch (error) {
    failed += 1;
    item.className = "check-fail";
    item.textContent = `FAIL: ${name} — ${error.message}`;
  }
  results.append(item);
  transcript.push(item.textContent);
  log.textContent = transcript.join("\n");
}

const requireNode = (root, selector) => {
  const node = root.querySelector(selector);
  assert(node, `Не найден элемент: ${selector}`);
  return node;
};
function click(root, selector) {
  requireNode(root, selector).click();
  assert(appErrors.length === 0, `Ошибка обработчика: ${appErrors.join("; ")}`);
}
const visibleIds = (doc) => [...doc.querySelectorAll("#task-list > [data-task-id]")].map((n) => Number(n.dataset.taskId));
const stats = (doc) => ["total", "completed", "pending", "progress", "visible"]
  .map((name) => requireNode(doc, `#task-summary [data-stat="${name}"]`).textContent.trim());

// query: "" — общий набор, "?dataset=variant" — набор варианта.
function freshApp(query = "") {
  loadNumber += 1;
  appErrors = [];
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Приложение не загрузилось за 10 секунд")), 10000);
    function loaded() {
      clearTimeout(timer);
      frame.removeEventListener("load", loaded);
      const doc = frame.contentDocument;
      if (!doc?.querySelector("#task-list")) return reject(new Error("В iframe нет страницы приложения"));
      frame.contentWindow.addEventListener("error", (event) => appErrors.push(event.message));
      resolve(doc);
    }
    frame.addEventListener("load", loaded);
    frame.src = `./index.html${query}${query ? "&" : "?"}check=${loadNumber}`;
  });
}
const row = (id) => `#task-list > [data-task-id="${id}"]`;
const action = (id, kind) => `${row(id)} button[data-action="${kind}"] .action-label`;
const filter = (mode) => `#task-filters button[data-filter="${mode}"] .filter-label`;
const priority = (mode) => `#priority-filters button[data-priority-filter="${mode}"] .filter-label`;
const empty = (doc) => requireNode(doc, "#empty-message");

// ---------- Граничные случаи ----------

await check("Свой 1 (граница): остаётся одна задача, затем список пустеет", async () => {
  const doc = await freshApp("?dataset=variant");
  for (const id of [23, 37, 41, 58, 64]) click(doc, action(id, "delete"));
  same(visibleIds(doc), [11]);
  same(stats(doc), ["1", "1", "0", "100.0%", "1"]);
  click(doc, filter("pending"));
  same(stats(doc), ["1", "1", "0", "100.0%", "0"]);
  same(empty(doc).textContent, "Нет задач по выбранному фильтру.");
  click(doc, filter("all"));
  click(doc, action(11, "delete"));
  same(stats(doc), ["0", "0", "0", "0.0%", "0"]);
  same(empty(doc).textContent, "Список задач пуст.");
  assert(!empty(doc).hidden);
});

await check("Свой 2 (граница): название из 100 символов и из одного символа", () => {
  const list = document.createElement("ul");
  fixtureRoot.append(list);
  const long = "ы".repeat(100);
  renderTaskList(list, [
    { id: 1, title: long, completed: false, priority: "low" },
    { id: 2, title: "я", completed: true, priority: "high" },
  ]);
  same(list.querySelector('[data-task-id="1"] .task-title').textContent.length, 100);
  same(list.querySelector('[data-task-id="2"] .task-title').textContent, "я");
  same(list.children.length, 2);
});

// ---------- События и повторная отрисовка ----------

await check("Свой 3 (событие): 11 быстрых переключений id 4 дают ровно 11 смен статуса", async () => {
  const doc = await freshApp();
  for (let i = 1; i <= 10; i += 1) click(doc, action(4, "toggle"));
  same(stats(doc), ["4", "2", "2", "50.0%", "4"]);
  click(doc, action(4, "toggle"));
  same(stats(doc), ["4", "3", "1", "75.0%", "4"]);
  same(doc.querySelectorAll(row(4)).length, 1);
  same(visibleIds(doc), [1, 4, 7, 10]);
});

await check("Свой 4 (событие): клик по пустому месту карточки и по статусу ничего не меняет", async () => {
  const doc = await freshApp();
  click(doc, row(7));
  click(doc, `${row(7)} .task-status`);
  click(doc, `${row(7)} .task-actions`);
  same(stats(doc), ["4", "2", "2", "50.0%", "4"]);
});

await check("Свой 5: набор данных приложения (demoTasks) не меняется после действий", async () => {
  const doc = await freshApp();
  click(doc, action(4, "toggle"));
  click(doc, action(7, "delete"));
  // Тот же экземпляр модуля, что использует приложение: импорт выполняется из окна iframe.
  const data = await new frame.contentWindow.Function('return import("/src/data.js")')();
  // Защита от «пустой» проверки: это должен быть экземпляр модуля из iframe, а не из этой страницы.
  assert(data.demoTasks !== parentDemoTasks, "Получен не тот экземпляр модуля");
  same(data.demoTasks.map((task) => [task.id, task.completed]), [[1, true], [4, false], [7, false], [10, true]]);
  same(data.demoTasks.length, 4);
});

// ---------- Индивидуальный вариант 2 ----------

await check("Вариант 2: исходная сводка и фильтры", async () => {
  const doc = await freshApp("?dataset=variant");
  same(visibleIds(doc), [11, 23, 37, 41, 58, 64]);
  same(stats(doc), ["6", "1", "5", "16.7%", "6"]);
  click(doc, filter("pending"));
  same(visibleIds(doc), [23, 37, 41, 58, 64]);
  click(doc, filter("completed"));
  same(visibleIds(doc), [11]);
  click(doc, filter("all"));
  same(visibleIds(doc), [11, 23, 37, 41, 58, 64]);
});

await check("Вариант 2: переключить 23, удалить 37 — 5 задач, прогресс 40.0%", async () => {
  const doc = await freshApp("?dataset=variant");
  click(doc, action(23, "toggle"));
  same(stats(doc), ["6", "2", "4", "33.3%", "6"]);
  click(doc, action(37, "delete"));
  same(visibleIds(doc), [11, 23, 41, 58, 64]);
  same(stats(doc), ["5", "2", "3", "40.0%", "5"]);
  click(doc, filter("pending"));
  same(visibleIds(doc), [41, 58, 64]);
  same(stats(doc), ["5", "2", "3", "40.0%", "3"]);
  click(doc, filter("completed"));
  same(visibleIds(doc), [11, 23]);
  same(stats(doc), ["5", "2", "3", "40.0%", "2"]);
});

await check("Вариант 2: общий набор не затронут (чистая загрузка)", async () => {
  let doc = await freshApp("?dataset=variant");
  click(doc, action(37, "delete"));
  doc = await freshApp();
  same(visibleIds(doc), [1, 4, 7, 10]);
  same(requireNode(doc, "#dataset-label").textContent, "Общий контрольный набор");
  doc = await freshApp("?dataset=variant");
  same(requireNode(doc, "#dataset-label").textContent, "Индивидуальный вариант: 2");
  same(visibleIds(doc), [11, 23, 37, 41, 58, 64]);
});

// ---------- Расширение: фильтр по приоритету ----------

await check("Расширение 1: чистые функции filterByPriority и getVisibleTasks вместе", () => {
  const tasks = [
    { id: 1, title: "a", completed: true, priority: "medium" },
    { id: 4, title: "b", completed: false, priority: "high" },
    { id: 7, title: "c", completed: false, priority: "low" },
    { id: 10, title: "d", completed: true, priority: "medium" },
  ];
  const before = JSON.stringify(tasks);
  same(filterByPriority(tasks, "all").map((t) => t.id), [1, 4, 7, 10]);
  same(filterByPriority(tasks, "medium").map((t) => t.id), [1, 10]);
  same(filterByPriority(getVisibleTasks(tasks, "pending"), "medium").map((t) => t.id), []);
  same(filterByPriority(getVisibleTasks(tasks, "completed"), "medium").map((t) => t.id), [1, 10]);
  same(filterByPriority([], "high"), []);
  assert(filterByPriority(tasks, "all") !== tasks, "Нужен новый массив");
  let thrown = false;
  try { filterByPriority(tasks, "urgent"); } catch { thrown = true; }
  assert(thrown, "Неизвестный приоритет должен давать ошибку");
  same(JSON.stringify(tasks), before);
});

await check("Расширение 2: приоритет и статус работают вместе, сводка по всему списку", async () => {
  const doc = await freshApp();
  click(doc, priority("medium"));
  same(visibleIds(doc), [1, 10]);
  same(stats(doc), ["4", "2", "2", "50.0%", "2"]);
  click(doc, filter("pending"));
  same(visibleIds(doc), []);
  same(stats(doc), ["4", "2", "2", "50.0%", "0"]);
  same(empty(doc).textContent, "Нет задач по выбранному фильтру.");
  click(doc, priority("low"));
  same(visibleIds(doc), [7]);
  click(doc, priority("all"));
  same(visibleIds(doc), [4, 7]);
  click(doc, filter("all"));
  same(visibleIds(doc), [1, 4, 7, 10]);
});

await check("Расширение 3: действия под активными фильтрами и независимые aria-pressed", async () => {
  const doc = await freshApp();
  click(doc, filter("pending"));
  click(doc, priority("high"));
  same(visibleIds(doc), [4]);
  click(doc, action(4, "toggle"));
  same(visibleIds(doc), []);
  same(stats(doc), ["4", "3", "1", "75.0%", "0"]);
  const pressedStatus = [...doc.querySelectorAll('#task-filters [aria-pressed="true"]')].map((b) => b.dataset.filter);
  const pressedPriority = [...doc.querySelectorAll('#priority-filters [aria-pressed="true"]')].map((b) => b.dataset.priorityFilter);
  same(pressedStatus, ["pending"]);
  same(pressedPriority, ["high"]);
  same(doc.querySelectorAll("#task-filters button").length, 3);
  click(doc, priority("medium"));
  click(doc, filter("all"));
  click(doc, action(1, "delete"));
  same(visibleIds(doc), [10]);
  same(stats(doc), ["3", "2", "1", "66.7%", "1"]);
});

fixtureRoot.replaceChildren();
const conclusion = `Всего: ${passed + failed}. Пройдено: ${passed}. Ошибок: ${failed}.`;
summary.textContent = conclusion;
log.textContent = `${transcript.join("\n")}\n\n${conclusion}`;
document.documentElement.dataset.checksDone = "true";
document.documentElement.dataset.checksPassed = String(passed);
document.documentElement.dataset.checksFailed = String(failed);
