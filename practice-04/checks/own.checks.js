// Мои собственные браузерные проверки ПР4 (дополняют готовые checks/browser.checks.js).
// Открывать checks-own.html через локальный сервер. Ожидания записаны до запуска.
// Приложение запускается в iframe с mode=check: отдельные ключи localStorage, рабочие данные не затрагиваются.

const results = document.querySelector("#check-results");
const log = document.querySelector("#check-log");
const summary = document.querySelector("#check-summary");
const fixtureRoot = document.querySelector("#test-fixture");
const frame = document.querySelector("#test-frame");
const transcript = [];
let passed = 0;
let failed = 0;
let loadNumber = 0;

const keyFor = (dataset = "demo") => `tip-js-practice-04:checks:${dataset}`;
const draftKeyFor = (dataset = "demo") => `${keyFor(dataset)}:draft`;

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
const visibleIds = (doc) => [...doc.querySelectorAll("#task-list > [data-task-id]")].map((n) => Number(n.dataset.taskId));
const stats = (doc) => ["total", "completed", "pending", "progress", "visible"]
  .map((name) => requireNode(doc, `#task-summary [data-stat="${name}"]`).textContent.trim());
const click = (doc, selector) => requireNode(doc, selector).click();
const card = (id, kind) => `#task-list [data-task-id="${id}"] [data-action="${kind}"] .action-label`;
const filterBtn = (mode) => `#task-filters [data-filter="${mode}"] .filter-label`;
const status = (doc) => requireNode(doc, "#storage-status");
const stored = (dataset = "demo") => {
  const raw = localStorage.getItem(keyFor(dataset));
  return raw === null ? null : JSON.parse(raw).tasks;
};

function inputValue(doc, selector, value) {
  const input = requireNode(doc, selector);
  input.value = value;
  input.dispatchEvent(new input.ownerDocument.defaultView.Event("input", { bubbles: true }));
}
function fill(doc, { id, title, priority }) {
  if (id !== undefined) inputValue(doc, "#task-id", String(id));
  if (title !== undefined) inputValue(doc, "#task-title", title);
  if (priority !== undefined) inputValue(doc, "#task-priority", priority);
}
function submit(doc, values) {
  fill(doc, values);
  requireNode(doc, "#task-form").requestSubmit();
}
const formValues = (doc) => [requireNode(doc, "#task-id").value, requireNode(doc, "#task-title").value, requireNode(doc, "#task-priority").value];

// Опции: dataset, keepStorage (не очищать ключи), raw / rawDraft (записать до загрузки), draft (включить черновик).
async function freshApp({ dataset = "demo", keepStorage = false, raw, rawDraft, draft = false } = {}) {
  loadNumber += 1;
  if (!keepStorage) {
    localStorage.removeItem(keyFor(dataset));
    localStorage.removeItem(draftKeyFor(dataset));
  }
  if (raw !== undefined) localStorage.setItem(keyFor(dataset), raw);
  if (rawDraft !== undefined) localStorage.setItem(draftKeyFor(dataset), rawDraft);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Приложение не загрузилось за 10 секунд")), 10000);
    frame.addEventListener("load", () => {
      clearTimeout(timer);
      const doc = frame.contentDocument;
      if (!doc?.querySelector("#task-form")) return reject(new Error("В iframe нет страницы приложения"));
      resolve(doc);
    }, { once: true });
    const parts = [`mode=check`, `run=${loadNumber}`];
    if (dataset === "variant") parts.push("dataset=variant");
    if (draft) parts.push("draft=on");
    frame.src = `./index.html?${parts.join("&")}`;
  });
}
function cleanup() {
  for (const dataset of ["demo", "variant"]) {
    localStorage.removeItem(keyFor(dataset));
    localStorage.removeItem(draftKeyFor(dataset));
  }
}

// ---------- Граница формы ----------

await check("Свой 1 (граница формы): название 100 символов принимается и сохраняется, 101 отклоняется без записи", async () => {
  const doc = await freshApp();
  // Свойство value обходит maxlength="100", поэтому длину 101 проверяет только прикладная валидация.
  submit(doc, { id: 20, title: `  ${"ы".repeat(101)}  `, priority: "low" });
  same(visibleIds(doc), [1, 4, 7, 10]);
  assert(requireNode(doc, "#task-title").getAttribute("aria-invalid") === "true");
  assert(requireNode(doc, "#task-title-error").textContent.includes("101"));
  same(localStorage.getItem(keyFor()), null);
  submit(doc, { id: 20, title: `  ${"ы".repeat(100)}  `, priority: "low" });
  same(visibleIds(doc), [1, 4, 7, 10, 20]);
  same(stored().find((task) => task.id === 20).title.length, 100);
});

