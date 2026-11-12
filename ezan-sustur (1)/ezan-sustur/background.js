const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const DEFAULTS = {
  enabled: true,
  city: "Istanbul",
  country: "Turkey",
  method: 13, // 13 = Diyanet İşleri Başkanlığı
  resume: true,
  duration: 5, // dakika
  prayers: { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true }
};

async function getSettings() {
  return await chrome.storage.sync.get(DEFAULTS);
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// Sayfadaki çalan medyayı duraklatır ve işaretler
function pauseMedia() {
  document.querySelectorAll("video, audio").forEach((m) => {
    if (!m.paused && !m.ended) {
      m.pause();
      m.dataset.ezanPaused = "1";
    }
  });
}

// Sadece bizim durdurduğumuz medyayı devam ettirir
function resumeMedia() {
  document.querySelectorAll("[data-ezan-paused='1']").forEach((m) => {
    delete m.dataset.ezanPaused;
    m.play().catch(() => {});
  });
}

async function runInAllTabs(func) {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (!tab.id || !/^https?:/.test(tab.url || "")) continue;
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        func
      });
    } catch (e) { /* erişilemeyen sekmeyi atla */ }
  }
}

async function clearPauseAlarms() {
  const all = await chrome.alarms.getAll();
  for (const a of all) {
    if (a.name.startsWith("ezan-pause-")) await chrome.alarms.clear(a.name);
  }
}

async function scheduleAlarms() {
  const s = await getSettings();
  if (!s.enabled) {
    await clearPauseAlarms();
    return;
  }
  const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(s.city)}&country=${encodeURIComponent(s.country)}&method=${s.method}`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    if (!res.ok || !json.data || !json.data.timings) throw new Error("not-found");
    const timings = json.data.timings;

    await clearPauseAlarms();
    const now = Date.now();
    for (const p of PRAYERS) {
      if (!s.prayers[p]) continue;
      const [h, m] = timings[p].slice(0, 5).split(":").map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      if (d.getTime() > now) {
        chrome.alarms.create(`ezan-pause-${p}`, { when: d.getTime() });
      }
    }
    await chrome.storage.local.set({
      lastTimings: timings,
      lastUpdate: now,
      lastDate: todayKey(),
      lastError: null
    });
  } catch (e) {
    await chrome.storage.local.set({
      lastError: e.message === "not-found" ? "city" : "network",
      lastUpdate: Date.now()
    });
  }
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "ezan-refresh") {
    scheduleAlarms();
  } else if (alarm.name.startsWith("ezan-pause-")) {
    const s = await getSettings();
    if (!s.enabled) return;
    await runInAllTabs(pauseMedia);
    if (s.resume) {
      chrome.alarms.create("ezan-resume", { delayInMinutes: Math.max(1, s.duration) });
    }
  } else if (alarm.name === "ezan-resume") {
    await runInAllTabs(resumeMedia);
  }
});

function init() {
  chrome.alarms.create("ezan-refresh", { periodInMinutes: 360 });
  scheduleAlarms();
}

chrome.runtime.onInstalled.addListener(init);
chrome.runtime.onStartup.addListener(init);

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "reschedule") scheduleAlarms();
  if (msg.type === "test") runInAllTabs(pauseMedia);
  if (msg.type === "test-resume") runInAllTabs(resumeMedia);
});
