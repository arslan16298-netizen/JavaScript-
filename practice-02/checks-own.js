// Собственные проверки к ПР2 (дополняют готовый checks.js, который не менялся).
// Ожидаемый результат в каждом случае записан до запуска.
import assert from "node:assert/strict";
import {
  createTask, findTaskById, getTaskStats,
  addTask, setTaskCompleted, renameTask, removeTask,
} from "./src/task-service.js";
import { searchTasks } from "./src/task-extra.js";
import { demoTasks, variantTasks } from "./src/data.js";

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

function fixture() {
  return [
    { id: 1, title: "Изучить функции", completed: true, priority: "medium" },
    { id: 4, title: "Подготовить модель задач", completed: false, priority: "high" },
    { id: 7, title: "Проверить методы массивов", completed: false, priority: "low" },
    { id: 10, title: "Оформить README", completed: true, priority: "medium" },
  ];
}

check("Свой 1. Добавление id после удаления этого же id", () => {
  const tasks = fixture();
  const removed = removeTask(tasks, 7);
  assert.equal(removed.ok, true);
  // id 7 теперь свободен, добавление должно пройти и поставить задачу в конец.
  const added = addTask(removed.tasks, 7, "Новая седьмая", "low");
  assert.equal(added.ok, true);
  assert.deepEqual(added.tasks.map((task) => task.id), [1, 4, 10, 7]);
  assert.deepEqual(tasks, fixture());
});

check("Свой 2. Изменение первой и последней записи не задевает остальные", () => {
  const tasks = fixture();
  const first = setTaskCompleted(tasks, 1, false);
  const last = renameTask(first.tasks, 10, "  Последняя  ");
  assert.equal(first.ok && last.ok, true);
  assert.deepEqual(last.tasks.map((task) => task.id), [1, 4, 7, 10]);
  assert.equal(last.tasks[0].completed, false);
  assert.equal(last.tasks[3].title, "Последняя");
  // Средние записи — те же самые объекты (не копировались), поля первой и последней сохранены.
  assert.equal(last.tasks[1], tasks[1]);
  assert.equal(last.tasks[2], tasks[2]);
  assert.equal(last.tasks[0].priority, "medium");
  assert.equal(last.tasks[3].completed, true);
  assert.deepEqual(tasks, fixture());
});

check("Свой 3. Серия обновлений и возврат к исходному состоянию", () => {
  const tasks = fixture();
  let state = tasks;
  state = setTaskCompleted(state, 4, true).tasks;
  state = setTaskCompleted(state, 4, false).tasks;
  state = renameTask(state, 7, "Временное название").tasks;
  state = renameTask(state, 7, "Проверить методы массивов").tasks;
  assert.deepEqual(state, tasks);
  assert.notEqual(state, tasks);
  assert.notEqual(state[1], tasks[1]);
  assert.deepEqual(tasks, fixture());
});

check("Свой 4. Граница длины названия считается после trim", () => {
  const edge = ` ${"x".repeat(100)} `;
  assert.equal(createTask(1, edge).ok, true);
  assert.equal(createTask(1, edge).task.title.length, 100);
  assert.equal(createTask(1, `${"x".repeat(101)} `).ok, false);
  assert.equal(createTask(1, "a  b").task.title, "a  b");
});

check("Свой 5. Сообщения об ошибках разные для разных причин", () => {
  const messages = new Set([
    createTask("1", "Название").error,
    createTask(1.5, "Название").error,
    createTask(-1, "Название").error,
    createTask(1, 5).error,
    createTask(1, "").error,
    createTask(1, "x".repeat(101)).error,
    createTask(1, "Название", "urgent").error,
  ]);
  assert.equal(messages.size, 7);
});

check("Свой 6. Вариант 2: исходные данные и сводка", () => {
  assert.deepEqual(variantTasks.map((task) => task.id), [11, 23, 37, 41, 58, 64]);
  assert.deepEqual(variantTasks.map((task) => task.completed), [true, false, false, false, false, false]);
  assert.deepEqual(new Set(variantTasks.map((task) => task.priority)), new Set(["low", "medium", "high"]));
  const stats = getTaskStats(variantTasks);
  assert.deepEqual({ ...stats, progress: undefined }, { total: 6, completed: 1, pending: 5, progress: undefined });
  assert.equal(stats.progress.toFixed(1), "16.7");
});

check("Свой 7. Вариант 2: сценарий с промежуточными сводками (ожидания рассчитаны заранее)", () => {
  const expected = [
    ["16.7", 6, 1], ["14.3", 7, 1], ["14.3", 7, 1], ["14.3", 7, 1], ["16.7", 6, 1],
  ];
  const steps = [
    (s) => addTask(s, 80, "Раздать материалы слушателям", "medium"),
    (s) => setTaskCompleted(s, 11, true),
    (s) => renameTask(s, 23, "Составить подробный план доклада"),
    (s) => removeTask(s, 37),
  ];
  let state = variantTasks;
  const seen = [getTaskStats(state)];
  for (const step of steps) {
    const result = step(state);
    assert.equal(result.ok, true);
    state = result.tasks;
    seen.push(getTaskStats(state));
  }
  seen.forEach((stats, index) => {
    assert.equal(stats.progress.toFixed(1), expected[index][0]);
    assert.equal(stats.total, expected[index][1]);
    assert.equal(stats.completed, expected[index][2]);
  });
  assert.equal(addTask(state, 80, "Ещё раз").ok, false);
  assert.deepEqual(state.map((task) => task.id), [11, 23, 41, 58, 64, 80]);
  assert.equal(variantTasks.length, 6);
  assert.equal(findTaskById(variantTasks, 37).title, "Подготовить слайды");
});

check("Расширение 1. Пример из методички: ' ФУНК ' находит id = 1", () => {
  assert.deepEqual(searchTasks(demoTasks, " ФУНК ").map((task) => task.id), [1]);
});

check("Расширение 2. Регистр, порядок и несколько совпадений", () => {
  const found = searchTasks(demoTasks, "ПРОВЕРИТЬ");
  assert.deepEqual(found.map((task) => task.id), [7]);
  assert.deepEqual(searchTasks(demoTasks, "по").map((task) => task.id), [4]);
  // «ить» встречается во всех четырёх названиях: порядок как в исходном списке.
  assert.deepEqual(searchTasks(demoTasks, "ить").map((task) => task.id), [1, 4, 7, 10]);
});

check("Расширение 3. Пустой и пробельный запрос, отсутствие совпадений, не строка", () => {
  assert.deepEqual(searchTasks(demoTasks, "").map((task) => task.id), [1, 4, 7, 10]);
  assert.deepEqual(searchTasks(demoTasks, "    ").map((task) => task.id), [1, 4, 7, 10]);
  assert.notEqual(searchTasks(demoTasks, ""), demoTasks);
  assert.deepEqual(searchTasks(demoTasks, "яяя"), []);
  assert.deepEqual(searchTasks([], "а"), []);
  assert.deepEqual(searchTasks(demoTasks, null), []);
  assert.deepEqual(searchTasks(demoTasks, 5), []);
});

check("Расширение 4. Поиск не меняет данные и возвращает те же объекты", () => {
  const tasks = Object.freeze(fixture().map((task) => Object.freeze(task)));
  const found = searchTasks(tasks, "README");
  assert.equal(found[0], tasks[3]);
  assert.deepEqual(tasks, fixture());
});

console.log(`\nСобственных проверок пройдено: ${passed}; не пройдено: ${failed}.`);
if (failed > 0) process.exitCode = 1;
