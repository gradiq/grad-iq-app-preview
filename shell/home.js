/* Grad-IQ Planners: home screen. */
(function () {
  "use strict";
  var P = [
    { id: "stipend", title: "PhD Stipend & Loan Budget", sub: "Stipend budget, summer gaps, loan tracker and RAP due dates", key: "gradiq-phd-stipend-loan-v1", color: "mint", icon: "💵" },
    { id: "study", title: "Burnout-Proof Study Tracker", sub: "Minimum good day, focus timer, flashcards, weekly review", key: "gradiq-burnout-proof-study-v1", color: "lavender", icon: "🌱" },
    { id: "roadmap", title: "PhD Roadmap", sub: "Advisor outreach, milestones, job plan, defense countdown", key: "gradiq-phd-roadmap-v1", color: "sky", icon: "🧭" },
    { id: "lumen", title: "Lumen 7-Step Time Planner", sub: "Seven calm steps from chaos to a weekly plan", key: "lumen-seven-step-v1", color: "blush", icon: "🕯️" }
  ];
  var M = window.GRADIQ_MODE || {};
  function has(k) { try { return !!localStorage.getItem(k); } catch (e) { return false; } }
  var S = window.GQStore;
  function unlocked() { return !M.preview && !!(S && S.isUnlocked()); }
  function render() {
    var full = unlocked();
    document.getElementById("tiles").innerHTML = P.map(function (p) {
      var st = M.preview ? "Demo · sample data" : !full ? "Free demo · sample data, not saved" : (has(p.key) ? "Saved on this device" : "Start fresh");
      var dir = M.preview || full ? "planners/" : "demo/";
      return '<a class="tile ' + p.color + '" href="' + dir + p.id + '/index.html" data-planner="' + p.id + '" data-edition="' + (M.preview ? "demo" : full ? "full" : "demo") + '">' +
        '<span class="tile-icon" aria-hidden="true">' + p.icon + '</span>' +
        '<span class="tile-text"><strong>' + p.title + '</strong><span class="tile-sub">' + p.sub + '</span>' +
        '<span class="tile-status">' + st + '</span></span><span class="chev" aria-hidden="true">›</span></a>';
    }).join("");
    var cta = document.getElementById("unlock-cta");
    if (cta) cta.hidden = M.preview || full;
    var lede = document.getElementById("lede");
    if (lede && !M.preview) lede.textContent = full ? "Four planners for grad school, in one place. Everything you type stays on this device."
      : "Four planners for grad school. Try each one free with sample data, then unlock them all to save your own plans.";
  }
  render();
  if (S && !M.preview) {
    S.ready.then(render);
    document.addEventListener("gradiq:entitlement", render);
    // Launch check with the App Store / Google Play: picks up purchases made elsewhere, pending purchases that completed, refunds.
    S.ready.then(function () { return S.check(); }).then(render);
  }
  if (M.preview) { var n = document.getElementById("mode-note"); n.hidden = false; n.textContent = "Web preview of the app. Planners run in demo mode with sample data, and nothing is saved."; }
  document.getElementById("ver").textContent = M.version ? "v" + M.version : "";
  // Re-render after native storage restore (bridge fires this) so "Saved" badges are right.
  document.addEventListener("gradiq:restored", render);
  window.addEventListener("pageshow", render);
})();
