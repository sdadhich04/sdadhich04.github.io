// Mobile menu toggle (the only script on the site besides click-to-load video, R24).
(() => {
  const btn = document.querySelector(".menu-btn");
  const menu = document.getElementById("site-menu");
  if (!btn || !menu) return;
  const set = (open) => {
    btn.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("is-open", open);
  };
  btn.addEventListener("click", () => set(btn.getAttribute("aria-expanded") !== "true"));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") { set(false); btn.focus(); }
  });
})();
