// ═══════════════════════════════════════════════════════════
//  STATE.JS — Game state, progression, save/load, audio
// ═══════════════════════════════════════════════════════════

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = Math.floor(window.innerWidth / 2.0);
canvas.height = Math.floor(window.innerHeight / 2.0);

let W = canvas.width;
let H = canvas.height;
let GROUND_Y = Math.floor(H * 0.74);

const bgImage = new Image();
bgImage.src = 'sprites/Gemini_Generated_Image_jn03bijn03bijn03.png';

window.addEventListener('resize', () => {
  canvas.width = Math.floor(window.innerWidth / 2.0);
  canvas.height = Math.floor(window.innerHeight / 2.0);
  W = canvas.width;
  H = canvas.height;
  GROUND_Y = Math.floor(H * 0.74);
  // ensure player isn't stuck under the new ground
  if (typeof player !== 'undefined' && player.y > GROUND_Y) {
    player.y = GROUND_Y;
  }
});

// ─── Progression (persisted) ──────────────────────────────
let progression = {
  echoes: 0,
  fragments: 0,
  sheetMusic: 0,
  riffs: [],
  weapon: "base_sword",
  levelsCompleted: [],
  bossesDefeated: 0,
  purchasedItems: [],
  devilsBargainCount: 0,
  eternalDamnationPending: false,
  eternalDamnationCompleted: false,
  soundOn: true,
  // Volume for in-game music (BGM). 0..1.
  musicVolume: 0.10
};

function ensurePermanentUnlocks() {
  // Riffs (special attacks) should be locked until a boss is defeated.
  // Migrate old saves that may have had riffs pre-granted.
  if (!progression.bossesDefeated || progression.bossesDefeated < 1) {
    if (progression.riffs?.length) progression.riffs = [];
  }
}

function hasUnlockedRiff() {
  return (progression.bossesDefeated || 0) >= 1 && (progression.riffs?.length || 0) > 0;
}

function loadPersistent() {
  const saved = localStorage.getItem('wp_progression');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Merge with defaults so new fields don't break old saves
      progression = { ...progression, ...parsed };
    } catch(e) { /* ignore corrupt data */ }
  }
  ensurePermanentUnlocks();
}

function savePersistent() {
  localStorage.setItem('wp_progression', JSON.stringify(progression));
}

function resetAllProgression() {
  progression = {
    echoes: 0,
    fragments: 0,
    sheetMusic: 0,
    riffs: [],
    weapon: "base_sword",
    levelsCompleted: [],
    bossesDefeated: 0,
    purchasedItems: [],
    devilsBargainCount: 0,
    eternalDamnationPending: false,
    eternalDamnationCompleted: false,
    soundOn: true,
    musicVolume: 0.10
  };
  ensurePermanentUnlocks();
  savePersistent();
}


function getWeaponData() {
  return WEAPONS.find(w => w.id === progression.weapon) || WEAPONS[0];
}

function checkSheetMusicConversion() {
  if (progression.fragments >= FRAGMENTS_FOR_SHEET_MUSIC) {
    progression.fragments -= FRAGMENTS_FOR_SHEET_MUSIC;
    progression.sheetMusic++;
    savePersistent();
    return true;
  }
  return false;
}

function getShopTier() {
  return Math.min(3, progression.bossesDefeated);
}

function isLevelUnlocked(level) {
  if (dbg.unlockLevels) return true;
  if (!level.unlockRequirement) return true;
  const req = level.unlockRequirement;
  if (req.bossesDefeated && progression.bossesDefeated < req.bossesDefeated) return false;
  if (req.fragments && progression.fragments < req.fragments && progression.sheetMusic < 1) return false;
  if (req.sheetMusic && progression.sheetMusic < req.sheetMusic) return false;
  return true;
}

function canDropFragmentInLevel(levelConfig) {
  const maxF = levelConfig.maxFragments || 0;
  if (maxF <= 0) return false;
  const total = progression.fragments + progression.sheetMusic * FRAGMENTS_FOR_SHEET_MUSIC;
  return total < maxF;
}

