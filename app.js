import { positions, rotate, futureRotations, rosterOrder, reorder, validate, initialLineup } from './rotation.js';
const $ = id => document.getElementById(id);
const key = 'sideout-lineup-v1';
const DEFAULT_PREVIEW_COUNT = 3;
let previewCount = DEFAULT_PREVIEW_COUNT;
let lineup = initialLineup(), history = [], storageAvailable = true;
try { const saved = JSON.parse(localStorage.getItem(key)); if (validate(saved)) lineup = saved; } catch { storageAvailable = false; }
const announce = message => { $('announcement').textContent = message; };
function save() {
  try { localStorage.setItem(key, JSON.stringify(lineup)); storageAvailable = true; } catch { storageAvailable = false; }
  $('save-status').textContent = storageAvailable ? '● Saved on this device' : '● Storage unavailable — export to save';
}
function change(update, message) {
  history.push(structuredClone(lineup));
  if (history.length > 100) history.shift();
  lineup = update; save(); render();
  if (message) announce(message);
}
function button(text, label, action, disabled = false) {
  const el = document.createElement('button'); el.textContent = text; el.className = 'icon-button'; el.type = 'button'; el.setAttribute('aria-label', label); el.disabled = disabled; el.onclick = action; return el;
}
function drawCourt(target, view) {
  const names = new Map(lineup.players.map(p => [p.id, p.name]));
  target.replaceChildren();
  for (const index of [2, 3, 4, 1, 0, 5]) {
    const card = document.createElement('div'); card.className = `position ${index === 5 ? 'server' : ''}`;
    const highlighted = lineup.players.find(p => p.id === view.court[index]).highlighted === true;
    card.classList.toggle('highlighted-player', highlighted);
    const shirt = document.createElement('div'); shirt.className = 'jersey'; shirt.setAttribute('aria-hidden', 'true'); if (highlighted) shirt.textContent = '★';
    const label = document.createElement('span'); label.className = 'position-label'; label.textContent = positions[index];
    const name = document.createElement('span'); name.className = 'court-player'; name.textContent = names.get(view.court[index]);
    if (highlighted) { const status = document.createElement('span'); status.className = 'sr-only'; status.textContent = ' (highlighted)'; name.append(status); }
    card.append(shirt, label, name); target.append(card);
  }
}
function render() {
  const view = lineup, names = new Map(lineup.players.map(p => [p.id, p.name]));
  $('undo').disabled = history.length === 0;
  drawCourt($('court'), lineup);
  $('upcoming').replaceChildren();
  const maxPreviews = lineup.players.length - 1;
  $('rotation-count').replaceChildren();
  for (let count = 1; count <= maxPreviews; count++) {
    const option = document.createElement('option'); option.value = count; option.textContent = String(count); $('rotation-count').append(option);
  }
  const all = document.createElement('option'); all.value = 'all'; all.textContent = `All (${maxPreviews})`; $('rotation-count').append(all);
  if (previewCount !== 'all') previewCount = Math.min(previewCount, maxPreviews);
  $('rotation-count').value = String(previewCount);
  $('cycle-note').textContent = `The live lineup repeats after ${lineup.players.length} rotations. There are ${maxPreviews} unique upcoming lineups.`;
  futureRotations(lineup, previewCount).forEach((future, index) => {
    const step = index + 1, section = document.createElement('section');
    const heading = document.createElement('h3'); heading.textContent = `Rotation +${step}`;
    const court = document.createElement('div'); court.className = 'court mini-court'; drawCourt(court, future);
    const bench = document.createElement('p'); bench.className = 'hint'; bench.textContent = `Bench: ${future.bench.map(id => names.get(id)).join(' → ') || 'None'}`;
    section.append(heading, court, bench); $('upcoming').append(section);
  });
  $('bench-count').textContent = view.bench.length; $('player-count').textContent = `${lineup.players.length} players`;
  $('bench').replaceChildren();
  if (!view.bench.length) { const empty = document.createElement('li'); empty.className = 'hint'; empty.textContent = 'No bench players. The server rotates directly to back middle.'; $('bench').append(empty); }
  view.bench.forEach((id, index) => {
    const row = document.createElement('li'); row.className = 'bench-row'; row.classList.toggle('highlighted-player', lineup.players.find(p => p.id === id).highlighted === true);
    const number = document.createElement('span'); number.className = 'queue-number'; number.textContent = String(index + 1).padStart(2, '0');
    const avatar = document.createElement('span'); avatar.className = 'avatar'; avatar.textContent = names.get(id).trim().split(/\s+/).map(n => n[0]).slice(0, 2).join('').toUpperCase();
    const name = document.createElement('span'); name.className = 'bench-name'; name.textContent = names.get(id);
    row.append(number, avatar, name);
    if (!index) { const tag = document.createElement('span'); tag.className = 'next-tag'; tag.textContent = 'UP NEXT'; row.append(tag); }
    $('bench').append(row);
  });
  $('roster').replaceChildren();
  rosterOrder(lineup).forEach((id, slot) => {
    const index = lineup.players.findIndex(player => player.id === id), player = lineup.players[index];
    const row = document.createElement('li'); row.className = 'roster-item'; row.dataset.slot = slot; row.classList.toggle('highlighted-player', player.highlighted === true);
    const handle = button('⠿', `Drag ${player.name} to reorder`, () => {}); handle.className = 'drag-handle';
    handle.onpointerdown = event => {
      if (event.button !== 0) return;
      event.preventDefault(); handle.setPointerCapture(event.pointerId); row.classList.add('dragging');
      let targetSlot = slot;
      const clear = () => document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
      handle.onpointermove = move => {
        clear(); const target = document.elementFromPoint(move.clientX, move.clientY)?.closest('.roster-item');
        targetSlot = target ? Number(target.dataset.slot) : slot;
        if (target) target.classList.add('drop-target');
      };
      const finish = (apply) => {
        clear(); row.classList.remove('dragging'); handle.onpointermove = null; handle.onpointerup = null; handle.onpointercancel = null;
        if (apply && targetSlot !== slot) movePlayer(slot, targetSlot);
      };
      handle.onpointerup = () => finish(true); handle.onpointercancel = () => finish(false);
    };
    const details = document.createElement('div'); details.className = 'roster-details';
    const label = document.createElement('span'); label.className = 'slot-label'; label.textContent = `${slot + 1}. ${slot < 6 ? positions[slot] : `Bench ${slot - 5}${slot === 6 ? ' · up next' : ''}`}`;
    const input = document.createElement('input'); input.value = player.name; input.maxLength = 40; input.setAttribute('aria-label', `${label.textContent} player name`);
    input.onchange = () => { const name = input.value.trim(); if (!name) { input.value = player.name; announce('Player names cannot be empty.'); return; } const next = structuredClone(lineup); next.players[index].name = name; change(next); };
    details.append(label, input);
    const up = button('↑', `Move ${player.name} up`, () => movePlayer(slot, slot - 1), slot === 0);
    const down = button('↓', `Move ${player.name} down`, () => movePlayer(slot, slot + 1), slot === lineup.players.length - 1);
    const remove = button('×', `Remove ${player.name}`, () => {
      const next = structuredClone(lineup), order = rosterOrder(lineup).filter(value => value !== id);
      next.players.splice(index, 1); next.court = order.slice(0, 6); next.bench = order.slice(6);
      change(next, `${player.name} removed.`);
    }, lineup.players.length <= 6); remove.className = 'remove';
    const highlightLabel = document.createElement('label'); highlightLabel.className = 'highlight-toggle';
    const highlight = document.createElement('input'); highlight.type = 'checkbox'; highlight.id = `highlight-${slot}`; highlight.checked = player.highlighted === true;
    highlight.setAttribute('aria-label', `Highlight ${player.name}`);
    highlight.onchange = () => {
      const next = structuredClone(lineup); next.players[index].highlighted = highlight.checked;
      change(next, `${player.name} ${highlight.checked ? 'highlighted' : 'no longer highlighted'}.`);
      $(`highlight-${slot}`).focus({ preventScroll: true });
    };
    highlightLabel.title = `Highlight ${player.name}`; highlightLabel.append(highlight);
    row.append(handle, highlightLabel, details, up, down, remove); $('roster').append(row);
  });
}
function movePlayer(from, to) {
  const name = lineup.players.find(p => p.id === rosterOrder(lineup)[from]).name;
  change(reorder(lineup, from, to), `${name} moved to slot ${to + 1}.`);
  $('roster').children[to]?.querySelector('.drag-handle').focus({ preventScroll: true });
}
$('rotation-count').onchange = event => {
  previewCount = event.target.value === 'all' ? 'all' : Number(event.target.value);
  render();
};
$('rotate').onclick = () => change(rotate(lineup), 'Team rotated one position.');
$('undo').onclick = () => { if (!history.length) return; lineup = history.pop(); save(); render(); announce('Last change undone.'); };
$('add-player').onsubmit = event => { event.preventDefault(); const name = $('player-name').value.trim(); if (!name) return; if (lineup.players.length >= 50) { announce('The roster supports up to 50 players.'); return; } const next = structuredClone(lineup), id = crypto.randomUUID(); next.players.push({ id, name }); next.bench.push(id); change(next, `${name} added to the end of the bench.`); $('player-name').value = ''; $('player-name').focus(); };
$('export').onclick = () => { const url = URL.createObjectURL(new Blob([JSON.stringify(lineup, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = 'sideout-lineup.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); announce('Lineup exported.'); };
$('import').onchange = async event => { const file = event.target.files[0]; if (!file) return; try { if (file.size > 100000) throw new Error(); const data = JSON.parse(await file.text()); if (!validate(data)) throw new Error(); change({ players: data.players.map(p => ({id:p.id,name:p.name.trim(),highlighted:p.highlighted === true})), court: [...data.court], bench: [...data.bench] }, 'Lineup imported. Undo to restore your previous lineup.'); } catch { announce('Could not import. Choose a valid Sideout lineup JSON file with 6–50 players.'); } event.target.value = ''; };
save(); render();
