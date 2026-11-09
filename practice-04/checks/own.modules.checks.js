// Мои собственные проверки модулей ПР4 (Node.js, без пакетов). Ожидания записаны до запуска.
// Запуск: npm run check:own
import assert from "node:assert/strict";
import { updateTask } from "../src/task-service.js";
import { validateTaskDraft } from "../src/form-validation.js";
import { STORAGE_VERSION, isValidTaskList, loadTasks, removeSavedTasks, saveTasks } from "../src/task-storage.js";
import { DRAFT_VERSION, loadDraft, removeDraft, saveDraft } from "../src/task-draft.js";

let passed = 0;
let failed = 0;
function check(name, action) {
  try {
    action();
    passed += 1;
    console.log(`OK: ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL: ${name}`);
    console.error(error.message);
  }
}

const fixture = () => [
  { id: 1, title: "Изучить функции", completed: true, priority: "medium" },
  { id: 4, title: "Подготовить модель задач", completed: false, priority: "high" },
  { id: 7, title: "Проверить методы массивов", completed: false, priority: "low" },
  { id: 10, title: "Оформить README", completed: true, priority: "medium" },
];

class MemoryStorage {
  constructor(entries = {}) {
    this.values = new Map(Object.entries(entries));
    this.writes = 0;
  }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.writes += 1; this.values.set(String(key), String(value)); }
  removeItem(key) { this.values.delete(String(key)); }
}

const draftOf = (id, title = "Название", priority = "low") => ({ id, title, priority });

// ---------- Граница формы ----------

check("Свой 1 (граница формы). Запись id: пробелы по краям и ведущие нули допустимы", () => {
  const result = validateTaskDraft(draftOf(" 020 "), fixture());
  assert.equal(result.ok, true);
  assert.equal(result.value.id, 20); // "020" -> 20, пробелы обрезаны
});

check("Свой 2 (граница формы). Запись id: экспонента, знак, дробь, пробел внутри и ноль отклоняются", () => {
  for (const id of ["1e3", "+5", "-5", "2.0", "1 000", "0", "00", "٣", "0x10", "NaN", "Infinity"]) {
    const result = validateTaskDraft(draftOf(id), fixture());
    assert.equal(result.ok, false, `id ${JSON.stringify(id)} должен быть отклонён`);
    assert.equal(typeof result.errors.id, "string");
  }
});

check("Свой 3 (граница формы). Безопасная граница id: 9007199254740991 принимается, на единицу больше нет", () => {
  assert.equal(validateTaskDraft(draftOf("9007199254740991"), fixture()).ok, true);
  assert.equal(validateTaskDraft(draftOf("9007199254740992"), fixture()).ok, false);
  assert.equal(validateTaskDraft(draftOf("99999999999999999999"), fixture()).ok, false);
});

check("Свой 4 (граница формы). Несколько ошибок собираются сразу, по одной на поле", () => {
  const result = validateTaskDraft({ id: "", title: "   ", priority: "urgent" }, fixture());
  assert.equal(result.ok, false);
  assert.deepEqual(Object.keys(result.errors).sort(), ["id", "priority", "title"]);
});

check("Свой 5 (граница формы). Название: ровно 100 после trim принимается, 101 отклоняется, внутренние пробелы сохраняются", () => {
  const hundred = `  ${"ы".repeat(100)}  `;
  assert.equal(validateTaskDraft(draftOf(20, hundred), fixture()).value.title.length, 100);
  const result = validateTaskDraft(draftOf(20, "ы".repeat(101)), fixture());
  assert.equal(result.ok, false);
  assert.ok(result.errors.title.includes("101"));
  assert.equal(validateTaskDraft(draftOf(20, "a   b"), fixture()).value.title, "a   b");
});

check("Свой 6 (редактирование). Значения из draft.id игнорируются, совпадение с собственным id не дубликат", () => {
  // id из формы чужой (1), но в режиме редактирования используется editingId = 4.
  const result = validateTaskDraft({ id: "1", title: "Новое", priority: "low" }, fixture(), 4);
  assert.equal(result.ok, true);
  assert.equal(result.value.id, 4);
  // Поле id заблокировано: в FormData его нет, draft.id === null.
  assert.equal(validateTaskDraft({ id: null, title: "Новое", priority: "low" }, fixture(), 4).ok, true);
});

check("Свой 7. updateTask: те же значения всё равно успех, новые объекты, соседи не тронуты", () => {
  const source = fixture();
  const result = updateTask(source, 7, source[2].title, source[2].priority);
  assert.equal(result.ok, true);
  assert.notEqual(result.tasks, source);
  assert.notEqual(result.tasks[2], source[2]);
  assert.deepEqual(result.tasks[2], source[2]);
  assert.equal(result.tasks[0], source[0]);
  assert.deepEqual(source, fixture());
});

// ---------- Восстановление ----------

check("Свой 8 (восстановление). Сохранить, загрузить, снова сохранить: данные не меняются", () => {
  const storage = new MemoryStorage();
  assert.deepEqual(saveTasks(storage, "k", fixture()), { ok: true });
  const first = loadTasks(storage, "k", []);
  assert.equal(first.source, "storage");
  assert.deepEqual(first.tasks, fixture());
  assert.deepEqual(saveTasks(storage, "k", first.tasks), { ok: true });
  assert.deepEqual(loadTasks(storage, "k", []).tasks, fixture());
});

