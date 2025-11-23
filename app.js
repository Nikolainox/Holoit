/* ------------------------------------------------------
   HOLOFIT 90 • Hologram Journey + Fat-Burn Engine
   + Fast Mission (offline "AI")
------------------------------------------------------ */

const STORAGE_KEY = "holofitAvatarV2_BurnEngine_Mission";

/*
  BODY_PARTS:
  - label: nimi UI:lle
  - growthKey: mihin avatarin osaan vaikuttaa
  - factor: lihasryhmän kulutuskertoimen (fat-burn)
  - isMajor: vaikuttaako StressFactorin laskentaan
*/
const BODY_PARTS = {
  biceps:   { label: "Hauis",          growthKey: "arm",     factor: 1.1, isMajor: false },
  triceps:  { label: "Ojentaja",       growthKey: "arm",     factor: 1.1, isMajor: false },
  shoulders:{ label: "Olkapäät",       growthKey: "shoulder",factor: 1.3, isMajor: false },
  chest:    { label: "Rinta",          growthKey: "chest",   factor: 1.6, isMajor: true  },
  back:     { label: "Selkä",          growthKey: "chest",   factor: 1.6, isMajor: true  },
  core:     { label: "Core / Vatsa",   growthKey: "core",    factor: 1.4, isMajor: true  },
  quads:    { label: "Reidet",         growthKey: "thigh",   factor: 2.0, isMajor: true  },
  calves:   { label: "Pohkeet",        growthKey: "calf",    factor: 1.2, isMajor: false },
  cardio:   { label: "Cardio",         growthKey: "thigh",   factor: 2.0, isMajor: true  }
};

/* FAST MISSIONS — offline "AI" presetit */
const MISSIONS = {
  interview: {
    name: "Interview Pump",
    goal: "Ryhti, olkapäälinja, rento itsevarmuus.",
    note: "Noin 5–7 minuuttia, kevyt mutta näkyvä.",
    steps: [
      { part: "shoulders", reps: 30, label: "🫱 2×15 lateral raise -tyyppistä toistoa" },
      { part: "back",      reps: 30, label: "🕺 2×15 lap squeeze / row-motion" },
      { part: "core",      reps: 20, label: "🧍‍♂️ 20 hallittua core twist -toistoa" }
    ]
  },
  stage: {
    name: "Stage / Lava Pump",
    goal: "Rinta + olkapää + core esiin valojen alle.",
    note: "Noin 8–10 minuuttia, selkeä pump.",
    steps: [
      { part: "chest",    reps: 40, label: "🫀 2×20 pushup-tyyppistä sarjaa" },
      { part: "shoulders",reps: 30, label: "🫱 2×15 olkapääpumppia" },
      { part: "core",     reps: 30, label: "🧍‍♂️ 3×10 hitaat crunch / hold -toistot" }
    ]
  },
  photoshoot: {
    name: "Photoshoot Shaper",
    goal: "Yläkropan linjat esiin, ei liikaa uupumusta.",
    note: "Noin 6–8 minuuttia, kontrolloitu pump.",
    steps: [
      { part: "chest",    reps: 30, label: "🫀 3×10 kontrolloitua punnerrusliikettä" },
      { part: "shoulders",reps: 20, label: "🫱 2×10 olkapään nostoja" },
      { part: "back",     reps: 20, label: "🕺 2×10 selkäaktivointia / row-motion" },
      { part: "core",     reps: 20, label: "🧍‍♂️ 20 kiertävää core-työtä" }
    ]
  },
  date: {
    name: "Date Pump",
    goal: "Rento olo, pieni upper body -boost, ei tukkoisuutta.",
    note: "Noin 5 minuuttia, keho hereillä.",
    steps: [
      { part: "chest",    reps: 20, label: "🫀 2×10 kevyt pushup" },
      { part: "shoulders",reps: 20, label: "🫱 2×10 olkapääaktivointi" },
      { part: "cardio",   reps: 40, label: "🏃‍♂️ 40 rytmikästä kävely / step -toistoa" }
    ]
  },
  game: {
    name: "Game Ready",
    goal: "Alavartalo ja core hereille peliä varten.",
    note: "Noin 8 minuuttia, valmis otteluun.",
    steps: [
      { part: "quads",  reps: 40, label: "🦵 2×20 air squat / lunge -toistoa" },
      { part: "cardio", reps: 60, label: "🏃‍♂️ 60 high knees / step-tyyppistä liikettä" },
      { part: "core",   reps: 30, label: "🧍‍♂️ 3×10 core-aktivointia" }
    ]
  },
  fatburn: {
    name: "10 min Shred",
    goal: "Koko kropan rasvanpoltto, korkea burn-score.",
    note: "Noin 10–12 minuuttia, selkeä hiki.",
    steps: [
      { part: "cardio", reps: 80, label: "🏃‍♂️ 2×40 high knees / jumping jack -tyyppistä" },
      { part: "quads",  reps: 40, label: "🦵 2×20 air squat / lunge" },
      { part: "core",   reps: 40, label: "🧍‍♂️ 2×20 core crunch / twist" }
    ]
  }
};

