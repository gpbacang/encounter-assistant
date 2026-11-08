/**
 * Center `el` inside its scrolling `container` without moving anything else.
 * (scrollIntoView also scrolls every ancestor, including the page, which
 * pushes the fixed top bar out of view.)
 */
export function scrollWithin(container: HTMLElement | null, el: HTMLElement | null | undefined) {
  if (!container || !el) return;
  const c = container.getBoundingClientRect();
  const e = el.getBoundingClientRect();
  const top = container.scrollTop + (e.top - c.top) - (container.clientHeight - e.height) / 2;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  container.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' });
}
