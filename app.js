const STORAGE_KEY = "workout_plan_v1";

const defaultData = {
    days: [
        {
            id: 1,
            name: "День 1 - Груди + Трицепс",
            open: true,
            exercises: [
                { id: 101, name: "Жим штанги лежачи", sets: "4x8-10", done: false },
                { id: 102, name: "Жим гантелей на нахилі", sets: "3x10-12", done: false },
                { id: 103, name: "Розведення гантелей", sets: "3x12-15", done: false },
                { id: 104, name: "Французький жим", sets: "3x10-12", done: false },
                { id: 105, name: "Віджимання на брусах", sets: "3x8-12", done: false }
            ]
        },
        {
            id: 2,
            name: "День 2 - Спина + Біцепс",
            open: false,
            exercises: [
                { id: 201, name: "Тяга штанги в нахилі", sets: "4x8-10", done: false },
                { id: 202, name: "Підтягування", sets: "4xмакс", done: false },
                { id: 203, name: "Тяга верхнього блоку", sets: "3x12-15", done: false },
                { id: 204, name: "Згинання рук зі штангою", sets: "3x10-12", done: false },
                { id: 205, name: "Молотки", sets: "3x12-15", done: false }
            ]
        },
        {
            id: 3,
            name: "День 3 - Ноги + Плечі",
            open: false,
            exercises: [
                { id: 301, name: "Присідання зі штангою", sets: "4x8-10", done: false },
                { id: 302, name: "Випади з гантелями", sets: "3x10-12", done: false },
                { id: 303, name: "Жим ногами", sets: "3x12-15", done: false },
                { id: 304, name: "Жим штанги стоячи", sets: "4x8-10", done: false },
                { id: 305, name: "Махи гантелями", sets: "3x12-15", done: false }
            ]
        }
    ]
};

let data = cloneData(defaultData);
let timerInterval = null;
let timeLeft = 0;
let isRunning = false;

const daysContainer = document.getElementById("daysContainer");
const timerDisplay = document.getElementById("timerDisplay");
const completedCount = document.getElementById("completedCount");
const progressBar = document.getElementById("progressBar");

function cloneData(value) {
    return JSON.parse(JSON.stringify(value));
}

function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
        render();
        return;
    }

    try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.days)) {
            data = parsed;
        }
    } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
        data = cloneData(defaultData);
    }

    render();
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    updateStats();
}

function render() {
    daysContainer.replaceChildren();

    if (data.days.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-day";
        empty.textContent = "План порожній. Додайте день тренування.";
        daysContainer.append(empty);
        updateStats();
        return;
    }

    data.days.forEach((day, dayIndex) => {
        const doneCount = day.exercises.filter((exercise) => exercise.done).length;
        const totalCount = day.exercises.length;
        const isComplete = doneCount === totalCount && totalCount > 0;

        const dayEl = document.createElement("article");
        dayEl.className = "day-card";

        const header = document.createElement("button");
        header.type = "button";
        header.className = `day-header${isComplete ? " complete" : ""}`;
        header.setAttribute("aria-expanded", String(Boolean(day.open)));
        header.addEventListener("click", () => toggleDay(dayIndex));

        const title = document.createElement("span");
        title.className = "day-title";
        title.textContent = day.name;

        const progress = document.createElement("span");
        progress.className = "day-progress";
        progress.textContent = `${doneCount}/${totalCount} ✓`;

        header.append(title, progress);

        const exercises = document.createElement("div");
        exercises.className = `exercises${day.open ? " open" : ""}`;

        if (day.exercises.length === 0) {
            const emptyDay = document.createElement("p");
            emptyDay.className = "empty-day";
            emptyDay.textContent = "У цьому дні ще немає вправ.";
            exercises.append(emptyDay);
        }

        day.exercises.forEach((exercise, exerciseIndex) => {
            exercises.append(createExerciseItem(exercise, dayIndex, exerciseIndex));
        });

        exercises.append(createAddExerciseForm(dayIndex));
        dayEl.append(header, exercises);
        daysContainer.append(dayEl);
    });

    updateStats();
}

function createExerciseItem(exercise, dayIndex, exerciseIndex) {
    const item = document.createElement("div");
    item.className = `exercise-item${exercise.done ? " done" : ""}`;

    const checkbox = document.createElement("button");
    checkbox.type = "button";
    checkbox.className = `checkbox${exercise.done ? " checked" : ""}`;
    checkbox.setAttribute("aria-label", `${exercise.done ? "Зняти відмітку" : "Позначити виконаною"}: ${exercise.name}`);
    checkbox.addEventListener("click", () => toggleExercise(dayIndex, exerciseIndex));

    const name = document.createElement("span");
    name.className = "exercise-name";
    name.textContent = exercise.name;

    const sets = document.createElement("span");
    sets.className = "sets-reps";
    sets.textContent = exercise.sets;

    item.append(checkbox, name, sets);
    return item;
}

