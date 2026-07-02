import "./index.css";

type Task = {
  id: string;
  title: string;
  elapsedMs: number;
  isRunning: boolean;
  isDone: boolean;
  startedAt: number | null;
  createdAt: number;
};

type TaskFilter = "all" | "ongoing" | "done";

declare global {
  interface Window {
    taskierWindow?: {
      close: () => void;
      maximize: () => void;
      minimize: () => void;
    };
  }
}

const STORAGE_KEY = "taskier.tasks.v1";
let appRoot: HTMLElement | null = null;
let tasks: Task[] = loadTasks();
let ticker: number | null = null;
let addPanelOpen = false;
let addTaskDraft = "";
let shouldFocusAddInput = false;
let currentFilter: TaskFilter = "all";

const icons = {
  add: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z"/></svg>',
  alarm:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.9 2.4 3.6 6l1.3 1.5 4.3-3.6zm8.2 0-1.3 1.5 4.3 3.6L20.4 6zM12 6a7 7 0 1 0 0 14 7 7 0 0 0 0-14m1 3v4.2l3 1.8-1 1.7-4-2.4V9z"/></svg>',
  close:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6.4 5 12.7 12.7-1.4 1.4L5 6.4zm12.7 1.4L6.4 19.1 5 17.7 17.7 5z"/></svg>',
  clock:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m1 5v4.6l3.4 2-1 1.8-4.4-2.6V7z"/></svg>',
  edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16.8 15.8 5l3.2 3.2L7.2 20H4zm13-13 1.1-1.1a1.6 1.6 0 0 1 2.2 0l1 1a1.6 1.6 0 0 1 0 2.2L20.2 7z"/></svg>',
  expand:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h6v2H8.4l4.1 4.1-1.4 1.4L7 8.4V11H5zm8 0h6v6h-2V8.4l-4.1 4.1-1.4-1.4L15.6 7H13zM7 15.6l4.1-4.1 1.4 1.4L8.4 17H11v2H5v-6h2zm9.6 1.4-4.1-4.1 1.4-1.4 4.1 4.1V13h2v6h-6v-2z"/></svg>',
  check:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.4 16.2-4-4 1.4-1.4 2.6 2.6 7.8-7.8L18.6 7z"/></svg>',
  focus:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5a7 7 0 1 1 0 14 7 7 0 0 1 0-14m0-3 2 3h-4zm0 20-2-3h4zM2 12l3-2v4zm20 0-3 2v-4z"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>',
  minimize:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 11h14v2H5z"/></svg>',
  pause:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5h3v14H8zM13 5h3v14h-3z"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.2v13.6L18.8 12z"/></svg>',
  reset:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5a7 7 0 1 1-6.32 4H3l4-4 4 4H8.06A5 5 0 1 0 12 7z"/></svg>',
  resize:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h5v2H8.4l4.1 4.1-1.4 1.4L7 7.4V11H5V4zm10 9h2v7h-7v-2h3.6l-4.1-4.1 1.4-1.4 4.1 4.1z"/></svg>',
  settings:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m19.4 13.5 1.5 1.2-2 3.5-1.9-.7q-.8.6-1.7 1l-.3 2h-4l-.3-2q-.9-.4-1.7-1l-1.9.7-2-3.5 1.5-1.2a8 8 0 0 1 0-2L5.1 10.3l2-3.5 1.9.7q.8-.6 1.7-1l.3-2h4l.3 2q.9.4 1.7 1l1.9-.7 2 3.5-1.5 1.2a8 8 0 0 1 0 2M13 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6"/></svg>',
  trash:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6l1 2h4v2H4V5h4zm-2 6h10l-.7 11H7.7z"/></svg>',
};