let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
  days: {},
  currentDay: 1,
  lastCompletedDay: null,
  streak: 0
};

/* INIT 1–90 */
for (let i = 1; i <= 90; i++) {
  if (!data.days[i]) {
    data.days[i] = {
      repsByPart: {},
      totalReps: 0,
      pr: false,
      locked: false,
      burnScore: 0
    };
  } else {
    const d = data.days[i];
    if (!d.repsByPart) d.repsByPart = {};
    if (d.totalReps === undefined) d.totalReps = 0;
    if (d.pr === undefined) d.pr = false;
    if (d.locked === undefined) d.locked = false;
    if (d.burnScore === undefined) d.burnScore = 0;
  }
}
if (!data.currentDay || data.currentDay < 1 || data.currentDay > 90) {
  data.currentDay = 1;
}
save();

/* ELEMENTS */
const hudDay = document.getElementById("hud-day");
const hudStreak = document.getElementById("hud-streak");
const hudTotalReps = document.getElementById("hud-total-reps");
const btnReset = document.getElementById("btn-reset");

const avatarEl = document.getElementById("avatar");
const pathStrip = document.getElementById("path-strip");
const pathStripWrapper = document.getElementById("path-strip-wrapper");

const statTodayReps = document.getElementById("stat-today-reps");
const statIntensity = document.getElementById("stat-intensity");
const statPrDays = document.getElementById("stat-pr-days");

const emojiButtons = document.querySelectorAll(".emoji-btn");
const btnFinalize = document.getElementById("btn-finalize");

/* REPS POPUP */
const repsBackdrop = document.getElementById("reps-backdrop");
const repsTitle = document.getElementById("reps-title");
const repsChoices = document.querySelectorAll(".reps-choice");
const repsCustomInput = document.getElementById("reps-custom-input");
const repsCustomBtn = document.getElementById("reps-custom-btn");
const repsCancel = document.getElementById("reps-cancel");

/* DAY INFO */
const dayinfoBackdrop = document.getElementById("dayinfo-backdrop");
const dayinfoTitle = document.getElementById("dayinfo-title");
const dayinfoTotal = document.getElementById("dayinfo-total");
const dayinfoBurn = document.getElementById("dayinfo-burn");
const dayinfoBurnLabel = document.getElementById("dayinfo-burn-label");
const dayinfoBodyparts = document.getElementById("dayinfo-bodyparts");
const dayinfoClose = document.getElementById("dayinfo-close");

/* MISSIONS UI */
const missionButtons = document.querySelectorAll(".mission-btn");
const missionBackdrop = document.getElementById("mission-backdrop");
const missionTitle = document.getElementById("mission-title");
const missionGoal = document.getElementById("mission-goal");
const missionNote = document.getElementById("mission-note");
const missionSteps = document.getElementById("mission-steps");
const missionApply = document.getElementById("mission-apply");
const missionClose = document.getElementById("mission-close");