check("Свой 9 (восстановление). Пустой сохранённый список — корректная запись, а не отсутствие записи", () => {
  const storage = new MemoryStorage();
  saveTasks(storage, "k", []);
  const result = loadTasks(storage, "k", fixture());
  assert.equal(result.ok, true);
  assert.equal(result.source, "storage");
  assert.deepEqual(result.tasks, []);
});

check("Свой 10 (восстановление). Лишние поля из JSON не попадают в приложение", () => {
  const raw = JSON.stringify({
    version: STORAGE_VERSION,
    tasks: [{ id: 1, title: "Задача", completed: false, priority: "low", admin: true }],
  });
  const result = loadTasks(new MemoryStorage({ k: raw }), "k", []);
  assert.equal(result.source, "storage");
  assert.deepEqual(Object.keys(result.tasks[0]), ["id", "title", "completed", "priority"]);
});

// ---------- Повреждение и исключения хранилища ----------

check("Свой 11 (повреждение). Разные неверные формы записи дают fallback и не бросают исключений", () => {
  const bad = [
    "", "null", "[]", "42", '"text"', "{}", '{"version":1}', '{"version":1,"tasks":{}}',
    '{"version":"1","tasks":[]}', '{"version":1,"tasks":[null]}', "{broken-json",
    JSON.stringify({ version: 1, tasks: [{ id: 1, title: "a", completed: false, priority: "low" }, { id: 1, title: "b", completed: false, priority: "low" }] }),
  ];
  for (const raw of bad) {
    const result = loadTasks(new MemoryStorage({ k: raw }), "k", fixture());
    assert.equal(result.ok, false, `запись ${JSON.stringify(raw)} должна быть отклонена`);
    assert.equal(result.source, "fallback");
    assert.deepEqual(result.tasks, fixture());
    assert.ok(result.error.length > 0);
  }
});

check("Свой 12 (исключения). Хранилище отсутствует или бросает исключения: ни одна функция не выпускает ошибку", () => {
  for (const storage of [undefined, null, {}, { getItem() { throw new Error("denied"); } }]) {
    assert.equal(loadTasks(storage, "k", fixture()).ok, false);
    assert.equal(saveTasks(storage, "k", fixture()).ok, false);
    assert.equal(removeSavedTasks(storage, "k").ok, false);
  }
});

check("Свой 13 (исключения). QuotaExceededError при записи: ok false, сообщение содержит причину", () => {
  const storage = { setItem() { throw new DOMException("The quota has been exceeded.", "QuotaExceededError"); } };
  const result = saveTasks(storage, "k", fixture());
  assert.equal(result.ok, false);
  assert.ok(result.error.includes("quota"));
});

check("Свой 14. Список с дубликатами id и с неверным типом не записывается", () => {
  const storage = new MemoryStorage();
  const dup = [...fixture(), { id: 4, title: "Копия", completed: false, priority: "low" }];
  assert.equal(saveTasks(storage, "k", dup).ok, false);
  assert.equal(saveTasks(storage, "k", "строка").ok, false);
  assert.equal(storage.writes, 0);
  assert.equal(isValidTaskList(dup), false);
});

// ---------- Расширение: черновик формы ----------

check("Расширение 1. Черновик: запись, чтение и удаление", () => {
  const storage = new MemoryStorage();
  assert.deepEqual(loadDraft(storage, "d"), { ok: true, draft: null });
  assert.deepEqual(saveDraft(storage, "d", draftOf("20", "Недописанное", "high")), { ok: true });
  assert.deepEqual(JSON.parse(storage.getItem("d")), { version: DRAFT_VERSION, draft: draftOf("20", "Недописанное", "high") });
  assert.deepEqual(loadDraft(storage, "d"), { ok: true, draft: draftOf("20", "Недописанное", "high") });
  assert.deepEqual(removeDraft(storage, "d"), { ok: true });
  assert.deepEqual(loadDraft(storage, "d"), { ok: true, draft: null });
});

check("Расширение 2. Повреждённый и неверный черновик: ok false, черновик не применяется", () => {
  const raws = [
    "{broken", "null", "[]", '{"version":2,"draft":{"id":"1","title":"a","priority":"low"}}',
    '{"version":1,"draft":null}', '{"version":1,"draft":{"id":1,"title":"a","priority":"low"}}',
    '{"version":1,"draft":{"id":"1","title":"a","priority":"urgent"}}',
    JSON.stringify({ version: 1, draft: { id: "1", title: "x".repeat(101), priority: "low" } }),
  ];
  for (const raw of raws) {
    const result = loadDraft(new MemoryStorage({ d: raw }), "d");
    assert.equal(result.ok, false, `запись ${raw} должна быть отклонена`);
    assert.equal(result.draft, null);
    assert.ok(result.error.length > 0);
  }
});

check("Расширение 3. Черновик не смешивается с задачами и не бросает исключений", () => {
  const storage = new MemoryStorage();
  saveTasks(storage, "tasks", fixture());
  saveDraft(storage, "tasks:draft", draftOf("5"));
  removeDraft(storage, "tasks:draft");
  assert.deepEqual(loadTasks(storage, "tasks", []).tasks, fixture());
  for (const broken of [undefined, null, {}]) {
    assert.equal(loadDraft(broken, "d").ok, false);
    assert.equal(saveDraft(broken, "d", draftOf("1")).ok, false);
    assert.equal(removeDraft(broken, "d").ok, false);
  }
  assert.equal(saveDraft(new MemoryStorage(), "d", { id: 1, title: "a", priority: "low" }).ok, false);
});

console.log(`\nСобственных проверок пройдено: ${passed}; не пройдено: ${failed}.`);
if (failed > 0) process.exitCode = 1;
