(() => {
  'use strict';

  /* ------------------------------------------------------------------
     Trumpet Fingerings (B♭ trumpet, WRITTEN pitch, treble clef)
     To change a fingering, edit the FINGERINGS table below.
     Keys are MIDI numbers of the written pitch (middle C = 60).
     Values are the valves pressed: [] = open, [1,2] = valves 1 + 2, etc.
     ------------------------------------------------------------------ */
  const FINGERINGS = {
    54: [1, 2, 3],   // F♯3 / G♭3 (lowest note)
    55: [1, 3],      // G3
    56: [2, 3],      // G♯3 / A♭3
    57: [1, 2],      // A3
    58: [1],         // A♯3 / B♭3
    59: [2],         // B3 / C♭4
    60: [],          // C4 (middle C) / B♯3
    61: [1, 2, 3],   // C♯4 / D♭4
    62: [1, 3],      // D4
    63: [2, 3],      // D♯4 / E♭4
    64: [1, 2],      // E4 / F♭4
    65: [1],         // F4 / E♯4
    66: [2],         // F♯4 / G♭4
    67: [],          // G4
    68: [2, 3],      // G♯4 / A♭4
    69: [1, 2],      // A4
    70: [1],         // A♯4 / B♭4
    71: [2],         // B4 / C♭5
    72: [],          // C5 / B♯4
    73: [1, 2],      // C♯5 / D♭5
    74: [1],         // D5
    75: [2],         // D♯5 / E♭5
    76: [],          // E5 / F♭5
    77: [1],         // F5 / E♯5
    78: [2],         // F♯5 / G♭5
    79: [],          // G5
    80: [2, 3],      // G♯5 / A♭5
    81: [1, 2],      // A5
    82: [1],         // A♯5 / B♭5
    83: [2],         // B5 / C♭6
    84: [],          // C6 / B♯5
    85: [1, 2]       // C♯6 / D♭6
  };

  /* ---------- Staff geometry ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const FIRST_D = 3 * 7 + 4;   // diatonic number of G3 (lowest clickable position)
  const COUNT = 18;            // G3 … C6
  const GAP = 32;              // distance between two staff lines
  const HALF = GAP / 2;
  const TOP = 40;
  const W = 300;
  const LEFT = 14, RIGHT = 262;
  const NOTE_X = 196, ACC_X = 150;
  const STAFF_LINES = [5, 7, 9, 11, 13];   // E4 G4 B4 D5 F5
  const LEDGERS_BELOW = [3, 1];            // C4, A3
  const LEDGERS_ABOVE = [15, 17];          // A5, C6

  const ALT_NAMES = {
    0: ['C', 'B♯'], 1: ['C♯', 'D♭'], 2: ['D'], 3: ['D♯', 'E♭'], 4: ['E', 'F♭'], 5: ['F', 'E♯'],
    6: ['F♯', 'G♭'], 7: ['G'], 8: ['G♯', 'A♭'], 9: ['A'], 10: ['A♯', 'B♭'], 11: ['B', 'C♭']
  };
  const SYM = { '-1': '♭', '0': '', '1': '♯' };

  const POS = [];
  for (let i = 0; i < COUNT; i++) {
    const d = FIRST_D + i;
    POS.push({
      i,
      letter: LETTERS[d % 7],
      octave: Math.floor(d / 7),
      y: TOP + (COUNT - 1 - i) * HALF
    });
  }

  /* ---------- State ---------- */
  let sel = null;       // selected position index, or null
  let acc = 0;          // -1 flat, 0 natural, 1 sharp
  let showNat = false;  // draw a natural sign only if the user pressed ♮ explicitly

  /* ---------- Elements ---------- */
  const $ = (id) => document.getElementById(id);
  const svg = $('staff');
  const nameEl = $('noteName');
  const subEl = $('noteSub');
  const fingerEl = $('fingerText');
  const valveEls = [...document.querySelectorAll('.valve')];
  const accBtns = [...document.querySelectorAll('.acc')];
  const namesToggle = $('showNames');

  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  /* ---------- Build the static staff ---------- */
  const gBand = el('g', {}, svg);
  const gLines = el('g', {}, svg);
  const gClef = el('g', {}, svg);
  const gLabels = el('g', {}, svg);
  const gGhost = el('g', { class: 'ghost' }, svg);
  const gNote = el('g', {}, svg);
  const gHits = el('g', {}, svg);

  const band = el('rect', { class: 'band', x: 0, width: W, height: HALF, rx: 4, visibility: 'hidden' }, gBand);

  STAFF_LINES.forEach((i) => {
    el('line', { class: 'staff-line', x1: LEFT, x2: RIGHT, y1: POS[i].y, y2: POS[i].y }, gLines);
  });
  // faint dotted guides so people can see where the ledger lines would be
  [...LEDGERS_BELOW, ...LEDGERS_ABOVE].forEach((i) => {
    el('line', { class: 'guide', x1: NOTE_X - 26, x2: NOTE_X + 26, y1: POS[i].y, y2: POS[i].y }, gLines);
  });
  // barline at the start
  el('line', { class: 'staff-line', x1: LEFT, x2: LEFT, y1: POS[13].y, y2: POS[5].y }, gLines);

  // Treble clef (hand-drawn path, so no font is needed)
  el('path', {
    class: 'note-stroke',
    d: 'M 36,258 C 34,268 52,272 55,252 C 58,220 62,150 60,100 C 59,78 74,76 74,96 ' +
       'C 74,122 48,150 38,176 C 28,206 44,234 66,226 C 90,218 84,184 62,184 C 46,184 40,204 54,208',
    'stroke-width': 4.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
  }, gClef);
  el('circle', { class: 'note-ink', cx: 37, cy: 260, r: 5 }, gClef);

  const labels = POS.map((p) => {
    const t = el('text', { class: 'pos-label', x: W - 8, y: p.y + 4 }, gLabels);
    t.textContent = p.letter + p.octave;
    return t;
  });

  POS.forEach((p) => {
    const r = el('rect', {
      class: 'hit', x: 0, y: p.y - HALF / 2, width: W, height: HALF,
      role: 'button', 'aria-label': p.letter + p.octave
    }, gHits);
    r.addEventListener('click', () => select(p.i));
    r.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') showGhost(p.i); });
    r.addEventListener('pointerleave', () => gGhost.replaceChildren());
  });

  /* ---------- Drawing helpers ---------- */
  function notehead(parent, x, y) {
    return el('ellipse', {
      class: 'note-ink', cx: x, cy: y, rx: 12.5, ry: 9, transform: `rotate(-22 ${x} ${y})`
    }, parent);
  }

  function showGhost(i) {
    gGhost.replaceChildren();
    if (i === sel) return;
    notehead(gGhost, NOTE_X, POS[i].y);
  }

  function drawAccidental(parent, kind, y) {
    const g = el('g', { transform: `translate(${ACC_X} ${y})` }, parent);
    if (kind === 1) {            // sharp
      el('line', { class: 'note-stroke', x1: -5, x2: -5, y1: -20, y2: 24, 'stroke-width': 2.4 }, g);
      el('line', { class: 'note-stroke', x1: 5, x2: 5, y1: -24, y2: 20, 'stroke-width': 2.4 }, g);
      el('polygon', { class: 'note-ink', points: '-10,-4 10,-12 10,-7 -10,1' }, g);
      el('polygon', { class: 'note-ink', points: '-10,10 10,2 10,7 -10,15' }, g);
    } else if (kind === -1) {    // flat
      el('line', { class: 'note-stroke', x1: -4, x2: -4, y1: -34, y2: 16, 'stroke-width': 2.8 }, g);
      el('path', { class: 'note-stroke', d: 'M -4,16 C 16,3 16,-13 -4,-3', 'stroke-width': 3.2, 'stroke-linecap': 'round' }, g);
    } else {                     // natural
      el('line', { class: 'note-stroke', x1: -5, x2: -5, y1: -28, y2: 7, 'stroke-width': 2.4 }, g);
      el('line', { class: 'note-stroke', x1: 5, x2: 5, y1: -9, y2: 28, 'stroke-width': 2.4 }, g);
      el('polygon', { class: 'note-ink', points: '-5,-6 5,-9 5,-4 -5,-1' }, g);
      el('polygon', { class: 'note-ink', points: '-5,2 5,-1 5,4 -5,7' }, g);
    }
  }

  function drawNote() {
    gNote.replaceChildren();
    gGhost.replaceChildren();
    if (sel === null) { band.setAttribute('visibility', 'hidden'); return; }

    const p = POS[sel];
    band.setAttribute('y', p.y - HALF / 2);
    band.setAttribute('visibility', 'visible');

    const g = el('g', { class: 'note-pop' }, gNote);

    LEDGERS_BELOW.forEach((i) => { if (sel <= i) el('line', { class: 'ledger', x1: NOTE_X - 24, x2: NOTE_X + 24, y1: POS[i].y, y2: POS[i].y }, g); });
    LEDGERS_ABOVE.forEach((i) => { if (sel >= i) el('line', { class: 'ledger', x1: NOTE_X - 24, x2: NOTE_X + 24, y1: POS[i].y, y2: POS[i].y }, g); });

    if (acc !== 0) drawAccidental(g, acc, p.y);
    else if (showNat) drawAccidental(g, 0, p.y);

    notehead(g, NOTE_X, p.y);

    // crotchet (quarter note) stem: down for B4 and above, up otherwise
    if (sel >= 9) {
      el('line', { class: 'note-stroke', x1: NOTE_X - 11.4, x2: NOTE_X - 11.4, y1: p.y + 2, y2: p.y + GAP * 3.4, 'stroke-width': 2.8 }, g);
    } else {
      el('line', { class: 'note-stroke', x1: NOTE_X + 11.4, x2: NOTE_X + 11.4, y1: p.y - 2, y2: p.y - GAP * 3.4, 'stroke-width': 2.8 }, g);
    }
  }

  /* ---------- Display ---------- */
  function setValves(list) {
    valveEls.forEach((v) => v.classList.toggle('pressed', !!list && list.includes(Number(v.dataset.v))));
  }

  function updateDisplay() {
    labels.forEach((t, i) => t.classList.toggle('sel', i === sel));
    accBtns.forEach((b) => b.classList.toggle('active', Number(b.dataset.acc) === acc));

    if (sel === null) {
      nameEl.textContent = '—';
      subEl.textContent = 'Tap a line or space on the staff';
      fingerEl.classList.remove('on');
      fingerEl.innerHTML = '&nbsp;';
      setValves(null);
      return;
    }

    const p = POS[sel];
    const midi = 12 * (p.octave + 1) + SEMI[p.letter] + acc;
    const spelled = p.letter + SYM[acc];
    const fing = FINGERINGS[midi];

    nameEl.textContent = spelled;

    const alt = (ALT_NAMES[((midi % 12) + 12) % 12] || []).find((n) => n !== spelled);
    subEl.textContent = acc !== 0 && alt
      ? `${spelled}${p.octave} · same as ${alt}`
      : `${spelled}${p.octave} · written pitch`;

    if (!fing) {
      fingerEl.textContent = 'Outside the trumpet range';
      fingerEl.classList.add('on');
      setValves(null);
      return;
    }
    fingerEl.textContent = fing.length ? 'Valves ' + fing.join(' + ') : 'Open · no valves';
    fingerEl.classList.add('on');
    setValves(fing);
  }

  function refresh() { drawNote(); updateDisplay(); }

  /* ---------- Actions ---------- */
  function select(i) { sel = Math.max(0, Math.min(COUNT - 1, i)); refresh(); }

  function setAcc(value, explicit) {
    acc = value;
    showNat = value === 0 && explicit;
    refresh();
  }

  accBtns.forEach((b) => b.addEventListener('click', () => {
    const v = Number(b.dataset.acc);
    // tapping the active sharp/flat again goes back to natural
    if (v === acc && v !== 0) setAcc(0, false);
    else setAcc(v, true);
  }));

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'ArrowUp') { e.preventDefault(); select(sel === null ? 3 : sel + 1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); select(sel === null ? 3 : sel - 1); }
    else if (e.key === 'b') setAcc(-1, true);
    else if (e.key === 'n') setAcc(0, true);
    else if (e.key === '#' || e.key === 's') setAcc(1, true);
  });

  /* ---------- Note names toggle ---------- */
  function applyNames() {
    document.body.classList.toggle('no-names', !namesToggle.checked);
    try { localStorage.setItem('showNames', namesToggle.checked ? '1' : '0'); } catch (e) {}
  }
  try { if (localStorage.getItem('showNames') === '0') namesToggle.checked = false; } catch (e) {}
  namesToggle.addEventListener('change', applyNames);
  applyNames();

  refresh();

  /* ---------- Install (PWA) ---------- */
  let deferredPrompt = null;
  const installBtn = $('installBtn');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.hidden = false;
  });
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.hidden = true;
  });
  window.addEventListener('appinstalled', () => { installBtn.hidden = true; });

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
})();
