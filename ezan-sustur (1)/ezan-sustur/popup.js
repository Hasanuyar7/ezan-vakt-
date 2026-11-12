const $ = (id) => document.getElementById(id);
const NS = "http://www.w3.org/2000/svg";
const NAMES = { Fajr: "Sabah", Dhuhr: "Öğle", Asr: "İkindi", Maghrib: "Akşam", Isha: "Yatsı" };
const KEYS = Object.keys(NAMES);
const DEFAULTS = {
  enabled: true, city: "Istanbul", country: "Turkey", method: 13, resume: true, duration: 5,
  prayers: { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true }
};

let settings = { ...DEFAULTS };
let local = {};
let times = null;      // [{key, at}] bugünün vakitleri
let targetFrac = 0;
let animating = true;
let introStarted = false;

const pad = (n) => String(n).padStart(2, "0");
const fmt = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
function parse(str, dayOffset = 0) {
  const [h, m] = str.slice(0, 5).split(":").map(Number);
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return d;
}
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/* ---------- durum mesajı ---------- */
let statusTimer;
function setStatus(text, kind = "", ms = 0) {
  clearTimeout(statusTimer);
  const el = $("status");
  el.textContent = text;
  el.className = kind;
  el.dataset.kind = kind || (text ? "info" : "");
  if (ms) statusTimer = setTimeout(() => { el.textContent = ""; el.className = ""; el.dataset.kind = ""; }, ms);
}
function showLocalStatus() {
  if (local.lastError === "city") {
    setStatus("Şehir bulunamadı. İngilizce harflerle yaz, örneğin Iskenderun.", "err");
  } else if (local.lastError === "network") {
    setStatus("Vakitler alınamadı. İnternet bağlantını kontrol et.", "err");
  } else if ($("status").dataset.kind === "err" || $("status").dataset.kind === "wait") {
    setStatus(settings.enabled ? "Vakitler güncellendi" : "", "", 1600);
  }
}

/* ---------- yay ---------- */
const arcPoint = (f) => ({
  x: 150 - 130 * Math.cos(Math.PI * f),
  y: 108 - 90 * Math.sin(Math.PI * f)
});
function place(f) {
  const p = arcPoint(f);
  const sun = $("sun");
  sun.setAttribute("cx", p.x.toFixed(2));
  sun.setAttribute("cy", p.y.toFixed(2));
  $("arc-done").style.strokeDasharray = `${f} 2`;
}
function intro() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    animating = false; place(targetFrac); return;
  }
  const t0 = performance.now();
  const step = (t) => {
    const p = Math.min(1, (t - t0) / 1000);
    place(targetFrac * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
    else { animating = false; place(targetFrac); }
  };
  requestAnimationFrame(step);
}

/* ---------- liste ---------- */
function buildRows() {
  const ul = $("list");
  ul.replaceChildren();
  KEYS.forEach((k) => {
    const li = document.createElement("li");
    li.dataset.key = k;

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = NAMES[k];

    const time = document.createElement("span");
    time.className = "time";
    time.textContent = "–:–";

    const sw = document.createElement("label");
    sw.className = "switch";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.setAttribute("role", "switch");
    input.setAttribute("aria-label", `${NAMES[k]} vaktinde duraklat`);
    input.checked = settings.prayers[k];
    input.addEventListener("change", () => { settings.prayers[k] = input.checked; queueSave(); });
    const track = document.createElement("span");
    track.className = "track";
    sw.append(input, track);

    li.append(name, time, sw);
    ul.append(li);
  });
}

function applyTimings() {
  const t = local.lastTimings;
  const dots = $("dots");
  dots.replaceChildren();
  if (!t) { times = null; return; }
  times = KEYS.map((k) => ({ key: k, at: parse(t[k]) }));
  const first = times[0].at, last = times[4].at;
  times.forEach(({ key, at }) => {
    $("list").querySelector(`[data-key="${key}"] .time`).textContent = fmt(at);
    const f = Math.min(1, Math.max(0, (at - first) / (last - first)));
    const p = arcPoint(f);
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("class", "dot");
    c.setAttribute("r", "4");
    c.setAttribute("cx", p.x.toFixed(2));
    c.setAttribute("cy", p.y.toFixed(2));
    c.dataset.key = key;
    dots.append(c);
  });
  tick();
}