function createDefaultTasks(): Task[] {
  const now = Date.now();

  return [
    {
      id: createId(),
      title: "1 min",
      elapsedMs: 60 * 1000,
      isRunning: false,
      isDone: false,
      startedAt: null,
      createdAt: now,
    },
    {
      id: createId(),
      title: "3 min",
      elapsedMs: 3 * 60 * 1000,
      isRunning: false,
      isDone: false,
      startedAt: null,
      createdAt: now - 1,
    },
    {
      id: createId(),
      title: "5 min",
      elapsedMs: 5 * 60 * 1000,
      isRunning: false,
      isDone: false,
      startedAt: null,
      createdAt: now - 2,
    },
    {
      id: createId(),
      title: "10 min",
      elapsedMs: 10 * 60 * 1000,
      isRunning: false,
      isDone: false,
      startedAt: null,
      createdAt: now - 3,
    },
  ];
}

function loadTasks(): Task[] {
  let storedTasks: string | null = null;

  try {
    storedTasks = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    storedTasks = null;
  }

  if (!storedTasks) {
    return createDefaultTasks();
  }

  try {
    const parsedTasks = JSON.parse(storedTasks) as Task[];

    if (!Array.isArray(parsedTasks)) {
      return createDefaultTasks();
    }

    return parsedTasks.map((task) => {
      const isDone = Boolean(task.isDone);
      const isRunning = !isDone && Boolean(task.isRunning);

      return {
        ...task,
        elapsedMs: Number(task.elapsedMs) || 0,
        isDone,
        isRunning,
        startedAt: isRunning ? Number(task.startedAt) || Date.now() : null,
      };
    });
  } catch {
    return createDefaultTasks();
  }
}

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function saveTasks(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // Keep the app usable even if storage is unavailable.
  }
}

function getElapsed(task: Task): number {
  if (!task.isRunning || task.startedAt === null) {
    return task.elapsedMs;
  }

  return task.elapsedMs + Date.now() - task.startedAt;
}

function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function getProgress(task: Task): number {
  const hour = 60 * 60 * 1000;
  return Math.min((getElapsed(task) % hour) / hour, 1);
}

function createWindowButton(
  label: string,
  action: string,
  icon: string,
): string {
  return `<button class="window-button" type="button" data-action="${action}" aria-label="${label}">${icon}</button>`;
}

function createRailButton(
  label: string,
  icon: string,
  active = false,
  filter?: TaskFilter,
): string {
  const filterAttributes = filter
    ? ` data-action="set-filter" data-filter="${filter}"`
    : "";

  return `<button class="rail-button ${active ? "active" : ""}" type="button" aria-label="${label}"${filterAttributes}>${icon}</button>`;
}

function getFilteredTasks(): Task[] {
  if (currentFilter === "ongoing") {
    return tasks.filter((task) => !task.isDone);
  }

  if (currentFilter === "done") {
    return tasks.filter((task) => task.isDone);
  }

  return tasks;
}

function getFilterTitle(): string {
  if (currentFilter === "ongoing") {
    return "Ongoing";
  }

  if (currentFilter === "done") {
    return "Done";
  }

  return "All tasks";
}

