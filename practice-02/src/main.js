import { demoTasks, variantNumber, variantTasks } from "./data.js";
import {
  findTaskById,
  getTaskStats,
  addTask,
  setTaskCompleted,
  renameTask,
  removeTask,
} from "./task-service.js";
import { searchTasks } from "./task-extra.js";

// ---------- Вспомогательные функции вывода (расчёты делает task-service.js) ----------

function formatStats(tasks) {
  const { total, completed, pending, progress } = getTaskStats(tasks);
  if (total === 0) return "Задач пока нет";
  return `всего ${total} / выполнено ${completed} / осталось ${pending} / прогресс ${progress.toFixed(1)}%`;
}

function printSummary(title, tasks) {
  console.log(`${title}: ${formatStats(tasks)}`);
}

// Применяет результат операции. Состояние заменяется только при result.ok === true,
// иначе выводится причина отказа, а текущее состояние остаётся прежним.
function applyResult(title, currentTasks, result) {
  if (!result.ok) {
    console.log(`${title}: ОТКАЗ — ${result.error}`);
    printSummary("  состояние не изменилось", currentTasks);
    return currentTasks;
  }
  printSummary(title, result.tasks);
  return result.tasks;
}

// Снимок для проверки неизменности: строка JSON до начала сценария.
const snapshot = (tasks) => JSON.stringify(tasks);

// ---------- Общий сценарий (demoTasks) ----------

console.log("=== Общий сценарий (demoTasks) ===");
const demoBefore = snapshot(demoTasks);

let currentTasks = demoTasks;
printSummary("Исходный набор", currentTasks);
currentTasks = applyResult("Добавление id 20", currentTasks, addTask(currentTasks, 20, "Добавить проверку", "high"));
currentTasks = applyResult("Выполнение id 4", currentTasks, setTaskCompleted(currentTasks, 4, true));
currentTasks = applyResult(
  "Переименование id 10",
  currentTasks,
  renameTask(currentTasks, 10, "Подготовить инструкцию запуска"),
);
currentTasks = applyResult("Удаление id 7", currentTasks, removeTask(currentTasks, 7));

console.log("Идентификаторы итогового списка:", currentTasks.map((task) => task.id));
console.log("Название задачи 10 теперь:", findTaskById(currentTasks, 10).title);

console.log("--- Обработанные отказы ---");
currentTasks = applyResult("Повторное добавление id 4", currentTasks, addTask(currentTasks, 4, "Дубликат"));
currentTasks = applyResult("Статус строкой \"false\" для id 4", currentTasks, setTaskCompleted(currentTasks, 4, "false"));
currentTasks = applyResult("Удаление несуществующего id 777", currentTasks, removeTask(currentTasks, 777));

console.log("--- Сохранность исходных данных ---");
console.log("demoTasks не изменился:", snapshot(demoTasks) === demoBefore);
console.log("Итоговый список — другой массив, чем demoTasks:", currentTasks !== demoTasks);
console.table(currentTasks);

// ---------- Индивидуальный вариант ----------

console.log(`\n=== Индивидуальный вариант ${variantNumber} (variantTasks) ===`);
const variantBefore = snapshot(variantTasks);

let variantState = variantTasks;
printSummary("Шесть исходных задач", variantState);
variantState = applyResult(
  "Добавление id 80 (medium)",
  variantState,
  addTask(variantState, 80, "Раздать материалы слушателям", "medium"),
);
// Задача 11 уже выполнена: повторная установка того же статуса всё равно успешна.
variantState = applyResult("Установка completed = true для id 11", variantState, setTaskCompleted(variantState, 11, true));
variantState = applyResult(
  "Переименование id 23",
  variantState,
  renameTask(variantState, 23, "Составить подробный план доклада"),
);
variantState = applyResult("Удаление id 37", variantState, removeTask(variantState, 37));
variantState = applyResult(
  "Повторное добавление id 80",
  variantState,
  addTask(variantState, 80, "Раздать материалы слушателям", "medium"),
);

console.log("Итоговые id:", variantState.map((task) => task.id));
console.table(variantState);
console.log("variantTasks не изменился:", snapshot(variantTasks) === variantBefore);

// ---------- Расширение: поиск (src/task-extra.js) ----------

console.log("\n=== Расширение: searchTasks ===");
for (const query of [" ФУНК ", "readme", "", "   ", "нет такого"]) {
  const found = searchTasks(demoTasks, query);
  console.log(`Запрос ${JSON.stringify(query)} -> id: [${found.map((task) => task.id).join(", ")}]`);
}