/* ---------- geri sayım ---------- */
function setCount(str) {
  const el = $("count");
  if (el.dataset.v === str) return;
  el.dataset.v = str;
  el.replaceChildren(...[...str].map((ch) => {
    const s = document.createElement("span");
    s.className = ch === ":" ? "c" : "d";
    s.textContent = ch;
    return s;
  }));
}

function tick() {
  if (!times) {
    setCount("--:--:--");
    $("next").textContent = "Şehrini yazınca vakitler gelir.";
    return;
  }
  const now = new Date();
  let next = times.find((t) => t.at > now);
  let tomorrow = false;
  if (!next) {
    next = { key: "Fajr", at: parse(local.lastTimings.Fajr, 1) };
    tomorrow = true;
  }
  const s = Math.floor(Math.max(0, next.at - now) / 1000);
  setCount(`${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`);
  const label = tomorrow ? `Yarın ${NAMES[next.key].toLocaleLowerCase("tr")}` : NAMES[next.key];
  $("next").textContent = `${label} vaktine kalan süre`;

  times.forEach(({ key, at }) => {
    const past = at <= now;
    const isNext = !tomorrow && key === next.key;
    const li = $("list").querySelector(`[data-key="${key}"]`);
    li.classList.toggle("past", past);
    li.classList.toggle("next", isNext);
    const dot = $("dots").querySelector(`[data-key="${key}"]`);
    if (dot) {
      dot.classList.toggle("past", past);
      dot.classList.toggle("next", isNext);
    }
  });

  const first = times[0].at, last = times[4].at;
  targetFrac = Math.min(1, Math.max(0, (now - first) / (last - first)));
  $("sun").classList.toggle("night", now < first || now > last);
  if (!introStarted) { introStarted = true; intro(); }
  else if (!animating) place(targetFrac);
}

/* ---------- kaydetme ---------- */
let saveTimer;
function queueSave(delay = 0) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, delay);
}
async function save() {
  await chrome.storage.sync.set({
    enabled: settings.enabled,
    city: settings.city,
    country: settings.country,
    resume: settings.resume,
    duration: settings.duration,
    prayers: settings.prayers
  });
  chrome.runtime.sendMessage({ type: "reschedule" });
  setStatus("Kaydedildi", "", 1600);
}

function renderSettings() {
  $("enabled").checked = settings.enabled;
  $("body").inert = !settings.enabled;
  $("city").value = settings.city;
  $("country").value = settings.country;
  $("resume").checked = settings.resume;
  $("durationLine").hidden = !settings.resume;
  $("duration").textContent = `${settings.duration} dk`;
}

function bind() {
  $("enabled").addEventListener("change", (e) => {
    settings.enabled = e.target.checked;
    $("body").inert = !settings.enabled;
    queueSave();
  });
  const place_ = (key) => (e) => {
    settings[key] = e.target.value.trim();
    setStatus("Vakitler getiriliyor…", "wait");
    queueSave(700);
  };
  $("city").addEventListener("input", place_("city"));
  $("country").addEventListener("input", place_("country"));
  $("resume").addEventListener("change", (e) => {
    settings.resume = e.target.checked;
    $("durationLine").hidden = !settings.resume;
    queueSave();
  });
  const bump = (n) => () => {
    settings.duration = Math.min(30, Math.max(1, settings.duration + n));
    $("duration").textContent = `${settings.duration} dk`;
    queueSave(400);
  };
  $("dec").addEventListener("click", bump(-1));
  $("inc").addEventListener("click", bump(1));
  $("test").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "test" });
    setStatus("Çalan medya duraklatıldı", "", 1800);
  });
  $("testResume").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "test-resume" });
    setStatus("Devam ettirildi", "", 1800);
  });
}

/* ---------- başlangıç ---------- */
async function init() {
  settings = await chrome.storage.sync.get(DEFAULTS);
  local = await chrome.storage.local.get(null);
  buildRows();
  renderSettings();
  bind();
  applyTimings();
  showLocalStatus();
  setInterval(tick, 1000);

  if (settings.enabled && (local.lastDate !== todayKey() || !local.lastTimings)) {
    setStatus("Vakitler getiriliyor…", "wait");
    chrome.runtime.sendMessage({ type: "reschedule" });
  }
}

chrome.storage.onChanged.addListener(async (_, area) => {
  if (area !== "local") return;
  local = await chrome.storage.local.get(null);
  applyTimings();
  showLocalStatus();
});

init();
