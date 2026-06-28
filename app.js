const STORAGE_KEY = "workout_plan_v2";

const defaultData = {
    days: []
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
    sets.textContent = formatExerciseVolume(exercise);

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
    setsInput.type = "number";
    setsInput.placeholder = "Підходи";
    setsInput.autocomplete = "off";
    setsInput.min = "1";
    setsInput.max = "99";
    setsInput.inputMode = "numeric";
    setsInput.required = true;

    const repsInput = document.createElement("input");
    repsInput.type = "number";
    repsInput.placeholder = "Повторення";
    repsInput.autocomplete = "off";
    repsInput.min = "1";
    repsInput.max = "999";
    repsInput.inputMode = "numeric";
    repsInput.required = true;

    const weightInput = document.createElement("input");
    weightInput.type = "number";
    weightInput.placeholder = "Вага, кг";
    weightInput.autocomplete = "off";
    weightInput.min = "0";
    weightInput.max = "999";
    weightInput.step = "0.5";
    weightInput.inputMode = "decimal";

    const button = document.createElement("button");
    button.className = "btn-primary";
    button.type = "submit";
    button.textContent = "➕";
    button.setAttribute("aria-label", "Додати вправу");

    form.append(nameInput, setsInput, repsInput, weightInput, button);
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
    const [nameInput, setsInput, repsInput, weightInput] = form.querySelectorAll("input");
    const name = nameInput.value.trim();

    if (!name) {
        nameInput.focus();
        return;
    }

    if (!setsInput.value) {
        setsInput.focus();
        return;
    }

    if (!repsInput.value) {
        repsInput.focus();
        return;
    }

    const sets = clampNumber(setsInput.value, 1, 99);
    const reps = clampNumber(repsInput.value, 1, 999);
    const weight = weightInput.value ? clampDecimal(weightInput.value, 0, 999) : null;

    data.days[dayIndex].exercises.push({
        id: Date.now(),
        name,
        sets,
        reps,
        weight,
        done: false
    });

    data.days[dayIndex].open = true;
    saveData();
    render();
}

function formatExerciseVolume(exercise) {
    if (Number.isFinite(exercise.sets) && Number.isFinite(exercise.reps)) {
        const volume = `${exercise.sets}x${exercise.reps}`;
        return Number.isFinite(exercise.weight) && exercise.weight > 0
            ? `${volume} · ${formatWeight(exercise.weight)} кг`
            : volume;
    }

    return exercise.sets || "";
}

function clampDecimal(value, min, max) {
    const number = Number.parseFloat(value);
    if (Number.isNaN(number)) return min;
    return Math.min(Math.max(number, min), max);
}

function formatWeight(weight) {
    return Number.isInteger(weight) ? String(weight) : String(weight).replace(".", ",");
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