function render(): void {
  if (!appRoot) {
    return;
  }

  const activeElement = document.activeElement;
  const wasTaskInputFocused =
    activeElement instanceof HTMLInputElement &&
    activeElement.id === "task-title";
  const selectionStart = wasTaskInputFocused
    ? activeElement.selectionStart
    : null;
  const selectionEnd = wasTaskInputFocused ? activeElement.selectionEnd : null;

  appRoot.innerHTML = `
    <div class="desktop-frame">
      <aside class="side-rail">
        <div class="rail-top">
          ${createRailButton("All tasks", icons.menu, currentFilter === "all", "all")}
          ${createRailButton("Ongoing tasks", icons.clock, currentFilter === "ongoing", "ongoing")}
          ${createRailButton("Done tasks", icons.check, currentFilter === "done", "done")}
        </div>
        <div class="rail-bottom">
          <button class="profile-dot" type="button" aria-label="Profile">ᛒ</button>
          ${createRailButton("Settings", icons.settings)}
        </div>
      </aside>

      <section class="workspace">
        <header class="titlebar">
          <div class="titlebar-brand">
            <span class="brand-icon">${icons.clock}</span>
            <span>${getFilterTitle()}</span>
          </div>
          <div class="window-controls">
            ${createWindowButton("Minimize", "window-minimize", icons.minimize)}
            ${createWindowButton("Maximize", "window-maximize", icons.resize)}
            ${createWindowButton("Close", "window-close", icons.close)}
          </div>
        </header>

        <section class="timer-grid" aria-label="Task timers">
          ${renderTaskCards()}
        </section>

        <div class="floating-area ${addPanelOpen ? "is-open" : ""}">
          <form class="quick-add-panel">
            <label for="task-title">New task</label>
            <div class="quick-add-row">
              <input id="task-title" name="title" type="text" placeholder="Task name" autocomplete="off" maxlength="80" value="${escapeHtml(addTaskDraft)}" />
              <button class="submit-add" type="submit">Add</button>
            </div>
          </form>
          <div class="fab-dock">
            <button class="dock-button" type="button" data-action="toggle-add" aria-label="Edit tasks">${icons.edit}</button>
            <button class="dock-button primary" type="button" data-action="toggle-add" aria-label="Add task">${icons.add}</button>
          </div>
        </div>
      </section>
    </div>
  `;

  const form = appRoot.querySelector<HTMLFormElement>(".quick-add-panel");
  const input = appRoot.querySelector<HTMLInputElement>("#task-title");

  form?.addEventListener("submit", handleAddTask);
  input?.addEventListener("input", handleAddTaskInput);

  if (addPanelOpen && input) {
    if (wasTaskInputFocused) {
      input.focus();

      if (selectionStart !== null && selectionEnd !== null) {
        input.setSelectionRange(selectionStart, selectionEnd);
      }
    } else if (shouldFocusAddInput) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }

  shouldFocusAddInput = false;
  updateTicker();
}

