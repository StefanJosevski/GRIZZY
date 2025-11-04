/* ===================== Data Model ===================== */
// days: 1=Mon ... 5=Fri; time as 24h decimals
// Each course includes: seats, prereqs, alternatives (sections), and sessions
const courseCatalog = {
  "CSI 2300": {
    code: "CSI 2300",
    title: "Data Structures",
    credits: 4,
    instructor: "Dr. Sarah Johnson",
    location: "Engineering Center 201",
    seats: 2,              // live availability
    prereqs: ["CSI 1200"],
    sessions: [
      { day: 1, start: 9.0, end: 10.5 },
      { day: 3, start: 9.0, end: 10.5 },
      { day: 5, start: 9.0, end: 10.5 },
    ],
    alternatives: [
      { label: "T/Th 2:00–3:15", sessions: [{day:2,start:14.0,end:15.25},{day:4,start:14.0,end:15.25}] },
    ]
  },
  "MTH 1554": {
    code: "MTH 1554",
    title: "Calculus II",
    credits: 4,
    instructor: "Prof. Michael Chen",
    location: "Math Science Center 304",
    seats: 0,  // full (will demo waitlist)
    prereqs: ["MTH 1553"],
    sessions: [
      { day: 2, start: 11.0, end: 12.5 },
      { day: 4, start: 11.0, end: 12.5 },
    ],
    alternatives: [
      { label: "T/Th 8:30–10:00", sessions: [{day:2,start:8.5,end:10.0},{day:4,start:8.5,end:10.0}] }
    ]
  },
  "PHY 1510": {
    code: "PHY 1510",
    title: "Introductory Physics I",
    credits: 4,
    instructor: "Dr. Emily Rodriguez",
    location: "Science and Engineering Building 150",
    seats: 5,
    prereqs: [],
    sessions: [
      { day: 1, start: 13.0, end: 14.5 },
      { day: 3, start: 13.0, end: 14.5 },
      { day: 5, start: 13.0, end: 14.5 },
    ],
    alternatives: []
  },
  "WRT 1060": {
    code: "WRT 1060",
    title: "Composition II",
    credits: 4,
    instructor: "Prof. David Williams",
    location: "O'Dowd Hall 220",
    seats: 3,
    prereqs: [],
    sessions: [
      { day: 2, start: 14.0, end: 15.5 },
      { day: 4, start: 14.0, end: 15.5 },
    ],
    alternatives: []
  },
  "BIO 1200": {
    code: "BIO 1200",
    title: "Intro Biology",
    credits: 4,
    instructor: "Dr. K. Ahmed",
    location: "SEB 220",
    seats: 4,
    prereqs: [],
    sessions: [
      { day: 2, start: 9.0, end: 10.5 },
      { day: 4, start: 9.0, end: 10.5 },
    ],
    alternatives: []
  }
};

// “Completed” courses to satisfy prereqs (demo)
const completedCourses = new Set(["CSI 1200", "MTH 1553"]);

// degree progress: unmet requirements → course codes or tags
const degreeProgress = {
  unmet: ["PHY 1510", "BIO 1200"]  // demo: needs Physics and a bio elective
};

// enrolled + waitlist state
let enrolled = ["CSI 2300", "MTH 1554", "PHY 1510", "WRT 1060"];
const waitlist = new Map(); // code -> position

/* ===================== Utilities ===================== */
const $ = (q, r = document) => r.querySelector(q);
const $$ = (q, r = document) => Array.from(r.querySelectorAll(q));

function toast(message) {
  const host = $("#toasts");
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  Object.assign(el.style, {
    position: "fixed",
    right: "16px",
    bottom: "16px",
    background: "#111827",
    color: "white",
    padding: "10px 12px",
    borderRadius: "10px",
    boxShadow: "0 6px 16px rgba(0,0,0,.25)",
    zIndex: 50,
    maxWidth: "80vw",
  });
  host.appendChild(el);
  setTimeout(() => el.remove(), 2400);
}

/* Time formatting (robust) */
function hoursToLabel(h) {
  const hour = Math.floor(h);
  const minutes = Math.round((h - hour) * 60);
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayMinutes = minutes.toString().padStart(2, "0");
  return `${displayHour}:${displayMinutes} ${ampm}`;
}

