import {
  addTask,
  toggleTask,
  removeTask,
  filterTasks,
  getStats,
  serialize,
  deserialize,
} from './tasks.js';

const STORAGE_KEY = 'loopforge-demo-tasks';

const seed = [
  { id: 'task-1', title: 'Review the delivery SOP', done: true, priority: 'high', tags: ['loopforge', 'sop'] },
  { id: 'task-2', title: 'Fix the filter bug', done: false, priority: 'high', tags: ['bug'] },
  { id: 'task-3', title: 'Write acceptance tests', done: false, priority: 'normal', tags: ['testing'] },
];

let tasks = deserialize(localStorage.getItem(STORAGE_KEY));
if (tasks.length === 0) {
  tasks = seed.map((task) => ({ ...task, tags: [...task.tags] }));
}

const listEl = document.querySelector('#task-list');
const formEl = document.querySelector('#task-form');
const inputEl = document.querySelector('#task-input');
const queryEl = document.querySelector('#query');
const statusEl = document.querySelector('#status');
const statsEl = document.querySelector('#stats');

function persist() {
  localStorage.setItem(STORAGE_KEY, serialize(tasks));
}

function render() {
  const visible = filterTasks(tasks, {
    status: statusEl.value,
    query: queryEl.value,
  });

  listEl.innerHTML = '';
  for (const task of visible) {
    const li = document.createElement('li');

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = task.done;
    check.addEventListener('change', () => {
      tasks = toggleTask(tasks, task.id);
      persist();
      render();
    });

    const label = document.createElement('span');
    label.textContent = task.title;
    if (task.done) label.classList.add('done');

    const badge = document.createElement('small');
    badge.textContent = task.priority;

    const del = document.createElement('button');
    del.type = 'button';
    del.textContent = 'x';
    del.setAttribute('aria-label', `Delete ${task.title}`);
    del.addEventListener('click', () => {
      tasks = removeTask(tasks, task.id);
      persist();
      render();
    });

    li.append(check, label, badge, del);
    listEl.appendChild(li);
  }

  const stats = getStats(tasks);
  statsEl.textContent = `${stats.done}/${stats.total} done - ${stats.high} high priority`;
}

formEl.addEventListener('submit', (event) => {
  event.preventDefault();
  tasks = addTask(tasks, inputEl.value, { priority: 'normal' });
  inputEl.value = '';
  persist();
  render();
});

queryEl.addEventListener('input', render);
statusEl.addEventListener('change', render);

render();
