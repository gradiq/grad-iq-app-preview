/* Grad-IQ Planners: the one-time "Unlock all planners" purchase.
   Free download = demo editions (sample data, nothing saved). The unlock (non-consumable in-app purchase
   org.iqlearning.gradiq.unlock_all) turns on the full planners: saving, backup/export and loan reminders.
   Stores: Apple StoreKit 2 / Google Play Billing via @capgo/native-purchases (no third-party account or server).
   Test store: ONLY when the native GradIQBuild plugin reports a debug build (BuildConfig.DEBUG on Android,
   #if DEBUG on iOS). Release builds always use the real store and ignore/erase any simulated unlock.
   Prices are never hard-coded in the UI: they come from the store (localized priceString). */
(function () {
  "use strict";
  var PID = "org.iqlearning.gradiq.unlock_all";
  var KEY = "gradiq-unlock-v1";          // cached entitlement (mirrored to native Preferences by bridge.js)
  var SIMKEY = "gradiq-sim-store-v1";    // debug-only: what the simulated store account "owns"
  var C = window.Capacitor, M = window.GRADIQ_MODE || {};
  var native = !!(C && C.isNativePlatform && C.isNativePlatform());
  var platform = native && C.getPlatform ? C.getPlatform() : "web";
  function plug(n) { return native && C.Plugins ? C.Plugins[n] : null; }
  var NP = plug("NativePurchases"), BI = plug("GradIQBuild"), App = plug("App");
  var build = null, lastProduct = null, status = "";

  function read() { try { var j = JSON.parse(localStorage.getItem(KEY) || "null"); return j && j.product === PID ? j : null; } catch (e) { return null; } }
  function write(source, extra) {
    var j = { v: 1, product: PID, source: source, platform: platform, at: new Date().toISOString() };
    for (var k in extra || {}) j[k] = extra[k];
    localStorage.setItem(KEY, JSON.stringify(j)); emit();
  }
  function revoke() { if (read()) { localStorage.removeItem(KEY); emit(); } }
  function emit() { document.dispatchEvent(new CustomEvent("gradiq:entitlement", { detail: { unlocked: isUnlocked() } })); }

  /* Build info from native code. No native plugin (web preview, tests without it) = not debug. */
  var ready = (BI ? BI.getInfo().catch(function () { return {}; }) : Promise.resolve({})).then(function (b) {
    build = { debug: b && b.debug === true, versionName: (b && b.versionName) || "", versionCode: (b && b.versionCode) || "" };
    scrub();
    return build;
  });
  // Release builds: a simulated unlock can never count, and its records are erased (again after a storage restore).
  function scrub() {
    if (!build || build.debug) return;
    var c = read(); if (c && c.source === "sim") localStorage.removeItem(KEY);
    if (localStorage.getItem(SIMKEY) != null) localStorage.removeItem(SIMKEY);
  }
  document.addEventListener("gradiq:restored", function () { scrub(); emit(); });

  function mode() { if (!build) return "loading"; if (build.debug) return "sim"; if (NP) return "store"; return "none"; }
  /* Synchronous answer for page routing. A simulated unlock only counts once native code has confirmed a debug build. */
  function isUnlocked() { var c = read(); if (!c) return false; if (c.source === "sim") return !!(build && build.debug); return c.platform === platform; }

  function storeName() { return platform === "ios" ? "App Store" : platform === "android" ? "Google Play" : "store"; }
  function theStore() { return platform === "android" ? "Google Play" : "the " + storeName(); }
  function errText(e) { return String((e && (e.message || e.errorMessage || e.code)) || e || ""); }

  /* Product (title + localized price) */
  function product() {
    return ready.then(function () {
      var m = mode();
      if (m === "sim") return (lastProduct = { id: PID, title: "Unlock all planners", priceString: SIM_PRICE() + " (test)", test: true });
      if (m !== "store") return null;
      return NP.getProducts({ productIdentifiers: [PID], productType: "inapp" }).then(function (r) {
        var p = (r && r.products || []).filter(function (x) { return x.identifier === PID; })[0];
        return (lastProduct = p ? { id: PID, title: p.title, description: p.description, priceString: p.priceString } : null);
      }).catch(function () { return null; });
    });
  }
  // Test-only fallback price for the simulated store in debug builds. Real builds show the store's localized price.
  function SIM_PRICE() { return "$19.00"; }

  /* Ask the store what this Apple ID / Google account owns right now. */
  function check() {
    return ready.then(function () {
      var m = mode();
      if (m === "sim") { var c = read(); if (c && c.source === "sim" && !simOwned()) revoke(); return { ok: true, owned: isUnlocked() }; }
      if (m !== "store") return { ok: false };
      return NP.getPurchases({ productType: "inapp", onlyCurrentEntitlements: true }).then(function (r) {
        var list = (r && r.purchases || []).filter(function (p) { return p.productIdentifier === PID; });
        var good = list.filter(function (p) { return platform === "android" ? String(p.purchaseState) === "1" : !p.revocationDate; })[0];
        var pending = platform === "android" && list.some(function (p) { return String(p.purchaseState) === "2"; });
        if (good) {
          if (platform === "android" && good.isAcknowledged === false && good.purchaseToken) NP.acknowledgePurchase({ purchaseToken: good.purchaseToken }).catch(function () {});
          if (!isUnlocked()) write(platform === "ios" ? "apple" : "google", { txn: good.transactionId || "" });
          status = ""; return { ok: true, owned: true };
        }
        revoke(); status = pending ? "pending" : "";       // refunded / revoked / never bought
        return { ok: true, owned: false, pending: pending };
      }).catch(function (e) { return { ok: false, error: errText(e) }; }); // offline etc.: keep the cached answer
    });
  }

  function buy() {
    return ready.then(function () {
      var m = mode();
      if (m === "sim") {
        if (!confirm("TEST STORE (debug build only)\n\nSimulate buying “Unlock all planners”? No money is charged.")) return { cancelled: true };
        localStorage.setItem(SIMKEY, JSON.stringify({ owned: [PID] })); write("sim"); return { unlocked: true };
      }
      if (m !== "store") return { error: "Purchases are available in the Grad-IQ Planners app from " + theStore() + "." };
      return NP.purchaseProduct({ productIdentifier: PID, productType: "inapp", quantity: 1 }).then(function (t) {
        if (platform === "android" && t && t.purchaseState != null && String(t.purchaseState) !== "1") { status = "pending"; return { pending: true }; }
        write(platform === "ios" ? "apple" : "google", { txn: (t && t.transactionId) || "" }); return { unlocked: true };
      }).catch(function (e) {
        var s = errText(e);
        if (/pending/i.test(s)) { status = "pending"; return { pending: true }; }
        if (/cancel/i.test(s)) return { cancelled: true };
        if (/already owned|ITEM_ALREADY_OWNED/i.test(s)) return restore();
        return { error: s || "The purchase didn't go through." };
      });
    });
  }

  function restore() {
    return ready.then(function () {
      var m = mode();
      if (m === "sim") { if (simOwned()) { write("sim"); return { unlocked: true }; } return { found: false }; }
      if (m !== "store") return { error: "Restore is available in the Grad-IQ Planners app." };
      return NP.restorePurchases().catch(function () {}).then(check).then(function (r) {
        if (r.owned) return { unlocked: true };
        if (r.pending) return { pending: true };
        return r.ok ? { found: false } : { error: r.error || "Couldn't reach " + theStore() + ". Check your connection and try again." };
      });
    });
  }

  function simOwned() { try { return (JSON.parse(localStorage.getItem(SIMKEY) || "{}").owned || []).indexOf(PID) >= 0; } catch (e) { return false; } }
  /* Debug-only helpers (About screen, tests). No-ops unless native code reported a debug build. */
  var dev = {
    resetLocalUnlock: function () { return ready.then(function () { if (build.debug) revoke(); }); },          // like a reinstall: store still "owns" it
    clearSimStore: function () { return ready.then(function () { if (build.debug) { localStorage.removeItem(SIMKEY); revoke(); } }); } // like a refund
  };

  // StoreKit 2 pushes Ask-to-Buy approvals, purchases on other devices and refunds as transaction updates.
  if (NP && NP.addListener) {
    try { NP.addListener("transactionUpdated", function (t) {
      if (!t || t.productIdentifier !== PID || mode() !== "store") return;
      if (t.revocationDate) revoke(); else if (platform !== "android" || String(t.purchaseState) === "1") write(platform === "ios" ? "apple" : "google", { txn: t.transactionId || "" });
    }); } catch (e) { /* ignore */ }
  }
  // Re-check when the app returns to the foreground (completes pending Play purchases, picks up refunds).
  if (App && !M.preview) App.addListener("appStateChange", function (s) { if (s && s.isActive) check(); });

  window.GQStore = {
    PID: PID, platform: platform, native: native, ready: ready, mode: mode, isUnlocked: isUnlocked, cached: read,
    product: product, check: check, buy: buy, restore: restore, storeName: storeName, theStore: theStore, dev: dev,
    get status() { return status; }, get build() { return build; }
  };
})();
