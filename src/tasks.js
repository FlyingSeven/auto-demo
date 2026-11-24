// Pure task-model logic. No DOM, no framework, no dependencies.
// Kept in a separate module so it can be tested with `node --test`.

let sequence = 0;

function nextId() {
  sequence += 1;
  return `task-${sequence}`;
}

export function createTask(title, options = {}) {
  return {
    id: nextId(),
    title: String(title).trim(),
    done: false,
    priority: options.priority || 'normal',
    tags: Array.isArray(options.tags) ? [...options.tags] : [],
    startTime: options.startTime || null,
    endTime: options.endTime || null,
  };
}

export function addTask(tasks, title, options = {}) {
  if (!String(title).trim()) return tasks;
  return [...tasks, createTask(title, options)];
}

export function toggleTask(tasks, id) {
  return tasks.map((task) =>
    task.id === id ? { ...task, done: !task.done } : task
  );
}

/**
 * Check whether an optional start/end pair is a valid (non-inverted) range.
 * Missing values (`null` / `undefined`) on either side count as valid.
 */
export function isValidTimeRange(startTime, endTime) {
  if (!startTime || !endTime) return true;
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  return end >= start;
}

/**
 * Set the optional start/end time of a task by id.
 * Throws when the new pair forms an inverted range (end before start).
 */
export function updateTaskTime(tasks, id, { startTime, endTime } = {}) {
  const next = { startTime: startTime || null, endTime: endTime || null };
  if (!isValidTimeRange(next.startTime, next.endTime)) {
    throw new Error('Invalid time range: endTime must not be before startTime');
  }

  return tasks.map((task) => (task.id === id ? { ...task, ...next } : task));
}

export function removeTask(tasks, id) {
  return tasks.filter((task) => task.id !== id);
}

export function findTask(tasks, id) {
  return tasks.find((task) => task.id === id) || null;
}

/**
 * Filter tasks by status, priority and a free-text query.
 *
 * `status: 'done'` keeps only completed tasks, `status: 'todo'` keeps only
 * pending ones, any other value (including the default `'all'`) keeps all.
 */
export function filterTasks(tasks, filters = {}) {
  const { status = 'all', priority = 'all', query = '' } = filters;
  const needle = String(query).trim().toLowerCase();

  return tasks.filter((task) => {
    if (status === 'done' && !task.done) return false;
    if (status === 'todo' && task.done) return false;

    if (priority !== 'all' && task.priority !== priority) return false;
    if (
      needle &&
      !task.title.toLowerCase().includes(needle) &&
      !task.tags.some((tag) => tag.toLowerCase().includes(needle))
    ) {
      return false;
    }
    return true;
  });
}

export function getStats(tasks) {
  return {
    total: tasks.length,
    done: tasks.filter((task) => task.done).length,
    todo: tasks.filter((task) => !task.done).length,
    high: tasks.filter((task) => task.priority === 'high').length,
  };
}

export function serialize(tasks) {
  return JSON.stringify(tasks);
}

export function deserialize(raw) {
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}
