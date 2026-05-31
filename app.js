/* =========================================================
   우리 아이 칭찬 스티커판 (+ 달력)
   - 데이터는 브라우저 localStorage에 자동 저장됩니다.
   - 두 아이(유니=다윤, 리니=세린)를 따로 관리합니다.
   - 날짜별로 도장을 기록하고, 지난 날짜도 눌러서 수정할 수 있어요.
   ========================================================= */

// 칭찬 항목 정의 (이모지 + 이름)
const TASKS = [
  { id: "homework",   emoji: "📚", name: "숙제 잘하기" },
  { id: "wash",       emoji: "🛁", name: "잘 씻기" },
  { id: "eat",        emoji: "🍚", name: "밥 잘 먹기" },
  { id: "wakeup",     emoji: "⏰", name: "잘 일어나기" },
  { id: "grandpa",    emoji: "👵", name: "할머니·할아버지 말씀 잘 듣기" },
  { id: "hajji",      emoji: "🏡", name: "하지집 할머니 말씀 잘 듣기" },
  { id: "parents",    emoji: "👪", name: "엄마·아빠 말씀 잘 듣기" },
  { id: "brush",      emoji: "🦷", name: "양치 잘하기" },
];

// 보상으로 주는 동물 스티커 (순서대로 지급, 다 쓰면 다시 처음부터)
const ANIMALS = ["🐶","🐱","🐰","🐻","🐼","🦁","🐯","🦊","🐨","🐸","🐵","🐷","🐔","🐧","🦄","🐢","🐬","🦋","🐝","🐳"];

// 아이 정보
const KIDS = {
  yuni: { id: "yuni", title: "유니의 칭찬스티커판", praise: "유니 참 잘했어요!" },
  rini: { id: "rini", title: "리니의 칭찬스티커판", praise: "리니 참 잘했어요!" },
};

const WEEK = ["일","월","화","수","목","금","토"];
const STORAGE_KEY = "praiseBoard.v2";
const OLD_KEY = "praiseBoard.v1";