/* Schedule helpers */
function getRowHeight() {
  const sampleCell = document.querySelector(".schedule-grid .cell");
  return sampleCell ? sampleCell.getBoundingClientRect().height : 70;
}
function fractionalHour(h) { return h - Math.floor(h); }
function startRowIndex(startHourOfGrid, startTime) {
  return Math.max(0, Math.floor(startTime - startHourOfGrid));
}

/* Notifications Center */
function pushNotification(text) {
  const list = $("#notifList");
  const id = Math.random().toString(36).slice(2,9);
  const li = document.createElement("li");
  li.dataset.id = id;
  li.innerHTML = `<span class="dot"></span> ${text} <button class="btn outline" data-dismiss="${id}">Mark read</button>`;
  list.prepend(li);
}

/* ===================== Rendering ===================== */
function renderAll() {
  renderKpis();
  renderClassGrid();
  renderScheduleGridSkeleton();
  renderScheduleEvents();
  renderSuggestions();
}

function renderKpis() {
  const total = enrolled.reduce((sum, code) => sum + (courseCatalog[code]?.credits || 0), 0);
  $("#kpiCredits").textContent = total;
}

function courseSessionsText(c) {
  return c.sessions
    .map(s => `${["","Mon","Tue","Wed","Thu","Fri"][s.day]} ${hoursToLabel(s.start)}–${hoursToLabel(s.end)}`)
    .join(" • ");
}

