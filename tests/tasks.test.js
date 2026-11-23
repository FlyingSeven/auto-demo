import test from 'node:test';
import assert from 'node:assert/strict';

import {
  addTask,
  toggleTask,
  removeTask,
  filterTasks,
  getStats,
  serialize,
  deserialize,
} from '../src/tasks.js';

function fixture() {
  return [
    { id: 'a', title: 'Fix login bug', done: true, priority: 'high', tags: ['bug', 'auth'] },
    { id: 'b', title: 'Write docs', done: false, priority: 'normal', tags: ['docs'] },
    { id: 'c', title: 'Ship release', done: true, priority: 'high', tags: ['release'] },
    { id: 'd', title: 'Refactor auth', done: false, priority: 'normal', tags: ['auth'] },
  ];
}

test('addTask appends a trimmed task and ignores blank titles', () => {
  const result = addTask([], '  Buy milk  ');
  assert.equal(result.length, 1);
  assert.equal(result[0].title, 'Buy milk');
  assert.equal(result[0].done, false);
  assert.equal(addTask(result, '   ').length, 1);
});

test('toggleTask flips only the matching task', () => {
  const result = toggleTask(fixture(), 'b');
  assert.equal(result.find((task) => task.id === 'b').done, true);
  assert.equal(result.find((task) => task.id === 'a').done, true);
  assert.equal(result.find((task) => task.id === 'd').done, false);
});

test('removeTask drops only the matching task', () => {
  const result = removeTask(fixture(), 'c');
  assert.deepEqual(
    result.map((task) => task.id),
    ['a', 'b', 'd']
  );
});

test('filterTasks: status=done returns only completed tasks', () => {
  const result = filterTasks(fixture(), { status: 'done' });
  assert.deepEqual(
    result.map((task) => task.id),
    ['a', 'c']
  );
});

test('filterTasks: status=todo returns only pending tasks', () => {
  const result = filterTasks(fixture(), { status: 'todo' });
  assert.deepEqual(
    result.map((task) => task.id),
    ['b', 'd']
  );
});

test('filterTasks: priority and query combine with status', () => {
  const result = filterTasks(fixture(), {
    status: 'all',
    priority: 'high',
    query: 'auth',
  });
  assert.deepEqual(
    result.map((task) => task.id),
    ['a']
  );
});

test('getStats counts done, todo and high priority', () => {
  assert.deepEqual(getStats(fixture()), {
    total: 4,
    done: 2,
    todo: 2,
    high: 2,
  });
});

test('serialize / deserialize round-trip and tolerate bad input', () => {
  const tasks = fixture();
  assert.deepEqual(deserialize(serialize(tasks)), tasks);
  assert.deepEqual(deserialize('not json'), []);
});
