/* ── Course data — the Arden 42, from the city survey ─────────────────
   Marker x/y coordinates live in the same viewBox as the inline
   elevation SVG (1000 × 340): x = 40 + km / 42.195 * 940,
   y = 280 − ele × 2 (2× vertical exaggeration). */

export const DIST = 42.195;
export const HALF = 21.0975;
export const GUN_SECONDS = 7 * 3600; // the cannon, 07:00

export interface Marker {
  km: number;
  x: number;
  y: number;
  name: string;
  short: string;
  ele: number;
  grade: string;
  note: string;
}

export const MARKERS: Marker[] = [
  {
    km: 0, x: 40, y: 264, ele: 8,
    name: 'Docklands Gun Line', short: 'Docklands',
    grade: 'flat — mind the timing mats',
    note: 'Corrals A to E between the cranes. The cannon fires from the harbour battery at 07:00 sharp, and the first kilometre smells like salt and liniment.',
  },
  {
    km: 5, x: 151.4, y: 256, ele: 12,
    name: 'Cannery Flats', short: 'Cannery Flats',
    grade: '+0.3% avg — a false flat',
    note: 'Past the fish sheds and the first drum line. Seconds banked here get repaid at kilometre 20, with interest.',
  },
  {
    km: 10, x: 262.8, y: 212, ele: 34,
    name: 'Millbank Rise', short: 'Millbank Rise',
    grade: '+1.2% avg, pitches to 4%',
    note: 'The first honest climb: 24 metres over three kilometres of warehouse brick. Settle in and shorten the stride.',
  },
  {
    km: 15, x: 374.2, y: 188, ele: 46,
    name: 'The Terraces', short: 'The Terraces',
    grade: '−0.6% avg — rolling',
    note: 'Row houses, brass bands, and the loudest crowds on course. Locals hand out orange slices whether you want them or not.',
  },
  {
    km: 20, x: 485.6, y: 136, ele: 72,
    name: 'Reservoir Hill', short: 'Reservoir Hill',
    grade: 'summit — the top of the race',
    note: 'The highest point on the course and the reason your plan had hill repeats in it. It’s downhill-ish from here. Ish.',
  },
  {
    km: HALF, x: 510, y: 145, ele: 68,
    name: 'Halfway — Aqueduct Arch', short: 'Aqueduct Arch',
    grade: 'half in the bank',
    note: 'The arch does the split beep. Cameras on both sides — this is the photo your family sees first.',
  },
  {
    km: 25, x: 597, y: 204, ele: 38,
    name: 'The Long Downhill', short: 'The Long Downhill',
    grade: '−0.7% avg for 5 km',
    note: 'Free speed, if your quads signed the waiver. Resist the hero kilometre — it’s a trap with a view.',
  },
  {
    km: 30, x: 708.4, y: 236, ele: 22,
    name: 'River Flats', short: 'River Flats',
    grade: '0% — dead flat, open wind',
    note: 'Where the marathon actually starts. Wind off the water, gels at 30.4, and nothing to look at but your watch.',
  },
  {
    km: 34, x: 797.5, y: 186, ele: 47,
    name: 'The Overpass', short: 'The Overpass',
    grade: '+0.8% avg, one 5% ramp',
    note: 'Twenty-five metres of climb nobody mentions at parties. Now you know. Get over it, then spend the descent.',
  },
  {
    km: 38, x: 886.6, y: 244, ele: 18,
    name: 'Old Town Drop', short: 'Old Town Drop',
    grade: '−1.0% avg — cobbles for 400 m',
    note: 'Bells from three churches and a downhill that finally feels kind. Watch your footing on the road crowns.',
  },
  {
    km: 40, x: 931.2, y: 260, ele: 10,
    name: 'The Last Two', short: 'The Last Two',
    grade: '−0.4% — all momentum now',
    note: 'You can hear Civic Square before you can see it. Whatever’s left, spend it here.',
  },
  {
    km: DIST, x: 980, y: 268, ele: 6,
    name: 'Finish — Civic Square', short: 'Civic Square',
    grade: 'the tape',
    note: 'The clock, the tape, the town hall, a medal cast from a retired tram rail. Break something — a PR, ideally.',
  },
];

/** Nearest named point on course for a distance in km — used by the splits table. */
export function nameAt(km: number): string {
  let best = MARKERS[0];
  for (const m of MARKERS) {
    if (Math.abs(m.km - km) < Math.abs(best.km - km)) best = m;
  }
  return best.short;
}
