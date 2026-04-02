// ═══════════════════════════════════════════════════════════
//  GAME.JS — Main loop, wave management, game flow
// ═══════════════════════════════════════════════════════════

// ─── Start Level ──────────────────────────────────────────
function startLevel(levelConfig) {
  currentLevelConfig = levelConfig;
  isEternalDamnationRun = (levelConfig.id === ETERNAL_DAMNATION.id);

  const buffs = getShopBuffs();
  const playerHp = isEternalDamnationRun ? ETERNAL_DAMNATION.playerHp : (5 + buffs.maxHpBonus);
  player.reset(playerHp);

  enemies = [];
  fireballs = [];
  particles = [];
  afterimages = [];
  platforms = [];
  comboHistory.length = 0;
  comboSpecialTimer = 0;
  comboSpecialType = '';
  darkPowers = [];
  lifestealCounter = 0;
  riffCharge = 0;
  riffActive = false;
  riffBeam = null;
  gamePaused = false;
  fragmentWinActive = false;
  corrosionActive = false;
  corrosionProgress = 0;
  if (fragmentWinTimer) clearTimeout(fragmentWinTimer);
  fragmentWinTimer = 0;
  score = 0;
  waveNumber = 0;
  enemiesRemaining = 0;
  waveTotalEnemies = 0;
  waveSpawned = 0;
  waveDelay = 60;
  fragmentsEarnedThisRun = 0;
  gameRunning = true;
  lastTime = 0;
  accumulator = 0;
  sunriseStart = Date.now();
  sunriseElapsed = 0;
  canvas.style.background = '#1a0800';
  document.getElementById('sunrise-fill').style.width = '0%';

  playMusic();
  showScreen(null); // hide all overlays, show gameplay
  generatePlatforms();
}

function startEternalDamnation() {
  const edConfig = {
    id: ETERNAL_DAMNATION.id,
    name: ETERNAL_DAMNATION.name,
    difficulty: ETERNAL_DAMNATION.difficulty,
    waves: ETERNAL_DAMNATION.waves,
    enemyHpBase: ETERNAL_DAMNATION.enemyHpBase,
    enemyHpScale: 0,
    enemyCountBase: ETERNAL_DAMNATION.enemyCountBase,
    enemyCountScale: ETERNAL_DAMNATION.enemyCountScale,
    fragmentDropRate: 0,
    fragmentDropRateScale: 0,
    maxFragments: 0,
    color: ETERNAL_DAMNATION.color,
    icon: ETERNAL_DAMNATION.icon,
    description: ETERNAL_DAMNATION.description
  };
  startLevel(edConfig);
}

// ─── Waves ────────────────────────────────────────────────
function startNextWave() {
  // Check fragment drop for COMPLETED wave
  if (waveNumber > 0 && currentLevelConfig) {
    checkWaveEndFragment();
  }

  waveNumber++;

  // Boss level
  if (currentLevelConfig?.difficulty === 'Boss') {
    const boss = createBoss();
    boss.hp = currentLevelConfig.bossHp || 80;
    boss.maxHp = boss.hp;
    enemies.push(boss);
    enemiesRemaining = 1;
    waveTotalEnemies = 1;
    waveSpawned = 1;
    waveBannerTimer = 120;
    waveDelay = 0;
    return;
  }

  const countBase = currentLevelConfig?.enemyCountBase || 3;
  const countScale = currentLevelConfig?.enemyCountScale || 2;
  const count = countBase + waveNumber * countScale;
  waveTotalEnemies = count;
  waveSpawned = 0;
  enemiesRemaining = count;
  spawnNextBatch();
  waveDelay = 0;
}

function spawnNextBatch() {
  const remaining = waveTotalEnemies - waveSpawned;
  if (remaining <= 0) return;
  const batchSize = Math.min(remaining, 10);
  for (let i = 0; i < batchSize; i++) {
    const fromLeft = (i % 2 === 0); // alternate sides
    const e = createEnemy(waveNumber, currentLevelConfig, fromLeft);
    enemies.push(e);
  }
  waveSpawned += batchSize;
}