/* ---------- 날짜 도우미 (한국 현지 날짜 기준) ---------- */
const pad = (n) => String(n).padStart(2, "0");
function ymd(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function todayKey() { return ymd(new Date()); }
function parseKey(key) { const [y, m, dd] = key.split("-").map(Number); return new Date(y, m - 1, dd); }
function krDateLabel(key) {
  const d = parseKey(key);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEK[d.getDay()]})`;
}

/* ---------- 상태 ---------- */
function defaultKidState() {
  return {
    perAnimal: 10,   // 동물 스티커 1개에 필요한 도장 수
    daily: {},       // "YYYY-MM-DD" -> { taskId: count, ... }
  };
}

function migrateFromV1() {
  try {
    const raw = localStorage.getItem(OLD_KEY);
    if (!raw) return null;
    const old = JSON.parse(raw);
    const fresh = { current: old.current || "yuni", kids: { yuni: defaultKidState(), rini: defaultKidState() } };
    ["yuni", "rini"].forEach((k) => {
      const o = old.kids && old.kids[k];
      if (o) {
        fresh.kids[k].perAnimal = o.perAnimal || 10;
        // 이전 누적 기록은 오늘 날짜 한 칸으로 옮겨 보존
        if (o.taskCounts && Object.keys(o.taskCounts).length) {
          fresh.kids[k].daily[todayKey()] = Object.assign({}, o.taskCounts);
        }
      }
    });
    return fresh;
  } catch (e) { return null; }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* 무시 */ }
  const migrated = migrateFromV1();
  if (migrated) return migrated;
  return { current: "yuni", kids: { yuni: defaultKidState(), rini: defaultKidState() } };
}

function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

let state = loadState();
// 안전장치: 누락 필드 채우기
["yuni", "rini"].forEach((k) => {
  state.kids[k] = Object.assign(defaultKidState(), state.kids[k] || {});
  if (!state.kids[k].daily) state.kids[k].daily = {};
});

// 화면용 임시 상태 (저장 안 함)
let selectedDate = todayKey();
let viewYear, viewMonth; // 달력에서 보고 있는 연/월
(function initView() { const d = parseKey(selectedDate); viewYear = d.getFullYear(); viewMonth = d.getMonth(); })();

/* ---------- 계산 도우미 ---------- */
function kid() { return state.kids[state.current]; }
function dayTotal(k, key) {
  const day = k.daily[key];
  if (!day) return 0;
  return Object.values(day).reduce((a, b) => a + b, 0);
}
function totalStamps(k) {
  return Object.keys(k.daily).reduce((sum, key) => sum + dayTotal(k, key), 0);
}
function animalsOf(k) {
  const n = Math.floor(totalStamps(k) / k.perAnimal);
  const list = [];
  for (let i = 0; i < n; i++) list.push(ANIMALS[i % ANIMALS.length]);
  return list;
}

/* ---------- DOM 참조 ---------- */
const el = (id) => document.getElementById(id);
const boardTitle     = el("boardTitle");
const stampCountEl   = el("stampCount");
const animalCountEl  = el("animalCount");
const goalTextEl     = el("goalText");
const progressBar    = el("progressBar");
const taskGrid       = el("taskGrid");
const stampBoard     = el("stampBoard");
const animalShelf    = el("animalShelf");
const boardSubtitle  = el("boardSubtitle");
const perAnimalEl    = el("perAnimal");
const perAnimalInput = el("perAnimalInput");
const calTitle       = el("calTitle");
const calGrid        = el("calGrid");
const monthSummary   = el("monthSummary");
const selectedDateLabel = el("selectedDateLabel");

/* ---------- 렌더링 ---------- */
function render() {
  const k = kid();
  const info = KIDS[state.current];
  const total = totalStamps(k);
  const animals = animalsOf(k);

  // 테마 & 탭
  document.body.classList.toggle("theme-rini", state.current === "rini");
  document.querySelectorAll(".kid-tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.kid === state.current);
  });

  // 제목 & 요약
  boardTitle.textContent = info.title;
  stampCountEl.textContent = total;
  animalCountEl.textContent = animals.length;
  perAnimalEl.textContent = k.perAnimal;
  perAnimalInput.value = k.perAnimal;

  const inBoard = total % k.perAnimal;
  const remain = inBoard === 0 ? k.perAnimal : k.perAnimal - inBoard;
  goalTextEl.textContent = total === 0
    ? `동물 스티커까지 ${k.perAnimal}개 남았어요!`
    : `동물 스티커까지 ${remain}개 남았어요!`;
  progressBar.style.width = (inBoard / k.perAnimal * 100) + "%";
  boardSubtitle.textContent = `(${inBoard} / ${k.perAnimal})`;

  selectedDateLabel.textContent = selectedDate === todayKey() ? "오늘" : krDateLabel(selectedDate);

  renderCalendar(k);
  renderTasks(k);
  renderStampBoard(k, total);
  renderAnimals(animals);
}

function renderCalendar(k) {
  calTitle.textContent = `${viewYear}년 ${viewMonth + 1}월`;
  calGrid.innerHTML = "";

  const first = new Date(viewYear, viewMonth, 1);
  const startDay = first.getDay();              // 0(일)~6(토)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const tKey = todayKey();

  // 앞쪽 빈 칸
  for (let i = 0; i < startDay; i++) {
    const blank = document.createElement("div");
    blank.className = "cal-cell blank";
    calGrid.appendChild(blank);
  }

  let monthCount = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`;
    const count = dayTotal(k, key);
    monthCount += count;
    const dow = new Date(viewYear, viewMonth, d).getDay();

    const cell = document.createElement("button");
    cell.className = "cal-cell";
    if (dow === 0) cell.classList.add("sun");
    if (dow === 6) cell.classList.add("sat");
    if (key === tKey) cell.classList.add("today");
    if (key === selectedDate) cell.classList.add("selected");

    cell.innerHTML = `
      <span class="cal-day">${d}</span>
      ${count > 0 ? `<span class="cal-stamp">⭐<b>${count}</b></span>` : `<span class="cal-stamp empty"></span>`}`;

    cell.addEventListener("click", () => {
      selectedDate = key;
      render();
      // 도장 주기 패널로 부드럽게 이동
      document.getElementById("taskGrid").scrollIntoView({ behavior: "smooth", block: "center" });
    });
    calGrid.appendChild(cell);
  }

  monthSummary.textContent = `이번 달 도장 ${monthCount}개`;
}

function renderTasks(k) {
  taskGrid.innerHTML = "";
  const day = k.daily[selectedDate] || {};
  TASKS.forEach((task) => {
    const btn = document.createElement("button");
    btn.className = "task-btn";
    const count = day[task.id] || 0;
    btn.innerHTML = `
      ${count > 0 ? `<span class="task-count">${count}</span>` : ""}
      <span class="task-emoji">${task.emoji}</span>
      <span class="task-name">${task.name}</span>`;
    btn.addEventListener("click", () => addStamp(task));
    btn.addEventListener("contextmenu", (e) => { e.preventDefault(); removeStamp(task); });
    let pressTimer = null;
    btn.addEventListener("touchstart", () => {
      pressTimer = setTimeout(() => removeStamp(task), 700);
    }, { passive: true });
    btn.addEventListener("touchend", () => clearTimeout(pressTimer));
    taskGrid.appendChild(btn);
  });
}

