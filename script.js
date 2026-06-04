let todoLists = [
  {
    name: "My Tasks",
    tasks: [
      {
        text: "Review today's tasks",
        complete: false,
        important: true,
        date: new Date().toISOString().slice(0, 10),
        time: "",
        alarmEnabled: true,
        alarmLastTriggered: ""
      },
      {
        text: "Check email inbox",
        complete: false,
        important: false,
        date: "",
        time: "",
        alarmEnabled: false,
         alarmLastTriggered: ""
      }
    ]
  }
];

let currentListIndex = 0;
let editTaskIndex = null;
let draggingTaskIndex = null;

const confirmModal = document.getElementById("confirm-modal");
const modalTitle = document.getElementById("modal-title");
const modalMessage = document.getElementById("modal-message");
const modalCancel = document.getElementById("modal-cancel");
const modalConfirm = document.getElementById("modal-confirm");
const newTaskText = document.getElementById("new-task-text");
const newTaskDate = document.getElementById("new-task-date");
const newTaskTime = document.getElementById("new-task-time");
const newTaskAlarm = document.getElementById("new-task-alarm");
const newListName = document.getElementById("new-list-name");
const listSelect = document.getElementById("list-select");
const createListButton = document.getElementById("create-list-button");
const deleteListButton = document.getElementById("delete-list-button");
const addTaskButton = document.getElementById("new-task-button");
const cancelEditButton = document.getElementById("cancel-edit-button");

let confirmAction = null;
let alarmAudioContext = null;
let alarmAudioUnlocked = false;

const unlockAlarmAudio = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext || alarmAudioUnlocked) return;

  alarmAudioContext = new AudioContext();
  if (alarmAudioContext.state === "suspended") {
    alarmAudioContext.resume();
  }

  alarmAudioUnlocked = true;
};

document.addEventListener("click", unlockAlarmAudio, { once: true, capture: true });
document.addEventListener("keydown", unlockAlarmAudio, { once: true, capture: true });

const showAlertModal = (title, message) => {
  modalTitle.innerText = title;
  modalMessage.innerText = message;

  modalCancel.style.display = "none";
  modalConfirm.innerText = "OK";
  confirmAction = null;

  confirmModal.classList.remove("hidden");
};

const openConfirmModal = (title, message, onConfirm) => {
  modalTitle.innerText = title;
  modalMessage.innerText = message;

  modalCancel.style.display = "inline-block";
  modalConfirm.innerText = "Delete";

  confirmAction = onConfirm;
  confirmModal.classList.remove("hidden");
};

const closeConfirmModal = () => {
  confirmModal.classList.add("hidden");
  confirmAction = null;
};

modalCancel.onclick = closeConfirmModal;
modalConfirm.onclick = () => {
  if (confirmAction) confirmAction();
  closeConfirmModal();
};

const getCurrentList = () => todoLists[currentListIndex];
const getCurrentTasks = () => getCurrentList().tasks;

const addTask = () => {
  const text = newTaskText.value.trim();
  const date = newTaskDate ? newTaskDate.value : "";
  const time = newTaskTime ? newTaskTime.value : "";
  const alarmEnabled = newTaskAlarm ? newTaskAlarm.checked : false;

  if (!text) {
    showAlertModal("Add task", "Please enter a task before adding.");
    return;
  }

  getCurrentTasks().push({
    text,
    complete: false,
    important: false,
    date,
    time,
    alarmEnabled,
    alarmLastTriggered: ""
  });

  resetTaskForm();
  saveLists();
  updateTodoList();
};

const saveEditedTask = () => {
  const text = newTaskText.value.trim();
  const date = newTaskDate ? newTaskDate.value : "";
  const time = newTaskTime ? newTaskTime.value : "";
  const alarmEnabled = newTaskAlarm ? newTaskAlarm.checked : false;

  if (!text) {
    showAlertModal("Save task", "Please enter a task before saving.");
    return;
  }

  const currentTasks = getCurrentTasks();
  const originalTask = currentTasks[editTaskIndex];
  const alarmChanged =
    originalTask.alarmEnabled !== alarmEnabled ||
    originalTask.time !== time ||
    originalTask.date !== date;
  currentTasks[editTaskIndex] = {
    ...currentTasks[editTaskIndex],
    text,
    date,
    time,
    alarmEnabled,
    alarmLastTriggered:
      alarmChanged && alarmEnabled ? "" : currentTasks[editTaskIndex].alarmLastTriggered
  };

  resetTaskForm();
  saveLists();
  updateTodoList();
};

