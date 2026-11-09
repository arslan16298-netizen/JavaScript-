"use strict";

// Задание 4. План по дням.
// Вариант 2: 15 задач, выполнено 0, не больше 4 задач в день.
const totalTasks = 15;
const completedTasks = 0;
const dailyLimit = 4;

let errorMessage = "";

if (typeof totalTasks === "string") {
  errorMessage = "Ошибка: totalTasks — передана строка";
} else if (typeof completedTasks === "string") {
  errorMessage = "Ошибка: completedTasks — передана строка";
} else if (typeof dailyLimit === "string") {
  errorMessage = "Ошибка: dailyLimit — передана строка";
} else if (typeof totalTasks !== "number" || typeof completedTasks !== "number" || typeof dailyLimit !== "number") {
  errorMessage = "Ошибка: значения должны быть числами";
} else if (!Number.isFinite(totalTasks) || !Number.isFinite(completedTasks) || !Number.isFinite(dailyLimit)) {
  errorMessage = "Ошибка: недопустимое число (NaN или Infinity)";
} else if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks) || !Number.isInteger(dailyLimit)) {
  errorMessage = "Ошибка: дробное значение, нужны целые числа";
} else if (totalTasks < 0 || completedTasks < 0) {
  errorMessage = "Ошибка: отрицательное количество";
} else if (totalTasks > 1000) {
  errorMessage = "Ошибка: превышена граница, totalTasks не больше 1000";
} else if (completedTasks > totalTasks) {
  errorMessage = "Ошибка: выполнено больше, чем задач";
} else if (dailyLimit < 1 || dailyLimit > 1000) {
  // dailyLimit проверяется всегда, даже если задач уже не осталось.
  errorMessage = "Ошибка: dailyLimit должен быть от 1 до 1000";
}

if (errorMessage !== "") {
  // Цикл при ошибке не запускается.
  console.log(errorMessage);
} else {
  let remaining = totalTasks - completedTasks;
  let day = 0;

  if (remaining === 0) {
    console.log("Все задачи уже выполнены");
  } else {
    console.log(`Осталось задач: ${remaining}`);
    while (remaining > 0) {
      day = day + 1;
      // В последний день нельзя выполнить больше, чем осталось.
      const doneToday = Math.min(dailyLimit, remaining);
      remaining = remaining - doneToday;
      console.log(`День ${day}: выполнено ${doneToday}, осталось ${remaining}`);
    }
  }
  console.log(`Потребуется дней: ${day}`);
}