function renderStampBoard(k, total) {
  stampBoard.innerHTML = "";
  const inBoard = total % k.perAnimal;
  for (let i = 0; i < k.perAnimal; i++) {
    const cell = document.createElement("div");
    cell.className = "stamp-cell" + (i < inBoard ? " filled" : "");
    cell.textContent = i < inBoard ? "⭐" : (i + 1);
    stampBoard.appendChild(cell);
  }
}

function renderAnimals(animals) {
  animalShelf.innerHTML = "";
  if (animals.length === 0) {
    animalShelf.innerHTML = `<div class="empty-note">아직 받은 동물 스티커가 없어요. 도장을 모아보세요! 🐾</div>`;
    return;
  }
  animals.forEach((a) => {
    const s = document.createElement("div");
    s.className = "animal-sticker";
    s.textContent = a;
    animalShelf.appendChild(s);
  });
}

/* ---------- 도장 추가 / 빼기 ---------- */
function addStamp(task) {
  const k = kid();
  const before = Math.floor(totalStamps(k) / k.perAnimal);

  if (!k.daily[selectedDate]) k.daily[selectedDate] = {};
  k.daily[selectedDate][task.id] = (k.daily[selectedDate][task.id] || 0) + 1;

  const after = Math.floor(totalStamps(k) / k.perAnimal);
  saveState();
  render();

  if (after > before) {
    const animal = ANIMALS[(after - 1) % ANIMALS.length];
    celebrate(animal, true);
  } else {
    celebrate(task.emoji, false);
  }
}

function removeStamp(task) {
  const k = kid();
  const day = k.daily[selectedDate];
  if (!day || !day[task.id]) return;
  day[task.id] -= 1;
  if (day[task.id] <= 0) delete day[task.id];
  if (Object.keys(day).length === 0) delete k.daily[selectedDate];
  saveState();
  render();
}

/* ---------- 축하 팝업 ---------- */
const celebrateEl = el("celebrate");
const celebrateEmoji = el("celebrateEmoji");
const celebrateText = el("celebrateText");
let celebrateTimer = null;

function celebrate(emoji, isReward) {
  const info = KIDS[state.current];
  celebrateEmoji.textContent = isReward ? "🎁" : emoji;
  celebrateText.textContent = isReward
    ? `${info.praise}\n새 동물 친구 ${emoji} 를 받았어요!`
    : info.praise;
  celebrateText.style.whiteSpace = "pre-line";
  celebrateEl.hidden = false;
  clearTimeout(celebrateTimer);
  if (!isReward) celebrateTimer = setTimeout(() => { celebrateEl.hidden = true; }, 1200);
}

el("celebrateClose").addEventListener("click", () => { celebrateEl.hidden = true; });
celebrateEl.addEventListener("click", (e) => { if (e.target === celebrateEl) celebrateEl.hidden = true; });

/* ---------- 달력 이동 ---------- */
function shiftMonth(delta) {
  viewMonth += delta;
  if (viewMonth < 0) { viewMonth = 11; viewYear -= 1; }
  if (viewMonth > 11) { viewMonth = 0; viewYear += 1; }
  render();
}
el("prevMonth").addEventListener("click", () => shiftMonth(-1));
el("nextMonth").addEventListener("click", () => shiftMonth(1));
el("todayBtn").addEventListener("click", () => {
  selectedDate = todayKey();
  const d = parseKey(selectedDate);
  viewYear = d.getFullYear(); viewMonth = d.getMonth();
  render();
});

/* ---------- 탭 전환 ---------- */
document.querySelectorAll(".kid-tab").forEach((t) => {
  t.addEventListener("click", () => {
    state.current = t.dataset.kid;
    saveState();
    render();
  });
});

/* ---------- 설정 ---------- */
el("saveSettings").addEventListener("click", () => {
  const v = parseInt(perAnimalInput.value, 10);
  if (!isNaN(v) && v >= 1 && v <= 50) {
    kid().perAnimal = v;
    saveState();
    render();
  }
});

el("resetKid").addEventListener("click", () => {
  const info = KIDS[state.current];
  if (confirm(`${info.title}의 달력 기록을 모두 지울까요?\n(되돌릴 수 없어요.)`)) {
    kid().daily = {};
    saveState();
    render();
  }
});

/* ---------- 시작 ---------- */
render();
