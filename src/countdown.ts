/* ── Race clock — counts down to the next cannon ──────────────────────
   Race day is the fourth Sunday of October, gun at 07:00 local. If this
   year's edition is done (course closes 14:30), the clock rolls to next
   year. Reduced motion renders one static frame — no ticking loop. */

const fourthSundayOfOctober = (year: number): Date => {
  const first = new Date(year, 9, 1);
  const toSunday = (7 - first.getDay()) % 7;
  return new Date(year, 9, 1 + toSunday + 21, 7, 0, 0, 0);
};

export function initCountdown(reduced: boolean): void {
  const days = document.getElementById('cdDays');
  const hours = document.getElementById('cdHours');
  const mins = document.getElementById('cdMins');
  const secs = document.getElementById('cdSecs');
  const state = document.getElementById('clockState');
  const dateLbl = document.getElementById('raceDate');
  if (!days || !hours || !mins || !secs) return;

  const now = new Date();
  let gun = fourthSundayOfOctober(now.getFullYear());
  const closes = new Date(gun);
  closes.setHours(14, 30, 0, 0);
  if (now.getTime() > closes.getTime()) gun = fourthSundayOfOctober(now.getFullYear() + 1);

  if (dateLbl) {
    dateLbl.textContent =
      gun.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) +
      ' · 07:00';
  }

  /* schedule cards carry data-dayoffset relative to race day */
  document.querySelectorAll<HTMLElement>('[data-dayoffset]').forEach((el) => {
    const off = parseInt(el.dataset.dayoffset || '0', 10);
    const day = new Date(gun);
    day.setDate(day.getDate() + off);
    const txt = day.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    el.textContent = off === 0 ? `${txt} — race day` : txt;
  });

  const pad = (n: number): string => String(n).padStart(2, '0');
  const render = (): void => {
    const diff = gun.getTime() - Date.now();
    if (diff <= 0) {
      days.textContent = '00';
      hours.textContent = '00';
      mins.textContent = '00';
      secs.textContent = '00';
      if (state) state.textContent = 'racing now';
      return;
    }
    const t = Math.floor(diff / 1000);
    days.textContent = pad(Math.floor(t / 86400));
    hours.textContent = pad(Math.floor((t % 86400) / 3600));
    mins.textContent = pad(Math.floor((t % 3600) / 60));
    secs.textContent = pad(t % 60);
  };

  render();
  if (!reduced) window.setInterval(render, 1000);
}
