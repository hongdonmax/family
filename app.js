/* =========================================================
   우리 아이 칭찬 스티커판
   - 데이터는 브라우저 localStorage에 자동 저장됩니다.
   - 두 아이(유니=다윤, 리니=세린)를 따로 관리합니다.
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

// 보상으로 주는 동물 스티커 (순서대로 지급)
const ANIMALS = ["🐶","🐱","🐰","🐻","🐼","🦁","🐯","🦊","🐨","🐸","🐵","🐷","🐔","🐧","🦄","🐢","🐬","🦋","🐝","🐳"];

// 아이 정보
const KIDS = {
  yuni: { id: "yuni", title: "유니의 칭찬스티커판", praise: "유니 참 잘했어요!" },
  rini: { id: "rini", title: "리니의 칭찬스티커판", praise: "리니 참 잘했어요!" },
};

const STORAGE_KEY = "praiseBoard.v1";

// ---- 상태 불러오기 / 기본값 ----
function defaultKidState() {
  return {
    stamps: 0,            // 현재 도장판에 쌓인 도장 수 (보상 때 리셋)
    totalStamps: 0,       // 누적 도장 수 (참고용)
    animals: [],          // 받은 동물 스티커 이모지 배열
    perAnimal: 10,        // 동물 스티커 1개에 필요한 도장 수
    taskCounts: {},       // 항목별 받은 도장 수
    history: [],          // 최근 기록
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* 무시하고 새로 시작 */ }
  return { current: "yuni", kids: { yuni: defaultKidState(), rini: defaultKidState() } };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();
// 안전장치: 누락 필드 채우기
["yuni","rini"].forEach(k => {
  state.kids[k] = Object.assign(defaultKidState(), state.kids[k] || {});
});

// ---- DOM 참조 ----
const el = (id) => document.getElementById(id);
const boardTitle   = el("boardTitle");
const stampCountEl = el("stampCount");
const animalCountEl= el("animalCount");
const goalTextEl   = el("goalText");
const progressBar  = el("progressBar");
const taskGrid     = el("taskGrid");
const stampBoard   = el("stampBoard");
const animalShelf  = el("animalShelf");
const historyEl    = el("history");
const boardSubtitle= el("boardSubtitle");
const perAnimalEl  = el("perAnimal");
const perAnimalInput = el("perAnimalInput");

// ---- 현재 아이 가져오기 ----
function kid() { return state.kids[state.current]; }

// ---- 렌더링 ----
function render() {
  const k = kid();
  const info = KIDS[state.current];

  // 테마 & 탭
  document.body.classList.toggle("theme-rini", state.current === "rini");
  document.querySelectorAll(".kid-tab").forEach(t => {
    t.classList.toggle("active", t.dataset.kid === state.current);
  });

  // 제목 & 요약
  boardTitle.textContent = info.title;
  stampCountEl.textContent = k.stamps;
  animalCountEl.textContent = k.animals.length;
  perAnimalEl.textContent = k.perAnimal;
  perAnimalInput.value = k.perAnimal;

  const remain = k.perAnimal - (k.stamps % k.perAnimal);
  const remainReal = k.stamps % k.perAnimal === 0 && k.stamps > 0 ? k.perAnimal : remain;
  goalTextEl.textContent = `동물 스티커까지 ${remainReal}개 남았어요!`;
  progressBar.style.width = ((k.stamps % k.perAnimal) / k.perAnimal * 100) + "%";
  boardSubtitle.textContent = `(${k.stamps % k.perAnimal} / ${k.perAnimal})`;

  renderTasks(k);
  renderStampBoard(k);
  renderAnimals(k);
  renderHistory(k);
}

function renderTasks(k) {
  taskGrid.innerHTML = "";
  TASKS.forEach(task => {
    const btn = document.createElement("button");
    btn.className = "task-btn";
    const count = k.taskCounts[task.id] || 0;
    btn.innerHTML = `
      ${count > 0 ? `<span class="task-count">${count}</span>` : ""}
      <span class="task-emoji">${task.emoji}</span>
      <span class="task-name">${task.name}</span>`;
    // 클릭 = 도장 추가
    btn.addEventListener("click", () => addStamp(task));
    // 오른쪽 클릭 / 길게 누르기 = 도장 빼기
    btn.addEventListener("contextmenu", (e) => { e.preventDefault(); removeStamp(task); });
    let pressTimer = null;
    btn.addEventListener("touchstart", () => {
      pressTimer = setTimeout(() => removeStamp(task), 700);
    }, { passive: true });
    btn.addEventListener("touchend", () => clearTimeout(pressTimer));
    taskGrid.appendChild(btn);
  });
}

