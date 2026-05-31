from pathlib import Path
content = '''let todoLists = [
  {
    name: "My Tasks",
    dayType: "workday",
    tasks: [
      { text: "Walk Chilli", complete: false, important: false, time: "08:30", alarmEnabled: false, alarmLastTriggered: "" },
      { text: "Make dinner", complete: false, important: false, time: "19:00", alarmEnabled: false, alarmLastTriggered: "" },
      { text: "Check mails", complete: false, important: false, time: "10:30", alarmEnabled: false, alarmLastTriggered: "" }
    ]
  }
];

let currentListIndex = 0;

const confirmModal = document.getElementById("confirm-modal");
const modalTitle = document.getElementById("modal-title");
const modalMessage = document.getElementById("modal-message");
const modalCancel = document.getElementById("modal-cancel");
const modalConfirm = document.getElementById("modal-confirm");
const listTypeSelect = document.getElementById("list-type-select");
const listOverview = document.getElementById("list-overview");
const newTaskText = document.getElementById("new-task-text");
const newTaskTime = document.getElementById("new-task-time");
const newTaskAlarm = document.getElementById("new-task-alarm");
const newListName = document.getElementById("new-list-name");
const listSelect = document.getElementById("list-select");
const createListButton = document.getElementById("create-list-button");
const deleteListButton = document.getElementById("delete-list-button");
const addTaskButton = document.getElementById("new-task-button");

let confirmAction = null;

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

modalCancel.addEventListener("click", closeConfirmModal);
modalConfirm.addEventListener("click", () => {
  if (confirmAction) {
    confirmAction();
  }
  closeConfirmModal();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeConfirmModal();
  }
});

const getCurrentList = () => todoLists[currentListIndex];
const getCurrentTasks = () => getCurrentList().tasks;

const addTask = () => {
  const text = newTaskText.value.trim();
  const time = newTaskTime.value;
  const alarmEnabled = newTaskAlarm.checked;

  if (!text) {
    showAlertModal("Add task", "Please enter a task before adding.");
    return;
  }

  getCurrentTasks().push({
    text,
    complete: false,
    important: false,
    time,
    alarmEnabled,
    alarmLastTriggered: ""
  });

  newTaskText.value = "";
  newTaskTime.value = "";
  newTaskAlarm.checked = false;
  newTaskText.focus();

  saveLists();
  updateTodoList();
};

const deleteTask = (index) => {
  openConfirmModal("Delete task", "Are you sure you want to delete this task?", () => {
    getCurrentTasks().splice(index, 1);
    saveLists();
    updateTodoList();
  });
};

const createList = () => {
  const name = newListName.value.trim();
  const dayType = listTypeSelect.value;

  if (!name) {
    showAlertModal("Create list", "Please enter a name for the list.");
    return;
  }

  todoLists.push({
    name,
    dayType,
    tasks: []
  });

  currentListIndex = todoLists.length - 1;
  newListName.value = "";
  saveLists();
  updateListSelector();
  updateListTypeInput();
  updateTodoList();
};

const deleteCurrentList = () => {
  if (todoLists.length === 1) {
    showAlertModal("Cannot delete list", "At least one task list must remain.");
    return;
  }

  const listName = getCurrentList().name;
  openConfirmModal("Delete list", `Are you sure you want to delete the list "${listName}"?`, () => {
    todoLists.splice(currentListIndex, 1);
    if (currentListIndex >= todoLists.length) {
      currentListIndex = todoLists.length - 1;
    }
    saveLists();
    updateListSelector();
    updateListTypeInput();
    updateTodoList();
  });
};

const switchList = () => {
  currentListIndex = Number(listSelect.value);
  updateListTypeInput();
  saveLists();
  updateTodoList();
};

const updateListTypeInput = () => {
  const currentList = getCurrentList();
  listTypeSelect.value = currentList.dayType || "workday";
};

const updateListSelector = () => {
  listSelect.innerHTML = "";
  todoLists.forEach((list, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.innerText = list.name;
    if (index === currentListIndex) {
      option.selected = true;
    }
    listSelect.appendChild(option);
  });
};

const getListSummary = () => {
  const tasks = getCurrentTasks();
  const total = tasks.length;
  const completed = tasks.filter((task) => task.complete).length;
  const important = tasks.filter((task) => task.important).length;
  const alarms = tasks.filter((task) => task.alarmEnabled).length;
  return { total, completed, important, alarms };
};

const updateListOverview = () => {
  const { total, completed, important, alarms } = getListSummary();
  const active = total - completed;
  const currentList = getCurrentList();
  const dayType = currentList.dayType === "weekend" ? "Weekend" : "Workday";

  listOverview.innerHTML = `
    <div class="overview-row">
      <div>
        <p class="overview-label">Current list</p>
        <strong>${currentList.name}</strong>
      </div>
      <div class="overview-pill">${dayType}</div>
      <div class="overview-pill">${active} active</div>
      <div class="overview-pill">${completed} done</div>
      <div class="overview-pill">${important} important</div>
      <div class="overview-pill">${alarms} alarms</div>
    </div>
  `;
};

const updateTodoList = () => {
  const todoList = document.getElementById("todo-list");
  const currentTasks = getCurrentTasks();
  todoList.innerHTML = "";

  if (!currentTasks.length) {
    const emptyState = document.createElement("li");
    emptyState.className = "empty-state";
    emptyState.innerText = "Список пуст. Добавьте первую задачу.";
    todoList.appendChild(emptyState);
  } else {
    const tasksWithIndex = currentTasks.map((task, index) => ({ task, index }));
    tasksWithIndex.sort((a, b) => {
      if (a.task.complete !== b.task.complete) return a.task.complete ? 1 : -1;
      if (a.task.important !== b.task.important) return a.task.important ? -1 : 1;
      if (a.task.time && b.task.time) return a.task.time.localeCompare(b.task.time);
      if (a.task.time) return -1;
      if (b.task.time) return 1;
      return 0;
    });
    tasksWithIndex.forEach(({ task, index }) => {
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

  const timeElement = document.createElement("span");
  timeElement.innerText = task.time ? task.time : "No time";
  timeElement.classList.add("due-date");
  if (task.alarmEnabled) {
    timeElement.classList.add("alarm-set");
    timeElement.innerText += " ⏰";
  }

  const moveUpBtn = document.createElement("button");
  moveUpBtn.type = "button";
  moveUpBtn.className = "small-button";
  moveUpBtn.title = "Move task up";
  moveUpBtn.innerText = "⬆";
  moveUpBtn.addEventListener("click", () => moveTaskUp(index));

  const moveDownBtn = document.createElement("button");
  moveDownBtn.type = "button";
  moveDownBtn.className = "small-button";
  moveDownBtn.title = "Move task down";
  moveDownBtn.innerText = "⬇";
  moveDownBtn.addEventListener("click", () => moveTaskDown(index));

  if (index === 0) moveUpBtn.disabled = true;
  if (index === currentTasks.length - 1) moveDownBtn.disabled = true;

  const importantBtn = document.createElement("button");
  importantBtn.type = "button";
  importantBtn.className = "secondary-button";
  importantBtn.innerText = task.important ? "Unmark" : "Important";
  importantBtn.addEventListener("click", () => toggleImportant(index));

  const completeBtn = document.createElement("button");
  completeBtn.type = "button";
  completeBtn.className = "secondary-button";
  completeBtn.innerText = task.complete ? "Undo" : "Done";
  completeBtn.addEventListener("click", () => toggleComplete(index));

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "delete-task-btn";
  deleteBtn.innerText = "Delete";
  deleteBtn.addEventListener("click", () => deleteTask(index));

  buttonsContainer.appendChild(timeElement);
  buttonsContainer.appendChild(moveUpBtn);
  buttonsContainer.appendChild(moveDownBtn);
  buttonsContainer.appendChild(importantBtn);
  buttonsContainer.appendChild(completeBtn);
  buttonsContainer.appendChild(deleteBtn);

  li.appendChild(p);
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

const saveLists = () => {
  localStorage.setItem("todoLists", JSON.stringify(todoLists));
  localStorage.setItem("currentListIndex", String(currentListIndex));
};

const loadLists = () => {
  const savedLists = localStorage.getItem("todoLists");
  const savedCurrentListIndex = localStorage.getItem("currentListIndex");

  if (savedLists) {
    todoLists = JSON.parse(savedLists);
  }

  todoLists.forEach((list) => {
    list.dayType = list.dayType || "workday";
    list.tasks = (list.tasks || []).map((task) => ({
      time: task.time || "",
      alarmEnabled: Boolean(task.alarmEnabled),
      alarmLastTriggered: task.alarmLastTriggered || "",
      complete: Boolean(task.complete),
      important: Boolean(task.important),
      text: task.text || ""
    }));
  });

  if (savedCurrentListIndex !== null) {
    currentListIndex = Number(savedCurrentListIndex);
  }

  if (!todoLists.length) {
    todoLists = [
      {
        name: "My Tasks",
        dayType: "workday",
        tasks: []
      }
    ];
    currentListIndex = 0;
  }

  if (currentListIndex >= todoLists.length) {
    currentListIndex = 0;
  }
};

const playAlarmSound = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
  osc.start(ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.1);
  osc.stop(ctx.currentTime + 1.1);

  if (ctx.state === "suspended") {
    ctx.resume();
  }
};

const checkAlarms = () => {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const currentTasks = getCurrentTasks();

  currentTasks.forEach((task) => {
    if (!task.alarmEnabled || task.complete || !task.time) return;
    if (task.alarmLastTriggered === today) return;

    const [hour, minute] = task.time.split(":").map(Number);
    const alarmMoment = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);

    if (now >= alarmMoment) {
      playAlarmSound();
      task.alarmLastTriggered = today;
      saveLists();
      updateTodoList();
    }
  });
};

listTypeSelect.addEventListener("change", (event) => {
  getCurrentList().dayType = event.target.value;
  saveLists();
  updateListOverview();
});

createListButton.addEventListener("click", createList);
deleteListButton.addEventListener("click", deleteCurrentList);
addTaskButton.addEventListener("click", addTask);
newTaskText.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    addTask();
  }
});
newListName.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    createList();
  }
});
listSelect.addEventListener("change", switchList);

loadLists();
updateListSelector();
updateListTypeInput();
updateTodoList();
checkAlarms();
setInterval(checkAlarms, 15000);
'''
Path('c:/Users/alist/Desktop/She_Codes/plus-javascript-project-templates/todo-list-starter/script.js').write_text(content, encoding='utf-8')
print('script.js overwritten successfully')
