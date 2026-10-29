// Alpine components. The CSP build of Alpine only evaluates property/method names,
// so every bit of behaviour lives here instead of inline in templates.
document.addEventListener("alpine:init", function () {
  var Alpine = window.Alpine;

  Alpine.data("sidebar", function () {
    return {
      open: false,
      get panelClass() { return this.open ? "!translate-x-0" : ""; },
      toggle: function () { this.open = !this.open; },
      close: function () { this.open = false; },
    };
  });

  Alpine.data("themeToggle", function () {
    var order = ["system", "light", "dark"];
    return {
      pref: document.documentElement.dataset.themePref || "system",
      get isSystem() { return this.pref === "system"; },
      get isLight() { return this.pref === "light"; },
      get isDark() { return this.pref === "dark"; },
      cycle: function () {
        this.pref = order[(order.indexOf(this.pref) + 1) % order.length];
        document.documentElement.dataset.themePref = this.pref;
        window.kstroApplyTheme();
        var form = this.$root.querySelector("form");
        if (form) {
          form.querySelector("input[name=theme]").value = this.pref;
          window.htmx.trigger(form, "submit");
        }
      },
    };
  });

  Alpine.data("toast", function () {
    return {
      visible: true,
      init: function () {
        var self = this;
        setTimeout(function () { self.visible = false; }, 6000);
      },
      dismiss: function () { this.visible = false; },
    };
  });

  Alpine.data("dropdown", function () {
    return {
      open: false,
      toggle: function () { this.open = !this.open; },
      close: function () { this.open = false; },
    };
  });

  // Multi-step enquiry form (website). Without JS every step shows and the form still posts.
  Alpine.data("inquiry", function () {
    return {
      step: 1,
      total: 4,
      init: function () {
        this.total = parseInt(this.$el.dataset.stepCount, 10) || 4;
        this.step = parseInt(this.$el.dataset.initialStep, 10) || 1;
        this.$el.dataset.ready = "1";
        this.sync();
      },
      get isStep1() { return this.step === 1; },
      get isStep2() { return this.step === 2; },
      get isStep3() { return this.step === 3; },
      get isStep4() { return this.step === 4; },
      get isFirst() { return this.step === 1; },
      get isLast() { return this.step === this.total; },
      get notLast() { return this.step < this.total; },
      get canGoBack() { return this.step > 1; },
      get progressStyle() { return { width: (this.step / this.total) * 100 + "%" }; },
      validStep: function () {
        var fieldset = this.$el.querySelector('[data-step="' + this.step + '"]');
        if (!fieldset) { return true; }
        var group = fieldset.querySelector("[data-require-one]");
        if (group && !group.querySelector("input:checked")) {
          group.classList.add("shake");
          setTimeout(function () { group.classList.remove("shake"); }, 500);
          return false;
        }
        var fields = fieldset.querySelectorAll("input, textarea, select");
        for (var i = 0; i < fields.length; i++) {
          if (!fields[i].checkValidity()) { fields[i].reportValidity(); return false; }
        }
        return true;
      },
      next: function () {
        if (!this.validStep()) { return; }
        if (this.step < this.total) { this.step += 1; this.sync(); }
      },
      prev: function () {
        if (this.step > 1) { this.step -= 1; this.sync(); }
      },
      onSubmit: function (event) {
        if (!this.isLast) { event.preventDefault(); this.next(); return; }
        if (!this.validStep()) { event.preventDefault(); }
      },
      sync: function () {
        var step = this.step;
        document.querySelectorAll("[data-step-number]").forEach(function (el) { el.textContent = step; });
        document.querySelectorAll("[data-rail]").forEach(function (el) {
          var n = parseInt(el.dataset.rail, 10);
          el.classList.toggle("is-current", n === step);
          el.classList.toggle("is-done", n < step);
        });
        var self = this;
        this.$nextTick(function () {
          var first = self.$el.querySelector('[data-step="' + step + '"] input:not(.sr-only), [data-step="' + step + '"] textarea');
          if (first && window.innerWidth > 768 && step > 1) { first.focus({ preventScroll: true }); }
        });
      },
    };
  });

  // ⌘K / Ctrl+K or "/" opens the palette; "g" then d/l/t/f/h jumps between sections.
  Alpine.data("palette", function () {
    var jumps = { d: "/app/deals/", l: "/app/leads/", t: "/app/tickets/", f: "/app/finance/", h: "/app/" };
    return {
      open: false,
      active: -1,
      pendingG: false,
      show: function () {
        this.open = true;
        this.active = -1;
        var self = this;
        this.$nextTick(function () { self.$refs.input.focus(); self.$refs.input.select(); });
      },
      hide: function () { this.open = false; },
      typing: function (e) {
        var t = e.target;
        return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      },
      results: function () { return Array.prototype.slice.call(this.$root.querySelectorAll("[data-result]")); },
      highlight: function (items) {
        var i = this.active;
        items.forEach(function (el, n) { el.classList.toggle("is-active", n === i); });
        if (items[i]) { items[i].scrollIntoView({ block: "nearest" }); }
      },
      onKey: function (e) {
        var key = e.key;
        if ((e.metaKey || e.ctrlKey) && key.toLowerCase() === "k") { e.preventDefault(); this.open ? this.hide() : this.show(); return; }
        if (this.open) {
          var items = this.results();
          if (key === "Escape") { this.hide(); }
          else if (key === "ArrowDown") { e.preventDefault(); this.active = Math.min(this.active + 1, items.length - 1); this.highlight(items); }
          else if (key === "ArrowUp") { e.preventDefault(); this.active = Math.max(this.active - 1, 0); this.highlight(items); }
          else if (key === "Enter" && items[this.active]) { e.preventDefault(); items[this.active].click(); }
          return;
        }
        if (this.typing(e) || e.metaKey || e.ctrlKey || e.altKey) { return; }
        if (key === "/") { e.preventDefault(); this.show(); return; }
        if (this.pendingG && jumps[key]) { this.pendingG = false; window.htmx.ajax("GET", jumps[key], { target: "body", swap: "innerHTML" }); window.history.pushState({}, "", jumps[key]); return; }
        this.pendingG = key === "g";
        var self = this;
        if (this.pendingG) { setTimeout(function () { self.pendingG = false; }, 900); }
      },
    };
  });

  Alpine.data("paletteTrigger", function () {
    return { open: function () { window.dispatchEvent(new CustomEvent("open-palette")); } };
  });

  Alpine.data("modal", function () {
    return {
      init: function () {
        var first = this.$root.querySelector("input:not([type=hidden]), select, textarea");
        if (first && window.innerWidth > 768) { setTimeout(function () { first.focus(); }, 50); }
      },
      close: function () {
        var host = document.getElementById("modal");
        if (host) { host.innerHTML = ""; }
      },
    };
  });

  Alpine.data("secret", function () {
    return {
      label: "Copy",
      copy: function () {
        var self = this;
        navigator.clipboard.writeText(this.$refs.value.textContent).then(function () {
          self.label = "Copied";
          setTimeout(function () { self.label = "Copy"; }, 1500);
        });
      },
    };
  });
});

// Close the modal after a successful form (the server answers 204 + HX-Location).
document.addEventListener("htmx:beforeSwap", function (e) {
  if (e.detail.xhr.status === 204) {
    var host = document.getElementById("modal");
    if (host) { host.innerHTML = ""; }
  }
});
