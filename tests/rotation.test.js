import test from 'node:test';
import assert from 'node:assert/strict';
import { rotate, assign, validate, initialLineup } from '../rotation.js';
test('rotation follows the specified positions and FIFO queue without mutating input', () => {
  const lineup = initialLineup(), original = structuredClone(lineup);
  const next = rotate(lineup);
  assert.deepEqual(next.court, ['player-6','player-0','player-1','player-2','player-3','player-4']);
  assert.deepEqual(next.bench, ['player-7','player-5']);
  assert.equal(rotate(lineup, 2).court[0], 'player-7');
  assert.deepEqual(rotate(lineup, 8), lineup);
  assert.deepEqual(lineup, original);
});
test('six players cycle with no bench', () => {
  const lineup = initialLineup(); lineup.players.splice(6); lineup.bench = [];
  assert.equal(rotate(lineup).court[0], 'player-5');
  assert.deepEqual(rotate(lineup, 6), lineup);
});
test('assignments swap court players or preserve the bench slot', () => {
  const lineup = initialLineup();
  const courtSwap = assign(lineup, 0, 'player-4');
  assert.equal(courtSwap.court[4], 'player-0'); assert.equal(courtSwap.court[0], 'player-4');
  const benchSwap = assign(lineup, 0, 'player-7');
  assert.deepEqual(benchSwap.bench, ['player-6','player-0']); assert.ok(validate(benchSwap));
});
test('import validation rejects duplicates, missing players, invalid names, and malformed files', () => {
  assert.ok(validate(initialLineup()));
  for (const data of [null, {}, { players:[null] }]) assert.equal(validate(data), false);
  const duplicate = initialLineup(); duplicate.court[1] = duplicate.court[0]; assert.equal(validate(duplicate), false);
  const empty = initialLineup(); empty.players[0].name = ' '; assert.equal(validate(empty), false);
  const missing = initialLineup(); missing.bench.pop(); assert.equal(validate(missing), false);
});

test('roster reordering moves across court and bench slots without losing players', async () => {
  const { reorder, rosterOrder } = await import('../rotation.js');
  const original = initialLineup();
  const next = reorder(original, 7, 0);
  assert.deepEqual(next.court, ['player-7', 'player-0', 'player-1', 'player-2', 'player-3', 'player-4']);
  assert.deepEqual(next.bench, ['player-5', 'player-6']);
  assert.ok(validate(next));
  assert.deepEqual(reorder(next, 0, 7), original);
  assert.deepEqual(rosterOrder(reorder(original, 0, 6)), ['player-1','player-2','player-3','player-4','player-5','player-6','player-0','player-7']);
  assert.deepEqual(reorder(original, -1, 2), original);
});
test('future rotations preserve the live roster and FIFO order after reordering', async () => {
  const { reorder } = await import('../rotation.js');
  const live = reorder(initialLineup(), 7, 6), snapshot = structuredClone(live);
  assert.equal(rotate(live, 1).court[0], 'player-7');
  assert.equal(rotate(live, 2).court[0], 'player-6');
  assert.equal(rotate(live, 3).court[0], 'player-5');
  assert.deepEqual(live, snapshot);
});

test('preview count defaults to three and all excludes the repeating live lineup', async () => {
  const { futureRotations } = await import('../rotation.js');
  for (const size of [6, 8, 12, 50]) {
    const players = Array.from({ length: size }, (_, i) => ({ id: String(i), name: `Player ${i}` }));
    const lineup = { players, court: players.slice(0, 6).map(p => p.id), bench: players.slice(6).map(p => p.id) };
    assert.equal(futureRotations(lineup).length, 3);
    const all = futureRotations(lineup, 'all');
    assert.equal(all.length, size - 1);
    const states = [lineup, ...all].map(view => JSON.stringify([view.court, view.bench]));
    assert.equal(new Set(states).size, size);
    assert.deepEqual(rotate(all.at(-1)), lineup);
    assert.deepEqual(futureRotations(lineup, 2), all.slice(0, 2));
    assert.deepEqual(futureRotations(lineup, 100), all);
  }
});

test('player highlights are optional, validated, and follow identity through rotations and reordering', async () => {
  const { reorder, futureRotations } = await import('../rotation.js');
  const lineup = initialLineup();
  lineup.players[0].highlighted = true;
  lineup.players[6].highlighted = true;
  assert.ok(validate(lineup));
  for (const view of [rotate(lineup), reorder(lineup, 0, 7), ...futureRotations(lineup, 'all')]) {
    assert.deepEqual(view.players.filter(p => p.highlighted).map(p => p.id), ['player-0', 'player-6']);
  }
  assert.ok(validate(JSON.parse(JSON.stringify(lineup))));
  lineup.players[0].highlighted = 'true';
  assert.equal(validate(lineup), false);
});
