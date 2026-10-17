/* Burnout-Proof Study Tracker (Grad-IQ). No health claims; support links point to official services (see Sources). */
(function () {
  "use strict";
  var H = window.PH;
  var L = { l988: "https://988lifeline.org/", samhsa: "https://www.samhsa.gov/find-help/988", findtx: "https://findtreatment.gov/" };
  function a(u, t) { return '<a href="' + u + '" target="_blank" rel="noopener">' + t + "</a>"; }
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function ago(n) { var d = new Date(); d.setDate(d.getDate() - n); return iso(d); }
  function day(dt) { return { id: H.uid(), date: dt || H.today(), mins: "", cards: "", did: "", energy: "3", min: false, note: "" }; }
  function sess(dt, m, t) { return { id: H.uid(), date: dt || H.today(), mins: m || "", task: t || "" }; }
  function fc() { return { id: H.uid(), date: H.today(), deck: "", cards: "", right: "", mins: "", next: "" }; }
  function rev() { return { id: H.uid(), week: "", worked: "", blocked: "", minNext: "", drop: "", proud: "" }; }
  function defaults() {
    return { std: { a: "", b: "", c: "", rule: "any" }, days: [], timer: { mins: "25", task: "" }, sessions: [], cards: [], reviews: [], support: { person: "", campus: "", notes: "" } };
  }
  function demo() {
    return {
      std: { a: "25 focused minutes on my main course", b: "20 flashcards", c: "Read 2 pages and write 1 summary line", rule: "any" },
      days: [day(ago(6)), day(ago(5)), day(ago(4)), day(ago(3)), day(ago(2)), day(ago(1)), day(ago(0))].map(function (d, i) {
        var m = [["50", "40", "Stats problem set, Anki", "4", true], ["25", "0", "Read ch. 3 (slow day)", "2", true], ["0", "0", "Sick, rested", "1", false], ["30", "20", "Flashcards + outline", "3", true], ["90", "60", "Library block", "4", true], ["25", "20", "Quick review", "3", true], ["40", "30", "Practice quiz", "3", true]][i];
        d.mins = m[0]; d.cards = m[1]; d.did = m[2]; d.energy = m[3]; d.min = m[4]; d.note = i === 2 ? "Rest day counts as taking care of the plan." : ""; return d;
      }),
      timer: { mins: "25", task: "Stats review" },
      sessions: [sess(ago(2), "25", "Problem set"), sess(ago(2), "25", "Problem set"), sess(ago(1), "25", "Quick review"), sess(ago(0), "40", "Practice quiz")],
      cards: [{ id: "f1", date: ago(4), deck: "Stats terms", cards: "40", right: "70", mins: "15", next: ago(1) }, { id: "f2", date: ago(1), deck: "Stats terms", cards: "20", right: "85", mins: "8", next: ago(-3) }, { id: "f3", date: ago(0), deck: "Bio pathways", cards: "30", right: "60", mins: "12", next: ago(-1) }],
      reviews: [{ id: "r1", week: ago(7), worked: "Short morning sessions before class.", blocked: "Phone on the desk.", minNext: "25 minutes OR 20 cards", drop: "Re-copying notes", proud: "Kept going on a low-energy week." }],
      support: { person: "Study buddy: Sam (sample)", campus: "Campus counseling center: add number", notes: "" }
    };
  }
  /* focus timer: lives outside the saved data */
  var T = { end: 0, left: 0, run: false, iv: null, total: 0 };
  function pad(n) { return String(n).padStart(2, "0"); }
  function fmtT(sec) { sec = Math.max(0, Math.round(sec)); return pad(Math.floor(sec / 60)) + ":" + pad(sec % 60); }
  function remaining() { return T.run ? (T.end - Date.now()) / 1000 : T.left; }
  function paint() { var el = document.getElementById("tmr"); if (el) el.textContent = fmtT(remaining()); var st = document.getElementById("tmr-state"); if (st) st.textContent = T.run ? "Focusing…" : T.left ? "Paused" : "Ready"; }
  var finishCb = null;
  function tick() { if (T.run && remaining() <= 0) { T.run = false; clearInterval(T.iv); T.left = 0; if (finishCb) finishCb(); } paint(); }

  function minDone(d) { return !!d.min; }
  function streak(s) {
    var set = {}; s.days.forEach(function (d) { if (minDone(d)) set[d.date] = 1; });
    var n = 0, i = set[H.today()] ? 0 : 1; while (set[ago(i)]) { n++; i++; } return n;
  }
  function weekOf(s, start) {
    var st = new Date(start + "T00:00:00"), en = new Date(st); en.setDate(en.getDate() + 7); var a0 = iso(st), a1 = iso(en);
    var inW = function (x) { return x.date >= a0 && x.date < a1; };
    var ds = s.days.filter(inW), ss = s.sessions.filter(inW), cs = s.cards.filter(inW);
    return { logged: ds.length, good: ds.filter(minDone).length, mins: ds.reduce(function (t, d) { return t + H.num(d.mins); }, 0) + 0, focus: ss.reduce(function (t, x) { return t + H.num(x.mins); }, 0), sessions: ss.length, cards: cs.reduce(function (t, x) { return t + H.num(x.cards); }, 0) + ds.reduce(function (t, d) { return t + H.num(d.cards); }, 0) };
  }
  function monday(d) { d = new Date(d); var k = (d.getDay() + 6) % 7; d.setDate(d.getDate() - k); return iso(d); }

  var sections = [
    { id: "today", label: "1 · Minimum good day", render: function (s) {
      var rows = s.days.slice().map(function (d, i) { return [d, i]; }).sort(function (x, y) { return x[0].date < y[0].date ? 1 : -1; }).map(function (p) {
        var d = p[0], i = p[1], b = "days." + i + ".";
        return '<div class="row-card" data-row="days"><div class="card-head"><strong>' + H.out("dn-" + i) + "</strong> " + H.out("dp-" + i) + H.del("days", i) + "</div>" +
          '<div class="field-row" style="grid-template-columns:1fr 1fr">' + H.input(b + "date", "Date", "date") + H.input(b + "energy", "Energy", "select", { options: [["1", "1 · empty"], ["2", "2 · low"], ["3", "3 · okay"], ["4", "4 · good"], ["5", "5 · great"]] }) + H.input(b + "mins", "Minutes studied", "number", { step: "1" }) + H.input(b + "cards", "Flashcards", "number", { step: "1" }) + "</div>" +
          H.input(b + "did", "What I did", "text", { ph: "One line is plenty" }) + H.input(b + "min", "I hit my minimum good day", "check") + H.input(b + "note", "Note", "text") + "</div>";
      }).join("");
      return '<div class="card lav"><p class="eyebrow">Set the bar low on purpose</p><h2>My minimum good day</h2><p class="small">Pick small things you can do even on a rough day. Doing one (or all, your call) means the day counts.</p>' +
        H.input("std.a", "Option A", "text", { ph: "e.g. 25 focused minutes" }) + H.input("std.b", "Option B", "text", { ph: "e.g. 20 flashcards" }) + H.input("std.c", "Option C", "text", { ph: "e.g. read 2 pages" }) +
        H.input("std.rule", "A day counts when I do", "select", { options: [["any", "any one option"], ["all", "all of them"]] }) + "</div>" +
        '<div class="stat-grid" style="margin-bottom:1rem"><div class="stat big"><div class="label">Good-day streak</div><div class="value">' + H.out("streak") + '</div></div><div class="stat mint"><div class="label">Good days (last 7)</div><div class="value">' + H.out("g7") + '</div></div><div class="stat lav"><div class="label">Minutes (last 7)</div><div class="value">' + H.out("m7") + "</div></div></div>" +
        '<div class="card"><div class="card-head"><h2>Daily log</h2><button type="button" class="btn sm no-print" data-action="logToday">+ Log today</button></div>' + H.out("week7") + '<div class="rows" style="margin-top:.8rem">' + (rows || '<p class="empty">Tap "Log today" to start. One line is enough.</p>') + "</div></div>";
    } },
    { id: "focus", label: "2 · Focus timer", render: function (s) {
      var rows = s.sessions.map(function (x, i) { var b = "sessions." + i + "."; return '<div class="row-card" data-row="sessions"><div class="field-row" style="grid-template-columns:1fr 1fr">' + H.input(b + "date", "Date", "date") + H.input(b + "mins", "Minutes", "number", { step: "1" }) + "</div>" + H.input(b + "task", "Task") + H.del("sessions", i) + "</div>"; }).reverse().join("");
      return '<div class="card sky"><h2>Focus timer</h2><div class="field-row">' + H.input("timer.mins", "Minutes", "select", { options: [["10", "10 min · tiny start"], ["15", "15 min"], ["25", "25 min"], ["45", "45 min"], ["60", "60 min"]] }) + H.input("timer.task", "Working on", "text", { ph: "One task" }) + "</div>" +
        '<div class="countdown"><div class="days" id="tmr" aria-live="off">' + fmtT(remaining() || H.num(s.timer.mins) * 60) + '</div><p id="tmr-state" aria-live="polite">' + (T.run ? "Focusing…" : T.left ? "Paused" : "Ready") + "</p></div>" +
        '<div class="btn-row no-print" style="justify-content:center"><button type="button" class="btn primary" data-action="tStart">' + (T.run ? "Pause" : T.left ? "Resume" : "Start") + '</button><button type="button" class="btn secondary" data-action="tDone">Done, log it</button><button type="button" class="btn ghost" data-action="tReset">Reset</button></div>' +
        '<p class="small muted" style="text-align:center;margin-top:.6rem">Stopping early still counts: "Done, log it" saves the minutes you actually did.</p></div>' +
        '<div class="card"><div class="card-head"><h2>Focus sessions</h2>' + H.add("sessions", "Add session") + '</div><p>' + H.out("fsum") + '</p><div class="rows">' + (rows || '<p class="empty">Finished sessions show up here.</p>') + "</div></div>";
    } },
    { id: "cards", label: "3 · Flashcards", render: function (s) {
      var rows = s.cards.map(function (x, i) { var b = "cards." + i + "."; return '<div class="row-card" data-row="cards"><div class="card-head"><strong>' + H.out("cn-" + i) + "</strong> " + H.out("cd-" + i) + H.del("cards", i) + '</div><div class="field-row" style="grid-template-columns:1fr 1fr">' + H.input(b + "deck", "Deck / topic") + H.input(b + "date", "Date", "date") + H.input(b + "cards", "Cards reviewed", "number", { step: "1" }) + H.input(b + "right", "% I got right", "number", { hint: "(optional)" }) + H.input(b + "mins", "Minutes", "number", { step: "1" }) + H.input(b + "next", "Next review", "date") + "</div></div>"; }).reverse().join("");
      return '<div class="card"><p class="eyebrow">Works with Anki, Quizlet or paper cards</p><h2>Flashcard sessions</h2><div class="stat-grid" style="margin-bottom:1rem"><div class="stat"><div class="label">Cards this week</div><div class="value">' + H.out("c7") + '</div></div><div class="stat lav"><div class="label">Sessions logged</div><div class="value">' + H.out("cs") + '</div></div><div class="stat blush"><div class="label">Decks due by today</div><div class="value">' + H.out("cdue") + '</div></div></div><div class="notice">' + H.out("dueList") + '</div><div class="rows" style="margin-top:.8rem">' + (rows || '<p class="empty">Log a session after you review.</p>') + '</div><p style="margin-top:.8rem">' + H.add("cards", "Log session") + "</p></div>";
    } },
    { id: "review", label: "4 · Weekly review", render: function (s) {
      var rows = s.reviews.map(function (r, i) { var b = "reviews." + i + "."; return '<div class="row-card" data-row="reviews"><div class="card-head"><strong>' + H.out("rn-" + i) + "</strong>" + H.del("reviews", i) + "</div>" + H.out("rs-" + i) + H.input(b + "week", "Week starting", "date", {}) + H.input(b + "worked", "What worked?", "textarea") + H.input(b + "blocked", "What got in the way?", "textarea") + H.input(b + "proud", "One thing I'm glad I did", "textarea") + H.input(b + "drop", "One thing to drop or shrink next week", "text") + H.input(b + "minNext", "My minimum good day next week", "text") + "</div>"; }).reverse().join("");
      return '<div class="card mint"><h2>This week at a glance</h2>' + H.out("thisWeek") + "</div>" +
        '<div class="card"><div class="card-head"><h2>Weekly reviews</h2><button type="button" class="btn sm no-print" data-action="newReview">+ Start this week\'s review</button></div><p class="small">Five quick questions. Be kind to yourself; the goal is a plan you can keep.</p><div class="rows">' + (rows || '<p class="empty">No reviews yet.</p>') + "</div></div>";
    } },
    { id: "support", label: "5 · Support", render: function () {
      return '<div class="crisis"><h2>If it\'s more than a rough week</h2><p class="big988">In the U.S., call or text <strong>988</strong> or chat at ' + a(L.l988, "988lifeline.org") + ".</p><p class='small'>The 988 Suicide &amp; Crisis Lifeline is free and confidential, 24/7. If you're in immediate danger, call 911.</p></div>" +
        '<div class="card"><h2>My people and places</h2><p class="small">Write these down now, while it\'s easy.</p>' + H.input("support.person", "Someone I can text when studying feels impossible") + H.input("support.campus", "Campus counseling / health center (phone, hours)") + H.input("support.notes", "Other notes (advisor, dean of students, disability services…)", "textarea") + "</div>" +
        '<div class="card soft"><p class="small">This tracker is a study-planning tool. It doesn\'t diagnose, treat or measure burnout or any health condition, and it isn\'t a substitute for professional care.</p></div>';
    } },
    { id: "sources", label: "Sources", render: function () {
      return '<div class="card soft" id="sources"><h2>Sources</h2><ul class="small">' +
        "<li>" + a(L.l988, "988 Suicide & Crisis Lifeline") + ": call or text 988, or chat online; free, confidential, 24/7.</li>" +
        "<li>" + a(L.samhsa, "SAMHSA: 988 Suicide & Crisis Lifeline") + "</li>" +
        "<li>" + a(L.findtx, "FindTreatment.gov (SAMHSA)") + ": find mental health and substance use treatment.</li>" +
        "</ul><p class='small'>The \"minimum good day\" standard, focus timer presets and weekly-review questions are planning prompts, not research findings or health guidance. Pick what works for you.</p><p class='small muted'>Checked Oct 16, 2026.</p></div>";
    } }
  ];
  var actions = {
    logToday: function (s) { if (!s.days.some(function (d) { return d.date === H.today(); })) s.days.push(day()); },
    tStart: function (s) {
      if (T.run) { T.left = remaining(); T.run = false; clearInterval(T.iv); return; }
      if (!T.left) { T.total = H.num(s.timer.mins) * 60 || 1500; T.left = T.total; }
      T.end = Date.now() + T.left * 1000; T.run = true; clearInterval(T.iv); T.iv = setInterval(tick, 250);
      finishCb = function () { var m = Math.round(T.total / 60); s.sessions.push(sess(H.today(), String(m), s.timer.task)); T.total = 0; if (window.PH_refresh) window.PH_refresh(); var st = document.getElementById("tmr-state"); if (st) st.textContent = "Done! Session logged (" + m + " min)."; };
    },
    tDone: function (s) {
      var sec = T.total ? T.total - remaining() : 0, did = sec >= 30 ? Math.max(1, Math.round(sec / 60)) : 0; clearInterval(T.iv); T.run = false; T.left = 0;
      if (did > 0) s.sessions.push(sess(H.today(), String(did), s.timer.task)); T.total = 0;
    },
    tReset: function () { clearInterval(T.iv); T.run = false; T.left = 0; T.total = 0; },
    newReview: function (s) { var r = rev(); r.week = monday(new Date()); s.reviews.push(r); }
  };
  function compute(s) {
    var o = {}, seven = ago(6);
    s.days.forEach(function (d, i) { o["dn-" + i] = d.date ? new Date(d.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "Day"; o["dp-" + i] = { html: d.min ? '<span class="pill ok">good day ✓</span>' : '<span class="pill lav">logged</span>' }; });
    var last7 = s.days.filter(function (d) { return d.date >= seven; });
    o.streak = streak(s) + " day" + (streak(s) === 1 ? "" : "s"); o.g7 = last7.filter(minDone).length + " / 7"; o.m7 = last7.reduce(function (t, d) { return t + H.num(d.mins); }, 0) + " min";
    var cells = []; for (var k = 6; k >= 0; k--) { var dt = ago(k), rec = s.days.filter(function (d) { return d.date === dt; })[0]; cells.push('<div style="text-align:center"><div class="small muted">' + new Date(dt + "T00:00:00").toLocaleDateString("en-US", { weekday: "narrow" }) + '</div><div style="font-size:1.3rem" aria-label="' + dt + (rec && rec.min ? " good day" : rec ? " logged" : " not logged") + '">' + (rec && rec.min ? "🟣" : rec ? "⚪" : "·") + "</div></div>"); }
    o.week7 = { html: '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:.3rem">' + cells.join("") + '</div><p class="small muted" style="margin-top:.3rem">🟣 minimum good day · ⚪ logged · missed days don\'t break anything; just log the next one.</p>' };
    var ft = s.sessions.reduce(function (t, x) { return t + H.num(x.mins); }, 0), f7 = s.sessions.filter(function (x) { return x.date >= seven; });
    o.fsum = s.sessions.length ? f7.length + " sessions · " + f7.reduce(function (t, x) { return t + H.num(x.mins); }, 0) + " min in the last 7 days (" + ft + " min all time)" : "";
    var due = [];
    s.cards.forEach(function (x, i) { o["cn-" + i] = (x.deck || "Session") + (x.date ? " · " + x.date : ""); o["cd-" + i] = { html: x.next ? '<span class="pill ' + (x.next <= H.today() ? "warn" : "lav") + '">next ' + x.next + "</span>" : "" }; });
    var latest = {}; s.cards.forEach(function (x) { var k = (x.deck || "").trim().toLowerCase(); if (!latest[k] || x.date >= latest[k].date) latest[k] = x; });
    Object.keys(latest).forEach(function (k) { var x = latest[k]; if (x.next && x.next <= H.today()) due.push(x.deck || "Untitled deck"); });
    o.c7 = s.cards.filter(function (x) { return x.date >= seven; }).reduce(function (t, x) { return t + H.num(x.cards); }, 0); o.cs = s.cards.length; o.cdue = due.length;
    o.dueList = { html: due.length ? "<p>Due by today: <strong>" + due.map(H.esc).join(", ") + "</strong>. A few cards counts.</p>" : "<p>No decks due. Set a “Next review” date when you log a session.</p>" };
    var w = weekOf(s, monday(new Date()));
    o.thisWeek = { html: '<div class="kv"><span>Minimum good days</span><strong>' + w.good + " of " + w.logged + ' logged</strong></div><div class="kv"><span>Study minutes (daily log)</span><strong>' + w.mins + '</strong></div><div class="kv"><span>Focus sessions</span><strong>' + w.sessions + " · " + w.focus + ' min</strong></div><div class="kv"><span>Flashcards (log + sessions)</span><strong>' + w.cards + "</strong></div>" };
    s.reviews.forEach(function (r, i) { o["rn-" + i] = r.week ? "Week of " + new Date(r.week + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Review"; if (r.week) { var x = weekOf(s, r.week); o["rs-" + i] = { html: '<p class="small muted">' + x.good + " good days · " + x.mins + " min · " + x.sessions + " focus sessions · " + x.cards + " cards</p>" }; } else o["rs-" + i] = ""; });
    return o;
  }
  var tables = {
    days: { label: "Daily log", rows: function (s) { var r = [["Date", "Minutes", "Flashcards", "Energy", "Minimum good day", "What I did", "Note"]]; s.days.forEach(function (d) { r.push([d.date, d.mins, d.cards, d.energy, d.min ? "yes" : "no", d.did, d.note]); }); return r; } },
    sessions: { label: "Focus", rows: function (s) { var r = [["Date", "Minutes", "Task"]]; s.sessions.forEach(function (x) { r.push([x.date, x.mins, x.task]); }); return r; } },
    cards: { label: "Flashcards", rows: function (s) { var r = [["Date", "Deck", "Cards", "% right", "Minutes", "Next review"]]; s.cards.forEach(function (x) { r.push([x.date, x.deck, x.cards, x.right, x.mins, x.next]); }); return r; } },
    reviews: { label: "Reviews", rows: function (s) { var r = [["Week starting", "What worked", "What got in the way", "Glad I did", "Drop/shrink", "Minimum good day next week"]]; s.reviews.forEach(function (x) { r.push([x.week, x.worked, x.blocked, x.proud, x.drop, x.minNext]); }); return r; } }
  };
  window.PLANNER = { key: "gradiq-burnout-proof-study-v1", slug: "burnout-proof-study-tracker", title: "Burnout-Proof Study Tracker", disclaimer: "A study-planning tool only. Not medical or mental-health advice, diagnosis or treatment. In the U.S., call or text 988 if you're in crisis.", defaults: defaults, demo: demo, sections: sections, compute: compute, tables: tables, actions: actions, templates: { days: function () { return day(); }, sessions: function () { return sess(); }, cards: fc, reviews: rev } };
})();
