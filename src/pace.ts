/* ── Pace calculator — goal time ⇄ splits ─────────────────────────────
   Two-half model: pick a strategy d (second-half pace multiplier − 1),
   then p1 = T / (H · (2 + d)) and p2 = p1 · (1 + d), so the halves
   always sum back to the goal. Everything is client-side. */

import { DIST, HALF, GUN_SECONDS, nameAt } from './data';

const MI_KM = 1.609344;

interface Plan {
  p1: number; // sec per km, first half
  p2: number; // sec per km, second half
  total: number;
}

let plan: Plan | null = null;

const pad = (n: number): string => String(n).padStart(2, '0');
const fmtHMS = (sec: number): string => {
  const s = Math.round(sec);
  return `${Math.floor(s / 3600)}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
};
const fmtMS = (sec: number): string => {
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
};
const fmtClock = (elapsed: number): string => {
  const s = Math.round(GUN_SECONDS + elapsed);
  return `${pad(Math.floor(s / 3600) % 24)}:${pad(Math.floor((s % 3600) / 60))}`;
};

/** Elapsed seconds at a course distance under the current plan. */
export function elapsedAt(km: number): number | null {
  if (!plan) return null;
  const k = Math.min(Math.max(km, 0), DIST);
  return k <= HALF ? k * plan.p1 : HALF * plan.p1 + (k - HALF) * plan.p2;
}

/** One-line ETA for the course readout, or null when no plan exists. */
export function etaLine(km: number): string | null {
  const t = elapsedAt(km);
  if (t === null || !plan) return null;
  if (km <= 0.01) return `AT YOUR ${fmtHMS(plan.total)} GOAL: THE GUN — 07:00, ${fmtHMS(0)} IN`;
  return `AT YOUR ${fmtHMS(plan.total)} GOAL: HERE AT ${fmtClock(t)} — ${fmtHMS(t)} IN`;
}

/* ── parsing ── */
function parseParts(text: string): number[] | null {
  const t = text.trim();
  if (!/^\d{1,3}(:\d{1,2}){0,2}$/.test(t)) return null;
  const parts = t.split(':').map((x) => parseInt(x, 10));
  if (parts.slice(1).some((p) => p >= 60)) return null;
  return parts;
}
function parseGoal(text: string): number | null {
  const p = parseParts(text);
  if (!p) return null;
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  if (p.length === 2) return p[0] * 3600 + p[1] * 60; // h:mm
  return p[0] * 3600;
}
function parsePace(text: string): number | null {
  const p = parseParts(text);
  if (!p || p.length === 3) return null;
  if (p.length === 2) return p[0] * 60 + p[1]; // m:ss
  return p[0] * 60;
}

/* ── table rows ── */
interface Row {
  label: string;
  km: number;
  kind?: 'half' | 'finish';
}
const KM_ROWS: Row[] = [
  { label: '5 km', km: 5 },
  { label: '10 km', km: 10 },
  { label: '15 km', km: 15 },
  { label: '20 km', km: 20 },
  { label: 'Half · 21.1', km: HALF, kind: 'half' },
  { label: '25 km', km: 25 },
  { label: '30 km', km: 30 },
  { label: '35 km', km: 35 },
  { label: '40 km', km: 40 },
  { label: 'Finish · 42.195', km: DIST, kind: 'finish' },
];
const MI_ROWS: Row[] = [
  { label: '5 mi', km: 5 * MI_KM },
  { label: '10 mi', km: 10 * MI_KM },
  { label: 'Half · 13.1', km: HALF, kind: 'half' },
  { label: '15 mi', km: 15 * MI_KM },
  { label: '20 mi', km: 20 * MI_KM },
  { label: '25 mi', km: 25 * MI_KM },
  { label: 'Finish · 26.2', km: DIST, kind: 'finish' },
];

const STRAT_NOTES: Record<string, string> = {
  '0': 'even — same pace, gun to tape',
  '-0.02': 'negative — back half 2% faster; pass people at 35',
  '0.02': 'positive — bank time early; pray at the Overpass',
};

export function initPace(): void {
  const form = document.getElementById('paceForm') as HTMLFormElement | null;
  const big = document.getElementById('paceBig');
  const sub = document.getElementById('paceSub');
  const body = document.getElementById('splitsBody');
  const err = document.getElementById('paceErr');
  const goalField = document.getElementById('goalField');
  const paceField = document.getElementById('paceField');
  const stratNote = document.getElementById('stratNote');
  if (!form || !big || !sub || !body || !err) return;

  const inGoal = form.querySelector<HTMLInputElement>('#inGoal');
  const inPace = form.querySelector<HTMLInputElement>('#inPace');
  const inPaceUnit = form.querySelector<HTMLSelectElement>('#inPaceUnit');

  const mode = (): string =>
    form.querySelector<HTMLInputElement>('input[name="mode"]:checked')?.value ?? 'goal';
  const strategy = (): string =>
    form.querySelector<HTMLInputElement>('input[name="strategy"]:checked')?.value ?? '0';
  const tableUnit = (): string =>
    document.querySelector<HTMLInputElement>('input[name="tableUnit"]:checked')?.value ?? 'km';

  const fail = (msg: string): void => {
    err.textContent = msg;
    err.hidden = false;
  };

  const renderTable = (): void => {
    if (!plan) return;
    const rows = tableUnit() === 'mi' ? MI_ROWS : KM_ROWS;
    body.textContent = '';
    for (const row of rows) {
      const t = elapsedAt(row.km);
      if (t === null) continue;
      const tr = document.createElement('tr');
      if (row.kind) tr.className = row.kind === 'half' ? 'is-half' : 'is-finish';
      const cells: Array<[string, string]> = [
        [row.label, 'mono'],
        [nameAt(row.km), ''],
        [fmtHMS(t), 'mono'],
        [fmtClock(t), 'mono'],
      ];
      for (const [text, cls] of cells) {
        const td = document.createElement('td');
        if (cls) td.className = cls;
        td.textContent = text;
        tr.appendChild(td);
      }
      body.appendChild(tr);
    }
  };

  const recalc = (): void => {
    err.hidden = true;
    const d = parseFloat(strategy());
    if (stratNote) stratNote.textContent = STRAT_NOTES[strategy()] ?? STRAT_NOTES['0'];

    let total: number;
    if (mode() === 'goal') {
      const t = parseGoal(inGoal?.value ?? '');
      if (t === null) return fail('Time reads h:mm:ss — try 3:59:00.');
      if (t < 2 * 3600) return fail('That’s under the world record. Enter h:mm:ss.');
      if (t > 8 * 3600) return fail('The course closes at 7:30:00 — aim under 8 hours.');
      total = t;
    } else {
      const p = parsePace(inPace?.value ?? '');
      if (p === null) return fail('Pace reads m:ss — try 5:41.');
      const perKm = inPaceUnit?.value === 'mi' ? p / MI_KM : p;
      if (perKm < 165) return fail('That’s faster than world-record pace. Respect — but no.');
      if (perKm > 720) return fail('The sweep bus runs 7:30 / km. Aim under 12:00.');
      total = perKm * DIST;
    }

    const p1 = total / (HALF * (2 + d));
    plan = { p1, p2: p1 * (1 + d), total };

    const avgKm = total / DIST;
    const avgMi = avgKm * MI_KM;
    if (mode() === 'goal') {
      big.innerHTML = `${fmtMS(avgKm)} <span class="pace-big-unit">/ km</span>`;
      sub.textContent = `${fmtMS(avgMi)} / mi · tape at ${fmtClock(total)} on the town clock`;
    } else {
      big.innerHTML = `${fmtHMS(total)} <span class="pace-big-unit">finish</span>`;
      sub.textContent = `${fmtMS(avgKm)} / km · ${fmtMS(avgMi)} / mi · tape at ${fmtClock(total)}`;
    }

    renderTable();
    document.dispatchEvent(new CustomEvent('splits:plan'));
  };

  const syncMode = (): void => {
    const isGoal = mode() === 'goal';
    goalField?.toggleAttribute('hidden', !isGoal);
    paceField?.toggleAttribute('hidden', isGoal);
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    recalc();
  });
  form.addEventListener('input', () => {
    syncMode();
    recalc();
  });
  document.querySelectorAll<HTMLInputElement>('input[name="tableUnit"]').forEach((r) =>
    r.addEventListener('change', () => renderTable()),
  );

  syncMode();
  recalc();
}