function renderClassGrid() {
  const grid = $("#classGrid");
  grid.innerHTML = "";
  const q = $("#search").value?.toLowerCase() || "";

  enrolled.forEach(code => {
    const c = courseCatalog[code];
    if (!c) return;
    const textBlob = `${c.code} ${c.title} ${c.instructor} ${c.location}`.toLowerCase();
    if (q && !textBlob.includes(q)) return;

    const prereqUnsatisfied = (c.prereqs || []).filter(p => !completedCourses.has(p));
    const sessionsText = courseSessionsText(c);
    const seatsBadge = c.seats > 0
      ? `<span class="badge seats">${c.seats} seats</span>`
      : (waitlist.has(code)
          ? `<span class="badge wait">Waitlist #${waitlist.get(code)}</span>`
          : `<span class="badge wait">Waitlist</span>`);

    const warn = prereqUnsatisfied.length
      ? `<span class="warnline">Prerequisite required: ${prereqUnsatisfied.join(", ")}</span>`
      : "";

    const card = document.createElement("article");
    card.className = "card class-card";
    card.dataset.course = c.code;
    card.innerHTML = `
      <div class="card-header">
        <h3>${c.code} — ${c.title}</h3>
        <p class="muted">Instructor: ${c.instructor}</p>
        <p class="muted">${sessionsText}</p>
        <p class="muted">${c.location}</p>
        ${warn}
      </div>
      <div class="card-footer">
        <span class="badge">${c.credits} Credits</span>
        ${seatsBadge}
        <div class="actions">
          <button class="btn ghost" data-action="details">Details</button>
          <button class="btn ghost danger" data-action="drop">Drop</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  // Bind actions
  $$('.class-card [data-action="drop"]').forEach(btn => {
    btn.onclick = () => dropCourse(btn.closest(".class-card").dataset.course);
  });
  $$('.class-card [data-action="details"]').forEach(btn => {
    btn.onclick = () => showDetails(btn.closest(".class-card").dataset.course);
  });
}

function renderScheduleGridSkeleton() {
  const grid = $("#scheduleGrid");
  // remove old time rows (keep weekday headers)
  $$('#scheduleGrid .time, #scheduleGrid .cell').forEach(n => n.remove());

  const tpl = $("#slot-template");
  for (let hour = 9; hour <= 17; hour++) { // 9AM .. 5PM
    const row = tpl.content.cloneNode(true);
    row.children[0].textContent = hoursToLabel(hour);
    // mark lunch (12–1) row as break
    const isLunch = hour === 12;
    const cells = row.querySelectorAll('.cell');
    if (isLunch) cells.forEach(c => c.classList.add('break'));
    grid.appendChild(row);
  }
}

function detectConflicts(sessionsByCourse) {
  // returns Set of course codes that have at least one overlap
  const conflicts = new Set();
  // flatten by day
  for (let day=1; day<=5; day++){
    const blocks = [];
    for (const [code, c] of sessionsByCourse) {
      c.sessions.filter(s=>s.day===day).forEach(s => blocks.push({code,...s}));
    }
    blocks.sort((a,b)=>a.start-b.start);
    for (let i=0;i<blocks.length-1;i++){
      const a = blocks[i], b = blocks[i+1];
      if (a.end > b.start) { // overlap
        conflicts.add(a.code); conflicts.add(b.code);
      }
    }
  }
  return conflicts;
}

function renderScheduleEvents() {
  const startHour = 9;
  const cellH = getRowHeight();

  // Clear cells
  $$('#scheduleGrid .cell').forEach(c => { c.innerHTML = ""; c.style.overflow = "visible"; });

  // Build sessions map for conflicts
  const map = new Map();
  enrolled.forEach(code => { const c = courseCatalog[code]; if (c) map.set(code, c); });
  const conflictSet = detectConflicts(map);

  enrolled.forEach(code => {
    const c = courseCatalog[code]; if (!c) return;
    c.sessions.forEach(s => {
      const row = startRowIndex(startHour, s.start);
      const col = s.day - 1;
      const cells = $$('#scheduleGrid .cell');
      const firstCellIndex = row * 5 + col;
      const cell = cells[firstCellIndex];
      if (!cell) return;

      const el = document.createElement("div");
      el.className = "event" + (conflictSet.has(code) ? " conflict" : "");
      el.textContent = code;

      const topPx = fractionalHour(s.start) * cellH;
      const heightPx = Math.max(10, (s.end - s.start) * cellH);
      el.style.top = `${topPx}px`;
      el.style.height = `${heightPx}px`;

      // click to show details
      el.addEventListener("click", () => showDetails(code));
      cell.appendChild(el);
    });
  });
}

/* Suggestions based on degree progress + availability + alternatives */
function renderSuggestions() {
  const box = $("#suggestionList");
  box.innerHTML = "";

  // 1) Alternatives for conflicts or closed sections (use first available alt)
  enrolled.forEach(code => {
    const c = courseCatalog[code];
    if (!c || !c.alternatives || c.alternatives.length===0) return;
    const alt = c.alternatives.find(a => true);
    if (alt) {
      const item = document.createElement("div");
      item.className = "list-item";
      item.innerHTML = `
        <div>
          <h4>Switch ${code} to ${alt.label}</h4>
          <p class="muted">Alternative section to reduce conflicts.</p>
        </div>
        <button class="btn outline" data-alt="${code}">Apply</button>
      `;
      item.querySelector("button").onclick = () => {
        courseCatalog[code].sessions = alt.sessions.map(s=>({...s}));
        toast(`Switched ${code} to ${alt.label}`);
        pushNotification(`Switched ${code} to ${alt.label}.`);
        renderAll();
      };
      box.appendChild(item);
    }
  });

  // 2) Fill unmet degree requirements with open seats
  degreeProgress.unmet.forEach(req => {
    const c = courseCatalog[req];
    if (!c || enrolled.includes(req)) return;
    if (c.seats > 0) {
      const item = document.createElement("div");
      item.className = "list-item";
      item.innerHTML = `
        <div>
          <h4>Add ${c.code} — ${c.title} (${c.credits} cr)</h4>
          <p class="muted">Meets degree requirement • ${c.seats} seats open</p>
        </div>
        <button class="btn outline" data-add="${c.code}">Add</button>
      `;
      item.querySelector("button").onclick = () => addCourse(c.code);
      box.appendChild(item);
    }
  });

  // 3) If something is full, recommend waitlist monitoring
  enrolled.forEach(code => {
    const c = courseCatalog[code];
    if (!c) return;
    if (c.seats === 0 && waitlist.has(code)) {
      const pos = waitlist.get(code);
      const item = document.createElement("div");
      item.className = "list-item";
      item.innerHTML = `
        <div>
          <h4>Monitor waitlist for ${code}</h4>
          <p class="muted">You're currently #${pos}. We'll notify you if a seat opens.</p>
        </div>
        <button class="btn outline" disabled>Enabled</button>
      `;
      box.appendChild(item);
    }
  });

  if (!box.children.length) {
    const item = document.createElement("div");
    item.className = "list-item";
    item.innerHTML = `<div><h4>No new suggestions</h4><p class="muted">You're all set for now.</p></div><span class="muted">👍</span>`;
    box.appendChild(item);
  }
}

/* ===================== Actions / Class Management ===================== */
function addCourse(code) {
  code = (code || "").toUpperCase().trim();
  const c = courseCatalog[code];
  if (!c) { toast(`Unknown course: ${code}`); return; }
  if (enrolled.includes(code)) { toast(`${code} already in plan`); return; }

  // prereq check
  const missing = (c.prereqs || []).filter(p => !completedCourses.has(p));
  if (missing.length) {
    toast(`Prerequisite needed: ${missing.join(", ")}`);
    pushNotification(`Prerequisite alert for ${code}: ${missing.join(", ")}`);
    return;
  }

  // seat check
  if (c.seats > 0) {
    c.seats -= 1;
    enrolled.push(code);
    toast(`Added ${code} • ${c.seats} seats left`);
    pushNotification(`Added ${code}. Confirmation sent.`);
    renderAll();
  } else {
    // add to waitlist
    const position = (waitlist.get(code) || 0) + 1;
    waitlist.set(code, position);
    toast(`${code} is full — joined waitlist (#${position})`);
    pushNotification(`Waitlist update: ${code} → position #${position}`);
    renderAll();
  }
}

function dropCourse(code) {
  const idx = enrolled.indexOf(code);
  if (idx === -1) { toast(`${code} is not in plan`); return; }
  enrolled.splice(idx, 1);
  // free seat
  const c = courseCatalog[code];
  if (c) c.seats += 1;
  toast(`Dropped ${code} • ${c ? c.seats : 0} seats open`);
  pushNotification(`Dropped-course confirmation: ${code}.`);
  renderAll();
}

function showDetails(code) {
  const c = courseCatalog[code];
  if (!c) return;
  const msg = `${c.code} — ${c.title}
Credits: ${c.credits}
Instructor: ${c.instructor}
Location: ${c.location}
Seats: ${c.seats}
Prereqs: ${(c.prereqs && c.prereqs.length) ? c.prereqs.join(", ") : "None"}
Times:
${c.sessions.map(s => `• ${["","Mon","Tue","Wed","Thu","Fri"][s.day]} ${hoursToLabel(s.start)}–${hoursToLabel(s.end)}`).join("\n")}`;
  alert(msg);
}

/* Demo: simulate a seat opening for a waitlisted course */
function simulateSeatOpen(code, delayMs=8000) {
  setTimeout(() => {
    const c = courseCatalog[code];
    if (!c) return;
    c.seats += 1;
    const current = waitlist.get(code);
    if (current && current > 0) {
      waitlist.set(code, current-1);
      pushNotification(`Seat opened for ${code}! Your waitlist is now #${current-1}.`);
      toast(`Seat opened for ${code}!`);
    }
    renderAll();
  }, delayMs);
}

/* ===================== Wire Up UI ===================== */
// Tabs
$$(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    $$(".tab").forEach(b => b.classList.remove("active"));
    $$(".tab-panel").forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
  });
});

