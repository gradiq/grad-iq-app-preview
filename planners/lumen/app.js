/**
 * Lumen 7-Step Time Planner
 * Guided chaos → calm weekly plan. Pastel sibling of the full study planner.
 */
(function () {
  "use strict";

  const STORAGE_KEY = "lumen-seven-step-v1";
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const LEVELS = {
    hs: {
      id: "hs",
      label: "High School",
      prioritySuggestions: ["Math / hardest class", "Upcoming quiz or test", "Sleep (≥8 hrs)", "Sports / activity", "Family time"],
      dumpPlaceholders: "e.g. Algebra worksheet, history reading, soccer practice…",
      deepHint: "Hardest subject first after school — while your brain still has gas.",
    },
    college: {
      id: "college",
      label: "College",
      prioritySuggestions: ["Midterm / paper due", "Problem set / lab", "Lecture catch-up", "Job / work shifts", "Rest & friends"],
      dumpPlaceholders: "e.g. Chem problem set, essay draft, office hours, shift at work…",
      deepHint: "Put your hardest course in your peak-energy window — treat it like an appointment.",
    },
    grad: {
      id: "grad",
      label: "Grad / Research",
      prioritySuggestions: ["Writing / analysis block", "Advisor / lab meeting", "Milestone deadline", "Teaching / service", "Recovery day"],
      dumpPlaceholders: "e.g. Chapter draft, figure revisions, lit review, committee prep…",
      deepHint: "Protect a morning making block (write/analyze) before email and meetings.",
    },
  };

  const STEPS = [
    {
      id: "priorities",
      short: "Priorities",
      title: "What matters this week?",
      lede: "Pick a few priorities — classes, deadlines, life. Not everything; just what actually needs space.",
      tip: "If everything feels urgent, pick the 3 things that would make next week feel lighter. The rest can wait or get a tiny slot.",
    },
    {
      id: "dump",
      short: "Brain dump",
      title: "Dump everything out",
      lede: "List tasks and commitments floating in your head. Don’t organize yet — just empty the mental browser tabs.",
      tip: "Set a 3-minute timer. Write messy. Incomplete lists are still progress — you can add more later.",
    },
    {
      id: "estimate",
      short: "Estimates",
      title: "Rough hours (imperfect is fine)",
      lede: "Guess how long each item might take. Wild guesses beat no plan. You’ll adjust as you go.",
      tip: "ADHD brains often under-estimate. Try: first guess × 1.5. Still wrong? That’s data, not failure.",
    },
    {
      id: "fixed",
      short: "Fixed",
      title: "Block fixed commitments first",
      lede: "Class, work, sleep, meals — these aren’t optional. Lock them in before you schedule study.",
      tip: "Protect sleep and meals like appointments. A packed calendar with no sleep is a plan that will fail.",
    },
    {
      id: "deep",
      short: "Deep work",
      title: "Schedule deep work",
      lede: "Park hard subjects when your energy is highest. Soft tasks can fill the leftovers.",
      tip: "One deep block beats three half-focused hours. Start with 25–50 minutes if a long block feels scary.",
    },
    {
      id: "buffers",
      short: "Buffers",
      title: "Add buffers & breaks",
      lede: "Overpacking is the #1 plan-killer. Leave white space so life can happen.",
      tip: "Aim for ~70–80% full, not 100%. Transition time, snacks, and “oops” slots are features — not laziness.",
    },
    {
      id: "ritual",
      short: "Check-in",
      title: "Your daily 5-minute ritual",
      lede: "Plans drift. A tiny nightly check-in keeps next day kind and realistic.",
      tip: "Same time every day helps it stick — after dinner, or before you close your laptop. Miss a day? Just start again. No guilt.",
    },
  ];

  const BUFFER_OPTIONS = [
    { id: "transitions", label: "10–15 min transitions", desc: "Between classes and study blocks" },
    { id: "break25", label: "Breaks every 25–50 min", desc: "Pomodoro-style; stand, water, stretch" },
    { id: "flexEvening", label: "Open evening buffer", desc: "One flexible night with no hard deadlines" },
    { id: "weekendCatch", label: "Weekend catch-up slot", desc: "90 min max — not an all-day guilt marathon" },
    { id: "sleepGuard", label: "Sleep guardrail", desc: "No new work after a set wind-down time" },
  ];

  function uid() {
    return Math.random().toString(36).slice(2, 9);
  }

  function defaultState() {
    return {
      level: "college",
      step: 0,
      completed: false,
      priorities: [],
      tasks: [],
      fixed: [],
      energy: "morning",
      deepDays: ["Mon", "Tue", "Wed", "Thu"],
      deepFocus: "",
      buffers: ["transitions", "break25", "sleepGuard"],
      ritualTime: "evening",
      checklistDone: {},
    };
  }

  let state = load() || defaultState();

  function load() {
    try {
      const raw = null; /* demo: nothing saved */
      if (!raw) return null;
      return Object.assign(defaultState(), JSON.parse(raw));
    } catch (_) {
      return null;
    }
  }

  function save() {
    try {
      /* demo: nothing saved */
    } catch (_) {}
  }

  function toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.add("hidden"), 2200);
  }

  function level() {
    return LEVELS[state.level] || LEVELS.college;
  }

  function totalHours() {
    return state.tasks.reduce((s, t) => s + (Number(t.hours) || 0), 0);
  }

  // ——— Screens ———
  function showScreen(id) {
    ["welcome", "flow", "summary"].forEach((s) => {
      document.getElementById(s).classList.toggle("hidden", s !== id);
    });
  }

  function renderWelcome() {
    showScreen("welcome");
    document.querySelectorAll("#level-picker .level-card").forEach((btn) => {
      btn.classList.toggle("selected", btn.dataset.level === state.level);
    });
  }

  function renderFlow() {
    showScreen("flow");
    document.getElementById("level-badge").textContent = level().label;
    const step = Math.min(Math.max(state.step, 0), 6);
    const meta = STEPS[step];
    document.getElementById("step-label").textContent = `Step ${step + 1} of 7`;
    document.getElementById("step-title-short").textContent = meta.short;
    document.getElementById("progress-fill").style.width = `${((step + 1) / 7) * 100}%`;
    document.getElementById("progress-bar").setAttribute("aria-valuenow", String(step + 1));

    const dots = document.getElementById("step-dots");
    dots.innerHTML = STEPS.map((s, i) => {
      const cls = i === step ? "current" : i < step ? "done" : "";
      return `<button type="button" class="step-dot ${cls}" data-goto="${i}" aria-label="Go to step ${i + 1}: ${s.short}" title="${s.short}"></button>`;
    }).join("");

    const back = document.getElementById("btn-back");
    const next = document.getElementById("btn-next");
    back.disabled = step === 0;
    next.textContent = step === 6 ? "Build my plan" : "Next";

    const panel = document.getElementById("step-panel");
    panel.innerHTML = `
      <p class="eyebrow">Step ${step + 1} · ${meta.short}</p>
      <h1>${meta.title}</h1>
      <p class="lede">${meta.lede}</p>
      <div class="tip-box"><strong>Gentle tip</strong><p>${meta.tip}</p></div>
      <div id="step-body"></div>
    `;
    const body = document.getElementById("step-body");
    const renderers = [renderPriorities, renderDump, renderEstimate, renderFixed, renderDeep, renderBuffers, renderRitual];
    renderers[step](body);
  }

  // Step 1
  function renderPriorities(body) {
    const suggestions = level().prioritySuggestions;
    body.innerHTML = `
      <p class="field-label">Tap a suggestion or add your own</p>
      <div class="chip-row" id="sug-row">
        ${suggestions
          .map(
            (s) =>
              `<button type="button" class="btn chip ${state.priorities.includes(s) ? "selected" : ""}" data-sug="${escapeAttr(s)}">${escapeHtml(s)}</button>`
          )
          .join("")}
      </div>
      <div class="add-row">
        <input class="input" id="pri-input" type="text" maxlength="80" placeholder="Add a priority…" autocomplete="off" />
        <button type="button" class="btn secondary" id="pri-add">Add</button>
      </div>
      <ul class="item-list" id="pri-list"></ul>
      <div class="empty-state ${state.priorities.length ? "hidden" : ""}" id="pri-empty">
        <p>No priorities yet — even one is enough to start.</p>
      </div>
      <p class="encouragement">You’re clarifying, not committing forever.</p>
    `;
    paintPriorityList();
    body.querySelector("#sug-row").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-sug]");
      if (!btn) return;
      const s = btn.dataset.sug;
      if (state.priorities.includes(s)) {
        state.priorities = state.priorities.filter((p) => p !== s);
      } else {
        state.priorities.push(s);
      }
      save();
      renderFlow();
    });
    body.querySelector("#pri-add").addEventListener("click", addPriority);
    body.querySelector("#pri-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addPriority();
      }
    });
  }

  function addPriority() {
    const input = document.getElementById("pri-input");
    const v = (input.value || "").trim();
    if (!v) return;
    if (!state.priorities.includes(v)) state.priorities.push(v);
    input.value = "";
    save();
    renderFlow();
  }

  function paintPriorityList() {
    const list = document.getElementById("pri-list");
    if (!list) return;
    const custom = state.priorities.filter((p) => !level().prioritySuggestions.includes(p));
    list.innerHTML = state.priorities
      .map(
        (p, i) => `
      <li class="item-row">
        <span class="item-name">${escapeHtml(p)}</span>
        <button type="button" class="btn text-btn" data-rm="${i}" aria-label="Remove">Remove</button>
      </li>`
      )
      .join("");
    list.querySelectorAll("[data-rm]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.priorities.splice(Number(btn.dataset.rm), 1);
        save();
        renderFlow();
      });
    });
    const empty = document.getElementById("pri-empty");
    if (empty) empty.classList.toggle("hidden", state.priorities.length > 0);
  }

  // Step 2
  function renderDump(body) {
    body.innerHTML = `
      <div class="add-row">
        <input class="input" id="task-input" type="text" maxlength="120" placeholder="${escapeAttr(level().dumpPlaceholders)}" autocomplete="off" />
        <button type="button" class="btn secondary" id="task-add">Add</button>
      </div>
      <ul class="item-list" id="task-list"></ul>
      <div class="empty-state ${state.tasks.length ? "hidden" : ""}" id="task-empty">
        <p>Brain still full? Add anything — homework, errands, “email professor.”</p>
      </div>
      <p class="encouragement">${state.tasks.length ? `${state.tasks.length} item${state.tasks.length === 1 ? "" : "s"} on the list. Nice dump.` : "Empty is okay — you can come back."}</p>
    `;
    paintTaskList();
    body.querySelector("#task-add").addEventListener("click", addTask);
    body.querySelector("#task-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addTask();
      }
    });
  }

  function addTask() {
    const input = document.getElementById("task-input");
    const v = (input.value || "").trim();
    if (!v) return;
    state.tasks.push({ id: uid(), name: v, hours: null });
    input.value = "";
    save();
    renderFlow();
  }

  function paintTaskList() {
    const list = document.getElementById("task-list");
    if (!list) return;
    list.innerHTML = state.tasks
      .map(
        (t, i) => `
      <li class="item-row">
        <span class="item-name">${escapeHtml(t.name)}</span>
        <button type="button" class="btn text-btn" data-rm="${i}">Remove</button>
      </li>`
      )
      .join("");
    list.querySelectorAll("[data-rm]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.tasks.splice(Number(btn.dataset.rm), 1);
        save();
        renderFlow();
      });
    });
  }

  // Step 3
  function renderEstimate(body) {
    if (!state.tasks.length) {
      body.innerHTML = `
        <div class="empty-state">
          <p>No tasks yet. Go back and dump a few — or skip ahead with a light plan.</p>
        </div>
        <p class="encouragement">Skipping estimates is allowed. Rough is better than stuck.</p>
      `;
      return;
    }
    body.innerHTML = `
      <p class="field-label">Hours per item (decimals ok — 0.5, 1.5…)</p>
      <ul class="item-list" id="est-list">
        ${state.tasks
          .map(
            (t) => `
          <li class="item-row">
            <span class="item-name">${escapeHtml(t.name)}</span>
            <input class="hours-input" type="number" min="0" max="40" step="0.5" data-id="${t.id}"
              value="${t.hours != null ? t.hours : ""}" placeholder="?" aria-label="Hours for ${escapeAttr(t.name)}" />
            <span class="item-meta">hrs</span>
          </li>`
          )
          .join("")}
      </ul>
      <p class="encouragement">
        ${
          state.tasks.every((t) => t.hours == null || t.hours === "")
            ? "Blank hours? Totally fine — leave a ? and keep moving."
            : `Rough total: ~${totalHours().toFixed(1)} hrs this week. Adjust anytime.`
        }
      </p>
    `;
    body.querySelectorAll(".hours-input").forEach((input) => {
      input.addEventListener("change", () => {
        const task = state.tasks.find((t) => t.id === input.dataset.id);
        if (!task) return;
        const v = input.value === "" ? null : Number(input.value);
        task.hours = v != null && !Number.isNaN(v) ? Math.max(0, v) : null;
        save();
        const enc = body.querySelector(".encouragement");
        if (enc) {
          enc.textContent = state.tasks.every((t) => t.hours == null)
            ? "Blank hours? Totally fine — leave a ? and keep moving."
            : `Rough total: ~${totalHours().toFixed(1)} hrs this week. Adjust anytime.`;
        }
      });
    });
  }

  // Step 4
  function renderFixed(body) {
    body.innerHTML = `
      <div class="fixed-form" id="fixed-form">
        <div>
          <label class="field-label" for="fix-name">Commitment</label>
          <input class="input" id="fix-name" type="text" maxlength="80" placeholder="e.g. Sleep, Chem lecture, Work shift" />
        </div>
        <div class="row-2">
          <div>
            <label class="field-label" for="fx-day">Day</label>
            <select class="select" id="fx-day">
              ${DAYS.map((d) => `<option value="${d}">${d}</option>`).join("")}
              <option value="Daily">Daily</option>
            </select>
          </div>
          <div>
            <label class="field-label" for="fx-when">When (optional)</label>
            <input class="input" id="fx-when" type="text" maxlength="40" placeholder="e.g. 9–10am" />
          </div>
        </div>
        <button type="button" class="btn secondary" id="fx-add">Add commitment</button>
      </div>
      <div class="chip-row">
        ${["Sleep 11pm–7am", "Breakfast / lunch / dinner", "Commute", "Class block"]
          .map((q) => `<button type="button" class="btn chip" data-quick="${escapeAttr(q)}">${escapeHtml(q)}</button>`)
          .join("")}
      </div>
      <ul class="item-list" id="fx-list"></ul>
      <div class="empty-state ${state.fixed.length ? "hidden" : ""}" id="fx-empty">
        <p>Start with sleep. Then class or work. Meals count.</p>
      </div>
    `;
    paintFixedList();
    body.querySelector("#fx-add").addEventListener("click", addFixed);
    body.querySelectorAll("[data-quick]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const name = btn.dataset.quick;
        state.fixed.push({ id: uid(), name, day: name.startsWith("Sleep") || name.startsWith("Breakfast") ? "Daily" : "Mon", when: "" });
        save();
        renderFlow();
        toast("Added");
      });
    });
  }

  function addFixed() {
    const name = (document.getElementById("fx-name").value || "").trim();
    if (!name) return;
    const day = document.getElementById("fx-day").value;
    const when = (document.getElementById("fx-when").value || "").trim();
    state.fixed.push({ id: uid(), name, day, when });
    save();
    renderFlow();
  }

  function paintFixedList() {
    const list = document.getElementById("fx-list");
    if (!list) return;
    list.innerHTML = state.fixed
      .map(
        (f, i) => `
      <li class="item-row">
        <span class="item-name">${escapeHtml(f.name)} <span class="item-meta">· ${escapeHtml(f.day)}${f.when ? " · " + escapeHtml(f.when) : ""}</span></span>
        <button type="button" class="btn text-btn" data-rm="${i}">Remove</button>
      </li>`
      )
      .join("");
    list.querySelectorAll("[data-rm]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.fixed.splice(Number(btn.dataset.rm), 1);
        save();
        renderFlow();
      });
    });
  }

  // Step 5
  function renderDeep(body) {
    const taskOptions = state.tasks.length
      ? state.tasks.map((t) => `<option value="${escapeAttr(t.name)}" ${state.deepFocus === t.name ? "selected" : ""}>${escapeHtml(t.name)}</option>`).join("")
      : "";
    body.innerHTML = `
      <p class="field-label">When is your energy highest?</p>
      <div class="energy-grid" id="energy-grid">
        ${[
          ["morning", "Morning", "Fresh focus"],
          ["afternoon", "Afternoon", "Steady stretch"],
          ["evening", "Evening", "Quiet hours"],
        ]
          .map(
            ([id, label, sub]) => `
          <button type="button" class="energy-card ${state.energy === id ? "selected" : ""}" data-energy="${id}">
            <strong>${label}</strong><span>${sub}</span>
          </button>`
          )
          .join("")}
      </div>
      <p class="field-label">Deep-work days</p>
      <div class="day-grid" id="day-grid">
        ${DAYS.map(
          (d) =>
            `<button type="button" class="day-chip ${state.deepDays.includes(d) ? "selected" : ""}" data-day="${d}">${d}</button>`
        ).join("")}
      </div>
      <label class="field-label" for="deep-focus">Hardest focus this week</label>
      <select class="select" id="deep-focus">
        <option value="">Pick a task or type below…</option>
        ${taskOptions}
      </select>
      <input class="input" id="deep-custom" type="text" maxlength="80" placeholder="Or type: e.g. Organic chem problems"
        value="${state.deepFocus && !state.tasks.some((t) => t.name === state.deepFocus) ? escapeAttr(state.deepFocus) : ""}"
        style="margin-top:0.6rem" />
      <p class="encouragement">${level().deepHint}</p>
    `;
    body.querySelector("#energy-grid").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-energy]");
      if (!btn) return;
      state.energy = btn.dataset.energy;
      save();
      renderFlow();
    });
    body.querySelector("#day-grid").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-day]");
      if (!btn) return;
      const d = btn.dataset.day;
      if (state.deepDays.includes(d)) {
        state.deepDays = state.deepDays.filter((x) => x !== d);
      } else {
        state.deepDays.push(d);
      }
      save();
      renderFlow();
    });
    const syncFocus = () => {
      const sel = document.getElementById("deep-focus").value;
      const custom = (document.getElementById("deep-custom").value || "").trim();
      state.deepFocus = custom || sel;
      save();
    };
    body.querySelector("#deep-focus").addEventListener("change", () => {
      document.getElementById("deep-custom").value = "";
      syncFocus();
    });
    body.querySelector("#deep-custom").addEventListener("change", syncFocus);
  }

  // Step 6
  function renderBuffers(body) {
    body.innerHTML = `
      <p class="field-label">Choose protections (pick what you’ll actually try)</p>
      <div class="buffer-options" id="buf-opts">
        ${BUFFER_OPTIONS.map((o) => {
          const on = state.buffers.includes(o.id);
          return `
            <label class="check-card ${on ? "selected" : ""}">
              <input type="checkbox" data-buf="${o.id}" ${on ? "checked" : ""} />
              <div><strong>${escapeHtml(o.label)}</strong><span>${escapeHtml(o.desc)}</span></div>
            </label>`;
        }).join("")}
      </div>
      <p class="encouragement">White space is part of the plan. You’re allowed to under-schedule.</p>
    `;
    body.querySelectorAll("[data-buf]").forEach((cb) => {
      cb.addEventListener("change", () => {
        const id = cb.dataset.buf;
        if (cb.checked) {
          if (!state.buffers.includes(id)) state.buffers.push(id);
        } else {
          state.buffers = state.buffers.filter((b) => b !== id);
        }
        save();
        cb.closest(".check-card").classList.toggle("selected", cb.checked);
      });
    });
  }

  // Step 7
  function renderRitual(body) {
    body.innerHTML = `
      <p class="field-label">When will you do the 5-minute check-in?</p>
      <div class="energy-grid" id="ritual-grid">
        ${[
          ["morning", "Morning", "Set the day"],
          ["evening", "Evening", "Close the loop"],
          ["anytime", "Flexible", "Whenever I remember"],
        ]
          .map(
            ([id, label, sub]) => `
          <button type="button" class="energy-card ${state.ritualTime === id ? "selected" : ""}" data-ritual="${id}">
            <strong>${label}</strong><span>${sub}</span>
          </button>`
          )
          .join("")}
      </div>
      <div class="ritual-box">
        <strong style="font-family:var(--display);font-size:1.05rem">The 5-minute script</strong>
        <ol>
          <li>What got done today? (celebrate tiny wins)</li>
          <li>What’s the one MIT for tomorrow?</li>
          <li>Move anything leftover — no shame, just reschedule</li>
        </ol>
      </div>
      <p class="encouragement">Hit “Build my plan” when you’re ready. You can always edit steps later.</p>
    `;
    body.querySelector("#ritual-grid").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-ritual]");
      if (!btn) return;
      state.ritualTime = btn.dataset.ritual;
      save();
      renderFlow();
    });
  }

  // ——— Summary ———
  function buildPlan() {
    const energyLabel = { morning: "morning", afternoon: "afternoon", evening: "evening" }[state.energy] || "morning";
    const deepLabel = state.deepFocus || (state.tasks[0] && state.tasks[0].name) || "Hardest subject";
    const week = {};
    DAYS.forEach((d) => {
      week[d] = [];
    });

    state.fixed.forEach((f) => {
      if (f.day === "Daily") {
        DAYS.forEach((d) => week[d].push({ tag: "fixed", text: f.name + (f.when ? ` (${f.when})` : "") }));
      } else if (week[f.day]) {
        week[f.day].push({ tag: "fixed", text: f.name + (f.when ? ` (${f.when})` : "") });
      }
    });

    state.deepDays.forEach((d) => {
      if (week[d]) {
        week[d].push({
          tag: "deep",
          text: `Deep work · ${deepLabel} (${energyLabel})`,
        });
      }
    });

    // Distribute tasks lightly across week
    const studyDays = state.deepDays.length ? state.deepDays : ["Mon", "Wed", "Fri"];
    let di = 0;
    state.tasks.forEach((t) => {
      if (t.name === deepLabel && state.deepDays.length) return; // already covered as deep focus
      const day = studyDays[di % studyDays.length];
      di++;
      const hrs = t.hours != null ? ` · ~${t.hours}h` : "";
      week[day].push({ tag: "task", text: t.name + hrs });
    });

    if (state.buffers.includes("break25")) {
      studyDays.slice(0, 3).forEach((d) => {
        week[d].push({ tag: "break", text: "Break between focus blocks" });
      });
    }
    if (state.buffers.includes("flexEvening")) {
      week.Fri.push({ tag: "break", text: "Open evening — flexible buffer" });
    }
    if (state.buffers.includes("weekendCatch")) {
      week.Sat.push({ tag: "task", text: "Catch-up slot (≤90 min)" });
    }
    if (state.buffers.includes("sleepGuard")) {
      DAYS.forEach((d) => week[d].push({ tag: "break", text: "Wind-down · protect sleep" }));
    }

    return week;
  }

  function renderSummary() {
    showScreen("summary");
    state.completed = true;
    save();

    const week = buildPlan();
    const hrs = totalHours();
    const ritualLabel = { morning: "morning", evening: "evening", anytime: "whenever you remember" }[state.ritualTime];

    const content = document.getElementById("summary-content");
    content.innerHTML = `
      <div class="summary-hero">
        <p class="eyebrow">You did it</p>
        <h1>Your simple week</h1>
        <p class="lede">Not perfect — usable. Check things off as you go. Edit any step if life shifts.</p>
        <div class="stats-row">
          <div class="stat-pill"><strong>${state.priorities.length || "—"}</strong><span>Priorities</span></div>
          <div class="stat-pill"><strong>${state.tasks.length || "—"}</strong><span>Tasks</span></div>
          <div class="stat-pill"><strong>${hrs ? "~" + hrs.toFixed(0) + "h" : "—"}</strong><span>Est. work</span></div>
        </div>
      </div>

      ${
        state.priorities.length
          ? `<div class="checklist-card"><h3>This week’s priorities</h3><ul>${state.priorities
              .map((p) => `<li class="check-item"><span class="check-label">★ ${escapeHtml(p)}</span></li>`)
              .join("")}</ul></div>`
          : ""
      }

      <h2 style="margin:0 0 0.75rem">Weekly view</h2>
      <div class="week-board">
        ${DAYS.map((d) => {
          const items = week[d];
          return `
            <article class="day-card">
              <h3>${d}</h3>
              ${
                items.length
                  ? `<ul>${items
                      .map(
                        (it) =>
                          `<li><span class="tag ${it.tag}">${it.tag}</span><span>${escapeHtml(it.text)}</span></li>`
                      )
                      .join("")}</ul>`
                  : `<p class="muted" style="margin:0;font-size:0.85rem">Light day — rest or flex</p>`
              }
            </article>`;
        }).join("")}
      </div>

      <div class="checklist-card">
        <h3>Task checklist</h3>
        <p class="muted">Tap to check off. Saved on this device.</p>
        <ul id="summary-checks">
          ${
            state.tasks.length
              ? state.tasks
                  .map((t) => {
                    const done = !!state.checklistDone[t.id];
                    return `
                    <li class="check-item ${done ? "done" : ""}" data-check="${t.id}">
                      <input type="checkbox" ${done ? "checked" : ""} aria-label="Mark done" />
                      <span class="check-label">${escapeHtml(t.name)}</span>
                      <span class="check-hours">${t.hours != null ? "~" + t.hours + "h" : ""}</span>
                    </li>`;
                  })
                  .join("")
              : `<li class="muted" style="padding:0.5rem 0">No tasks listed — your weekly view still has fixed blocks & deep work.</li>`
          }
        </ul>
      </div>

      <div class="ritual-summary">
        <h3>Daily check-in</h3>
        <p style="margin:0;color:var(--ink-soft)">
          Do your 5-minute ritual in the <strong>${ritualLabel}</strong>:
          what got done → one MIT tomorrow → reschedule leftovers without guilt.
        </p>
      </div>

      ${
        state.buffers.length
          ? `<div class="checklist-card"><h3>Your buffers</h3><ul>${state.buffers
              .map((id) => {
                const o = BUFFER_OPTIONS.find((b) => b.id === id);
                return o ? `<li class="check-item"><span class="check-label">${escapeHtml(o.label)}</span></li>` : "";
              })
              .join("")}</ul></div>`
          : ""
      }

      <p class="muted" style="text-align:center;margin-top:1.5rem">
        Want the full dashboard? <a class="link-quiet" style="margin:0" href="../study-planner/index.html">Open Lumen study planner</a>
      </p>
    `;

    content.querySelectorAll("[data-check]").forEach((row) => {
      const id = row.dataset.check;
      const cb = row.querySelector("input");
      const toggle = () => {
        state.checklistDone[id] = cb.checked;
        row.classList.toggle("done", cb.checked);
        save();
      };
      cb.addEventListener("change", toggle);
      row.addEventListener("click", (e) => {
        if (e.target === cb) return;
        cb.checked = !cb.checked;
        toggle();
      });
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
  }

  // ——— Events ———
  function bind() {
    document.getElementById("level-picker").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-level]");
      if (!btn) return;
      state.level = btn.dataset.level;
      save();
      renderWelcome();
    });

    document.getElementById("btn-begin").addEventListener("click", () => {
      state.step = 0;
      state.completed = false;
      save();
      renderFlow();
    });

    document.getElementById("btn-back").addEventListener("click", () => {
      if (state.step > 0) {
        state.step--;
        save();
        renderFlow();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });

    document.getElementById("btn-next").addEventListener("click", () => {
      if (state.step < 6) {
        state.step++;
        save();
        renderFlow();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        renderSummary();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });

    document.getElementById("step-dots").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-goto]");
      if (!btn) return;
      state.step = Number(btn.dataset.goto);
      save();
      renderFlow();
    });

    document.getElementById("btn-edit-steps").addEventListener("click", () => {
      state.completed = false;
      state.step = 0;
      save();
      renderFlow();
    });

    document.getElementById("btn-restart").addEventListener("click", () => {
      if (!confirm("Start over? This clears your 7-step plan on this device.")) return;
      const lvl = state.level;
      state = defaultState();
      state.level = lvl;
      save();
      renderWelcome();
      toast("Fresh start");
    });
  }

  function init() {
    bind();
    if (state.completed) {
      renderSummary();
    } else if (state.step > 0 || state.priorities.length || state.tasks.length) {
      renderFlow();
    } else {
      renderWelcome();
    }
  }

  init();
})();