function renderStampBoard(k) {
  stampBoard.innerHTML = "";
  const inBoard = k.stamps % k.perAnimal;
  for (let i = 0; i < k.perAnimal; i++) {
    const cell = document.createElement("div");
    cell.className = "stamp-cell" + (i < inBoard ? " filled" : "");
    cell.textContent = i < inBoard ? "⭐" : (i + 1);
    stampBoard.appendChild(cell);
  }
}

function renderAnimals(k) {
  animalShelf.innerHTML = "";
  if (k.animals.length === 0) {
    animalShelf.innerHTML = `<div class="empty-note">아직 받은 동물 스티커가 없어요. 도장을 모아보세요! 🐾</div>`;
    return;
  }
  k.animals.forEach(a => {
    const s = document.createElement("div");
    s.className = "animal-sticker";
    s.textContent = a;
    animalShelf.appendChild(s);
  });
}

function renderHistory(k) {
  historyEl.innerHTML = "";
  if (!k.history.length) {
    historyEl.innerHTML = `<li><span>아직 기록이 없어요.</span></li>`;
    return;
  }
  k.history.slice(0, 15).forEach(h => {
    const li = document.createElement("li");
    const label = h.reward
      ? `<span class="reward">🎁 동물 스티커 ${h.reward} 획득!</span>`
      : `<span>${h.emoji} ${h.name} <b>+1</b></span>`;
    li.innerHTML = `${label}<span class="time">${h.time}</span>`;
    historyEl.appendChild(li);
  });
}

// ---- 도장 추가 / 빼기 ----
function nowLabel() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

function addStamp(task) {
  const k = kid();
  k.stamps += 1;
  k.totalStamps += 1;
  k.taskCounts[task.id] = (k.taskCounts[task.id] || 0) + 1;
  k.history.unshift({ emoji: task.emoji, name: task.name, time: nowLabel() });

  // 보상 도달?
  if (k.stamps % k.perAnimal === 0) {
    const animal = ANIMALS[(k.animals.length) % ANIMALS.length];
    k.animals.push(animal);
    k.history.unshift({ reward: animal, time: nowLabel() });
    saveState();
    render();
    celebrate(animal, true);
  } else {
    saveState();
    render();
    celebrate(task.emoji, false);
  }
}

function removeStamp(task) {
  const k = kid();
  if ((k.taskCounts[task.id] || 0) <= 0 && k.stamps <= 0) return;
  if (k.stamps > 0) {
    k.stamps -= 1;
    k.totalStamps = Math.max(0, k.totalStamps - 1);
  }
  if (k.taskCounts[task.id] > 0) k.taskCounts[task.id] -= 1;
  saveState();
  render();
}

// ---- 축하 팝업 ----
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
  // 보상이 아니면 1.2초 후 자동 닫힘
  if (!isReward) {
    celebrateTimer = setTimeout(() => { celebrateEl.hidden = true; }, 1200);
  }
}

el("celebrateClose").addEventListener("click", () => { celebrateEl.hidden = true; });
celebrateEl.addEventListener("click", (e) => { if (e.target === celebrateEl) celebrateEl.hidden = true; });

// ---- 탭 전환 ----
document.querySelectorAll(".kid-tab").forEach(t => {
  t.addEventListener("click", () => {
    state.current = t.dataset.kid;
    saveState();
    render();
  });
});

// ---- 설정 저장 ----
el("saveSettings").addEventListener("click", () => {
  const v = parseInt(perAnimalInput.value, 10);
  if (!isNaN(v) && v >= 1 && v <= 50) {
    kid().perAnimal = v;
    saveState();
    render();
  }
});

// ---- 초기화 ----
el("resetKid").addEventListener("click", () => {
  const info = KIDS[state.current];
  if (confirm(`${info.title}의 도장을 모두 초기화할까요?\n(받은 동물 스티커는 그대로 유지돼요.)`)) {
    const k = kid();
    k.stamps = 0;
    k.taskCounts = {};
    k.history.unshift({ reward: "초기화", time: nowLabel() });
    saveState();
    render();
  }
});

// ---- 시작 ----
render();
