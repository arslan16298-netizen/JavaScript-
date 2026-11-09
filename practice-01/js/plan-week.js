"use strict";

// Расширение (вариант Б). План по календарным дням с выходными.
// Первый день — понедельник. Суббота и воскресенье — выходные: задачи не выполняются.
// dailyLimit действует только в рабочие дни.
// Вариант 2: 15 задач, выполнено 0, не больше 4 задач в день.
const totalTasks = 15;
const completedTasks = 0;
const dailyLimit = 4;

const dayNames = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

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
  errorMessage = "Ошибка: dailyLimit должен быть от 1 до 1000";
}

if (errorMessage !== "") {
  console.log(errorMessage);
} else {
  let remaining = totalTasks - completedTasks;
  let calendarDays = 0; // сколько календарных дней прошло
  let workingDays = 0; // в скольких рабочих днях были задачи

  if (remaining === 0) {
    console.log("Все задачи уже выполнены");
  } else {
    console.log(`Осталось задач: ${remaining}`);
    // Цикл заканчивается сразу после последней задачи,
    // поэтому выходные после неё в расписание не попадают.
    while (remaining > 0) {
      calendarDays = calendarDays + 1;
      // Номер дня недели: 0 — понедельник, ..., 5 — суббота, 6 — воскресенье.
      const weekdayIndex = (calendarDays - 1) % 7;
      const dayName = dayNames[weekdayIndex];

      if (weekdayIndex >= 5) {
        console.log(`День ${calendarDays} (${dayName}): выходной`);
      } else {
        const doneToday = Math.min(dailyLimit, remaining);
        remaining = remaining - doneToday;
        workingDays = workingDays + 1;
        console.log(`День ${calendarDays} (${dayName}): выполнено ${doneToday}, осталось ${remaining}`);
      }
    }
  }
  console.log(`Рабочих дней с задачами: ${workingDays}`);
  console.log(`Календарных дней: ${calendarDays}`);
}