const resetTaskForm = () => {
  newTaskText.value = "";
  if (newTaskDate) newTaskDate.value = "";
  if (newTaskTime) newTaskTime.value = "";
  if (newTaskAlarm) newTaskAlarm.checked = false;
  editTaskIndex = null;
  addTaskButton.innerText = "Add task";
  cancelEditButton.classList.add("hidden");
};

const handleTaskForm = () => {
  if (editTaskIndex !== null) {
    saveEditedTask();
    return;
  }

  addTask();
};

const deleteTask = (index) => {
  openConfirmModal(
    "Delete task",
    "Are you sure you want to delete this task?",
    () => {
      getCurrentTasks().splice(index, 1);
      saveLists();
      updateTodoList();
    }
  );
};

const editTask = (index) => {
  const task = getCurrentTasks()[index];
  newTaskText.value = task.text;
  if (newTaskDate) newTaskDate.value = task.date || "";
  if (newTaskTime) newTaskTime.value = task.time || "";
  if (newTaskAlarm) newTaskAlarm.checked = Boolean(task.alarmEnabled);
  editTaskIndex = index;
  addTaskButton.innerText = "Save task";
  cancelEditButton.classList.remove("hidden");
};

const createList = () => {
  const listName = newListName.value.trim();

  if (!listName) {
    showAlertModal("Create list", "Please enter a name for the list.");
    return;
  }

  todoLists.push({
    name: listName,
    tasks: []
  });

  currentListIndex = todoLists.length - 1;
  newListName.value = "";

  saveLists();
  updateListSelector();
  updateTodoList();
};

const deleteCurrentList = () => {
  if (todoLists.length === 1) {
    showAlertModal("Cannot delete list", "At least one task list must remain.");
    return;
  }

  const listName = getCurrentList().name;

  openConfirmModal(
    "Delete list",
    `Are you sure you want to delete the list "${listName}"?`,
    () => {
      todoLists.splice(currentListIndex, 1);
      if (currentListIndex >= todoLists.length) {
        currentListIndex = todoLists.length - 1;
      }
      saveLists();
      updateListSelector();
      updateTodoList();
    }
  );
};

const switchList = () => {
  currentListIndex = Number(listSelect.value);
  saveLists();
  updateTodoList();
};