// ─── Shop Buff Computation ────────────────────────────────
function getShopBuffs() {
  const buffs = {
    maxHpBonus: 0,
    lightDmgBonus: 0,
    heavyDmgBonus: 0,
    allDmgBonus: 0,
    speedBonus: 0,
    heavyCdReduce: 0,
    dashCdReduce: 0,
    dashDistBonus: 0,
    riffChargeBonus: 0,
    riffKillBonus: 0,
    echoMultiplier: 1,
    dmgReduce: 0
  };
  for (const itemId of progression.purchasedItems) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) continue;
    const b = item.buff;
    switch (b.type) {
      case 'maxHpBonus':    buffs.maxHpBonus += b.value; break;
      case 'lightDmgBonus': buffs.lightDmgBonus += b.value; break;
      case 'heavyDmgBonus': buffs.heavyDmgBonus += b.value; break;
      case 'allDmgBonus':   buffs.allDmgBonus += b.value; break;
      case 'speedBonus':    buffs.speedBonus += b.value; break;
      case 'heavyCdReduce': buffs.heavyCdReduce += b.value; break;
      case 'dashCdReduce':  buffs.dashCdReduce += b.value; break;
      case 'dashDistBonus': buffs.dashDistBonus += b.value; break;
      case 'riffChargeBonus': buffs.riffChargeBonus += b.value; break;
      case 'riffKillBonus': buffs.riffKillBonus += b.value; break;
      case 'echoMultiplier': buffs.echoMultiplier = b.value; break;
      case 'tankBundle':    buffs.maxHpBonus += b.hpBonus; buffs.dmgReduce += b.dmgReduce; break;
    }
  }
  return buffs;
}

// ─── Runtime game state ───────────────────────────────────
let gameScreen = 'home';
let gameRunning = false;
let gamePaused = false;
let currentLevelConfig = null;
let isEternalDamnationRun = false;

let score = 0;
let waveNumber = 0;
let enemiesRemaining = 0;
let waveDelay = 0;
let waveTotalEnemies = 0;
let waveSpawned = 0;
let fragmentsEarnedThisRun = 0;

let enemies = [];
let fireballs = [];
let particles = [];
let afterimages = [];
let platforms = [];

let shakeTimer = 0;
let shakeIntensity = 0;

let darkPowers = [];
let lifestealCounter = 0;

let fragmentWinActive = false;
let fragmentWinTimer = 0;

// Sunrise timer
const SUNRISE_DURATION = 15 * 60 * 1000;
let sunriseStart = 0;
let sunriseElapsed = 0;

// Riff (special attack)
let riffCharge = 0;
let riffActive = false;
let riffBeam = null;

// Debug config
const dbg = {
  gameSpeed: 1.0,
  enemySpeedMult: 1.0,
  playerSpeedMult: 1.0,
  godMode: false,
  unlockLevels: false,
  showCombos: true
};

// ─── Simple Audio System (Web Audio API) ──────────────────
let audioCtx = null;
let musicPlaying = false;
let nextNoteTime = 0;
let noteIndex = 0;

// Optional MP3 BGM playback (per-level tracks)
let bgmSrcOverride = null; // set by game.js before calling playMusic()
let bgmAudioEl = null;
let bgmFadeRaf = null;
let bgmFadeToken = 0;
let bgmTargetVolume = 0.12;

function setLevelBgmSrc(src) {
  bgmSrcOverride = src;
}

function setMusicVolume(volume01) {
  const v = Math.max(0, Math.min(1, volume01));
  progression.musicVolume = v;
  savePersistent();

  // If MP3 BGM is active, update it smoothly.
  if (bgmAudioEl) fadeBgmVolumeTo(v, 300);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function fadeBgmVolumeTo(target, durationMs) {
  if (!bgmAudioEl) return;
  const audio = bgmAudioEl;
  const from = audio.volume;

  bgmFadeToken++;
  const token = bgmFadeToken;
  const start = performance.now();

  const step = (now) => {
    if (token !== bgmFadeToken) return;
    const elapsed = now - start;
    const t = Math.min(1, elapsed / Math.max(1, durationMs));
    const eased = easeInOutCubic(t);
    audio.volume = from + (target - from) * eased;
    if (t < 1) {
      bgmFadeRaf = requestAnimationFrame(step);
    } else {
      bgmFadeRaf = null;
    }
  };

  bgmFadeRaf = requestAnimationFrame(step);
}

function playBgmTrack(src, { volume = 0.12, fadeInMs = 1200, loop = true } = {}) {
  if (!progression.soundOn) return;

  // Stop doom-riff scheduler if it was running.
  musicPlaying = false;

  if (bgmAudioEl) {
    try { bgmAudioEl.pause(); } catch (e) { /* ignore */ }
    bgmAudioEl = null;
  }
  if (bgmFadeRaf) cancelAnimationFrame(bgmFadeRaf);
  bgmFadeRaf = null;

  bgmTargetVolume = volume;
  const audio = new Audio(src);
  audio.loop = loop;
  audio.preload = 'auto';
  audio.volume = 0;
  bgmAudioEl = audio;

  audio.play().catch(() => { /* ignore autoplay/interrupt errors */ });

  // Smoothly ramp up to target.
  fadeBgmVolumeTo(volume, fadeInMs);
}
const doomRiff = [
  41.2, 0, 41.2, 41.2, 0,
  46.25, 0, 46.25, 46.25, 0,
  41.2, 0, 36.71, 0, 49.0, 0
]; // Low E, F, D, G power chords representation

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function scheduleMusic() {
  if (!musicPlaying || !audioCtx) return;
  const vol = progression.musicVolume ?? 0.10;
  while (nextNoteTime < audioCtx.currentTime + 0.1) {
    const freq = doomRiff[noteIndex];
    if (freq > 0) {
      if (vol <= 0.0001) {
        // Still advance timing but skip oscillator creation.
        nextNoteTime += 0.13;
        noteIndex = (noteIndex + 1) % doomRiff.length;
        continue;
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, nextNoteTime);
      filter.frequency.exponentialRampToValueAtTime(80, nextNoteTime + 0.15);
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, nextNoteTime);
      
      // Scale to user-selected music volume.
      const minVol = Math.max(0.001, vol * 0.02);
      gain.gain.setValueAtTime(vol, nextNoteTime);
      gain.gain.exponentialRampToValueAtTime(minVol, nextNoteTime + 0.15);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(nextNoteTime);
      osc.stop(nextNoteTime + 0.15);
    }
    // Very fast, intense 16th notes
    nextNoteTime += 0.13;
    noteIndex = (noteIndex + 1) % doomRiff.length;
  }
  requestAnimationFrame(scheduleMusic);
}

