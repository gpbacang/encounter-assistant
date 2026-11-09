/**
 * Center `el` inside its scrolling `container` without moving anything else.
 * (scrollIntoView also scrolls every ancestor, including the page, which
 * pushes the fixed top bar out of view.) On narrow screens the container
 * doesn't scroll and the page does, so scrollIntoView is the right call there.
 */
export function scrollWithin(container: HTMLElement | null, el: HTMLElement | null | undefined) {
  if (!container || !el) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const behavior = reduce ? 'auto' : 'smooth';
  if (container.scrollHeight <= container.clientHeight) {
    el.scrollIntoView({ block: 'center', behavior });
    return;
  }
  const c = container.getBoundingClientRect();
  const e = el.getBoundingClientRect();
  const top = container.scrollTop + (e.top - c.top) - (container.clientHeight - e.height) / 2;
  container.scrollTo({ top: Math.max(0, top), behavior });
}
