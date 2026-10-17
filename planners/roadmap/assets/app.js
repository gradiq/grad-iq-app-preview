/* PhD Roadmap Planner (Grad-IQ). Career figures verified against NCSES and peer-reviewed sources (see Sources). */
(function () {
  "use strict";
  var H = window.PH;
  var L = {
    sed: "https://ncses.nsf.gov/pubs/nsf25349/assets/data-tables/tables/nsf25349-tab006-001.pdf",
    sedRep: "https://ncses.nsf.gov/pubs/nsf26315/report/postgraduation-trends",
    denton: "https://doi.org/10.1371/journal.pone.0263185",
    idp: "https://myidp.sciencecareers.org/",
    imagine: "https://imaginephd.com/"
  };
  var BUYBACK = 125, USED_LO = 250, USED_HI = 300;
  function a(u, t) { return '<a href="' + u + '" target="_blank" rel="noopener">' + t + "</a>"; }
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function off(n) { var d = new Date(); d.setDate(d.getDate() + n); return iso(d); }
  function daysTo(x) { var d = new Date(x + "T00:00:00"), n = new Date(); n.setHours(0, 0, 0, 0); return Math.round((d - n) / 864e5); }
  function fmt(x) { return new Date(x + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  function pi() { return { id: H.uid(), name: "", uni: "", link: "", sent: "", follow: "", status: "draft", notes: "" }; }
  function ms(n, t) { return { id: H.uid(), name: n || "", type: t || "other", date: "", done: false, notes: "" }; }
  function ch(n) { return { id: H.uid(), name: n || "", status: "idea", pct: "", due: "", notes: "" }; }
  function job() { return { id: H.uid(), role: "", org: "", track: "industry", deadline: "", status: "saved", notes: "" }; }
  var MS = [["Coursework done", "course"], ["Advisor & lab chosen", "other"], ["Qualifying / comprehensive exam", "quals"], ["Committee formed", "other"], ["Proposal / prospectus defense", "proposal"], ["Advance to candidacy", "other"], ["Full dissertation draft to advisor", "chapter"], ["Draft to committee", "chapter"], ["Defense", "defense"], ["Final revisions & submission", "other"]];
  var DEF = [["d1", "Defense date confirmed with every committee member"], ["d2", "Room / video link booked"], ["d3", "School's defense and formatting rules read (deadlines, forms)"], ["d4", "Full draft sent to committee by the date my program requires"], ["d5", "Slides drafted · practice talk scheduled"], ["d6", "Graduation application filed by the school's deadline"], ["d7", "Regalia sorted (see below)"], ["d8", "Final dissertation submitted"]];
  function defaults() {
    return {
      prog: { name: "", field: "", start: "", defense: "", grad: "" },
      email: { target: "150", draft: "" },
      pis: [pi()],
      ms: MS.map(function (m) { return ms(m[0], m[1]); }),
      chapters: [ch("Chapter 1 · Introduction"), ch("Chapter 2"), ch("Chapter 3")],
      plan: { a: "", b: "", c: "", skills: "", people: "", reviewDate: "" },
      jobs: [],
      def: {},
      reg: { choice: "", price: "", sellBack: false, notes: "" }
    };
  }
  function demo() {
    var d = defaults();
    d.prog = { name: "PhD, Ecology (sample)", field: "Life sciences", start: "2023-08-21", defense: off(198), grad: off(225) };
    d.email = { target: "150", draft: "Dear Dr. Rivera,\n\nI'm applying to State U's Ecology PhD for Fall 2027. Your 2025 paper on urban pollinator corridors connects directly to my undergrad thesis on bee foraging in city parks (2 posters, R and field GIS).\n\nAre you planning to take a new student for Fall 2027?\n\nThank you,\nAlex Kim · CV attached" };
    d.pis = [{ id: "a", name: "Dr. Rivera (sample)", uni: "State U", link: "", sent: off(-20), follow: off(-6), status: "replied", notes: "Zoom call booked" }, { id: "b", name: "Dr. Okafor (sample)", uni: "Tech U", link: "", sent: off(-12), follow: off(2), status: "sent", notes: "" }, { id: "c", name: "Dr. Chen (sample)", uni: "Coast U", link: "", sent: "", follow: "", status: "draft", notes: "Read 2 recent papers first" }];
    var dates = [-420, -300, -180, -150, -60, -45, 120, 170, 198, 230];
    d.ms.forEach(function (m, i) { m.date = off(dates[i]); m.done = dates[i] < 0; });
    d.ms[4].notes = "Passed with minor edits (sample)";
    d.chapters = [{ id: "c1", name: "Ch 1 · Introduction", status: "draft", pct: "60", due: off(60), notes: "" }, { id: "c2", name: "Ch 2 · Pollinator corridors (paper 1)", status: "done", pct: "100", due: off(-30), notes: "Published 2026 (sample)" }, { id: "c3", name: "Ch 3 · Foraging model", status: "advisor", pct: "85", due: off(20), notes: "" }, { id: "c4", name: "Ch 4 · Synthesis", status: "idea", pct: "10", due: off(110), notes: "" }];
    d.plan = { a: "Postdoc in urban ecology → faculty", b: "Industry: environmental data scientist / ecological consultant", c: "Government: state wildlife or parks agency scientist", skills: "Python + SQL course this spring; GIS certificate; 1 consulting-style report", people: "3 informational chats: alum at consulting firm, state agency scientist, data-science postdoc", reviewDate: off(30) };
    d.jobs = [{ id: "j1", role: "Postdoc, urban ecology lab (sample)", org: "Big U", track: "academic", deadline: off(25), status: "applying", notes: "" }, { id: "j2", role: "Environmental data scientist (sample)", org: "EcoAnalytics", track: "industry", deadline: off(40), status: "saved", notes: "Ask alum for referral" }, { id: "j3", role: "Wildlife biologist II (sample)", org: "State agency", track: "government", deadline: off(15), status: "applied", notes: "" }];
    d.def = { d1: true, d3: true };
    d.reg = { choice: "gradiq", price: "250", sellBack: true, notes: "Check my school's doctoral hood colors" };
    return d;
  }
  function words(t) { t = String(t || "").trim(); return t ? t.split(/\s+/).length : 0; }
  var sections = [
    { id: "overview", label: "1 · Overview", render: function () {
      return '<div class="card"><h2>My PhD at a glance</h2><div class="field-row">' + H.input("prog.name", "Program") + H.input("prog.field", "Field") + "</div>" +
        '<div class="field-row">' + H.input("prog.start", "Start date", "date") + H.input("prog.defense", "Target defense date", "date") + H.input("prog.grad", "Graduation / commencement", "date") + "</div></div>" +
        '<div class="card lav"><div class="countdown">' + H.out("defCount") + "</div>" + H.out("msBar") + "</div>" +
        '<div class="card"><h2>Coming up</h2>' + H.out("upNext") + "</div>";
    } },
    { id: "advisors", label: "2 · Advisor outreach", render: function (s) {
      var rows = s.pis.map(function (p, i) { var b = "pis." + i + "."; return '<div class="row-card" data-row="pis"><div class="card-head"><strong>' + H.out("pn-" + i) + "</strong> " + H.out("ps-" + i) + H.del("pis", i) + '</div><div class="field-row" style="grid-template-columns:1fr 1fr">' + H.input(b + "name", "Professor") + H.input(b + "uni", "University") + H.input(b + "sent", "Date sent", "date") + H.input(b + "follow", "Follow up on", "date") + "</div>" + H.input(b + "status", "Status", "select", { options: [["draft", "Drafting"], ["sent", "Sent"], ["followed", "Followed up"], ["replied", "Replied"], ["meeting", "Meeting set"], ["no", "Not taking students"], ["closed", "No reply, moved on"]] }) + H.input(b + "link", "Lab / profile link", "url") + H.input(b + "notes", "Notes") + "</div>"; }).join("");
      return '<div class="card blush"><p class="eyebrow">Short wins</p><h2>Cold email checklist</h2><ul class="small"><li>One email per professor, addressed by name. No mass blasts.</li><li>Say what you\'re applying to and when, in one line.</li><li>One specific link between their work and yours. Don\'t explain their own research back to them.</li><li>One clear question (e.g. "Are you taking students for Fall 2027?").</li><li>Attach your CV. Keep it short enough to read in under a minute.</li></ul></div>' +
        '<div class="card"><h2>Draft check</h2>' + H.input("email.draft", "Paste your draft", "textarea", { ph: "Dear Dr. …" }) + '<div class="field-row">' + H.input("email.target", "My word limit", "number", { step: "1", hint: "(your own target)" }) + "</div><p>" + H.out("wc") + "</p></div>" +
        '<div class="card"><div class="card-head"><h2>Outreach tracker</h2>' + H.add("pis", "Add professor") + "</div><p>" + H.out("piSum") + '</p><div class="rows">' + rows + "</div></div>";
    } },
    { id: "milestones", label: "3 · Milestones", render: function (s) {
      var rows = s.ms.map(function (m, i) { var b = "ms." + i + "."; return '<div class="ms-row" data-row="ms"><input type="checkbox" data-path="' + b + 'done"' + (m.done ? " checked" : "") + ' aria-label="Done"><input type="text" data-path="' + b + 'name" value="' + H.esc(m.name) + '" aria-label="Milestone"><input class="ms-date" type="date" data-path="' + b + 'date" value="' + H.esc(m.date) + '" aria-label="Target date">' + H.out("mp-" + i, "") + '<span class="ms-del">' + H.del("ms", i) + "</span></div>"; }).join("");
      var crs = s.chapters.map(function (c, i) { var b = "chapters." + i + "."; return '<div class="row-card" data-row="chapters"><div class="card-head"><strong>' + H.out("cn-" + i) + "</strong>" + H.del("chapters", i) + "</div>" + H.input(b + "name", "Chapter") + '<div class="field-row" style="grid-template-columns:1fr 1fr">' + H.input(b + "status", "Status", "select", { options: [["idea", "Idea / outline"], ["draft", "Drafting"], ["advisor", "With advisor"], ["revise", "Revising"], ["done", "Done"]] }) + H.input(b + "pct", "% done", "number", { step: "5" }) + "</div>" + H.input(b + "due", "Target date", "date") + H.out("cb-" + i) + H.input(b + "notes", "Notes") + "</div>"; }).join("");
      return '<div class="card"><div class="card-head"><h2>Milestones</h2>' + H.add("ms", "Add milestone") + '</div><p class="small">Names and order vary by program; edit freely. Check your handbook for the real deadlines.</p><div class="rows" style="display:grid;gap:.5rem">' + rows + "</div></div>" +
        '<div class="card"><div class="card-head"><h2>Dissertation chapters</h2>' + H.add("chapters", "Add chapter") + "</div><p>" + H.out("chSum") + '</p><div class="grid two">' + crs + "</div></div>";
    } },
    { id: "career", label: "4 · Job plan", render: function (s) {
      var rows = s.jobs.map(function (j, i) { var b = "jobs." + i + "."; return '<div class="row-card" data-row="jobs"><div class="card-head"><strong>' + H.out("jn-" + i) + "</strong> " + H.out("jd-" + i) + H.del("jobs", i) + '</div><div class="field-row" style="grid-template-columns:1fr 1fr">' + H.input(b + "role", "Role") + H.input(b + "org", "Organization") + H.input(b + "track", "Track", "select", { options: [["academic", "Academic"], ["industry", "Industry"], ["government", "Government"], ["nonprofit", "Nonprofit"], ["other", "Other"]] }) + H.input(b + "deadline", "Deadline", "date") + "</div>" + H.input(b + "status", "Status", "select", { options: [["saved", "Saved"], ["applying", "Applying"], ["applied", "Applied"], ["interview", "Interviewing"], ["offer", "Offer"], ["no", "Not this time"]] }) + H.input(b + "notes", "Notes") + "</div>"; }).join("");
      return '<div class="card sky"><p class="eyebrow">Plan A, plus a real Plan B</p><h2>Why a backup plan</h2><p>In 2024, about <strong>23%</strong> of new U.S. research doctorates (13,296 of 58,131) reported a definite U.S. postdoc commitment at graduation (' + a(L.sed, "NCSES, Survey of Earned Doctorates 2024, Table 6-1") + "). And a postdoc doesn't guarantee a faculty job: one national study found about <strong>23%</strong> of life-science and <strong>33%</strong> of physical-science/engineering postdocs held tenure-track faculty jobs 5–6 years after the PhD (" + a(L.denton, "Denton et al., PLOS ONE 2022") + "). Rates vary a lot by field, so plan for more than one path.</p></div>" +
        '<div class="card"><h2>My three paths</h2>' + H.input("plan.a", "Plan A", "text", { ph: "e.g. postdoc → faculty" }) + H.input("plan.b", "Plan B: industry backup", "text", { ph: "e.g. data scientist, R&D, consulting" }) + H.input("plan.c", "Plan C", "text", { ph: "e.g. government, nonprofit, policy" }) +
        H.input("plan.skills", "Skills to build this year (for B and C, too)", "textarea") + H.input("plan.people", "People to talk to (informational interviews)", "textarea") + H.input("plan.reviewDate", "Next time I'll review this plan", "date") +
        '<p class="small">Free planning tools: ' + a(L.idp, "myIDP (Science Careers)") + " · " + a(L.imagine, "ImaginePhD") + "</p></div>" +
        '<div class="card"><div class="card-head"><h2>Applications</h2>' + H.add("jobs", "Add application") + "</div><p>" + H.out("jobSum") + '</p><div class="rows">' + (rows || '<p class="empty">No applications yet.</p>') + "</div></div>";
    } },
    { id: "defense", label: "5 · Defense & regalia", render: function (s) {
      return '<div class="card lav"><div class="countdown">' + H.out("defCount") + "</div></div>" +
        '<div class="card"><h2>Defense checklist</h2>' + DEF.map(function (c) { return '<div class="ck-row" style="grid-template-columns:26px 1fr"><input type="checkbox" data-path="def.' + c[0] + '"' + (s.def[c[0]] ? " checked" : "") + ' id="ck-' + c[0] + '"><label for="ck-' + c[0] + '">' + c[1] + "</label></div>"; }).join("") + '<p style="margin-top:.8rem">' + H.out("defProg") + "</p></div>" +
        '<div class="card blush"><p class="eyebrow">Graduation</p><h2>Doctoral regalia</h2><div class="notice"><p><strong>Grad-IQ used regalia:</strong> buy a used full set for <strong>$' + USED_LO + "–$" + USED_HI + "</strong>, and after graduation Grad-IQ buys back used full sets for <strong>$" + BUYBACK + "</strong>. Ask Grad-IQ for current availability and condition.</p></div>" +
        H.input("reg.choice", "My plan", "select", { options: [["", "Not decided"], ["gradiq", "Buy used from Grad-IQ"], ["rent", "Rent"], ["new", "Buy new"], ["borrow", "Borrow / hand-me-down"], ["own", "Already have it"]] }) +
        '<div class="field-row">' + H.input("reg.price", "Price I'll pay", "money") + "</div>" + H.input("reg.sellBack", "Sell my set back to Grad-IQ after graduation ($" + BUYBACK + ")", "check") + "<p>" + H.out("regNet") + "</p>" + H.input("reg.notes", "Notes (school colors, hood, tam, size, pickup date)", "textarea") + "</div>";
    } },
    { id: "sources", label: "Sources", render: function () {
      return '<div class="card soft" id="sources"><h2>Sources</h2><ul class="small">' +
        "<li>" + a(L.sed, "NCSES, Survey of Earned Doctorates 2024, Table 6-1 (NSF 25-349)") + ": 58,131 research doctorate recipients; 13,296 with definite U.S. postdoc commitments (≈23%). Measured at graduation; some find positions later.</li>" +
        "<li>" + a(L.sedRep, "NCSES, Doctorate Recipients from U.S. Universities: 2024, Postgraduation trends") + "</li>" +
        "<li>" + a(L.denton, "Denton M, Borrego M, Knight DB. U.S. postdoctoral careers in life sciences, physical sciences and engineering. PLOS ONE 17(2): e0263185, 2022") + ": 23.0% (life sciences) and 33.2% (physical sciences & engineering) of postdocs in tenure-track faculty jobs 5–6 years after the PhD; earlier studies cited there report 17–21% over 10 years.</li>" +
        "<li>" + a(L.idp, "myIDP") + " · " + a(L.imagine, "ImaginePhD") + ": free career-planning tools.</li>" +
        "<li>Grad-IQ regalia prices ($" + USED_LO + "–$" + USED_HI + " used full set; $" + BUYBACK + " buyback) are Grad-IQ's own offer.</li>" +
        "</ul><p class='small'>Cold-email tips are common-sense guidance, not rules; your field may differ. Milestone names and deadlines come from your program's handbook.</p><p class='small muted'>Checked Oct 16, 2026.</p></div>";
    } }
  ];
  function compute(s) {
    var o = {};
    if (s.prog.defense) { var d = daysTo(s.prog.defense); o.defCount = { html: '<div class="days">' + Math.abs(d) + "</div><p>" + (d > 0 ? "days until my defense · " + fmt(s.prog.defense) : d === 0 ? "Defense day. You've got this." : "days since my defense") + "</p>" + (s.prog.grad ? '<p class="small muted">Graduation: ' + fmt(s.prog.grad) + (daysTo(s.prog.grad) > 0 ? " (" + daysTo(s.prog.grad) + " days)" : "") + "</p>" : "") }; }
    else o.defCount = { html: '<p class="muted">Add a target defense date to start the countdown.</p>' };
    var done = s.ms.filter(function (m) { return m.done; }).length, pct = s.ms.length ? Math.round(done / s.ms.length * 100) : 0;
    o.msBar = { html: '<div class="bar"><span style="width:' + pct + '%"></span></div><p class="small" style="margin-top:.3rem;text-align:center">' + done + " of " + s.ms.length + " milestones done (" + pct + "%)</p>" };
    var up = s.ms.filter(function (m) { return !m.done && m.date; }).sort(function (x, y) { return x.date < y.date ? -1 : 1; }).slice(0, 3).map(function (m) { var n = daysTo(m.date); return '<div class="kv"><span>' + H.esc(m.name) + '</span><strong><span class="pill ' + (n < 0 ? "bad" : n < 30 ? "warn" : "lav") + '">' + (n < 0 ? Math.abs(n) + " days late" : "in " + n + " days") + "</span></strong></div>"; });
    var fu = s.pis.filter(function (p) { return p.follow && (p.status === "sent") && daysTo(p.follow) <= 3; }).map(function (p) { return '<div class="kv"><span>Follow up: ' + H.esc(p.name || "professor") + '</span><strong><span class="pill warn">' + fmt(p.follow) + "</span></strong></div>"; });
    var jd = s.jobs.filter(function (j) { return j.deadline && daysTo(j.deadline) >= 0 && daysTo(j.deadline) <= 30 && (j.status === "saved" || j.status === "applying"); }).map(function (j) { return '<div class="kv"><span>Apply: ' + H.esc(j.role || "job") + '</span><strong><span class="pill warn">' + fmt(j.deadline) + "</span></strong></div>"; });
    o.upNext = { html: (up.concat(fu, jd).join("")) || '<p class="muted">Nothing scheduled yet. Add dates in Milestones.</p>' };
    s.ms.forEach(function (m, i) { var n = m.date ? daysTo(m.date) : null; o["mp-" + i] = { html: m.done ? '<span class="pill ok">done</span>' : n === null ? '<span class="pill lav">no date</span>' : '<span class="pill ' + (n < 0 ? "bad" : n < 30 ? "warn" : "lav") + '">' + (n < 0 ? "late" : n + "d") + "</span>" }; });
    var avg = 0; s.chapters.forEach(function (c, i) { var p = Math.min(100, H.num(c.pct)); avg += p; o["cn-" + i] = c.name || "Chapter " + (i + 1); o["cb-" + i] = { html: '<div class="bar"><span style="width:' + p + '%"></span></div><p class="small muted" style="margin:.2rem 0 .5rem">' + p + "% · " + (c.due ? "target " + fmt(c.due) : "no target date") + "</p>" }; });
    o.chSum = s.chapters.length ? "Dissertation about " + Math.round(avg / s.chapters.length) + "% drafted across " + s.chapters.length + " chapters." : "";
    var w = words(s.email.draft), t = H.num(s.email.target);
    o.wc = { html: w ? "<span class='pill " + (t && w > t ? "warn" : "ok") + "'>" + w + " words</span> " + (t ? (w > t ? "Over your " + t + "-word limit. Cut one sentence and re-check." : "Within your " + t + "-word limit.") : "") : "<span class='muted'>Paste a draft to count words.</span>" };
    var sent = s.pis.filter(function (p) { return p.status !== "draft"; }).length, rep = s.pis.filter(function (p) { return p.status === "replied" || p.status === "meeting"; }).length;
    o.piSum = s.pis.length ? sent + " sent · " + rep + " replied or meeting set" : "";
    s.pis.forEach(function (p, i) { o["pn-" + i] = p.name || "Professor " + (i + 1); var due = p.status === "sent" && p.follow && daysTo(p.follow) <= 0; o["ps-" + i] = { html: '<span class="pill ' + (due ? "warn" : p.status === "replied" || p.status === "meeting" ? "ok" : "lav") + '">' + (due ? "follow up now" : p.status) + "</span>" }; });
    var tr = {}; s.jobs.forEach(function (j, i) { tr[j.track] = (tr[j.track] || 0) + 1; o["jn-" + i] = (j.role || "Role") + (j.org ? " · " + j.org : ""); o["jd-" + i] = { html: j.deadline ? '<span class="pill ' + (daysTo(j.deadline) < 0 ? "bad" : daysTo(j.deadline) <= 14 ? "warn" : "lav") + '">' + fmt(j.deadline) + "</span>" : "" }; });
    o.jobSum = s.jobs.length ? Object.keys(tr).map(function (k) { return tr[k] + " " + k; }).join(" · ") + (!tr.industry && !tr.government && !tr.nonprofit ? " · add at least one non-academic option" : "") : "";
    o.defProg = DEF.filter(function (c) { return s.def[c[0]]; }).length + " of " + DEF.length + " done";
    var pr = H.num(s.reg.price);
    o.regNet = { html: pr ? (s.reg.sellBack ? "Net cost after selling back: <strong>" + H.money(Math.max(0, pr - BUYBACK)) + "</strong> (" + H.money(pr) + " − " + H.money(BUYBACK) + " buyback)." : "Cost: <strong>" + H.money(pr) + "</strong>.") : "" };
    return o;
  }
  var tables = {
    milestones: { label: "Milestones", rows: function (s) { var r = [["Milestone", "Target date", "Done", "Notes"]]; s.ms.forEach(function (m) { r.push([m.name, m.date, m.done ? "yes" : "no", m.notes]); }); s.chapters.forEach(function (c) { r.push(["Chapter: " + c.name + " (" + c.status + ", " + (c.pct || 0) + "%)", c.due, c.status === "done" ? "yes" : "no", c.notes]); }); return r; } },
    outreach: { label: "Outreach", rows: function (s) { var r = [["Professor", "University", "Link", "Sent", "Follow up", "Status", "Notes"]]; s.pis.forEach(function (p) { r.push([p.name, p.uni, p.link, p.sent, p.follow, p.status, p.notes]); }); return r; } },
    jobs: { label: "Jobs", rows: function (s) { var r = [["Role", "Organization", "Track", "Deadline", "Status", "Notes"]]; s.jobs.forEach(function (j) { r.push([j.role, j.org, j.track, j.deadline, j.status, j.notes]); }); return r; } }
  };
  window.PLANNER = { key: "gradiq-phd-roadmap-v1", slug: "phd-roadmap-planner", title: "PhD Roadmap Planner", disclaimer: "For planning only. Not career, legal, or financial advice. Your program's handbook sets your real deadlines.", defaults: defaults, demo: demo, sections: sections, compute: compute, tables: tables, templates: { pis: pi, ms: function () { return ms(); }, chapters: function () { return ch(); }, jobs: job } };
})();