function playMusic() {
  if (!progression.soundOn) return;
  // Ensure WebAudio context exists for gameplay SFX.
  initAudio();

  // If a per-level MP3 track is configured, use that instead of the doom riff.
  if (bgmSrcOverride) {
    const vol = progression.musicVolume ?? 0.10;
    playBgmTrack(bgmSrcOverride, { volume: vol, fadeInMs: 1200, loop: true });
    return;
  }

  initAudio();
  if (musicPlaying) return;
  musicPlaying = true;
  nextNoteTime = audioCtx.currentTime + 0.1;
  scheduleMusic();
}

function stopMusic() {
  musicPlaying = false;
  if (!bgmAudioEl) return;

  const audio = bgmAudioEl;
  fadeBgmVolumeTo(0, 800);
  const token = bgmFadeToken;
  setTimeout(() => {
    if (token !== bgmFadeToken) return;
    try { audio.pause(); } catch (e) { /* ignore */ }
    if (bgmAudioEl === audio) bgmAudioEl = null;
  }, 850);
}

function playSound(type) {
  if (!progression.soundOn) return;

  // Heavy attack uses a dedicated MP3 SFX.
  if (type === 'heavyAttack') {
    try {
      // Use a fresh Audio instance for reliable immediate retriggering.
      const a = new Audio('audio/Atk-audio/atk-heavy.mp3');
      a.volume = 0.7;
      a.currentTime = 0;
      a.play().catch(() => { /* ignore playback errors */ });
    } catch (e) { /* non-fatal */ }
    return;
  }

  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    switch(type) {
      case 'lightAttack':
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);
        gain.gain.setValueAtTime(0.08, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now); osc.stop(now + 0.08); break;
      case 'heavyAttack':
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.2);
        gain.gain.setValueAtTime(0.12, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now); osc.stop(now + 0.2); break;
      case 'enemyAttack':
        osc.type = 'square'; osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        gain.gain.setValueAtTime(0.08, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now); osc.stop(now + 0.15); break;
      case 'hit':
        // Pitch drop explosion 
        osc.type = 'square'; osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
        gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now); osc.stop(now + 0.1); break;
      case 'hurt':
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
        gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now); osc.stop(now + 0.3); break;
      case 'fragment':
        osc.type = 'sine'; osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.1);
        osc.frequency.setValueAtTime(784, now + 0.2);
        gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now); osc.stop(now + 0.4); break;
      case 'bargain':
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);
        gain.gain.setValueAtTime(0.08, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now); osc.stop(now + 0.5); break;
      case 'riff':
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(220, now);
        osc.frequency.setValueAtTime(330, now + 0.05);
        osc.frequency.setValueAtTime(440, now + 0.1);
        osc.frequency.setValueAtTime(660, now + 0.15);
        osc.frequency.setValueAtTime(880, now + 0.2);
        gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now); osc.stop(now + 0.4); break;
      case 'death':
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.8);
        gain.gain.setValueAtTime(0.12, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.start(now); osc.stop(now + 0.8); break;
      case 'victory':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.15);
        osc.frequency.setValueAtTime(784, now + 0.3);
        osc.frequency.setValueAtTime(1047, now + 0.45);
        gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.start(now); osc.stop(now + 0.7); break;
      case 'purchase':
        osc.type = 'sine'; osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(660, now + 0.08);
        osc.frequency.setValueAtTime(880, now + 0.16);
        gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now); osc.stop(now + 0.3); break;
    }
  } catch(e) { /* audio errors are non-fatal */ }
}