// Modal
const modal = $("#addDropModal");
$("#openModalBtn").addEventListener("click", () => {
  $("#courseCode").value = "";
  $("#courseAction").value = "add";
  $("#courseHint").textContent = "Type a course code like CSI 2300, MTH 1554, PHY 1510, WRT 1060, BIO 1200.";
  modal.showModal();
});
$('#addDropModal .btn.icon').addEventListener("click", () => modal.close());
$("#submitAddDrop").addEventListener("click", (e) => {
  e.preventDefault();
  const code = $("#courseCode").value.trim();
  const action = $("#courseAction").value;
  if (!code) { toast("Please enter a course code."); return; }
  if (action === "add") addCourse(code);
  else dropCourse(code);
  modal.close();
});

// Search
$("#search").addEventListener("input", () => renderClassGrid());

// Notifications (mark read)
$("#notifList").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-dismiss]");
  if (!btn) return;
  const li = document.querySelector(`li[data-id="${btn.dataset.dismiss}"]`);
  if (!li) return;
  li.style.opacity = 0.5;
  li.style.textDecoration = "line-through";
  btn.remove();
});

// Initial paint
renderAll();

/* ===================== Demo Reminders / Deadlines ===================== */
// Registration reminder (demo): fires after 6s
setTimeout(() => {
  pushNotification("Reminder: Registration window opens soon. Review your plan.");
  toast("Registration reminder posted to Notifications.");
}, 6000);

// Simulate a seat opening for a waitlisted class (MTH 1554) after 12s
simulateSeatOpen("MTH 1554", 12000);