function createAddExerciseForm(dayIndex) {
    const form = document.createElement("form");
    form.className = "add-form";
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        addExercise(dayIndex, form);
    });

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "Нова вправа...";
    nameInput.autocomplete = "off";
    nameInput.maxLength = 80;

    const setsInput = document.createElement("input");
    setsInput.type = "text";
    setsInput.placeholder = "Підходи";
    setsInput.autocomplete = "off";
    setsInput.maxLength = 24;

    const button = document.createElement("button");
    button.className = "btn-primary";
    button.type = "submit";
    button.textContent = "➕";
    button.setAttribute("aria-label", "Додати вправу");

    form.append(nameInput, setsInput, button);
    return form;
}

function toggleDay(dayIndex) {
    data.days[dayIndex].open = !data.days[dayIndex].open;
    saveData();
    render();
}

function toggleExercise(dayIndex, exerciseIndex) {
    data.days[dayIndex].exercises[exerciseIndex].done = !data.days[dayIndex].exercises[exerciseIndex].done;
    saveData();
    render();
}

function addExercise(dayIndex, form) {
    const [nameInput, setsInput] = form.querySelectorAll("input");
    const name = nameInput.value.trim();
    const sets = setsInput.value.trim() || "3x10";

    if (!name) {
        nameInput.focus();
        return;
    }

    data.days[dayIndex].exercises.push({
        id: Date.now(),
        name,
        sets,
        done: false
    });

    data.days[dayIndex].open = true;
    saveData();
    render();
}

function addDay() {
    const name = prompt("Назва дня (наприклад: День 4 - Кардіо):");
    const trimmedName = name ? name.trim() : "";

    if (!trimmedName) return;

    const newId = data.days.length > 0 ? Math.max(...data.days.map((day) => day.id)) + 1 : 1;

    data.days.push({
        id: newId,
        name: trimmedName,
        exercises: [],
        open: true
    });

    saveData();
    render();
}

function showModal(id) {
    document.getElementById(id).classList.add("show");
}

function closeModal(id) {
    document.getElementById(id).classList.remove("show");
}

function resetChecks() {
    data.days.forEach((day) => {
        day.exercises.forEach((exercise) => {
            exercise.done = false;
        });
    });
    saveData();
    render();
    closeModal("resetModal");
}

function clearAll() {
    data = { days: [] };
    saveData();
    render();
    closeModal("clearModal");
}

function updateStats() {
    const exercises = data.days.flatMap((day) => day.exercises);
    const total = exercises.length;
    const done = exercises.filter((exercise) => exercise.done).length;
    const percent = total > 0 ? (done / total) * 100 : 0;

    completedCount.textContent = `${done}/${total}`;
    progressBar.style.width = `${percent}%`;
}

function getTimerInputSeconds() {
    const hours = clampNumber(document.getElementById("hours").value, 0, 23);
    const minutes = clampNumber(document.getElementById("minutes").value, 0, 59);
    const seconds = clampNumber(document.getElementById("seconds").value, 0, 59);

    document.getElementById("hours").value = hours;
    document.getElementById("minutes").value = minutes;
    document.getElementById("seconds").value = seconds;

    return hours * 3600 + minutes * 60 + seconds;
}

function clampNumber(value, min, max) {
    const number = Number.parseInt(value, 10);
    if (Number.isNaN(number)) return min;
    return Math.min(Math.max(number, min), max);
}

function updateTimerDisplay() {
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;

    timerDisplay.textContent = [
        hours,
        minutes,
        seconds
    ].map((unit) => String(unit).padStart(2, "0")).join(":");
}

function startTimer() {
    if (isRunning) return;

    if (timeLeft === 0) {
        timeLeft = getTimerInputSeconds();
    }

    if (timeLeft <= 0) {
        alert("Встановіть час!");
        return;
    }

    isRunning = true;
    timerDisplay.classList.add("timer-running");

    timerInterval = window.setInterval(() => {
        timeLeft -= 1;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            pauseTimer();
            playTimerSound();
            alert("⏰ Час вийшов!");
        }
    }, 1000);
}

function pauseTimer() {
    window.clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;
    timerDisplay.classList.remove("timer-running");
}

function resetTimer() {
    pauseTimer();
    timeLeft = 0;
    updateTimerDisplay();
}

function playTimerSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.22, audioContext.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.35);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.36);
    } catch (error) {
        // Sound is optional; some browsers block audio until user interaction.
    }
}

document.getElementById("startTimer").addEventListener("click", startTimer);
document.getElementById("pauseTimer").addEventListener("click", pauseTimer);
document.getElementById("resetTimer").addEventListener("click", resetTimer);
document.getElementById("addDay").addEventListener("click", addDay);
document.getElementById("showResetModal").addEventListener("click", () => showModal("resetModal"));
document.getElementById("showClearModal").addEventListener("click", () => showModal("clearModal"));
document.getElementById("resetChecks").addEventListener("click", resetChecks);
document.getElementById("clearAll").addEventListener("click", clearAll);

document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => closeModal(button.dataset.closeModal));
});

document.querySelectorAll(".modal-overlay").forEach((modal) => {
    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal(modal.id);
    });
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeModal("resetModal");
        closeModal("clearModal");
    }
});

loadData();
updateTimerDisplay();