await check("Свой 2 (граница формы): id 9007199254740991 принимается, 9007199254740992 и 4abc отклоняются", async () => {
  const doc = await freshApp();
  // type="number" не пропускает "4abc" в поле, поэтому значение проверяется на уровне приложения через текстовые случаи.
  submit(doc, { id: "9007199254740992", title: "Больше границы", priority: "low" });
  same(visibleIds(doc), [1, 4, 7, 10]);
  assert(requireNode(doc, "#task-id-error").textContent.trim().length > 0);
  submit(doc, { id: "9007199254740991", title: "На границе", priority: "low" });
  same(visibleIds(doc), [1, 4, 7, 10, Number.MAX_SAFE_INTEGER]);
  same(stored().map((task) => task.id), [1, 4, 7, 10, Number.MAX_SAFE_INTEGER]);
});

await check("Свой 3 (ошибки полей): input очищает только ошибку исправляемого поля", async () => {
  const doc = await freshApp();
  submit(doc, { id: 4, title: "   ", priority: "low" });
  assert(requireNode(doc, "#task-id-error").textContent.trim().length > 0, "нет ошибки id");
  assert(requireNode(doc, "#task-title-error").textContent.trim().length > 0, "нет ошибки названия");
  inputValue(doc, "#task-title", "Исправленное название");
  same(requireNode(doc, "#task-title-error").textContent, "");
  assert(requireNode(doc, "#task-title").getAttribute("aria-invalid") === null);
  assert(requireNode(doc, "#task-id-error").textContent.trim().length > 0, "ошибка id не должна исчезнуть");
  assert(requireNode(doc, "#task-id").getAttribute("aria-invalid") === "true");
  same(visibleIds(doc), [1, 4, 7, 10]);
});

// ---------- Режим редактирования ----------

await check("Свой 4 (редактирование): пустое название при правке отклоняется, задача и storage не меняются", async () => {
  const doc = await freshApp();
  click(doc, card(7, "edit"));
  submit(doc, { title: "    " });
  assert(requireNode(doc, "#task-title-error").textContent.trim().length > 0);
  same(requireNode(doc, "#task-id-error").textContent, "");
  same(requireNode(doc, '[data-task-id="7"] .task-title').textContent, "Проверить методы массивов");
  same(localStorage.getItem(keyFor()), null);
  assert(requireNode(doc, "#task-id").disabled, "режим редактирования должен сохраниться");
});

await check("Свой 5 (редактирование): удаление редактируемой задачи возвращает форму в режим создания", async () => {
  const doc = await freshApp();
  click(doc, card(4, "edit"));
  same(requireNode(doc, "#form-submit").textContent, "Сохранить изменения");
  click(doc, card(4, "delete"));
  same(visibleIds(doc), [1, 7, 10]);
  same(requireNode(doc, "#form-submit").textContent, "Добавить задачу");
  same(requireNode(doc, "#form-heading").textContent, "Добавление задачи");
  assert(!requireNode(doc, "#task-id").disabled);
  same(formValues(doc), ["", "", "medium"]);
  same(stored().map((task) => task.id), [1, 7, 10]);
});

await check("Свой 6 (редактирование): правка не меняет статус и порядок, повторная правка без изменений успешна", async () => {
  const doc = await freshApp();
  click(doc, card(10, "edit"));
  submit(doc, { title: "Оформить README", priority: "medium" }); // те же значения
  same(visibleIds(doc), [1, 4, 7, 10]);
  assert(requireNode(doc, '[data-task-id="10"]').classList.contains("is-completed"));
  same(stats(doc), ["4", "2", "2", "50.0%", "4"]);
  same(stored().find((task) => task.id === 10), { id: 10, title: "Оформить README", completed: true, priority: "medium" });
});

// ---------- Восстановление ----------

