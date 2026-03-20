'use strict';

// ===== State =====
const state = {
  airports: [],
  recordings: [],
  currentTab: 'live',
  currentRecording: null,
};

// ===== DOM helpers =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ===== Tab navigation =====
function initTabs() {
  $$('.nav-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      $$('.nav-tab').forEach((t) => t.classList.remove('active'));
      $$('section[data-tab]').forEach((s) => s.classList.remove('active'));
      tab.classList.add('active');
      $(`section[data-tab="${target}"]`).classList.add('active');
      state.currentTab = target;
    });
  });
}

// ===== Load data =====
async function loadData() {
  const [airportsRes, recordingsRes] = await Promise.all([
    fetch('data/airports.json'),
    fetch('data/recordings.json'),
  ]);
  state.airports = (await airportsRes.json()).airports;
  state.recordings = (await recordingsRes.json()).recordings;
}

// ===== Render airports =====
function renderAirports(airports) {
  const grid = $('#airport-grid');
  if (!airports.length) {
    grid.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:32px">見つかりませんでした</p>';
    return;
  }

  grid.innerHTML = airports
    .map(
      (ap) => `
    <div class="airport-card">
      <div class="airport-card-header">
        <div>
          <div class="airport-iata">${ap.iata}</div>
          <div class="airport-icao">${ap.icao}</div>
        </div>
        <div class="airport-location">${ap.location}</div>
      </div>
      <div class="airport-name">${ap.name}</div>
      <ul class="feed-list">
        ${ap.feeds
          .map(
            (feed) => `
          <li class="feed-item">
            <div class="feed-info">
              <div class="feed-name">${feed.name}</div>
              <div class="feed-freq">${feed.freq}</div>
            </div>
            <a class="btn-live" href="${feed.liveatc_url}" target="_blank" rel="noopener noreferrer">
              <span class="live-dot"></span>LIVE
            </a>
          </li>
        `
          )
          .join('')}
      </ul>
    </div>
  `
    )
    .join('');
}

// ===== Search airports =====
function initSearch() {
  const input = $('#airport-search');
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    if (!q) {
      renderAirports(state.airports);
      return;
    }
    const filtered = state.airports.filter(
      (ap) =>
        ap.name.includes(q) ||
        ap.iata.toLowerCase().includes(q) ||
        ap.icao.toLowerCase().includes(q) ||
        ap.location.includes(q) ||
        ap.name_en.toLowerCase().includes(q)
    );
    renderAirports(filtered);
  });
}

// ===== Render recordings =====
function renderRecordings() {
  const list = $('#recordings-list');
  if (!state.recordings.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div style="font-size:2.5rem">&#127911;</div>
        <p>まだ録音がありません。<br>Google Colab で録音をアップロードしてください。</p>
      </div>`;
    return;
  }

  list.innerHTML = state.recordings
    .map(
      (rec) => `
    <div class="recording-card" data-id="${rec.id}" onclick="playRecording('${rec.id}')">
      <div class="play-icon" id="play-icon-${rec.id}">&#9654;</div>
      <div class="recording-info">
        <div class="recording-title">${rec.description}</div>
        <div class="recording-meta">${rec.airport} / ${rec.feed} &nbsp;|&nbsp; ${rec.date} ${rec.time} &nbsp;|&nbsp; ${formatDuration(rec.duration)}</div>
      </div>
      <div class="recording-badge">${rec.airport}</div>
    </div>
  `
    )
    .join('');
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ===== Audio player =====
function playRecording(id) {
  const rec = state.recordings.find((r) => r.id === id);
  if (!rec) return;

  // Reset previous
  if (state.currentRecording) {
    const prev = $(`#play-icon-${state.currentRecording}`);
    const prevCard = $(`.recording-card[data-id="${state.currentRecording}"]`);
    if (prev) prev.innerHTML = '&#9654;';
    if (prevCard) prevCard.classList.remove('playing');
  }

  state.currentRecording = id;
  const audio = $('#audio-player');
  audio.src = `audio/${rec.filename}`;
  audio.play();

  // Update UI
  const icon = $(`#play-icon-${id}`);
  const card = $(`.recording-card[data-id="${id}"]`);
  if (icon) icon.innerHTML = '&#9646;&#9646;';
  if (card) card.classList.add('playing');

  // Player bar
  const bar = $('#player-bar');
  bar.classList.remove('hidden');
  $('#now-playing-title').textContent = rec.description;
  $('#now-playing-sub').textContent = `${rec.airport} / ${rec.feed} | ${rec.date} ${rec.time}`;

  audio.onended = () => {
    if (icon) icon.innerHTML = '&#9654;';
    if (card) card.classList.remove('playing');
    state.currentRecording = null;
  };
}

// ===== Init =====
async function init() {
  initTabs();

  try {
    await loadData();
  } catch (e) {
    console.error('データ読み込みエラー:', e);
    return;
  }

  renderAirports(state.airports);
  renderRecordings();
  initSearch();

  // Hide player bar initially
  $('#player-bar').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', init);