function renderTaskCards(): string {
  const visibleTasks = getFilteredTasks();

  if (visibleTasks.length === 0) {
    return `
      <article class="empty-card">
        <strong>No ${currentFilter === "all" ? "tasks" : currentFilter + " tasks"} yet</strong>
        <span>Click the + button to add a timer or switch filters.</span>
      </article>
    `;
  }

  return visibleTasks
    .map((task) => {
      const progress = Math.round(getProgress(task) * 360);
      const elapsed = formatDuration(getElapsed(task));

      return `
        <article class="timer-card ${task.isRunning ? "is-running" : ""} ${task.isDone ? "is-done" : ""}">
          <div class="card-topline">
            <strong>${escapeHtml(task.title)}</strong>
            <div class="card-tools">
              <button class="tool-button done-tool ${task.isDone ? "active" : ""}" type="button" data-action="toggle-done" data-task-id="${task.id}" aria-label="${task.isDone ? "Mark task as ongoing" : "Mark task as done"}">${icons.check}</button>
              <button class="tool-button" type="button" data-action="delete" data-task-id="${task.id}" aria-label="Delete task">${icons.trash}</button>
            </div>
          </div>

          <div class="timer-ring" style="--progress: ${progress}deg">
            <div class="timer-value">${elapsed}</div>
          </div>

          <div class="timer-actions">
            <button class="play-button" type="button" data-action="toggle" data-task-id="${task.id}" aria-label="${
              task.isDone
                ? "Task is done"
                : task.isRunning
                  ? "Pause task"
                  : "Start task"
            }" ${task.isDone ? "disabled" : ""}>${task.isRunning ? icons.pause : icons.play}</button>
            <button class="reset-button" type="button" data-action="reset" data-task-id="${task.id}" aria-label="Reset task">${icons.reset}</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function handleAddTaskInput(event: Event): void {
  const input = event.currentTarget;

  if (input instanceof HTMLInputElement) {
    addTaskDraft = input.value;
  }
}

function handleAddTask(event: SubmitEvent): void {
  event.preventDefault();

  const form = event.currentTarget;

  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  const formData = new FormData(form);
  const title = String(formData.get("title") || addTaskDraft).trim();

  if (!title) {
    return;
  }

  tasks = [
    {
      id: createId(),
      title,
      elapsedMs: 0,
      isRunning: false,
      isDone: false,
      startedAt: null,
      createdAt: Date.now(),
    },
    ...tasks,
  ];

  addTaskDraft = "";
  addPanelOpen = false;
  saveTasks();
  render();
}

function toggleTask(taskId: string): void {
  const now = Date.now();

  tasks = tasks.map((task) => {
    if (task.id !== taskId || task.isDone) {
      return task;
    }

    if (task.isRunning) {
      return {
        ...task,
        elapsedMs: getElapsed(task),
        isRunning: false,
        startedAt: null,
      };
    }

    return { ...task, isRunning: true, startedAt: now };
  });

  saveTasks();
  render();
}

function resetTask(taskId: string): void {
  tasks = tasks.map((task) =>
    task.id === taskId
      ? { ...task, elapsedMs: 0, startedAt: task.isRunning ? Date.now() : null }
      : task,
  );

  saveTasks();
  render();
}

function toggleDoneTask(taskId: string): void {
  tasks = tasks.map((task) => {
    if (task.id !== taskId) {
      return task;
    }

    if (task.isDone) {
      return { ...task, isDone: false };
    }

    return {
      ...task,
      elapsedMs: getElapsed(task),
      isDone: true,
      isRunning: false,
      startedAt: null,
    };
  });

  saveTasks();
  render();
}

function deleteTask(taskId: string): void {
  tasks = tasks.filter((task) => task.id !== taskId);
  saveTasks();
  render();
}

function updateTicker(): void {
  const hasRunningTask = tasks.some((task) => task.isRunning);

  if (hasRunningTask && ticker === null) {
    ticker = window.setInterval(render, 1000);
    return;
  }

  if (!hasRunningTask && ticker !== null) {
    window.clearInterval(ticker);
    ticker = null;
  }
}

function handleWindowAction(action: string): boolean {
  if (action === "window-minimize") {
    window.taskierWindow?.minimize();
    return true;
  }

  if (action === "window-maximize") {
    window.taskierWindow?.maximize();
    return true;
  }

  if (action === "window-close") {
    window.taskierWindow?.close();
    return true;
  }

  return false;
}

function handleAppClick(event: MouseEvent): void {
  const target = event.target;

  if (!(target instanceof Element)) {
    return;
  }

  const button = target.closest<HTMLButtonElement>("[data-action]");

  if (!button) {
    return;
  }

  const action = button.dataset.action;

  if (!action) {
    return;
  }

  if (handleWindowAction(action)) {
    return;
  }

  if (action === "toggle-add") {
    addPanelOpen = !addPanelOpen;
    shouldFocusAddInput = addPanelOpen;
    render();
    return;
  }

  if (action === "set-filter") {
    const filter = button.dataset.filter as TaskFilter | undefined;

    if (filter) {
      currentFilter = filter;
      render();
    }

    return;
  }

  const taskId = button.dataset.taskId;

  if (!taskId) {
    return;
  }

  if (action === "toggle") {
    toggleTask(taskId);
  }

  if (action === "reset") {
    resetTask(taskId);
  }

  if (action === "toggle-done") {
    toggleDoneTask(taskId);
  }

  if (action === "delete") {
    deleteTask(taskId);
  }
}

function boot(): void {
  appRoot = document.querySelector<HTMLElement>("#app");

  if (!appRoot) {
    appRoot = document.createElement("main");
    appRoot.id = "app";
    appRoot.className = "app-shell";
    appRoot.setAttribute("aria-label", "Taskier time tracker");
    document.body.appendChild(appRoot);
  }

  appRoot.addEventListener("click", handleAppClick);
  render();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