await check("Свой 7 (восстановление): после перезагрузки сохраняются данные, а фильтр сбрасывается на «Все»", async () => {
  let doc = await freshApp();
  submit(doc, { id: 20, title: "Сохранённая", priority: "high" });
  click(doc, card(7, "toggle"));
  click(doc, card(1, "delete"));
  click(doc, filterBtn("pending"));
  same(visibleIds(doc), [4, 20]);
  doc = await freshApp({ keepStorage: true });
  same(visibleIds(doc), [4, 7, 10, 20]);
  same(stats(doc), ["4", "2", "2", "50.0%", "4"]);
  assert(status(doc).textContent.includes("восстановлены"));
  same(requireNode(doc, "#task-filters .is-active .filter-label").textContent, "Все");
});

await check("Свой 8 (восстановление): после сохранения всех удалений пустой список тоже восстанавливается", async () => {
  let doc = await freshApp();
  for (const id of [1, 4, 7, 10]) click(doc, card(id, "delete"));
  same(visibleIds(doc), []);
  same(stored(), []);
  doc = await freshApp({ keepStorage: true });
  same(visibleIds(doc), []);
  same(stats(doc), ["0", "0", "0", "0.0%", "0"]);
  same(requireNode(doc, "#empty-message").textContent, "Список задач пуст.");
  assert(status(doc).textContent.includes("восстановлены"));
});

// ---------- Повреждение данных ----------

await check("Свой 9 (повреждение): неизвестная версия и null дают предупреждение, а следующая запись исправляет ключ", async () => {
  let doc = await freshApp({ raw: JSON.stringify({ version: 999, tasks: [] }) });
  same(visibleIds(doc), [1, 4, 7, 10]);
  assert(status(doc).classList.contains("is-warning"));
  doc = await freshApp({ raw: "null" });
  same(visibleIds(doc), [1, 4, 7, 10]);
  assert(status(doc).classList.contains("is-warning"));
  submit(doc, { id: 20, title: "После повреждения", priority: "low" });
  assert(!status(doc).classList.contains("is-warning"), "после успешной записи предупреждение должно уйти");
  same(stored().map((task) => task.id), [1, 4, 7, 10, 20]);
  doc = await freshApp({ keepStorage: true });
  same(visibleIds(doc), [1, 4, 7, 10, 20]);
});

await check("Свой 10 (повреждение): дубликаты id в сохранённых данных не принимаются", async () => {
  const raw = JSON.stringify({ version: 1, tasks: [
    { id: 1, title: "Первая", completed: false, priority: "low" },
    { id: 1, title: "Вторая", completed: true, priority: "high" },
  ] });
  const doc = await freshApp({ raw });
  same(visibleIds(doc), [1, 4, 7, 10]);
  assert(status(doc).classList.contains("is-warning"));
});

// ---------- Индивидуальный вариант 2 ----------

await check("Вариант 2: добавление 75, правка 23, удаление 37, перезагрузка, сброс", async () => {
  localStorage.removeItem(keyFor("demo")); // чтобы остатки прошлых проверок не влияли на вывод
  let doc = await freshApp({ dataset: "variant" });
  same(visibleIds(doc), [11, 23, 37, 41, 58, 64]);
  same(stats(doc), ["6", "1", "5", "16.7%", "6"]);
  submit(doc, { id: 75, title: "Раздать материалы слушателям", priority: "medium" });
  same(stats(doc), ["7", "1", "6", "14.3%", "7"]);
  const long = "в".repeat(100);
  click(doc, card(23, "edit"));
  submit(doc, { title: long, priority: "high" });
  same(requireNode(doc, '[data-task-id="23"] .task-title').textContent, long);
  same(requireNode(doc, '[data-task-id="23"] .task-priority').textContent, "Высокий");
  click(doc, card(37, "delete"));
  same(visibleIds(doc), [11, 23, 41, 58, 64, 75]);
  same(stats(doc), ["6", "1", "5", "16.7%", "6"]);
  doc = await freshApp({ dataset: "variant", keepStorage: true });
  same(visibleIds(doc), [11, 23, 41, 58, 64, 75]);
  same(stats(doc), ["6", "1", "5", "16.7%", "6"]);
  same(requireNode(doc, '[data-task-id="23"] .task-title').textContent, long);
  same(localStorage.getItem(keyFor("demo")), null, "общий набор не должен измениться");
  click(doc, "#reset-data");
  same(visibleIds(doc), [11, 23, 37, 41, 58, 64]);
  same(localStorage.getItem(keyFor("variant")), null);
  same(requireNode(doc, "#dataset-label").textContent, "Индивидуальный вариант: 2");
});

