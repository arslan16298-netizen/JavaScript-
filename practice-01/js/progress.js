"use strict";

// Задание 3. Сводка выполнения задач.
// Вариант 2: 15 задач, выполнено 0.
const totalTasks = 15;
const completedTasks = 0;

// Сначала проверяем данные. Строки в числа автоматически не переводим.
// В переменную errorMessage попадает только первая найденная ошибка.
let errorMessage = "";

if (typeof totalTasks === "string") {
  errorMessage = "Ошибка: totalTasks — передана строка";
} else if (typeof completedTasks === "string") {
  errorMessage = "Ошибка: completedTasks — передана строка";
} else if (typeof totalTasks !== "number" || typeof completedTasks !== "number") {
  errorMessage = "Ошибка: значения должны быть числами";
} else if (!Number.isFinite(totalTasks) || !Number.isFinite(completedTasks)) {
  errorMessage = "Ошибка: недопустимое число (NaN или Infinity)";
} else if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
  errorMessage = "Ошибка: дробное значение, нужны целые числа";
} else if (totalTasks < 0 || completedTasks < 0) {
  errorMessage = "Ошибка: отрицательное количество";
} else if (totalTasks > 1000) {
  errorMessage = "Ошибка: превышена граница, totalTasks не больше 1000";
} else if (completedTasks > totalTasks) {
  errorMessage = "Ошибка: выполнено больше, чем задач";
}

if (errorMessage !== "") {
  // При ошибке выводим одно сообщение и сводку не показываем.
  console.log(errorMessage);
} else if (totalTasks === 0 && completedTasks === 0) {
  // Задач нет: делить на ноль нельзя, процент не считаем.
  console.log("Задач пока нет");
} else {
  const remaining = totalTasks - completedTasks;
  const percent = (completedTasks / totalTasks) * 100;

  // Статус определяется по исходным числам, а не по округлённому проценту:
  // 1 из 1000 даёт 0.1%, но это уже "В работе", а не "Не начато".
  let status;
  if (completedTasks === 0) {
    status = "Не начато";
  } else if (completedTasks === totalTasks) {
    status = "Завершено";
  } else {
    status = "В работе";
  }

  console.log(`Всего задач: ${totalTasks}`);
  console.log(`Выполнено: ${completedTasks}`);
  console.log(`Осталось: ${remaining}`);
  console.log(`Прогресс: ${percent.toFixed(1)}%`);
  console.log(`Статус: ${status}`);
}