const updateListSelector = () => {
  listSelect.innerHTML = "";
  for (const [index, list] of todoLists.entries()) {
    const option = document.createElement("option");
    option.value = index;
    option.innerText = list.name;
    if (index === currentListIndex) option.selected = true;
    listSelect.appendChild(option);
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const formatScheduleText = (dateString, timeString) => {
  const parts = [];
  if (dateString) parts.push(formatDate(dateString));
  if (timeString) parts.push(timeString);
  return parts.join(" • ");
};

const getListSummary = () => {
  const tasks = getCurrentTasks();
  return {
    total: tasks.length,
    completed: tasks.filter((task) => task.complete).length,
    important: tasks.filter((task) => task.important).length,
    alarms: tasks.filter((task) => task.alarmEnabled).length
  };
};

const updateListOverview = () => {
  const overview = document.getElementById("list-overview");
  const currentList = getCurrentList();
  const { total, completed, important, alarms } = getListSummary();
  const active = total - completed;
  overview.innerHTML = `
    <div class="overview-row">
      <div>
        <p class="overview-label">Current list</p>
        <strong>${currentList.name}</strong>
      </div>
      <div class="overview-pill">${active} active</div>
      <div class="overview-pill">${completed} done</div>
      <div class="overview-pill">${important} important</div>
      <div class="overview-pill">${alarms} alarms</div>
    </div>`;
};

const updateTodoList = () => {
  const todoList = document.getElementById("todo-list");
  const currentTasks = getCurrentTasks();

  todoList.innerHTML = "";
  if (!currentTasks.length) {
    const emptyState = document.createElement("li");
    emptyState.className = "empty-state";
    emptyState.innerText = "No tasks. Add your first task.";
    todoList.appendChild(emptyState);
  } else {
    currentTasks.forEach((task, index) => {
      todoList.appendChild(createNewTodoItemElement(task, index));
    });
  }

  updateListOverview();
};

const createNewTodoItemElement = (task, index) => {
  const currentTasks = getCurrentTasks();
  const li = document.createElement("li");
  const p = document.createElement("p");
  p.innerText = task.text;
  if (task.complete) p.classList.add("complete");
  if (task.important) p.classList.add("important");

  const buttonsContainer = document.createElement("div");
  buttonsContainer.classList.add("task-buttons");

  const scheduleElement = document.createElement("span");
  scheduleElement.classList.add("due-date");
  if (task.alarmEnabled) scheduleElement.classList.add("alarm-set");

  if (task.date || task.time) {
    if (task.date) {
      const dateLine = document.createElement("span");
      dateLine.className = "due-date-line due-date-date";
      dateLine.innerText = formatDate(task.date);
      scheduleElement.appendChild(dateLine);
    }

    if (task.time) {
      const timeLine = document.createElement("span");
      timeLine.className = "due-date-line due-date-time";
      timeLine.innerText = task.time;
      scheduleElement.appendChild(timeLine);
    }
  } else {
    scheduleElement.innerText = "No schedule";
  }

  if (task.date && !task.complete) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [y, m, d] = task.date.split("-").map(Number);
    const dueDate = new Date(y, m - 1, d);
    dueDate.setHours(0, 0, 0, 0);
    if (dueDate < today) {
      scheduleElement.classList.add("overdue");
    } else if (dueDate.getTime() === today.getTime()) {
      scheduleElement.classList.add("due-today");
    }
  }

  li.draggable = true;
  li.addEventListener("dragstart", (event) => {
    draggingTaskIndex = index;
    li.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    try {
      event.dataTransfer.setData("text/plain", "");
    } catch (err) {
      // Some browsers require setData for drag to work.
    }
  });

  li.addEventListener("dragend", () => {
    draggingTaskIndex = null;
    li.classList.remove("dragging");
    document.querySelectorAll(".drag-over").forEach((item) => item.classList.remove("drag-over"));
  });

  li.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  });

  li.addEventListener("dragenter", () => {
    if (index !== draggingTaskIndex) {
      li.classList.add("drag-over");
    }
  });

  li.addEventListener("dragleave", () => {
    li.classList.remove("drag-over");
  });

  li.addEventListener("drop", (event) => {
    event.preventDefault();
    event.stopPropagation();
    li.classList.remove("drag-over");
    if (draggingTaskIndex === null || draggingTaskIndex === index) return;

    const rect = li.getBoundingClientRect();
    const dropAfter = event.clientY > rect.top + rect.height / 2;
    let targetIndex = index + (dropAfter ? 1 : 0);
    if (draggingTaskIndex < targetIndex) targetIndex -= 1;
    moveTaskToIndex(draggingTaskIndex, targetIndex);
  });

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "secondary-button desktop-only";
  editBtn.innerText = "Edit";
  editBtn.addEventListener("click", () => editTask(index));

  const editIconBtn = document.createElement("button");
  editIconBtn.type = "button";
  editIconBtn.className = "icon-button edit-button mobile-only";
  editIconBtn.innerText = "✏️";
  editIconBtn.title = "Edit";
  editIconBtn.dataset.tooltip = "Edit";
  editIconBtn.addEventListener("click", () => editTask(index));

  const importantBtn = document.createElement("button");
  importantBtn.type = "button";
  importantBtn.className = "secondary-button desktop-only";
  importantBtn.innerText = task.important ? "Unmark" : "Important";
  importantBtn.addEventListener("click", () => toggleImportant(index));

  const importantIconBtn = document.createElement("button");
  importantIconBtn.type = "button";
  importantIconBtn.className = "icon-button important-button mobile-only";
  importantIconBtn.innerText = "❗";
  importantIconBtn.title = "Mark as important";
  importantIconBtn.dataset.tooltip = "Mark as important";
  if (task.important) importantIconBtn.classList.add("active");
  importantIconBtn.addEventListener("click", () => toggleImportant(index));

  const desktopCompleteLabel = document.createElement("label");
  desktopCompleteLabel.className = "complete-checkbox desktop-only";
  desktopCompleteLabel.title = task.complete ? "Mark as not done" : "Mark as done";
  desktopCompleteLabel.dataset.tooltip = task.complete ? "Mark as not done" : "Mark as done";
  const desktopCompleteInput = document.createElement("input");
  desktopCompleteInput.type = "checkbox";
  desktopCompleteInput.checked = task.complete;
  desktopCompleteInput.addEventListener("change", () => toggleComplete(index));
  desktopCompleteLabel.appendChild(desktopCompleteInput);
  desktopCompleteLabel.appendChild(document.createElement("span"));

  const completeLabel = document.createElement("label");
  completeLabel.className = "complete-checkbox mobile-only";
  completeLabel.title = task.complete ? "Mark as not done" : "Mark as done";
  completeLabel.dataset.tooltip = task.complete ? "Mark as not done" : "Mark as done";
  const completeInput = document.createElement("input");
  completeInput.type = "checkbox";
  completeInput.checked = task.complete;
  completeInput.addEventListener("change", () => toggleComplete(index));
  completeLabel.appendChild(completeInput);
  completeLabel.appendChild(document.createElement("span"));

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "delete-task-btn";
  deleteBtn.innerText = "×";
  deleteBtn.title = "Delete";
  deleteBtn.dataset.tooltip = "Delete";
  deleteBtn.addEventListener("click", () => deleteTask(index));

  li.appendChild(desktopCompleteLabel);
  li.appendChild(completeLabel);
  li.appendChild(p);
  li.appendChild(deleteBtn);
  buttonsContainer.appendChild(scheduleElement);
  buttonsContainer.appendChild(editBtn);
  buttonsContainer.appendChild(editIconBtn);
  buttonsContainer.appendChild(importantBtn);
  buttonsContainer.appendChild(importantIconBtn);

  li.appendChild(buttonsContainer);

  return li;
};

