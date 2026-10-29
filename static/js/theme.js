// Runs in <head> before paint so there is no light/dark flash. No inline scripts (CSP).
(function () {
  var root = document.documentElement;
  root.classList.add("js");
  var media = window.matchMedia("(prefers-color-scheme: dark)");
  function apply() {
    var pref = root.dataset.themePref || "system";
    var dark = pref === "dark" || (pref === "system" && media.matches);
    root.dataset.theme = dark ? "dark" : "light";
  }
  apply();
  media.addEventListener("change", apply);
  window.kstroApplyTheme = apply;
})();