function checkWaveEndFragment() {
  if (!currentLevelConfig || currentLevelConfig.difficulty === 'Boss') return;
  if (isEternalDamnationRun) return;
  if (!canDropFragmentInLevel(currentLevelConfig)) return;

  const dropRate = (currentLevelConfig.fragmentDropRate || 0) +
    waveNumber * (currentLevelConfig.fragmentDropRateScale || 0);

  if (Math.random() < dropRate) {
    // 30% Devil's Bargain, 70% straight fragment
    if (Math.random() < 0.5) {
      showDevilsBargain();
    } else {
      awardFragmentDirect();
    }
  }
}

// ─── Level Complete ───────────────────────────────────────
function levelComplete() {
  stopMusic();
  gameRunning = false;

  if (isEternalDamnationRun) {
    // Eternal Damnation WON
    const rewards = ETERNAL_DAMNATION.rewards;
    progression.echoes += rewards.echoes;
    progression.fragments += rewards.fragments;
    progression.weapon = rewards.weapon;
    progression.eternalDamnationPending = false;
    progression.eternalDamnationCompleted = true;
    progression.devilsBargainCount = 0;
    savePersistent();

    // Check sheet music conversion
    checkSheetMusicConversion();

    showVictory({
      echoes: rewards.echoes,
      fragments: rewards.fragments,
      weapon: rewards.weapon
    });
    return;
  }

  // Mark level complete
  if (currentLevelConfig && !progression.levelsCompleted.includes(currentLevelConfig.id)) {
    progression.levelsCompleted.push(currentLevelConfig.id);
  }

  // Boss level rewards
  if (currentLevelConfig?.difficulty === 'Boss' && currentLevelConfig.reward) {
    progression.bossesDefeated = Math.max(progression.bossesDefeated, currentLevelConfig.circle || 1);
    if (currentLevelConfig.reward.riff && !progression.riffs.includes(currentLevelConfig.reward.riff)) {
      progression.riffs.push(currentLevelConfig.reward.riff);
    }
    savePersistent();
    showVictory({ riff: currentLevelConfig.reward.riff });
    return;
  }

  savePersistent();
  showVictory(null);
}

// ─── Game Over ────────────────────────────────────────────
function gameOver(reason) {
  stopMusic();
  gameRunning = false;
  playSound('death');

  if (isEternalDamnationRun) {
    // Total wipe
    resetAllProgression();
    // Keep the flag cleared
    progression.eternalDamnationPending = false;
    savePersistent();
  } else {
    savePersistent();
  }

  showGameOverScreen(reason);
}

function sunriseGameOver() {
  gameOver('Sunrise caught you.');
}