/* STATE */
let activeRepsPart = null;
let activeMissionKey = null;

/* SAVE */
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* RESET */
btnReset.addEventListener("click", () => {
  const ok = confirm("Reset Holofit 90? Kaikki treenidata poistetaan.");
  if (!ok) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
});

/* BURN ENGINE */

/**
 * Laskee yhden päivän BurnScore:
 * - lihasryhmäkertoimet
 * - StressFactor (useita isoja lihasryhmiä)
 */
function recomputeBurnForDay(dayNum) {
  const d = data.days[dayNum];
  let activationSum = 0;
  const majorSet = new Set();

  for (const [part, reps] of Object.entries(d.repsByPart || {})) {
    const info = BODY_PARTS[part];
    if (!info) continue;
    const factor = info.factor || 1;
    activationSum += reps * factor;
    if (info.isMajor) majorSet.add(part);
  }

  let stressFactor = 1;
  const majorCount = majorSet.size;
  if (majorCount > 1) {
    stressFactor = 1 + (majorCount - 1) * 0.08; // +8% per extra major area
  }

  d.burnScore = Math.round(activationSum * stressFactor);
}

function recomputeBurnForAllDays() {
  for (let i = 1; i <= 90; i++) {
    recomputeBurnForDay(i);
  }
}

/* RENDER PATH */
function renderPath() {
  pathStrip.innerHTML = "";
  let globalMax = 0;
  let prDays = 0;

  for (let i = 1; i <= 90; i++) {
    const d = data.days[i];
    if (d.burnScore > globalMax) globalMax = d.burnScore;
    if (d.pr) prDays++;
  }
  statPrDays.textContent = prDays;

  for (let i = 1; i <= 90; i++) {
    const d = data.days[i];
    const node = document.createElement("div");
    node.className = "path-node";
    node.dataset.day = i;

    let cls = "empty";
    if (d.burnScore > 0 && globalMax > 0) {
      const ratio = d.burnScore / globalMax;
      if (ratio < 0.25) cls = "low";
      else if (ratio < 0.5) cls = "mid";
      else if (ratio < 0.85) cls = "high";
      else cls = "insane";
    }

    node.classList.add(cls);
    if (i === data.currentDay) node.classList.add("current");
    if (d.pr) node.classList.add("pr");

    node.innerHTML = `<div class="path-node-inner"></div>`;
    pathStrip.appendChild(node);
  }
}

/* SCROLL CURRENT DAY INTO VIEW */
function scrollCurrentDayIntoView() {
  const node = pathStrip.querySelector(`.path-node[data-day="${data.currentDay}"]`);
  if (!node) return;
  const rect = node.getBoundingClientRect();
  const wrapperRect = pathStripWrapper.getBoundingClientRect();
  const offset = rect.left - (wrapperRect.left + wrapperRect.width / 2 - rect.width / 2);
  pathStripWrapper.scrollBy({
    left: offset,
    behavior: "smooth"
  });
}

/* HUD + QUICK STATS */
function burnLabel(score) {
  if (!score || score <= 0) return "—";
  if (score < 40) return "Light";
  if (score < 80) return "Solid";
  if (score < 130) return "High Burn";
  return "Savage";
}

function updateHUD() {
  hudDay.textContent = `${data.currentDay} / 90`;
  hudStreak.textContent = data.streak || 0;

  let totalAll = 0;
  for (let i = 1; i <= 90; i++) {
    totalAll += data.days[i].totalReps || 0;
  }
  hudTotalReps.textContent = totalAll;

  const d = data.days[data.currentDay];
  statTodayReps.textContent = d.totalReps || 0;
  statIntensity.textContent = burnLabel(d.burnScore);
}

