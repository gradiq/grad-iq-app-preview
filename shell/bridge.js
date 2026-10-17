/* Grad-IQ Planners: native bridge for the app shell. Loaded on the home screen and on every planner page,
   before the planner's own scripts. Does nothing harmful on the plain web (preview): every native call is guarded.
   1. Durable storage: every localStorage write is mirrored to Capacitor Preferences (native SharedPreferences /
      UserDefaults), and restored into localStorage at launch if the WebView's storage was cleared.
   2. Android hardware back: planner -> home, home -> exit.
   3. Back-to-home app bar on planner pages (safe-area aware).
   4. External links (sources) open in the system browser; downloads (backup JSON / CSV) are shared via the native share sheet. */
(function () {
  "use strict";
  var M = window.GRADIQ_MODE || {};
  var C = window.Capacitor;
  var native = !!(C && C.isNativePlatform && C.isNativePlatform());
  function plug(n) { return native && C.Plugins ? C.Plugins[n] : null; }
  var Prefs = plug("Preferences"), App = plug("App"), FS = plug("Filesystem"), Share = plug("Share");
  var PFX = "ls:";
  var inPlanner = /\/planners\//.test(location.pathname);
  var homeHref = inPlanner ? "../../index.html" : "index.html";
  function isHome() { return !!(document.body && document.body.classList.contains("home")); }
  if (native) document.documentElement.classList.add("in-app");
  document.documentElement.classList.add(M.preview ? "in-preview" : "gq-app");

  /* 1. storage mirror */
  if (Prefs) {
    var ls = window.localStorage, sp = Storage.prototype, oSet = sp.setItem, oRem = sp.removeItem, oClr = sp.clear;
    sp.setItem = function (k, v) { oSet.call(this, k, v); if (this === ls) Prefs.set({ key: PFX + k, value: String(v) }).catch(function () {}); };
    sp.removeItem = function (k) { oRem.call(this, k); if (this === ls) Prefs.remove({ key: PFX + k }).catch(function () {}); };
    sp.clear = function () { oClr.call(this); if (this === ls) Prefs.keys().then(function (r) { r.keys.forEach(function (k) { if (k.indexOf(PFX) === 0) Prefs.remove({ key: k }); }); }).catch(function () {}); };
    // Restore: native copy wins only when the WebView copy is missing (e.g. OS reclaimed WebView storage).
    Prefs.keys().then(function (r) {
      var miss = r.keys.filter(function (k) { return k.indexOf(PFX) === 0 && ls.getItem(k.slice(PFX.length)) === null; });
      return Promise.all(miss.map(function (k) { return Prefs.get({ key: k }).then(function (g) { if (g.value != null) oSet.call(ls, k.slice(PFX.length), g.value); }); }))
        .then(function () {
          // Back-fill: data saved before the mirror existed gets copied to native storage.
          for (var i = 0; i < ls.length; i++) { var k = ls.key(i); if (r.keys.indexOf(PFX + k) < 0) Prefs.set({ key: PFX + k, value: ls.getItem(k) }); }
          document.dispatchEvent(new CustomEvent("gradiq:restored", { detail: { restored: miss.length } }));
          if (miss.length && inPlanner) location.reload(); // planner already read empty storage; reload with restored data
        });
    }).catch(function () {});
  }

  /* 2. Android hardware back */
  if (App) {
    App.addListener("backButton", function () { if (isHome()) App.exitApp(); else location.href = homeHref; });
  }

  /* 3. app bar on planner pages */
  if (inPlanner) {
    var bar = function () {
      if (document.getElementById("gq-appbar")) return;
      var b = document.createElement("nav"); b.id = "gq-appbar"; b.setAttribute("aria-label", "App");
      var title = (document.title || "Grad-IQ Planners").split(/ · | — /)[0];
      if (/^Lumen$/.test(title)) title = "Lumen 7-Step Planner";
      b.innerHTML = '<a href="' + homeHref + '" class="gq-home" id="gq-home"><span aria-hidden="true">‹</span> Home</a>' +
        '<span class="gq-title"></span>' + (M.preview ? '<span class="gq-demo">Demo</span>' : '<span class="gq-spacer"></span>');
      b.querySelector(".gq-title").textContent = title;
      document.body.insertBefore(b, document.body.firstChild);
    };
    if (document.body) bar(); else document.addEventListener("DOMContentLoaded", bar);
  }

  /* 4. links + downloads */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]"); if (!a) return;
    var href = a.getAttribute("href") || "";
    if (native && /^https?:\/\//i.test(href)) { e.preventDefault(); location.href = href; } // Capacitor hands non-app URLs to the system browser
  }, true);
  if (native && FS && Share) {
    var oClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.download && /^blob:/.test(this.href)) {
        var name = this.download.replace(/[^\w.\-]+/g, "_");
        fetch(this.href).then(function (r) { return r.text(); }).then(function (text) {
          return FS.writeFile({ path: name, data: text, directory: "CACHE", encoding: "utf8" });
        }).then(function (w) { return Share.share({ title: name, files: [w.uri] }); }).catch(function (err) {
          if (!/cancel/i.test(String(err && err.message))) alert("Couldn't share the file: " + (err && err.message || err));
        });
        return;
      }
      return oClick.call(this);
    };
  }
})();
