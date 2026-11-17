export const positions = ['Back middle', 'Back left', 'Front left', 'Front middle', 'Front right', 'Server'];
export function rotate(lineup, steps = 1) {
  const next = structuredClone(lineup);
  for (let i = 0; i < steps; i++) {
    const outgoing = next.court.pop();
    next.court.unshift(next.bench.length ? next.bench.shift() : outgoing);
    if (lineup.bench.length) next.bench.push(outgoing);
  }
  return next;
}
export function assign(lineup, position, player) {
  const next = structuredClone(lineup), old = next.court[position];
  const index = next.court.indexOf(player);
  if (index >= 0) next.court[index] = old;
  else {
    const benchIndex = next.bench.indexOf(player);
    if (benchIndex < 0) return next;
    next.bench[benchIndex] = old;
  }
  next.court[position] = player;
  return next;
}
export function validate(data) {
  if (!data || !Array.isArray(data.players) || data.players.length < 6 || data.players.length > 50 || !Array.isArray(data.court) || data.court.length !== 6 || !Array.isArray(data.bench)) return false;
  const ids = data.players.map(p => p?.id), assigned = [...data.court, ...data.bench];
  return data.players.every(p => p && typeof p.id === 'string' && typeof p.name === 'string' && p.name.trim().length > 0 && p.name.length <= 40 && (p.highlighted === undefined || typeof p.highlighted === 'boolean')) && new Set(ids).size === ids.length && assigned.length === ids.length && new Set(assigned).size === ids.length && assigned.every(id => ids.includes(id));
}
export function initialLineup() {
  const players = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Sam'].map((name, i) => ({ id: `player-${i}`, name }));
  return { players, court: players.slice(0, 6).map(p => p.id), bench: players.slice(6).map(p => p.id) };
}

// Roster slots always follow the court path, then the FIFO bench queue.
export function rosterOrder(lineup) {
  return [...lineup.court, ...lineup.bench];
}
export function reorder(lineup, from, to) {
  const order = rosterOrder(lineup);
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= order.length || to >= order.length) return structuredClone(lineup);
  order.splice(to, 0, order.splice(from, 1)[0]);
  return { ...structuredClone(lineup), court: order.slice(0, 6), bench: order.slice(6) };
}

export function futureRotations(lineup, count = 3) {
  // Each player visits every slot once before the entire lineup repeats.
  const uniqueFutureCount = lineup.court.length + lineup.bench.length - 1;
  const limit = count === 'all' ? uniqueFutureCount : Math.min(uniqueFutureCount, Math.max(0, Math.floor(Number(count) || 0)));
  const futures = [];
  let next = lineup;
  for (let step = 0; step < limit; step++) {
    next = rotate(next);
    futures.push(next);
  }
  return futures;
}