/* AVATAR GROWTH LOGIC */
function updateAvatar() {
  // Summataan koko seasonin reps per growthKey
  const growth = {
    arm: 0,
    shoulder: 0,
    chest: 0,
    core: 0,
    thigh: 0,
    calf: 0
  };

  for (let i = 1; i <= 90; i++) {
    const d = data.days[i];
    for (const [part, reps] of Object.entries(d.repsByPart || {})) {
      const info = BODY_PARTS[part];
      if (!info) continue;
      const key = info.growthKey;
      growth[key] += reps;
    }
  }

  // Mapataan reps → scale
  function calcScale(totalReps, base, factor, max) {
    if (!totalReps) return base;
    const added = totalReps / factor;
    return Math.min(max, base + added);
  }

  const armScale = calcScale(growth.arm, 1.0, 500, 1.6);
  const shoulderScale = calcScale(growth.shoulder, 1.0, 800, 1.5);
  const chestScale = calcScale(growth.chest, 1.0, 700, 1.7);
  const coreScale = calcScale(growth.core, 1.0, 600, 1.6);
  const thighScale = calcScale(growth.thigh, 1.0, 700, 1.8);
  const calfScale = calcScale(growth.calf, 1.0, 900, 1.6);

  document.documentElement.style.setProperty("--arm-scale", armScale.toFixed(2));
  document.documentElement.style.setProperty("--shoulder-scale", shoulderScale.toFixed(2));
  document.documentElement.style.setProperty("--chest-scale", chestScale.toFixed(2));
  document.documentElement.style.setProperty("--core-scale", coreScale.toFixed(2));
  document.documentElement.style.setProperty("--thigh-scale", thighScale.toFixed(2));
  document.documentElement.style.setProperty("--calf-scale", calfScale.toFixed(2));
}

/* EMOJI INPUT */
emojiButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const part = btn.dataset.part;
    if (!BODY_PARTS[part]) return;
    activeRepsPart = part;
    openRepsModal(part);
  });
});

/* REPS MODAL */
function openRepsModal(part) {
  const info = BODY_PARTS[part];
  repsTitle.textContent = info ? info.label : "Toistot";
  repsCustomInput.value = "";
  repsBackdrop.style.display = "flex";
}
function closeRepsModal() {
  repsBackdrop.style.display = "none";
  activeRepsPart = null;
}

repsBackdrop.addEventListener("click", e => {
  if (e.target === repsBackdrop) closeRepsModal();
});
repsCancel.addEventListener("click", () => {
  closeRepsModal();
});

repsChoices.forEach(btn => {
  btn.addEventListener("click", () => {
    const r = parseInt(btn.dataset.reps, 10);
    if (!activeRepsPart || !r) return;
    addRepsToCurrentDay(activeRepsPart, r);
    closeRepsModal();
  });
});

repsCustomBtn.addEventListener("click", () => {
  const val = parseInt(repsCustomInput.value, 10);
  if (!activeRepsPart || !val || val <= 0) return;
  addRepsToCurrentDay(activeRepsPart, val);
  closeRepsModal();
});

/* ADD REPS */
function addRepsToCurrentDay(part, reps) {
  const d = data.days[data.currentDay];
  if (d.locked) {
    alert("Päivä on jo lukittu (finalized).");
    return;
  }
  d.repsByPart[part] = (d.repsByPart[part] || 0) + reps;
  d.totalReps += reps;

  // Päivitä burn-score tälle päivälle
  recomputeBurnForDay(data.currentDay);

  // PR-check burnin perusteella
  let best = 0;
  for (let i = 1; i <= 90; i++) {
    if (i === data.currentDay) continue;
    const bd = data.days[i];
    if (bd.burnScore > best) best = bd.burnScore;
  }
  d.pr = d.burnScore > best && d.burnScore > 0;

  save();
  updateHUD();
  renderPath();
  updateAvatar();
}

