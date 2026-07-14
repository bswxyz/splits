/* ── The course — a self-drawing elevation profile ────────────────────
   The inline SVG ships fully drawn in the HTML (no JS, no problem).
   With JS: the line is dashed to its own length and the offset is fed
   by scroll progress, so the profile draws itself as you arrive; a
   runner dot rides the line via getPointAtLength, km markers pop in
   as the line passes them, and each marker drives the readout panel.
   Reduced motion: everything rendered complete, interactivity kept. */

import { MARKERS, DIST, type Marker } from './data';
import { etaLine } from './pace';

const SVG_NS = 'http://www.w3.org/2000/svg';
const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));

export function initCourse(reduced: boolean): void {
  const line = document.querySelector<SVGPathElement>('#profileLine');
  const layer = document.querySelector<SVGGElement>('#markerLayer');
  const runner = document.querySelector<SVGGElement>('#runnerDot');
  const ribbon = document.querySelector<SVGPathElement>('#ribbonPath');
  const ticks = document.querySelector<SVGGElement>('#ribbonTicks');
  const fig = document.querySelector<HTMLElement>('.profile-fig');

  const roKm = document.getElementById('roKm');
  const roName = document.getElementById('roName');
  const roGrade = document.getElementById('roGrade');
  const roNote = document.getElementById('roNote');
  const roEta = document.getElementById('roEta');
  if (!line || !layer || !fig) return;

  /* ── guide line under the markers ── */
  const guide = document.createElementNS(SVG_NS, 'line');
  guide.setAttribute('class', 'marker-guide');
  layer.appendChild(guide);

  /* ── readout ── */
  let current: Marker | null = null;
  const groups = new Map<Marker, SVGGElement>();

  const refreshEta = (): void => {
    if (!roEta || !current) return;
    const eta = etaLine(current.km);
    if (eta) {
      roEta.textContent = eta;
      roEta.hidden = false;
    } else {
      roEta.hidden = true;
    }
  };

  const select = (m: Marker): void => {
    current = m;
    if (roKm) roKm.textContent = `KM ${m.km === DIST ? '42.195' : m.km.toFixed(1)} · ELE ${m.ele} m`;
    if (roName) roName.textContent = m.name;
    if (roGrade) roGrade.textContent = m.grade;
    if (roNote) roNote.textContent = m.note;
    refreshEta();
    guide.setAttribute('x1', String(m.x));
    guide.setAttribute('x2', String(m.x));
    guide.setAttribute('y1', String(m.y + 9));
    guide.setAttribute('y2', '280');
    guide.classList.add('is-on');
    groups.forEach((g, mk) => g.classList.toggle('is-active', mk === m));
  };

  document.addEventListener('splits:plan', refreshEta);

  /* ── build the interactive markers ── */
  for (const m of MARKERS) {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'course-marker');
    g.setAttribute('transform', `translate(${m.x} ${m.y})`);
    g.setAttribute('role', 'button');
    g.setAttribute('tabindex', '0');
    const kmLabel = m.km === DIST ? '42.195' : String(Math.round(m.km * 10) / 10);
    g.setAttribute('aria-label', `${m.name} — kilometre ${kmLabel}, ${m.ele} metres. ${m.grade}.`);
    for (const [r, cls] of [
      [13, 'm-hit'],
      [7, 'm-ring'],
      [3, 'm-core'],
    ] as Array<[number, string]>) {
      const c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('r', String(r));
      c.setAttribute('class', cls);
      g.appendChild(c);
    }
    g.addEventListener('pointerenter', () => select(m));
    g.addEventListener('focus', () => select(m));
    g.addEventListener('click', () => select(m));
    g.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        select(m);
      }
    });
    layer.appendChild(g);
    groups.set(m, g);
  }

  /* default readout: the hill everyone asks about */
  const summit = MARKERS.find((m) => m.km === 20);
  if (summit) select(summit);

  /* ── ribbon 5K ticks, spaced by path length ── */
  const ribbonLen = ribbon ? ribbon.getTotalLength() : 0;
  if (ribbon && ticks) {
    for (let k = 5; k <= 40; k += 5) {
      const pt = ribbon.getPointAtLength((k / DIST) * ribbonLen);
      const c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('cx', pt.x.toFixed(1));
      c.setAttribute('cy', pt.y.toFixed(1));
      c.setAttribute('r', '4');
      ticks.appendChild(c);
    }
  }

  /* ── draw-on-scroll ── */
  const lineLen = line.getTotalLength();

  if (reduced) {
    /* one static, fully-drawn frame — no dashing, no loop */
    groups.forEach((g) => g.classList.add('is-past'));
    if (runner) {
      const end = line.getPointAtLength(lineLen);
      runner.setAttribute('transform', `translate(${end.x.toFixed(1)} ${end.y.toFixed(1)})`);
      runner.classList.add('is-on');
    }
    return;
  }

  line.style.strokeDasharray = `${lineLen}`;
  line.style.strokeDashoffset = `${lineLen}`;
  if (ribbon) {
    ribbon.style.strokeDasharray = `${ribbonLen}`;
    ribbon.style.strokeDashoffset = `${ribbonLen}`;
  }

  const update = (): void => {
    const r = fig.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = clamp((vh * 0.9 - r.top) / (vh * 0.75), 0, 1);
    line.style.strokeDashoffset = `${lineLen * (1 - p)}`;
    if (ribbon) ribbon.style.strokeDashoffset = `${ribbonLen * (1 - p)}`;
    const pt = line.getPointAtLength(lineLen * p);
    if (runner) {
      runner.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
      runner.classList.toggle('is-on', p > 0.01);
    }
    groups.forEach((g, m) => {
      if (pt.x >= m.x - 1) g.classList.add('is-past');
    });
  };

  let ticking = false;
  const onScroll = (): void => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      update();
    });
  };

  update();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
}