const moveTaskUp = (index) => {
  const currentTasks = getCurrentTasks();
  if (index === 0) return;
  [currentTasks[index - 1], currentTasks[index]] = [currentTasks[index], currentTasks[index - 1]];
  saveLists();
  updateTodoList();
};

const moveTaskDown = (index) => {
  const currentTasks = getCurrentTasks();
  if (index === currentTasks.length - 1) return;
  [currentTasks[index + 1], currentTasks[index]] = [currentTasks[index], currentTasks[index + 1]];
  saveLists();
  updateTodoList();
};

const toggleComplete = (index) => {
  const currentTasks = getCurrentTasks();
  currentTasks[index].complete = !currentTasks[index].complete;
  saveLists();
  updateTodoList();
};

const toggleImportant = (index) => {
  const currentTasks = getCurrentTasks();
  currentTasks[index].important = !currentTasks[index].important;
  saveLists();
  updateTodoList();
};

const moveTaskToIndex = (fromIndex, toIndex) => {
  const tasks = getCurrentTasks();
  if (fromIndex === toIndex || fromIndex < 0 || fromIndex >= tasks.length || toIndex < 0 || toIndex > tasks.length) {
    return;
  }

  const [movedTask] = tasks.splice(fromIndex, 1);
  tasks.splice(toIndex, 0, movedTask);
  saveLists();
  updateTodoList();
};

const saveLists = () => {
  localStorage.setItem("todoLists", JSON.stringify(todoLists));
  localStorage.setItem("currentListIndex", currentListIndex);
};

const loadLists = () => {
  const savedLists = localStorage.getItem("todoLists");
  const savedCurrentListIndex = localStorage.getItem("currentListIndex");
  if (savedLists) {
    todoLists = JSON.parse(savedLists);
  }
  if (savedCurrentListIndex !== null) {
    currentListIndex = Number(savedCurrentListIndex);
  }
  if (!todoLists.length) {
    todoLists = [
      {
        name: "My Tasks",
        tasks: []
      }
    ];
    currentListIndex = 0;
  }
  todoLists = todoLists.map((list) => ({
    name: list.name || "Untitled list",
    tasks: (list.tasks || []).map((task) => ({
      text: task.text || "",
      complete: Boolean(task.complete),
      important: Boolean(task.important),
      date: task.date || "",
      time: task.time || "",
      alarmEnabled: Boolean(task.alarmEnabled),
      alarmLastTriggered: task.alarmLastTriggered || ""
    }))
  }));
  if (currentListIndex >= todoLists.length) {
    currentListIndex = 0;
  }
};

const playAlarmSound = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const ctx = alarmAudioContext || new AudioContext();
  if (ctx.state === "suspended") {
    ctx.resume();
  }

  if (!alarmAudioContext) {
    alarmAudioContext = ctx;
  }

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(880, ctx.currentTime);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.02, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.02);

  oscillator.start(ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
  oscillator.stop(ctx.currentTime + 1.2);
};

const checkAlarms = () => {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const dueTask = getCurrentTasks().find((task) => {
    if (!task.alarmEnabled || task.complete || !task.time) return false;
    if (task.alarmLastTriggered === today) return false;

    const [hour, minute] = task.time.split(":").map(Number);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return false;

    const alarmTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
    return now >= alarmTime;
  });

  if (!dueTask) return;

  playAlarmSound();
  dueTask.alarmLastTriggered = today;
  saveLists();
  updateTodoList();
  showAlertModal("Alarm", `Task "${dueTask.text}" is due!`);
};

newTaskText.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    handleTaskForm();
  }
});

newListName.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    createList();
  }
});

createListButton.addEventListener("click", createList);
deleteListButton.addEventListener("click", deleteCurrentList);
addTaskButton.addEventListener("click", handleTaskForm);
cancelEditButton.addEventListener("click", resetTaskForm);
listSelect.addEventListener("change", switchList);

loadLists();
updateListSelector();
updateTodoList();
checkAlarms();
setInterval(checkAlarms, 15000);
