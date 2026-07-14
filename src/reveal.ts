/* ── Scroll reveals + animated counters ───────────────────────────────
   Progressive: hidden states are gated behind the .js class, and
   reduced-motion visitors get instant content and final numbers. */

export function initReveals(reduced: boolean): void {
  const nodes = document.querySelectorAll<HTMLElement>('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    nodes.forEach((n) => n.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          (e.target as HTMLElement).classList.add('is-in');
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.16, rootMargin: '0px 0px -6% 0px' },
  );
  nodes.forEach((n) => {
    /* arriving via an anchor link can land past an element — never leave it hidden */
    if (n.getBoundingClientRect().bottom < 0) {
      n.classList.add('is-in');
      return;
    }
    io.observe(n);
  });
}

export function initCounters(reduced: boolean): void {
  const nodes = document.querySelectorAll<HTMLElement>('.c-num');
  const fmt = (n: number): string => Math.round(n).toLocaleString('en-US');
  const finish = (n: HTMLElement): void => {
    n.textContent = fmt(parseFloat(n.dataset.to || '0'));
  };
  if (reduced || !('IntersectionObserver' in window)) {
    nodes.forEach(finish);
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const n = e.target as HTMLElement;
        io.unobserve(n);
        const to = parseFloat(n.dataset.to || '0');
        const dur = 1300;
        const t0 = performance.now();
        const tick = (t: number): void => {
          const p = Math.min(1, (t - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 3); // a negative split, numerically
          n.textContent = fmt(to * eased);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    },
    { threshold: 0.6 },
  );
  nodes.forEach((n) => io.observe(n));
}
