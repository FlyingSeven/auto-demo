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
  isValidTimeRange,
  updateTaskTime,
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

test('createTask stores optional start/end time and defaults to null', () => {
  const withTime = addTask([], 'Write report', {
    startTime: '2026-11-23T09:00',
    endTime: '2026-11-23T11:00',
  });
  assert.equal(withTime[0].startTime, '2026-11-23T09:00');
  assert.equal(withTime[0].endTime, '2026-11-23T11:00');

  const withoutTime = addTask([], 'No schedule');
  assert.equal(withoutTime[0].startTime, null);
  assert.equal(withoutTime[0].endTime, null);
});

test('updateTaskTime sets start/end time on the matching task only', () => {
  const result = updateTaskTime(fixture(), 'b', {
    startTime: '2026-11-23T09:00',
    endTime: '2026-11-23T10:00',
  });

  const updated = result.find((task) => task.id === 'b');
  assert.equal(updated.startTime, '2026-11-23T09:00');
  assert.equal(updated.endTime, '2026-11-23T10:00');
  assert.equal(result.find((task) => task.id === 'a').startTime, undefined);

  const cleared = updateTaskTime(result, 'b', { startTime: '', endTime: null });
  assert.equal(cleared.find((task) => task.id === 'b').startTime, null);
  assert.equal(cleared.find((task) => task.id === 'b').endTime, null);
});

test('updateTaskTime rejects an inverted range and keeps tasks untouched', () => {
  const tasks = fixture();
  assert.throws(
    () =>
      updateTaskTime(tasks, 'b', {
        startTime: '2026-11-23T10:00',
        endTime: '2026-11-23T09:00',
      }),
    /Invalid time range/
  );
  // The original list must not have been mutated by the failed update.
  assert.deepEqual(
    tasks.map((task) => 'startTime' in task),
    [false, false, false, false]
  );
});

test('isValidTimeRange accepts open values and rejects inverted ones', () => {
  assert.equal(isValidTimeRange('2026-11-23T09:00', '2026-11-23T10:00'), true);
  assert.equal(isValidTimeRange('2026-11-23T10:00', '2026-11-23T10:00'), true);
  assert.equal(isValidTimeRange('2026-11-23T09:00', '2026-11-23T09:00'), true);
  assert.equal(isValidTimeRange(null, '2026-11-23T10:00'), true);
  assert.equal(isValidTimeRange('2026-11-23T09:00', null), true);
  assert.equal(isValidTimeRange(null, null), true);
  assert.equal(
    isValidTimeRange('2026-11-23T10:00', '2026-11-23T09:00'),
    false
  );
});

test('tasks without time fields keep working alongside timed ones', () => {
  // Simulates old localStorage data stored before start/end time existed.
  const legacy = deserialize(JSON.stringify([
    { id: 'old-1', title: 'Legacy task', done: false, priority: 'normal', tags: [] },
  ]));
  assert.equal(legacy[0].startTime, undefined);
  assert.equal(legacy[0].endTime, undefined);

  const mixed = updateTaskTime(legacy, 'old-1', {
    startTime: '2026-11-23T08:00',
    endTime: '2026-11-23T09:00',
  });
  assert.equal(mixed[0].startTime, '2026-11-23T08:00');

  const roundTrip = deserialize(serialize(mixed));
  assert.equal(roundTrip[0].endTime, '2026-11-23T09:00');
});
