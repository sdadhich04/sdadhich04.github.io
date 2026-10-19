// Mobile menu: a full-viewport black overlay with the focus trapped inside while it is open.
// The only script on the site besides click-to-load video (R24).
(() => {
  const btn = document.querySelector(".menu-btn");
  const menu = document.getElementById("site-menu");
  if (!btn || !menu) return;
  const isOpen = () => btn.getAttribute("aria-expanded") === "true";
  const overlayShown = () => getComputedStyle(menu).position === "fixed";
  const focusables = () => [btn, ...menu.querySelectorAll("a[href], button:not([disabled])")]
    .filter((el) => el.getClientRects().length > 0);   // skip links hidden at this width

  const set = (open, { restoreFocus = false } = {}) => {
    btn.setAttribute("aria-expanded", String(open));
    btn.textContent = open ? "Close" : "Menu";
    menu.classList.toggle("is-open", open);
    document.documentElement.classList.toggle("menu-open", open);
    if (open) menu.querySelector("a[href]")?.focus();
    else if (restoreFocus) btn.focus();
  };

  btn.addEventListener("click", () => set(!isOpen(), { restoreFocus: true }));
  menu.addEventListener("click", (e) => { if (e.target.closest("a[href]") && isOpen()) set(false); });

  document.addEventListener("keydown", (e) => {
    if (!isOpen()) return;
    if (e.key === "Escape") { set(false, { restoreFocus: true }); return; }
    if (e.key !== "Tab" || !overlayShown()) return;
    const items = focusables();
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!items.includes(document.activeElement)) { e.preventDefault(); first.focus(); }
  });

  // Leaving the mobile breakpoint with the menu open: close it so the desktop nav shows normally.
  matchMedia("(min-width: 56.0625rem)").addEventListener("change", (e) => { if (e.matches && isOpen()) set(false); });
})();
