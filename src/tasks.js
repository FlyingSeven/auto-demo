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

export function removeTask(tasks, id) {
  return tasks.filter((task) => task.id !== id);
}

export function findTask(tasks, id) {
  return tasks.find((task) => task.id === id) || null;
}

/**
 * Filter tasks by status, priority and a free-text query.
 *
 * BUG (intentional, for the LoopForge bug-fix SOP demo):
 * The `status === 'done'` branch currently drops tasks that ARE done,
 * i.e. the exact opposite of what the caller asked for. The
 * `status === 'todo'` branch has the same inversion. Everything else is
 * correct. Fix both branches and the whole suite goes green.
 */
export function filterTasks(tasks, filters = {}) {
  const { status = 'all', priority = 'all', query = '' } = filters;
  const needle = String(query).trim().toLowerCase();

  return tasks.filter((task) => {
    if (status === 'done' && task.done) return false;
    if (status === 'todo' && !task.done) return false;

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