/* FINALIZE DAY */
btnFinalize.addEventListener("click", () => {
  finalizeCurrentDay();
});

function finalizeCurrentDay() {
  const d = data.days[data.currentDay];
  if (d.locked) {
    alert("Päivä on jo finalized.");
    return;
  }

  // Jos ei yhtään reps, ei järkeä finalizea
  if (!d.totalReps) {
    const ok = confirm("Tälle päivälle ei ole yhtään toistoa. Finalize silti?");
    if (!ok) return;
  }

  d.locked = true;

  // STREAK
  if (data.lastCompletedDay === data.currentDay - 1) {
    data.streak = (data.streak || 0) + 1;
  } else {
    data.streak = 1;
  }
  data.lastCompletedDay = data.currentDay;

  // WALK ANIMATION
  avatarEl.classList.add("walking");
  setTimeout(() => avatarEl.classList.remove("walking"), 1200);

  // Siirrytään seuraavaan päivään, jos mahdollista
  if (data.currentDay < 90) {
    data.currentDay++;
  }

  save();
  renderPath();
  updateHUD();
  updateAvatar();
  scrollCurrentDayIntoView();
}

/* DAY INFO MODAL */
pathStrip.addEventListener("click", e => {
  const node = e.target.closest(".path-node");
  if (!node) return;
  const day = parseInt(node.dataset.day, 10);
  openDayInfo(day);
});

function openDayInfo(day) {
  const d = data.days[day];
  dayinfoTitle.textContent = `Day ${day}`;
  dayinfoTotal.textContent = d.totalReps || 0;
  dayinfoBurn.textContent = d.burnScore || 0;
  dayinfoBurnLabel.textContent = burnLabel(d.burnScore);

  dayinfoBodyparts.innerHTML = "";
  const parts = Object.entries(d.repsByPart || {});
  if (!parts.length) {
    const li = document.createElement("li");
    li.textContent = "Ei kirjattuja toistoja.";
    dayinfoBodyparts.appendChild(li);
  } else {
    parts.forEach(([part, reps]) => {
      const info = BODY_PARTS[part];
      const li = document.createElement("li");
      li.textContent = `${info ? info.label : part}: ${reps}`;
      dayinfoBodyparts.appendChild(li);
    });
  }

  dayinfoBackdrop.style.display = "flex";
}

dayinfoBackdrop.addEventListener("click", e => {
  if (e.target === dayinfoBackdrop) dayinfoBackdrop.style.display = "none";
});
dayinfoClose.addEventListener("click", () => {
  dayinfoBackdrop.style.display = "none";
});

/* FAST MISSION MODAL */
missionButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.mission;
    openMission(key);
  });
});

function openMission(key) {
  const mission = MISSIONS[key];
  if (!mission) return;
  activeMissionKey = key;

  missionTitle.textContent = mission.name;
  missionGoal.textContent = mission.goal;
  missionNote.textContent = mission.note;

  missionSteps.innerHTML = "";
  mission.steps.forEach(step => {
    const li = document.createElement("li");
    li.textContent = step.label;
    missionSteps.appendChild(li);
  });

  missionBackdrop.style.display = "flex";
}

function closeMission() {
  missionBackdrop.style.display = "none";
  activeMissionKey = null;
}

missionBackdrop.addEventListener("click", e => {
  if (e.target === missionBackdrop) closeMission();
});
missionClose.addEventListener("click", () => {
  closeMission();
});

missionApply.addEventListener("click", () => {
  if (!activeMissionKey) return;
  const mission = MISSIONS[activeMissionKey];
  if (!mission) return;

  // Lisätään missionin repsit tälle päivälle
  mission.steps.forEach(step => {
    addRepsToCurrentDay(step.part, step.reps);
  });

  closeMission();
});

/* INIT */
recomputeBurnForAllDays();
renderPath();
updateHUD();
updateAvatar();
setTimeout(() => scrollCurrentDayIntoView(), 50);