// ─── Input Handling ───────────────────────────────────────
window.addEventListener('keydown', e => {
  if (e.key === '`') {
    const panel = document.getElementById('debug-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    return;
  }
  if (e.key === 'Escape') {
    togglePause();
    return;
  }
  if (!gameRunning || gamePaused) return;
  const k = e.key.toLowerCase();
  if (k === 'j' || k === 'z') { player.lightAttack(); recordAction('light'); }
  if (k === 'k' || k === 'x') { player.heavyAttack(); recordAction('heavy'); }
  if (k === 'shift') { player.dash(); recordAction('dash'); }
  if (k === 'w' || k === 'arrowup' || k === ' ') { recordAction('jump'); }
  if (k === 'q') { activateRiff(); }
});

// ─── Main Loop ────────────────────────────────────────────
let lastTime = 0;
let accumulator = 0;
const FIXED_DT = 1000 / 60;

function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const delta = (timestamp - lastTime) * dbg.gameSpeed;
  lastTime = timestamp;
  accumulator += delta;

  if (!gameRunning) { requestAnimationFrame(gameLoop); return; }
  if (gamePaused) {
    lastTime = timestamp; accumulator = 0;
    // Still draw corrosion if active
    if (corrosionActive) {
      ctx.save();
      if (shakeTimer > 0) ctx.translate((Math.random()-0.5)*shakeIntensity*2, (Math.random()-0.5)*shakeIntensity*2);
      ctx.clearRect(-10, -10, W + 20, H + 20);
      drawPlatforms(); drawGround(); drawAfterimages();
      player.draw(); enemies.forEach(e => e.draw());
      drawFireballs(); drawComboEffects(); drawParticles();
      drawCorrosionEffect();
      ctx.restore();
    }
    requestAnimationFrame(gameLoop);
    return;
  }

  // Fixed timestep
  while (accumulator >= FIXED_DT) {
    accumulator -= FIXED_DT;

    player.update();
    checkComboLanding();

    // Hellfire passive
    if (darkPowers.includes('hellfire')) {
      enemies.forEach(e => {
        if (e.dead) return;
        const dist = Math.abs((e.x + e.w/2) - (player.x + player.w/2));
        if (dist < 80) {
          e.hp -= 0.02;
          if (Math.random() < 0.05) spawnParticles(e.x + e.w/2, e.y + e.h/2, 1, '#f80');
          if (e.hp <= 0) killEnemy(e);
        }
      });
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
      if (enemies[i].update()) enemies.splice(i, 1);
    }

    updateFireballs();
    updateParticles();
    updateAfterimages();
    updateRiffBeam();

    // Spawn next batch
    if (waveSpawned < waveTotalEnemies && enemies.filter(e => !e.dead).length <= 3) {
      spawnNextBatch();
    }

    // Wave end / Boss death check
    const livingEnemies = enemies.filter(e => !e.dead);
    if (enemiesRemaining <= 0 && livingEnemies.length === 0) {
      waveDelay++;
      if (currentLevelConfig?.difficulty === 'Boss') {
        // Only trigger victory if the boss wave actually started and finished
        if (waveNumber > 0 && waveDelay > 60) {
          levelComplete();
          // Reset waveDelay to prevent multiple calls
          waveDelay = -9999;
        } else if (waveNumber === 0 && waveDelay > 60) {
          // Spawn boss at start sequence
          startNextWave();
          waveBannerTimer = 120;
        }
      } else {
        if (waveDelay > 90) {
          startNextWave();
          waveBannerTimer = 90;
          generatePlatforms();
        }
      }
    }

    if (shakeTimer > 0) shakeTimer--;
  }

  updateHUD();

  // ─── DRAW ───
  ctx.save();
  if (shakeTimer > 0) ctx.translate((Math.random()-0.5)*shakeIntensity*2, (Math.random()-0.5)*shakeIntensity*2);
  ctx.clearRect(-10, -10, W + 20, H + 20);

  // Background image
  if (bgImage.complete && bgImage.naturalWidth > 0) {
    ctx.drawImage(bgImage, 0, 0, W, H);
  } else {
    ctx.fillStyle = '#1a0800';
    ctx.fillRect(0, 0, W, H);
  }

  // Sunrise sky gradient overlay
  if (sunriseStart > 0) {
    const pct = Math.min(1, sunriseElapsed / SUNRISE_DURATION);
    if (pct > 0.3) {
      const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      const intensity = (pct - 0.3) / 0.7;
      grad.addColorStop(0, `rgba(${Math.floor(60*intensity)}, ${Math.floor(20*intensity)}, 0, ${intensity * 0.3})`);
      grad.addColorStop(1, `rgba(${Math.floor(180*intensity)}, ${Math.floor(80*intensity)}, 0, ${intensity * 0.15})`);
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, GROUND_Y);
    }
  }

  // Eternal damnation atmosphere
  if (isEternalDamnationRun) {
    ctx.fillStyle = 'rgba(60, 0, 0, 0.15)';
    ctx.fillRect(0, 0, W, H);
  }

  drawPlatforms();
  drawAfterimages();
  player.draw();
  enemies.forEach(e => e.draw());
  drawFireballs();
  drawRiffBeam();
  drawComboEffects();
  drawParticles();
  drawWaveBanner();

  // Boss HP bar
  if (currentLevelConfig?.difficulty === 'Boss') drawBossHpBar();

  // Corrosion overlay
  drawCorrosionEffect();

  ctx.restore();

  requestAnimationFrame(gameLoop);
}

// ─── Initialize ───────────────────────────────────────────
function init() {
  loadPersistent();
  initHomeScreen();
  initDebugPanel();
  showScreen('home-screen');
  gameLoop(0);
}

init();
