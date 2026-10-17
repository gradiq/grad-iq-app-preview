/* PhD Stipend & Loan Budget Planner (Grad-IQ). RAP rules verified on StudentAid.gov / ED.gov (see Sources). */
(function () {
  "use strict";
  var H = window.PH;
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var L = {
    rap: "https://studentaid.gov/manage-loans/repayment/plans/repayment-assistance-plan",
    applied: "https://mohela.studentaid.gov/DL/resourceCenter/HowPaymentsAreApplied.aspx",
    edfact: "https://www.ed.gov/about/news/press-release/fact-sheet-trump-administration-simplifying-student-loan-repayment",
    statute: "https://www.ed.gov/media/document/2025-rise-principles-application-of-interest-and-principal-subsidies-submitted-tamar-hoffman-112561.pdf",
    sim: "https://studentaid.gov/loan-simulator/",
    servicer: "https://studentaid.gov/manage-loans/repayment/servicers",
    tax: "https://www.irs.gov/taxtopics/tc421",
    est: "https://www.irs.gov/faqs/estimated-tax"
  };
  function a(u, t) { return '<a href="' + u + '" target="_blank" rel="noopener">' + t + "</a>"; }
  function months() { return MONTHS.map(function (m) { return { m: m, stipend: "", other: "", note: "" }; }); }
  function exp(n, amt, kind) { return { id: H.uid(), name: n || "", amt: amt || "", kind: kind || "need" }; }
  function loan() { return { id: H.uid(), name: "", servicer: "", balance: "", rate: "", status: "school", payment: "" }; }
  function pay() { return { id: H.uid(), due: "", paid: "", amount: "", required: "", note: "" }; }
  function defaults() {
    return {
      setup: { start: "1", stipend: "", paidMonths: "9", taxPct: "", savings: "", bufferGoal: "", bufferBy: "" },
      months: months(),
      expenses: [exp("Rent & utilities", "", "need"), exp("Groceries", "", "need"), exp("Phone & internet", "", "need"), exp("Transportation", "", "need"), exp("Health costs", "", "need"), exp("Fun & eating out", "", "want")],
      loans: [loan()],
      rap: { nextDue: "", required: "", reminderDays: "5", autopay: false, noPrepay: false, contact: "" },
      payments: [],
      checks: {}
    };
  }
  function demo() {
    var m = months(); for (var i = 0; i < 12; i++) { m[i].stipend = i >= 5 && i <= 7 ? "" : "2450"; }
    m[5].other = "1800"; m[5].note = "Summer RA (sample)"; m[6].other = "1800"; m[6].note = "Summer RA (sample)"; m[7].note = "No pay in August"; m[0].other = "300"; m[0].note = "Conference travel refund";
    return {
      setup: { start: "9", stipend: "2450", paidMonths: "9", taxPct: "10", savings: "1500", bufferGoal: "3500", bufferBy: "2027-05-15" },
      months: m,
      expenses: [exp("Rent & utilities (shared)", "1150", "need"), exp("Groceries", "340", "need"), exp("Phone & internet", "70", "need"), exp("Bus pass", "45", "need"), exp("Health costs", "60", "need"), exp("Fun & eating out", "150", "want"), exp("Subscriptions", "25", "want")],
      loans: [{ id: "l1", name: "Undergrad Direct Unsub (sample)", servicer: "My servicer", balance: "18500", rate: "5.5", status: "rap", payment: "45" }, { id: "l2", name: "Master's Grad PLUS (sample)", servicer: "My servicer", balance: "9200", rate: "7.5", status: "school", payment: "" }],
      rap: { nextDue: (function () { var d = new Date(); d.setDate(d.getDate() + 9); return d.toISOString().slice(0, 10); })(), required: "45", reminderDays: "5", autopay: true, noPrepay: true, contact: "Servicer phone & account # (sample)" },
      payments: [{ id: "p1", due: "2026-08-25", paid: "2026-08-22", amount: "45", required: "45", note: "Sample" }, { id: "p2", due: "2026-09-25", paid: "2026-09-25", amount: "45", required: "45", note: "Sample" }, { id: "p3", due: "2026-10-25", paid: "2026-09-20", amount: "45", required: "45", note: "Sample: paid before this payment's window opened" }],
      checks: { c1: true, c3: true }
    };
  }
  var CHECKS = [
    ["c1", "Find out when my stipend is paid (dates) and whether summer months are funded"],
    ["c2", "Check whether income tax is withheld from my stipend", L.tax, "IRS Topic 421"],
    ["c3", "Log in to StudentAid.gov and note every federal loan and my servicer", L.servicer, "Find my servicer"],
    ["c4", "Check my loan status (in school, grace, repayment) with my servicer"],
    ["c5", "Compare repayment plans for my situation", L.sim, "Loan Simulator"],
    ["c6", "Put my loan due date in my phone calendar"]
  ];
  function monthly(s) { return s.months.map(function (m) { return H.num(m.stipend) + H.num(m.other); }); }
  function expTotal(s) { return s.expenses.reduce(function (t, e) { return t + H.num(e.amt); }, 0); }
  function addMonth(iso, n) { var d = new Date(iso + "T00:00:00"); var day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + n); var last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(day, last)); return d; }
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function fmt(d) { return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  function daysTo(isoS) { var d = new Date(isoS + "T00:00:00"), n = new Date(); n.setHours(0, 0, 0, 0); return Math.round((d - n) / 864e5); }
  function onTime(p) {
    if (!p.due || !p.paid) return ["", "lav", "add dates"];
    var prev = iso(addMonth(p.due, -1));
    var full = !H.num(p.required) || H.num(p.amount) >= H.num(p.required);
    if (p.paid > p.due) return ["late", "bad", "late"];
    if (p.paid <= prev) return ["early", "warn", "paid before window"];
    return [full ? "ok" : "short", full ? "ok" : "warn", full ? "on time & full" : "on time, not full"];
  }

  var sections = [
    { id: "income", label: "1 · Stipend map", render: function (s) {
      var rows = s.months.map(function (m, i) {
        var b = "months." + i + ".";
        return '<div class="row-card"><div class="card-head"><strong>' + m.m + "</strong>" + H.out("mt-" + i, "pill lav") + '</div><div class="field-row" style="grid-template-columns:1fr 1fr">' + H.input(b + "stipend", "Stipend", "money") + H.input(b + "other", "Other income", "money") + "</div>" + H.input(b + "note", "Note", "text", { ph: "TA, RA, fellowship, no pay…" }) + "</div>";
      }).join("");
      return '<div class="card"><p class="eyebrow">Irregular pay, made visible</p><h2>Your year of income</h2><p class="small">Stipends often stop or change in summer. Fill in what actually lands in your account each month (after any withholding).</p>' +
        '<div class="field-row">' + H.input("setup.stipend", "Usual monthly stipend (take-home)", "money") + H.input("setup.paidMonths", "Months it's paid per year", "select", { options: [["9", "9 months"], ["10", "10 months"], ["11", "11 months"], ["12", "12 months"]] }) + H.input("setup.start", "First paid month", "select", { options: MONTHS.map(function (m, i) { return [String(i + 1), m]; }) }) + "</div>" +
        '<p><button type="button" class="btn sm secondary no-print" data-action="fill">Fill stipend into the paid months</button></p>' +
        '<div class="grid three">' + rows + "</div>" +
        '<div class="stat-grid" style="margin-top:1rem"><div class="stat"><div class="label">Year total</div><div class="value">' + H.out("yr") + '</div></div><div class="stat lav"><div class="label">Smoothed "pay yourself" / month</div><div class="value">' + H.out("smooth") + '</div></div><div class="stat blush"><div class="label">Lowest month</div><div class="value">' + H.out("low") + "</div></div></div>" +
        '<div class="notice" style="margin-top:1rem">' + H.out("smoothTip") + "</div></div>";
    } },
    { id: "budget", label: "2 · Monthly budget", render: function (s) {
      var rows = s.expenses.map(function (e, i) {
        var b = "expenses." + i + ".";
        return '<div class="row-card" data-row="expenses"><div class="field-row">' + H.input(b + "name", "Expense") + H.input(b + "amt", "Per month", "money") + H.input(b + "kind", "Type", "select", { options: [["need", "Need"], ["want", "Want"], ["save", "Saving / loans"]] }) + "</div>" + H.del("expenses", i) + "</div>";
      }).join("");
      return '<div class="card"><h2>Monthly spending plan</h2><p class="small">Budget against your <strong>smoothed</strong> monthly amount, not your biggest paycheck.</p>' +
        H.input("setup.taxPct", "Set aside for taxes (% of income)", "number", { hint: "(your own choice; see the checklist in Taxes & checks)" }) +
        '<div class="rows">' + (rows || '<p class="empty">No expenses yet.</p>') + '</div><p style="margin-top:.8rem">' + H.add("expenses", "Add expense") + "</p></div>" +
        '<div class="card mint"><h2>How it adds up</h2><div class="kv"><span>Smoothed income / month</span><strong>' + H.out("smooth") + '</strong></div><div class="kv"><span>Tax set-aside / month</span><strong>' + H.out("taxM") + '</strong></div><div class="kv"><span>Needs</span><strong>' + H.out("needs") + '</strong></div><div class="kv"><span>Wants</span><strong>' + H.out("wants") + '</strong></div><div class="kv"><span>Saving / loans</span><strong>' + H.out("saves") + '</strong></div><div class="kv"><span><strong>Left over / month</strong></span><strong>' + H.out("left") + "</strong></div>" + H.out("splitBar") + "</div>";
    } },
    { id: "gaps", label: "3 · Summer gaps", render: function () {
      return '<div class="card"><p class="eyebrow">Before the gap, not during it</p><h2>Month-by-month cash check</h2><p class="small">Each month\'s income minus your planned spending and tax set-aside. Red months are where your buffer has to carry you.</p>' + H.out("gapList") + "</div>" +
        '<div class="card sky"><h2>Build your buffer</h2><div class="field-row">' + H.input("setup.savings", "Savings I have now", "money") + H.input("setup.bufferGoal", "Buffer goal", "money", { hint: "(defaults to your total shortfall)" }) + H.input("setup.bufferBy", "Have it by", "date") + "</div>" + H.out("bufferPlan") + "</div>";
    } },
    { id: "loans", label: "4 · Loans & RAP", render: function (s) {
      var rows = s.loans.map(function (l, i) {
        var b = "loans." + i + ".";
        return '<div class="row-card" data-row="loans"><div class="card-head"><strong>' + H.out("ln-" + i) + "</strong>" + H.del("loans", i) + '</div><div class="field-row">' + H.input(b + "name", "Loan") + H.input(b + "servicer", "Servicer") + H.input(b + "status", "Status", "select", { options: [["school", "In school / deferment"], ["grace", "Grace period"], ["rap", "Repaying: RAP"], ["tiered", "Repaying: Tiered Standard"], ["other", "Repaying: other plan"], ["forb", "Forbearance"]] }) + "</div>" +
          '<div class="field-row">' + H.input(b + "balance", "Balance", "money") + H.input(b + "rate", "Interest rate %", "number") + H.input(b + "payment", "Monthly payment", "money") + "</div><p class='small muted'>" + H.out("li-" + i) + "</p></div>";
      }).join("");
      var prow = s.payments.map(function (p, i) {
        var b = "payments." + i + ".";
        return '<div class="row-card" data-row="payments"><div class="card-head"><strong>' + H.out("pd-" + i) + "</strong> " + H.out("ps-" + i) + H.del("payments", i) + '</div><div class="field-row" style="grid-template-columns:1fr 1fr">' + H.input(b + "due", "Due date", "date", {}) + H.input(b + "paid", "Date I paid", "date") + H.input(b + "required", "Required payment", "money") + H.input(b + "amount", "Amount I paid", "money") + "</div>" + H.input(b + "note", "Note") + "</div>";
      }).join("");
      return '<div class="card"><h2>My student loans</h2><div class="stat-grid" style="margin-bottom:1rem"><div class="stat"><div class="label">Total balance</div><div class="value">' + H.out("lb") + '</div></div><div class="stat lav"><div class="label">Est. interest / month</div><div class="value">' + H.out("lint") + '</div></div><div class="stat mint"><div class="label">Payments / month</div><div class="value">' + H.out("lpay") + '</div></div></div><div class="rows">' + rows + '</div><p style="margin-top:.8rem">' + H.add("loans", "Add loan") + '</p><p class="small muted">Interest estimate = balance × rate ÷ 12. Your servicer\'s numbers are the official ones.</p></div>' +
        '<div class="card blush"><p class="eyebrow">RAP due-date reminder</p><h2>Next payment</h2><div class="field-row">' + H.input("rap.nextDue", "Next due date", "date", { hint: "(from your servicer)" }) + H.input("rap.required", "Required RAP payment", "money") + H.input("rap.reminderDays", "Remind me this many days before", "number", { step: "1" }) + "</div>" +
        '<div class="countdown">' + H.out("rapDays") + "</div>" + H.out("rapWin") +
        H.input("rap.autopay", "Autopay is set up and matches my due date", "check") + H.input("rap.noPrepay", "I'm not paying ahead for future months (that can cost the monthly benefits)", "check") + H.input("rap.contact", "Servicer contact & account notes") +
        '<p class="small">What StudentAid.gov and the servicer guidance say: for months when your <strong>full, on-time</strong> RAP payment doesn\'t cover the interest, the unpaid interest isn\'t charged; if it reduces principal by less than $50, the Department adds a matching principal payment of up to $50. A payment is <strong>on time</strong> when it\'s made after the previous month\'s due date and on or before the current due date. Paying ahead to satisfy future due dates may mean those months don\'t get the benefits. ' + a(L.rap, "RAP on StudentAid.gov") + " · " + a(L.applied, "How payments are applied") + "</p></div>" +
        '<div class="card"><div class="card-head"><h2>On-time payment log</h2>' + H.add("payments", "Log a payment") + '</div><p class="small">Each row checks whether the payment landed inside its window and was the full amount.</p><div class="rows">' + (prow || '<p class="empty">No payments logged yet.</p>') + "</div>" + '<p style="margin-top:.6rem">' + H.out("onTimeSum") + "</p></div>";
    } },
    { id: "checks", label: "5 · Taxes & checks", render: function (s) {
      return '<div class="card"><h2>Grad money checklist</h2>' + CHECKS.map(function (c) { return '<div class="ck-row" style="grid-template-columns:26px 1fr"><input type="checkbox" data-path="checks.' + c[0] + '"' + (s.checks[c[0]] ? " checked" : "") + ' id="ck-' + c[0] + '"><label for="ck-' + c[0] + '">' + c[1] + (c[2] ? " · " + a(c[2], c[3]) : "") + "</label></div>"; }).join("") + '<p style="margin-top:.8rem">' + H.out("prog") + "</p></div>" +
        '<div class="card sky"><h2>Stipends and taxes</h2><p>The IRS treats scholarship and fellowship money used for things other than tuition and required fees and course materials (for example, rent and food) as taxable income, and money received as payment for teaching, research or other services required as a condition of the award is taxable too. Many stipends have no tax withheld, so some students set money aside or make estimated payments. Your situation depends on your award, so check the IRS pages or ask your school\'s financial aid or tax office.</p><p class="source">' + a(L.tax, "IRS Topic 421: Scholarships, fellowship grants, and other grants") + " · " + a(L.est, "IRS: Estimated tax FAQ") + "</p></div>";
    } },
    { id: "sources", label: "Sources", render: function () {
      return '<div class="card soft" id="sources"><h2>Sources</h2><ul class="small">' +
        "<li>" + a(L.rap, "StudentAid.gov: Repayment Assistance Plan (RAP)") + "</li>" +
        "<li>" + a(L.applied, "MOHELA on StudentAid.gov: How Payments Are Applied") + ": RAP interest subsidy and matching principal payment need a full, on-time monthly payment; on time = after the previous month's due date and on or before the current one; paying ahead for future due dates may lose the benefits.</li>" +
        "<li>" + a(L.edfact, "U.S. Department of Education fact sheet") + ": RAP waives remaining unpaid monthly interest when borrowers make on-time monthly payments; matching principal payment up to $50 a month.</li>" +
        "<li>" + a(L.statute, "Statutory text (ED.gov)") + ": interest not charged for each month with an on-time payment; matching principal payment rules.</li>" +
        "<li>" + a(L.sim, "StudentAid.gov Loan Simulator") + " · " + a(L.servicer, "Find your loan servicer") + "</li>" +
        "<li>" + a(L.tax, "IRS Topic 421") + " · " + a(L.est, "IRS Estimated tax FAQ") + "</li></ul><p class='small muted'>Checked Oct 16, 2026. Rules can change; your servicer and StudentAid.gov have the final word on your account.</p></div>";
    } }
  ];
  var actions = {
    fill: function (s) { var st = s.setup.stipend, n = +s.setup.paidMonths || 9, start = (+s.setup.start || 1) - 1; for (var i = 0; i < 12; i++) s.months[i].stipend = ""; for (var k = 0; k < n; k++) s.months[(start + k) % 12].stipend = st; }
  };
  function compute(s) {
    var o = {}, inc = monthly(s), yr = inc.reduce(function (t, v) { return t + v; }, 0), sm = yr / 12;
    inc.forEach(function (v, i) { o["mt-" + i] = H.money(v); });
    var lowV = Math.min.apply(null, inc), lowI = inc.indexOf(lowV);
    o.yr = H.money(yr); o.smooth = H.money(Math.round(sm)); o.low = yr ? MONTHS[lowI] + " · " + H.money(lowV) : "—";
    o.smoothTip = { html: yr ? "<p>If you treat <strong>" + H.money(Math.round(sm)) + "</strong> as your monthly pay and save the rest in big months, the low months are covered by your own money.</p>" : "<p>Enter your stipend to see your smoothed monthly amount.</p>" };
    var tax = H.num(s.setup.taxPct) / 100, n = 0, w = 0, sv = 0;
    s.expenses.forEach(function (e) { var v = H.num(e.amt); if (e.kind === "want") w += v; else if (e.kind === "save") sv += v; else n += v; });
    var taxM = sm * tax, left = sm - taxM - n - w - sv;
    o.taxM = H.money(Math.round(taxM)); o.needs = H.money(n); o.wants = H.money(w); o.saves = H.money(sv);
    o.left = { html: '<span class="' + (left < 0 ? "pill bad" : "pill ok") + '">' + (left < 0 ? "−" : "") + H.money(Math.abs(Math.round(left))) + "</span>" };
    var tot = n + w + sv + taxM || 1;
    o.splitBar = { html: sm ? '<div style="margin-top:.8rem"><p class="small">Needs ' + Math.round(n / sm * 100) + "% · Wants " + Math.round(w / sm * 100) + "% · Saving/loans " + Math.round(sv / sm * 100) + "% of smoothed income</p><div class='bar need'><span style='width:" + Math.min(100, n / sm * 100) + "%'></span></div></div>" : "" };
    var spend = n + w + sv, short = 0, run = H.num(s.setup.savings), li = [];
    inc.forEach(function (v, i) { var net = v - v * tax - spend; if (net < 0) short += -net; run += net; li.push('<div class="kv"><span>' + MONTHS[i] + (s.months[i].note ? ' <span class="small muted">· ' + H.esc(s.months[i].note) + "</span>" : "") + '</span><strong><span class="pill ' + (net < 0 ? "bad" : "ok") + '">' + (net < 0 ? "−" : "+") + H.money(Math.abs(Math.round(net))) + "</span></strong></div>"); });
    o.gapList = { html: li.join("") + '<p style="margin-top:.6rem">Total shortfall across short months: <strong>' + H.money(Math.round(short)) + "</strong>. Savings after 12 months if you follow this plan: <strong>" + (run < 0 ? "−" : "") + H.money(Math.abs(Math.round(run))) + "</strong>.</p>" };
    var goal = H.num(s.setup.bufferGoal) || short, have = H.num(s.setup.savings), need = Math.max(0, goal - have), mleft = s.setup.bufferBy ? Math.max(1, Math.ceil(daysTo(s.setup.bufferBy) / 30.44)) : 0;
    o.bufferPlan = { html: goal ? '<div class="bar save"><span style="width:' + Math.min(100, have / goal * 100) + '%"></span></div><p class="small" style="margin-top:.3rem">' + H.money(have) + " of " + H.money(Math.round(goal)) + " (" + Math.round(Math.min(100, have / goal * 100)) + "%).</p>" + (need ? "<p>Set aside about <strong>" + (mleft ? H.money(Math.ceil(need / mleft)) + "/month for " + mleft + " month" + (mleft > 1 ? "s" : "") : "—") + "</strong> to close the gap" + (mleft ? "" : " (pick a date)") + ".</p>" : "<p><span class='pill ok'>Buffer goal reached</span></p>") : "<p class='muted'>Fill in your income and budget first.</p>" };
    var lb = 0, lint = 0, lp = 0;
    s.loans.forEach(function (l, i) { var b = H.num(l.balance), r = H.num(l.rate), mi = b * r / 100 / 12; lb += b; lint += mi; lp += H.num(l.payment); o["ln-" + i] = l.name || "Loan " + (i + 1); o["li-" + i] = b ? "≈ " + H.money(mi, true) + " interest accrues per month" + (l.status === "rap" && H.num(l.payment) && H.num(l.payment) < mi ? ". Your payment is below the monthly interest; on RAP, the rest isn't charged in months you pay in full and on time." : "") : ""; });
    o.lb = H.money(lb); o.lint = H.money(lint, true); o.lpay = H.money(lp);
    if (s.rap.nextDue) {
      var d = daysTo(s.rap.nextDue), prev = addMonth(s.rap.nextDue, -1), rd = H.num(s.rap.reminderDays);
      o.rapDays = { html: '<div class="days">' + (d >= 0 ? d : "!") + '</div><p>' + (d > 1 ? "days until your payment is due" : d === 1 ? "day: due tomorrow" : d === 0 ? "due today" : "due date has passed: log the payment and enter your next due date") + "</p>" + (d >= 0 && d <= rd ? '<p><span class="pill warn">Reminder: pay ' + (s.rap.required ? H.money(s.rap.required, true) : "your full payment") + " by " + fmt(new Date(s.rap.nextDue + "T00:00:00")) + "</span></p>" : "") };
      o.rapWin = { html: '<div class="notice"><p>On-time window for this payment: <strong>after ' + fmt(prev) + "</strong> and <strong>on or before " + fmt(new Date(s.rap.nextDue + "T00:00:00")) + "</strong>. Following due date: " + fmt(addMonth(s.rap.nextDue, 1)) + ".</p></div>" };
    } else { o.rapDays = { html: '<p class="muted">Enter your next due date to start the countdown.</p>' }; o.rapWin = ""; }
    var ok = 0;
    s.payments.forEach(function (p, i) { var r = onTime(p); if (r[0] === "ok") ok++; o["pd-" + i] = p.due ? "Due " + fmt(new Date(p.due + "T00:00:00")) : "Payment " + (i + 1); o["ps-" + i] = { html: '<span class="pill ' + r[1] + '">' + r[2] + "</span>" }; });
    o.onTimeSum = s.payments.length ? ok + " of " + s.payments.length + " logged payments were full and inside their window." : "";
    o.prog = CHECKS.filter(function (c) { return s.checks[c[0]]; }).length + " of " + CHECKS.length + " done";
    return o;
  }
  var tables = {
    months: { label: "Income", rows: function (s) { var r = [["Month", "Stipend", "Other income", "Total", "Note"]]; s.months.forEach(function (m) { r.push([m.m, m.stipend, m.other, H.num(m.stipend) + H.num(m.other), m.note]); }); return r; } },
    budget: { label: "Budget", rows: function (s) { var r = [["Expense", "Per month", "Type"]]; s.expenses.forEach(function (e) { r.push([e.name, e.amt, e.kind]); }); return r; } },
    loans: { label: "Loans", rows: function (s) { var r = [["Loan", "Servicer", "Status", "Balance", "Rate %", "Monthly payment"]]; s.loans.forEach(function (l) { r.push([l.name, l.servicer, l.status, l.balance, l.rate, l.payment]); }); return r; } },
    payments: { label: "Payments", rows: function (s) { var r = [["Due date", "Date paid", "Required", "Paid", "Status", "Note"]]; s.payments.forEach(function (p) { r.push([p.due, p.paid, p.required, p.amount, onTime(p)[2], p.note]); }); return r; } }
  };
  window.PLANNER = { key: "gradiq-phd-stipend-loan-v1", slug: "phd-stipend-loan-planner", title: "PhD Stipend & Loan Budget Planner", disclaimer: "For planning only. Not financial, tax, or legal advice. Confirm loan details with your servicer and StudentAid.gov.", defaults: defaults, demo: demo, sections: sections, compute: compute, tables: tables, actions: actions, templates: { expenses: function () { return exp(); }, loans: loan, payments: pay } };
})();