// ---------- Расширение: черновик формы ----------

await check("Расширение 1: черновик восстанавливается после перезагрузки и не меняет задачи", async () => {
  let doc = await freshApp({ draft: true });
  fill(doc, { id: 55, title: "Недописанная задача", priority: "high" });
  doc = await freshApp({ keepStorage: true, draft: true });
  same(formValues(doc), ["55", "Недописанная задача", "high"]);
  same(visibleIds(doc), [1, 4, 7, 10]);
  same(localStorage.getItem(keyFor()), null, "черновик не должен создавать запись задач");
});

await check("Расширение 2: успешное добавление очищает черновик, сброс тоже", async () => {
  let doc = await freshApp({ draft: true });
  fill(doc, { id: 55, title: "Будет добавлена", priority: "low" });
  assert(localStorage.getItem(draftKeyFor()) !== null, "черновик должен быть записан при вводе");
  requireNode(doc, "#task-form").requestSubmit();
  same(visibleIds(doc), [1, 4, 7, 10, 55]);
  same(localStorage.getItem(draftKeyFor()), null);
  same(formValues(doc), ["", "", "medium"]);
  doc = await freshApp({ keepStorage: true, draft: true });
  same(formValues(doc), ["", "", "medium"]);
  fill(doc, { id: 60, title: "Для сброса" });
  assert(localStorage.getItem(draftKeyFor()) !== null);
  click(doc, "#reset-data");
  same(localStorage.getItem(draftKeyFor()), null);
  same(formValues(doc), ["", "", "medium"]);
});

await check("Расширение 3: режим редактирования не читает и не меняет черновик", async () => {
  const doc = await freshApp({ draft: true });
  fill(doc, { id: 70, title: "Черновик создания", priority: "high" });
  const before = localStorage.getItem(draftKeyFor());
  click(doc, card(4, "edit"));
  same(formValues(doc), ["4", "Подготовить модель задач", "high"]);
  inputValue(doc, "#task-title", "Правка существующей");
  same(localStorage.getItem(draftKeyFor()), before, "правка не должна менять черновик");
  click(doc, "#cancel-edit");
  same(formValues(doc), ["70", "Черновик создания", "high"]);
  same(visibleIds(doc), [1, 4, 7, 10]);
});

await check("Расширение 4: повреждённый черновик удаляется, форма пуста, предупреждение показано", async () => {
  let doc = await freshApp({ draft: true, rawDraft: "{broken" });
  same(formValues(doc), ["", "", "medium"]);
  assert(status(doc).classList.contains("is-warning"));
  same(localStorage.getItem(draftKeyFor()), null);
  doc = await freshApp({
    draft: true,
    rawDraft: JSON.stringify({ version: 1, draft: { id: "5", title: "ok", priority: "urgent" } }),
  });
  same(formValues(doc), ["", "", "medium"]);
  same(localStorage.getItem(draftKeyFor()), null);
});

await check("Расширение 5: у общего набора и варианта разные черновики", async () => {
  let doc = await freshApp({ draft: true });
  fill(doc, { id: 81, title: "Черновик общего набора" });
  doc = await freshApp({ dataset: "variant", draft: true });
  same(formValues(doc), ["", "", "medium"]);
  fill(doc, { id: 82, title: "Черновик варианта" });
  doc = await freshApp({ keepStorage: true, draft: true });
  same(formValues(doc), ["81", "Черновик общего набора", "medium"]);
  doc = await freshApp({ dataset: "variant", keepStorage: true, draft: true });
  same(formValues(doc), ["82", "Черновик варианта", "medium"]);
});

cleanup();
fixtureRoot.replaceChildren();
const conclusion = `Всего: ${passed + failed}. Пройдено: ${passed}. Ошибок: ${failed}.`;
summary.textContent = conclusion;
summary.className = failed === 0 ? "check-pass" : "check-fail";
log.textContent = `${transcript.join("\n")}\n\n${conclusion}`;
document.documentElement.dataset.checksDone = "true";
