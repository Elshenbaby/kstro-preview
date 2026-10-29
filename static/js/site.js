// Public website motion. Everything is progressive: without this file the site is fully usable.
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ready(fn) {
    if (document.readyState !== "loading") { fn(); } else { document.addEventListener("DOMContentLoaded", fn); }
  }

  ready(function () {
    document.documentElement.classList.add("site-ready");

    // 1. Reveal blocks as they enter the viewport.
    var reveals = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window && !reduce) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
        });
      }, { rootMargin: "0px 0px -10% 0px" });
      reveals.forEach(function (el) { io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add("is-in"); });
    }

    // 2. Nav colour follows the section under it (Lando-style theme switching).
    var nav = document.querySelector("[data-site-nav]");
    var toned = Array.prototype.slice.call(document.querySelectorAll("[data-tone]")).filter(function (el) {
      return el !== nav;
    });

    // 3. Manifesto words light up with scroll; process rail fills with scroll.
    var words = Array.prototype.slice.call(document.querySelectorAll("[data-words] .word"));
    var wordsBox = document.querySelector("[data-words]");
    var process = document.querySelector("[data-process]");
    var fill = process ? process.querySelector(".process-fill") : null;

    function progressOf(el, start, end) {
      var r = el.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh * start - r.top) / (r.height + vh * (start - end));
      return Math.max(0, Math.min(1, p));
    }

    var ticking = false;
    function onScroll() {
      ticking = false;
      if (nav) {
        var probe = 40;
        for (var i = 0; i < toned.length; i++) {
          var r = toned[i].getBoundingClientRect();
          if (r.top <= probe && r.bottom > probe) { nav.dataset.tone = toned[i].dataset.tone; break; }
        }
        nav.classList.toggle("is-scrolled", window.scrollY > 24);
      }
      if (wordsBox && words.length) {
        var lit = reduce ? words.length : Math.round(progressOf(wordsBox, 0.85, 0.35) * words.length);
        for (var w = 0; w < words.length; w++) { words[w].classList.toggle("on", w < lit); }
      }
      if (fill) { fill.style.height = (reduce ? 100 : progressOf(process, 0.6, 0.4) * 100) + "%"; }
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
    }, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();

    // 4. Hero glow + K mark follow the pointer.
    var hero = document.querySelector("[data-hero]");
    if (hero && !reduce && window.matchMedia("(pointer: fine)").matches) {
      hero.addEventListener("pointermove", function (e) {
        var r = hero.getBoundingClientRect();
        hero.style.setProperty("--mx", ((e.clientX - r.left) / r.width).toFixed(3));
        hero.style.setProperty("--my", ((e.clientY - r.top) / r.height).toFixed(3));
      });
    }

    // 5. Magnetic buttons.
    if (!reduce && window.matchMedia("(pointer: fine)").matches) {
      document.querySelectorAll("[data-magnetic]").forEach(function (el) {
        el.addEventListener("pointermove", function (e) {
          var r = el.getBoundingClientRect();
          var x = (e.clientX - r.left - r.width / 2) * 0.25;
          var y = (e.clientY - r.top - r.height / 2) * 0.35;
          el.style.transform = "translate(" + x + "px," + y + "px)";
        });
        el.addEventListener("pointerleave", function () { el.style.transform = ""; });
      });
    }

    // 6. Live Cairo clock in the footer.
    var clock = document.querySelector("[data-cairo-clock]");
    if (clock) {
      var fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", second: "2-digit" });
      var tick = function () { clock.textContent = fmt.format(new Date()); };
      tick();
      setInterval(tick, 1000);
    }
  });
})();
