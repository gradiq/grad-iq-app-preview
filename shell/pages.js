/* Grad-IQ Planners: Unlock and About screens. */
(function () {
  "use strict";
  var S = window.GQStore, M = window.GRADIQ_MODE || {};
  function $(id) { return document.getElementById(id); }
  function say(t) { var el = $("buy-status"); if (el) el.textContent = t || ""; }
  var store = S ? S.storeName() : "store", the = S ? S.theStore() : "the store";
  Array.prototype.forEach.call(document.querySelectorAll(".store-name"), function (el) { el.textContent = S && S.mode() !== "none" ? the : "Apple or Google"; });
  function web() { return !S || S.mode() === "none"; }

  function paint() {
    var on = S && S.isUnlocked();
    if ($("owned")) $("owned").hidden = !on;
    if ($("buy-box")) $("buy-box").hidden = on;
    if ($("test-banner")) $("test-banner").hidden = !(S && S.mode() === "sim");
    if ($("ent-status")) {
      var c = S && S.cached();
      $("ent-status").textContent = on ? "Unlocked" + (c && c.source === "sim" ? " (test store)" : " (" + store + ")") : web() ? "Free demo (purchases are in the app)" : S.status === "pending" ? "Purchase pending" : "Free demo";
    }
    if ($("about-unlock")) $("about-unlock").hidden = on || web();
    if ($("restore")) $("restore").hidden = web();
    if ($("dev")) $("dev").hidden = !(S && S.build && S.build.debug);
    if ($("app-ver")) { var b = S && S.build; $("app-ver").textContent = (b && b.versionName ? b.versionName + " (" + b.versionCode + ")" : "v" + (M.version || "")) + (b && b.debug ? " · debug" : ""); }
  }
  function loadPrice() {
    var btn = $("buy"); if (!btn) return;
    if (web()) { btn.disabled = true; btn.textContent = "Available in the app"; say("Purchases are made in the Grad-IQ Planners app from the App Store or Google Play."); return; }
    btn.disabled = true; btn.textContent = "Loading price…"; $("retry").hidden = true;
    S.product().then(function (p) {
      if (p && p.priceString) { btn.disabled = false; btn.textContent = "Unlock everything · " + p.priceString; btn.setAttribute("aria-label", "Unlock everything for " + p.priceString); say(""); }
      else { btn.textContent = "Unlock everything"; $("retry").hidden = false; say("Couldn't load the price from " + the + ". Check your connection and try again."); }
    });
  }
  function result(r) {
    paint();
    if (!r) return;
    if (r.unlocked) say("Unlocked. Thank you! Your full planners are ready.");
    else if (r.pending) say("Your purchase is pending. It will unlock automatically when " + the + " confirms the payment.");
    else if (r.found === false) say("No previous purchase found for this " + (S.platform === "ios" ? "Apple Account" : "Google account") + ".");
    else if (r.error) say(r.error);
    else if (r.cancelled) say("");
  }
  if (!S) return;
  S.ready.then(function () { Array.prototype.forEach.call(document.querySelectorAll(".store-name"), function (el) { el.textContent = S.mode() === "none" ? "Apple or Google" : S.mode() === "sim" ? "the test store" : the; }); paint(); loadPrice(); if (!web()) S.check().then(paint); });
  document.addEventListener("gradiq:entitlement", paint);
  if ($("buy")) $("buy").onclick = function () { var b = this; b.disabled = true; say("Opening " + the + "…"); S.buy().then(function (r) { b.disabled = false; result(r); }); };
  if ($("retry")) $("retry").onclick = loadPrice;
  if ($("restore")) $("restore").onclick = function () { var b = this; b.disabled = true; say("Checking " + the + "…"); S.restore().then(function (r) { b.disabled = false; result(r); }); };
  function dev(t) { $("dev-status").textContent = t; }
  if ($("dev-reset")) $("dev-reset").onclick = function () { S.dev.resetLocalUnlock().then(function () { paint(); dev("Local unlock removed. Tap Restore purchases to get it back."); }); };
  if ($("dev-clear")) $("dev-clear").onclick = function () { S.dev.clearSimStore().then(function () { paint(); dev("Test-store purchase cleared. Restore will now find nothing."); }); };
  if ($("dev-sync")) $("dev-sync").onclick = function () { if (window.GQReminders) window.GQReminders.sync().then(function (l) { dev("Reminders: " + (l.count || 0) + " scheduled (" + (l.state || "") + ")."); }); };
})();
