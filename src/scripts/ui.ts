// Header behaviour: mobile menu sheet, hairline on scroll, active anchor; the phone call bar after the hero.
// Everything works without this script (anchors, tel:, mailto:); it only adds comfort.
const header = document.querySelector<HTMLElement>("[data-header]");
const toggle = document.querySelector<HTMLButtonElement>("[data-menu-toggle]");
const nav = document.getElementById("site-nav");
const label = document.querySelector<HTMLElement>("[data-menu-label]");

function setMenu(open: boolean): void {
  if (!toggle || !nav) return;
  toggle.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("is-open", open);
  document.documentElement.classList.toggle("menu-open", open);
  if (label) label.textContent = open ? "Закрити меню" : "Відкрити меню";
}

toggle?.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
nav?.addEventListener("click", (e) => {
  if ((e.target as HTMLElement).closest("a")) setMenu(false);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && toggle?.getAttribute("aria-expanded") === "true") {
    setMenu(false);
    toggle.focus();
  }
});
window.matchMedia("(min-width: 1024px)").addEventListener("change", (m) => {
  if (m.matches) setMenu(false);
});

// hairline under the header once the page moves
const onScroll = (): void => header?.classList.toggle("is-scrolled", window.scrollY > 8);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

// active anchor in the menu
const links = [...document.querySelectorAll<HTMLAnchorElement>("[data-nav]")];
const targets = links
  .map((a) => document.querySelector<HTMLElement>(a.getAttribute("href") ?? ""))
  .filter((el): el is HTMLElement => el !== null);
if ("IntersectionObserver" in window && targets.length) {
  const spy = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        if (e.target.id === "hero") {
          links.forEach((a) => a.removeAttribute("aria-current"));
          continue;
        }
        for (const a of links) {
          if (a.getAttribute("href") === `#${e.target.id}`) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        }
      }
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );
  targets.forEach((t) => spy.observe(t));
  const heroBlock = document.getElementById("hero");
  if (heroBlock) spy.observe(heroBlock);
}

// call bar on phones: appears after the hero has scrolled away
const bar = document.querySelector<HTMLElement>("[data-callbar]");
const hero = document.getElementById("hero");
if (bar && hero && "IntersectionObserver" in window) {
  let afterHero = false;
  const seen = new Set<Element>();
  const update = (): void => {
    const tucked = seen.size > 0;
    bar.classList.toggle("is-shown", afterHero);
    bar.classList.toggle("is-tucked", tucked);
    bar.toggleAttribute("inert", !afterHero || tucked);
  };
  new IntersectionObserver(([e]) => {
    afterHero = !e.isIntersecting;
    update();
  }).observe(hero);
  // tuck the bar away while the blocks with their own contact buttons are on screen
  const tuck = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) seen.add(e.target);
      else seen.delete(e.target);
    }
    update();
  });
  ["online", "contacts"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) tuck.observe(el);
  });
  update();
}
