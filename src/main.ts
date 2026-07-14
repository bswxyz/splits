/* ── SPLITS — the Arden City Marathon ─────────────────────────────────
   Progressive enhancement throughout: the page reads fully without JS.
   Signatures: (1) the self-drawing course elevation profile, and
   (2) the pace calculator. Both live in their own modules. */

import { initReveals, initCounters } from './reveal';
import { initCountdown } from './countdown';
import { initPace } from './pace';
import { initCourse } from './course';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

/* ── theme toggle (persisted as "splits-theme") ── */
const themeBtn = document.getElementById('themeBtn');
const syncTheme = (): void => {
  const dark = root.dataset.theme === 'dark';
  themeBtn?.setAttribute('aria-pressed', String(dark));
  themeBtn?.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#16181b' : '#f4f2ee');
};
syncTheme();
themeBtn?.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try {
    localStorage.setItem('splits-theme', root.dataset.theme);
  } catch {
    /* storage unavailable — theme still flips for this visit */
  }
  syncTheme();
});

/* ── hero intro (clipped lines rise; pin the final state once it lands) ── */
const hero = document.querySelector('.hero');
requestAnimationFrame(() => hero?.classList.add('loaded'));
window.setTimeout(() => hero?.classList.add('done'), 1300);

/* ── shared motion ── */
initReveals(reduced);
initCounters(reduced);
initCountdown(reduced);

/* ── signatures — pace first so the course readout can quote the plan ── */
initPace();
initCourse(reduced);

/* ── register demo form: validates, confirms in place, sends nothing ── */
const regForm = document.getElementById('regForm') as HTMLFormElement | null;
if (regForm) {
  regForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = regForm.querySelector<HTMLInputElement>('#rName');
    const email = regForm.querySelector<HTMLInputElement>('#rEmail');
    if (name && !name.checkValidity()) {
      name.reportValidity();
      return;
    }
    if (email && !email.checkValidity()) {
      email.reportValidity();
      return;
    }
    const tier = regForm.querySelector<HTMLInputElement>('input[name="tier"]:checked')?.value ?? 'Open entry';
    const finish = (regForm.querySelector<HTMLSelectElement>('#rFinish')?.value ?? '').split(' —')[0];
    const bib = 1000 + Math.floor(Math.random() * 27000);
    regForm.innerHTML =
      `<div class="reg-done"><strong>You’re in the corrals.</strong>` +
      `<span class="reg-bib">BIB ${bib.toLocaleString('en-US')}</span>` +
      `<span class="mono">${tier} · est. ${finish} · demo only — nothing sent, nobody charged. see you at the cannon.</span></div>`;
  });
}

/* ── footer year ── */
const year = document.getElementById('year');
if (year) year.textContent = String(new Date().getFullYear());
