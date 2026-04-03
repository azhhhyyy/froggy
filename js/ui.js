// ═══════════════════════════════════════════════════════════
//  UI.JS — Screen management, HUD, transitions
// ═══════════════════════════════════════════════════════════

// ─── Screen Management ───────────────────────────────────
function showScreen(screenId) {
  const allScreens = ['home-screen', 'level-select-screen', 'settings-screen', 'stats-screen',
    'start-screen', 'game-over-screen', 'bargain-screen', 'fragment-win-screen',
    'eternal-warning-screen', 'boss-summon-screen', 'victory-screen', 'pause-screen', 'shop-screen',
    'level-fragments-complete-screen'];
  allScreens.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (id === 'fragment-win-screen') el.classList.remove('active');
      else el.style.display = 'none';
    }
  });
  if (screenId) {
    const target = document.getElementById(screenId);
    if (target) {
      if (screenId === 'fragment-win-screen') target.classList.add('active');
      else target.style.display = 'flex';
    }
  }
  gameScreen = screenId || 'gameplay';
}

// ─── Home Screen ──────────────────────────────────────────
function initHomeScreen() {
  document.getElementById('home-play-btn').addEventListener('click', () => {
    initAudio();
    if (progression.eternalDamnationPending) {
      showEternalDamnationWarning();
    } else {
      showLevelSelect();
    }
  });

  document.getElementById('home-settings-btn').addEventListener('click', () => {
    showSettings();
  });

  document.getElementById('home-stats-btn').addEventListener('click', () => {
    showStats();
  });

  document.getElementById('home-shop-btn').addEventListener('click', () => {
    initAudio();
    showShop();
  });
}

// ─── Level Select ─────────────────────────────────────────
function showLevelSelect() {
  showScreen('level-select-screen');
  renderLevelCards();
}

function renderLevelCards() {
  const container = document.getElementById('level-cards');
  container.innerHTML = '';

  const circles = [1, 2, 3];
  circles.forEach(circle => {
    const circleLevels = LEVELS.filter(l => l.circle === circle);
    const circleUnlocked = circleLevels.some(l => isLevelUnlocked(l));

    const header = document.createElement('div');
    header.className = 'circle-header' + (circleUnlocked ? '' : ' locked');
    header.innerHTML = `<span>Circle ${circle}</span>`;
    container.appendChild(header);

    const row = document.createElement('div');
    row.className = 'circle-row';

    circleLevels.forEach(level => {
      const unlocked = isLevelUnlocked(level);
      const completed = progression.levelsCompleted.includes(level.id);

      const card = document.createElement('div');
      card.className = 'level-card' + (unlocked ? ' unlocked' : ' locked') + (completed ? ' completed' : '');

      let requirementText = '';
      if (!unlocked && level.unlockRequirement) {
        if (level.unlockRequirement.fragments) requirementText = `Requires ${level.unlockRequirement.fragments} Fragments`;
        if (level.unlockRequirement.sheetMusic) requirementText = `Requires ${level.unlockRequirement.sheetMusic} Sheet Music`;
        if (level.unlockRequirement.bossesDefeated) requirementText = `Defeat ${level.unlockRequirement.bossesDefeated} Boss${level.unlockRequirement.bossesDefeated > 1 ? 'es' : ''}`;
      }

      card.innerHTML = `
        <div class="level-icon" style="color:${level.color}">${level.icon}</div>
        <div class="level-num">Level ${level.id}</div>
        <div class="level-name" style="color:${level.color}">${level.name}</div>
        <div class="level-diff">${level.difficulty}</div>
        <div class="level-desc">${level.description}</div>
        ${!unlocked ? `<div class="level-lock">🔒 ${requirementText}</div>` : ''}
        ${completed ? '<div class="level-completed">✓ COMPLETED</div>' : ''}
      `;

      if (unlocked) {
        card.addEventListener('click', () => {
          if (level.difficulty === 'Boss' && progression.sheetMusic >= 1) {
            showBossSummon(level);
          } else {
            startLevel(level);
          }
        });
      }

      row.appendChild(card);
    });

    container.appendChild(row);
  });
}

document.getElementById('level-back-btn')?.addEventListener('click', () => {
  showScreen('home-screen');
});

// ─── Settings Screen ──────────────────────────────────────
function showSettings() {
  showScreen('settings-screen');
  document.getElementById('sound-toggle').checked = progression.soundOn;
  const volPct = Math.round((progression.musicVolume ?? 0.10) * 100);
  const volEl = document.getElementById('music-volume');
  const volValEl = document.getElementById('music-volume-val');
  if (volEl) volEl.value = String(volPct);
  if (volValEl) volValEl.textContent = `${volPct}%`;
}

document.getElementById('sound-toggle')?.addEventListener('change', (e) => {
  progression.soundOn = e.target.checked;
  savePersistent();
  if (!progression.soundOn) stopMusic();
});

document.getElementById('music-volume')?.addEventListener('input', (e) => {
  const pct = parseInt(e.target.value, 10);
  const v = Math.max(0, Math.min(1, pct / 100));
  setMusicVolume(v);
  const volValEl = document.getElementById('music-volume-val');
  if (volValEl) volValEl.textContent = `${pct}%`;
});

let pauseOrigin = null; // tracks if settings/stats opened from pause

document.getElementById('settings-back-btn')?.addEventListener('click', () => {
  if (pauseOrigin === 'pause') {
    pauseOrigin = null;
    showScreen('pause-screen');
  } else {
    showScreen('home-screen');
  }
});

// ─── Stats Screen (Attributes) ────────────────────────────
function showStats() {
  showScreen('stats-screen');
  const wpn = getWeaponData();
  const damnCount = progression.devilsBargainCount;
  const damnMax = ETERNAL_DAMNATION.triggerThreshold;
  const damnColor = damnCount >= damnMax ? '#f00' : damnCount >= 4 ? '#f44' : damnCount > 0 ? '#f84' : '#555';
  let skullPips = '';
  for (let i = 0; i < damnMax; i++) {
    skullPips += `<span style="color:${i < damnCount ? damnColor : '#2a2a2a'};font-size:18px;margin:0 3px">&#9760;</span>`;
  }
  document.getElementById('stats-content').innerHTML = `
    <div style="text-align:center;margin-bottom:20px;padding:16px 24px;border:1px solid ${damnColor};background:rgba(${damnCount>=damnMax?'60,0,0':'30,5,5'},0.6);border-radius:4px;min-width:320px;">
      <div style="font-size:9px;color:${damnColor};letter-spacing:4px;margin-bottom:8px">ETERNAL DAMNATION</div>
      <div style="font-size:28px;font-weight:700;color:${damnColor};margin-bottom:8px">${damnCount}<span style="font-size:14px;color:#444"> / ${damnMax}</span></div>
      <div style="margin-bottom:6px">${skullPips}</div>
      <div style="font-size:9px;letter-spacing:2px;color:#555">${damnCount >= damnMax ? 'DAMNED \u2014 ENDURE THE TRIAL' : damnCount >= 4 ? 'WARNING: ONE MORE COSTS YOUR SOUL' : damnCount > 0 ? "DEVIL'S BARGAINS TAKEN" : 'NO BARGAINS TAKEN'}</div>
    </div>
    <div class="stat-row"><span class="stat-label">Echoes</span><span class="stat-value">${progression.echoes}</span></div>
    <div class="stat-row"><span class="stat-label">Fragments</span><span class="stat-value">${progression.fragments} / ${FRAGMENTS_FOR_SHEET_MUSIC}</span></div>
    <div class="stat-row"><span class="stat-label">Sheet Music</span><span class="stat-value">${progression.sheetMusic}</span></div>
    <div class="stat-row"><span class="stat-label">Bosses Defeated</span><span class="stat-value">${progression.bossesDefeated} / 3</span></div>
    <div class="stat-row"><span class="stat-label">Weapon</span><span class="stat-value" style="color:${wpn.id === 'arkangel_stratocaster' ? '#a0f' : '#ccc'}">${wpn.name}</span></div>
    <div class="stat-row"><span class="stat-label">Damage Multiplier</span><span class="stat-value">${wpn.damageMultiplier}x</span></div>
    <div class="stat-row"><span class="stat-label">Riffs Learned</span><span class="stat-value">${progression.riffs.length > 0 ? progression.riffs.map(r => RIFFS.find(x=>x.id===r)?.name || r).join(', ') : 'None'}</span></div>
    <div class="stat-row"><span class="stat-label">Levels Completed</span><span class="stat-value">${progression.levelsCompleted.length > 0 ? progression.levelsCompleted.join(', ') : 'None'}</span></div>
    <div class="stat-row"><span class="stat-label">Gear Owned</span><span class="stat-value">${progression.purchasedItems.length > 0 ? progression.purchasedItems.map(id => SHOP_ITEMS.find(i=>i.id===id)?.name || id).join(', ') : 'None'}</span></div>
  `;
}

document.getElementById('stats-back-btn')?.addEventListener('click', () => {
  if (pauseOrigin === 'pause') {
    pauseOrigin = null;
    showScreen('pause-screen');
  } else {
    showScreen('home-screen');
  }
});

// ─── Devil's Bargain ──────────────────────────────────────
let pendingDarkPower = null;

function showDevilsBargain() {
  gamePaused = true;
  const available = DARK_POWER_LIST.filter(p => !darkPowers.includes(p.key));
  if (available.length === 0) {
    awardFragmentDirect();
    return;
  }
  pendingDarkPower = available[Math.floor(Math.random() * available.length)];
  document.getElementById('dark-power-desc').textContent = pendingDarkPower.name + ': ' + pendingDarkPower.desc;
  document.getElementById('bargain-damnation').textContent = progression.devilsBargainCount;
  showScreen('bargain-screen');
  playSound('bargain');
}

document.getElementById('bargain-take')?.addEventListener('click', () => {
  awardFragmentDirect();
  closeBargain();
});

document.getElementById('bargain-dark')?.addEventListener('click', () => {
  if (pendingDarkPower) {
    darkPowers.push(pendingDarkPower.key);
    progression.devilsBargainCount++;
    savePersistent();
    showCombo(pendingDarkPower.name.toUpperCase() + '!', '#f44');
  }
  closeBargain();

  // Check Eternal Damnation trigger
  if (progression.devilsBargainCount >= ETERNAL_DAMNATION.triggerThreshold) {
    triggerEternalDamnation();
  }
});

function closeBargain() {
  document.getElementById('bargain-screen').style.display = 'none';
  pendingDarkPower = null;
  gamePaused = false;
}

// ─── Fragment Audio (MP3) ──────────────────────────────────
// Plays a per-fragment sound when the player gains a sheet fragment.
// When the final fragment is crafted, it plays Fragment-Final.mp3.
const fragmentDropAudioCache = {};
let activeFragmentAudio = null;
let fragmentWinClosing = false;
let levelFragmentsCompleteShown = false;
let pendingLevelFragmentsComplete = false;
let pendingLevelFragmentsCompleteLevelId = null;

function playFragmentDropAudio(fragmentIndexWithinCycle) {
  if (!progression.soundOn) return;
  const base = 'audio/Fragments-Audio/';
  const isFinal = fragmentIndexWithinCycle >= FRAGMENTS_FOR_SHEET_MUSIC;
  const src = isFinal
    ? `${base}Fragment-Final.mp3`
    : `${base}Fragment-${fragmentIndexWithinCycle}.mp3`;

  try {
    if (!fragmentDropAudioCache[src]) fragmentDropAudioCache[src] = new Audio(src);
    const a = fragmentDropAudioCache[src];
    // Loop per-fragment audio while the fragment overlay is up.
    a.loop = !isFinal;
    activeFragmentAudio = a;
    a.currentTime = 0;
    a.play().catch(() => { /* ignore autoplay/interrupt errors */ });
    return a;
  } catch (e) {
    // Audio errors should never break gameplay.
  }
}

// ─── Fragment Win Animation ───────────────────────────────
function awardFragmentDirect() {
  // Capture the fragment number within the current 0..FRAGMENTS_FOR_SHEET_MUSIC cycle.
  const fragmentIndexWithinCycle = progression.fragments + 1;
  const crafted = fragmentIndexWithinCycle >= FRAGMENTS_FOR_SHEET_MUSIC;

  progression.fragments++;
  savePersistent();
  fragmentsEarnedThisRun++;

  // Determine if this fragment completes the fragment cap for the current level.
  // We'll show the prompt after the fragment overlay closes.
  const levelNowComplete = currentLevelConfig &&
    currentLevelConfig.difficulty !== 'Boss' &&
    (currentLevelConfig.maxFragments || 0) > 0 &&
    !levelFragmentsCompleteShown &&
    !canDropFragmentInLevel(currentLevelConfig);
  if (levelNowComplete) {
    levelFragmentsCompleteShown = true;
    pendingLevelFragmentsComplete = true;
    pendingLevelFragmentsCompleteLevelId = currentLevelConfig.id;
  }

  const fragmentAudioEl = playFragmentDropAudio(fragmentIndexWithinCycle);
  showFragmentWinAnimation({ crafted, fragmentAudioEl });

  // Check auto-conversion
  if (checkSheetMusicConversion()) {
    setTimeout(() => {
      showCombo('Music Sheet Crafted', '#ff0');
    }, 2600);
  }
}

function showFragmentWinAnimation({ crafted = false, fragmentAudioEl = null } = {}) {
  gamePaused = true;
  fragmentWinActive = true;
  fragmentWinClosing = false;
  const screen = document.getElementById('fragment-win-screen');
  screen.classList.add('active');
  const titleEl = screen.querySelector('.frag-title');
  if (titleEl) titleEl.textContent = crafted ? 'Music Sheet Crafted' : 'FRAGMENT ACQUIRED';

  const pipsEl = document.getElementById('frag-pips');
  pipsEl.innerHTML = '';
  // Show progress within the current 0..FRAGMENTS_FOR_SHEET_MUSIC cycle.
  const fragsThisCycle = progression.fragments;
  for (let i = 0; i < FRAGMENTS_FOR_SHEET_MUSIC; i++) {
    const pip = document.createElement('div');
    pip.className = 'frag-pip' + (i < fragsThisCycle ? ' filled' : '');
    pip.textContent = i < fragsThisCycle ? '♫' : '';
    pipsEl.appendChild(pip);
  }
  document.getElementById('frag-count-text').textContent = `${fragsThisCycle} / ${FRAGMENTS_FOR_SHEET_MUSIC} Fragments`;

  for (let i = 0; i < 30; i++) {
    particles.push({
      x: W/2 + (Math.random()-0.5)*300, y: H/2 + (Math.random()-0.5)*200,
      vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8 - 3,
      life: 60 + Math.random()*40, maxLife: 100,
      color: ['#f0f','#a0f','#f5f','#ff0','#5ff'][Math.floor(Math.random()*5)],
      size: 3 + Math.random()*4
    });
  }

  // Keep the final overlay up until the final mp3 finishes.
  if (crafted && fragmentAudioEl) {
    fragmentWinTimer = null;
    fragmentAudioEl.addEventListener('ended', () => {
      if (fragmentWinActive) closeFragmentWin();
    }, { once: true });
    // Fallback: if audio never ends (rare), don't trap the player forever.
    setTimeout(() => {
      if (fragmentWinActive) closeFragmentWin();
    }, 60000);
  } else {
    // Non-final fragments: auto-close after the original timing.
    fragmentWinTimer = setTimeout(() => { closeFragmentWin(); }, 2500);
  }
}

function closeFragmentWin() {
  if (fragmentWinClosing) return;
  fragmentWinClosing = true;

  document.getElementById('fragment-win-screen').classList.remove('active');
  fragmentWinActive = false;
  gamePaused = false;
  if (fragmentWinTimer) clearTimeout(fragmentWinTimer);
  fragmentWinTimer = 0;

  // Stop looping fragment audio immediately when overlay closes.
  if (activeFragmentAudio) {
    try {
      activeFragmentAudio.pause();
      activeFragmentAudio.currentTime = 0;
    } catch (e) { /* ignore */ }
    activeFragmentAudio = null;
  }

  // Show level fragment completion prompt after the fragment overlay closes.
  if (pendingLevelFragmentsComplete &&
    pendingLevelFragmentsCompleteLevelId === currentLevelConfig?.id) {
    pendingLevelFragmentsComplete = false;
    pendingLevelFragmentsCompleteLevelId = null;
    showLevelFragmentsCompleteScreen();
  }
}

// ─── Level Fragment Completion Prompt ─────────────────────
function showLevelFragmentsCompleteScreen() {
  showScreen('level-fragments-complete-screen');
  gamePaused = true;

  // Level 1 gets an extra "Proceed to Level 2" option.
  const proceedBtn = document.getElementById('level-fragments-proceed-btn');
  if (proceedBtn) {
    proceedBtn.style.display = (currentLevelConfig?.id === 1) ? 'inline-block' : 'none';
  }
}

document.getElementById('level-fragments-home-btn')?.addEventListener('click', () => {
  // Stop gameplay + return to level select while keeping progression persisted.
  gameRunning = false;
  gamePaused = false;
  stopMusic();
  if (typeof bossIntroAudio !== 'undefined' && bossIntroAudio) {
    try { bossIntroAudio.pause(); } catch (e) { /* ignore */ }
    bossIntroAudio = null;
  }
  if (typeof bossIntroShakeInterval !== 'undefined' && bossIntroShakeInterval) {
    clearInterval(bossIntroShakeInterval);
    bossIntroShakeInterval = null;
  }
  if (typeof bossIntroActive !== 'undefined') bossIntroActive = false;
  showLevelSelect();
});

document.getElementById('level-fragments-proceed-btn')?.addEventListener('click', () => {
  // Proceed from Level 1 -> Level 2 immediately.
  const lvl2 = LEVELS.find(l => l.id === 2);
  if (!lvl2) return;
  gamePaused = false;
  stopMusic();
  showScreen(null);
  startLevel(lvl2);
});

document.getElementById('level-fragments-continue-btn')?.addEventListener('click', () => {
  gamePaused = false;
  showScreen(null); // back to gameplay
});

// ─── Eternal Damnation ────────────────────────────────────
let corrosionProgress = 0;
let corrosionActive = false;

function triggerEternalDamnation() {
  progression.eternalDamnationPending = true;
  savePersistent();
  gamePaused = true;
  corrosionActive = true;
  corrosionProgress = 0;

  // Animate corrosion over 3 seconds then show warning
  const corrosionInterval = setInterval(() => {
    corrosionProgress += 0.02;
    if (corrosionProgress >= 1) {
      clearInterval(corrosionInterval);
      corrosionActive = false;
      gameRunning = false;
      showScreen('eternal-warning-screen');
    }
  }, 33);
}

function drawCorrosionEffect() {
  if (!corrosionActive) return;
  const p = corrosionProgress;
  ctx.save();

  // Red-black veins from edges
  ctx.globalAlpha = p;
  const grad = ctx.createRadialGradient(W/2, H/2, Math.max(W,H) * (1 - p) * 0.5, W/2, H/2, Math.max(W,H));
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.5, 'rgba(80,0,0,0.6)');
  grad.addColorStop(1, 'rgba(0,0,0,0.95)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Cracks / veins
  ctx.strokeStyle = `rgba(200, 0, 0, ${p * 0.8})`;
  ctx.lineWidth = 2;
  for (let i = 0; i < 12; i++) {
    const startX = (i % 2 === 0) ? (Math.random() < 0.5 ? 0 : W) : Math.random() * W;
    const startY = (i % 2 === 1) ? (Math.random() < 0.5 ? 0 : H) : Math.random() * H;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    let cx = startX, cy = startY;
    for (let j = 0; j < 8; j++) {
      cx += (W/2 - cx) * 0.3 + (Math.random()-0.5) * 60;
      cy += (H/2 - cy) * 0.3 + (Math.random()-0.5) * 60;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  // Center text fade-in
  if (p > 0.5) {
    ctx.globalAlpha = (p - 0.5) * 2;
    ctx.fillStyle = '#f00';
    ctx.font = 'bold 28px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('YOU ARE ETERNALLY DAMNED', W/2, H/2);
    ctx.font = '14px Courier New';
    ctx.fillStyle = '#a44';
    ctx.fillText('The darkness has consumed you...', W/2, H/2 + 30);
    ctx.textAlign = 'left';
  }

  ctx.restore();
}

document.getElementById('eternal-menu-btn')?.addEventListener('click', () => {
  showScreen('home-screen');
});

// ─── Boss Summon ──────────────────────────────────────────
let bossSummonTimer = 0;

function showBossSummon(level) {
  showScreen('boss-summon-screen');
  bossSummonTimer = 0;

  // Special summon flow for the first demon boss (Circle 1, Level 3):
  // 1) Play Fragment-Final.mp3
  // 2) Wait for it to end
  // 3) Shake the screen
  // 4) Deduct sheet music + start the boss level (which also starts BGM)
  if (level && level.id === 3) {
    const canvasEl = document.getElementById('gameCanvas');
    const doShakeAndStart = () => {
      // Shake the canvas visually even while gameplay loop isn't running yet.
      if (canvasEl) {
        const shakeDurationMs = 650;
        const shakeStart = performance.now();
        const step = (now) => {
          const t = now - shakeStart;
          if (!canvasEl) return;
          if (t >= shakeDurationMs) {
            canvasEl.style.transform = 'none';
            canvasEl.style.transition = '';
            return;
          }
          const strength = 10;
          const x = (Math.random() - 0.5) * strength;
          const y = (Math.random() - 0.5) * strength;
          canvasEl.style.transform = `translate(${x}px, ${y}px)`;
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }

      const fill = document.getElementById('summon-progress-fill');
      if (fill) fill.style.width = '100%';

      progression.sheetMusic--;
      savePersistent();
      // Small delay so the shake lands before gameplay takeover.
      setTimeout(() => { startLevel(level); }, 500);
    };

    if (progression.soundOn) {
      const a = new Audio('audio/Fragments-Audio/Fragment-Final.mp3');
      a.addEventListener('ended', () => doShakeAndStart(), { once: true });
      a.play().catch(() => { doShakeAndStart(); });
    } else {
      doShakeAndStart();
    }
    return;
  }

  const summonInterval = setInterval(() => {
    bossSummonTimer += 0.015;
    const fill = document.getElementById('summon-progress-fill');
    if (fill) fill.style.width = (bossSummonTimer * 100) + '%';
    if (bossSummonTimer >= 1) {
      clearInterval(summonInterval);
      progression.sheetMusic--;
      savePersistent();
      setTimeout(() => { startLevel(level); }, 500);
    }
  }, 33);
}

// ─── Victory Screen ───────────────────────────────────────
function showVictory(rewards) {
  gameRunning = false;
  showScreen('victory-screen');
  playSound('victory');

  let rewardHtml = '';
  if (rewards) {
    if (rewards.echoes) rewardHtml += `<div class="reward-item">+${rewards.echoes} Echoes</div>`;
    if (rewards.fragments) rewardHtml += `<div class="reward-item">+${rewards.fragments} Fragments</div>`;
    if (rewards.weapon) {
      const wpn = WEAPONS.find(w => w.id === rewards.weapon);
      rewardHtml += `<div class="reward-item reward-special">🎸 ${wpn ? wpn.name : rewards.weapon}</div>`;
    }
    if (rewards.riff) {
      const riff = RIFFS.find(r => r.id === rewards.riff);
      rewardHtml += `<div class="reward-item reward-special">♫ Riff: ${riff ? riff.name : rewards.riff}</div>`;
    }
  }

  document.getElementById('victory-rewards').innerHTML = rewardHtml || '<div class="reward-item">Level Complete!</div>';
}

document.getElementById('victory-menu-btn')?.addEventListener('click', () => {
  stopMusic();
  showScreen('home-screen');
});

// ─── Game Over Screen ─────────────────────────────────────
function showGameOverScreen(reason) {
  showScreen('game-over-screen');
  document.getElementById('final-score').textContent = score;
  document.getElementById('final-wave').textContent = `Reached wave ${waveNumber}`;
  document.getElementById('final-reason').textContent = reason || '';

  // Eternal damnation loss
  if (isEternalDamnationRun) {
    document.getElementById('final-reason').textContent = 'DAMNATION — All resources lost.';
    document.getElementById('final-reason').style.color = '#f00';
  }
}

document.getElementById('retry-btn')?.addEventListener('click', () => {
  if (currentLevelConfig) {
    stopMusic();
    showScreen(null);
    startLevel(currentLevelConfig);
  } else {
    stopMusic();
    showScreen('home-screen');
  }
});

document.getElementById('restart-btn')?.addEventListener('click', () => {
  stopMusic();
  showScreen('home-screen');
});

// ─── HUD ──────────────────────────────────────────────────
function updateHUD() {
  document.getElementById('hp').textContent = player.hp;
  document.getElementById('hp-max').textContent = player.maxHp;
  if (currentLevelConfig?.difficulty === 'Boss') {
    document.getElementById('wave').parentElement.style.display = 'none';
  } else {
    document.getElementById('wave').parentElement.style.display = 'inline-block';
    document.getElementById('wave').textContent = waveNumber;
  }
  document.getElementById('score').textContent = score;
  document.getElementById('echoes').textContent = progression.echoes;
  document.getElementById('fragments').textContent = progression.fragments;

  const wpn = getWeaponData();
  document.getElementById('weapon-name').textContent = wpn.name;

  const cd = player.heavyCooldown;
  const hcd = document.getElementById('heavy-cd');
  if (cd <= 0) { hcd.textContent = 'READY'; hcd.style.color = '#0f0'; }
  else { hcd.textContent = (cd / 60).toFixed(1) + 's'; hcd.style.color = '#f55'; }

  const dcd = player.dashCooldown;
  const dcdEl = document.getElementById('dash-cd');
  if (dcd <= 0) { dcdEl.textContent = 'READY'; dcdEl.style.color = '#5af'; }
  else { dcdEl.textContent = (dcd / 60).toFixed(1) + 's'; dcdEl.style.color = '#f55'; }

  // Riff charge
  const riffBar = document.getElementById('riff-charge-bar');
  const riffText = document.getElementById('riff-charge-text');
  if (hasUnlockedRiff()) {
    riffBar.style.display = 'block';
    const riff = RIFFS.find(r => r.id === progression.riffs[0]);
    const pct = riff ? (riffCharge / riff.chargeRequired * 100) : 0;
    document.getElementById('riff-fill').style.width = pct + '%';
    riffText.textContent = riffCharge >= (riff?.chargeRequired || 20) ? 'Q: READY!' : `${riffCharge}/${riff?.chargeRequired || 20}`;
    riffText.style.color = riffCharge >= (riff?.chargeRequired || 20) ? '#a0f' : '#888';
  } else {
    riffBar.style.display = 'none';
  }

  // Sunrise timer
  if (gameRunning && sunriseStart > 0) {
    sunriseElapsed = Date.now() - sunriseStart;
    const remaining = Math.max(0, SUNRISE_DURATION - sunriseElapsed);
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    const pct = Math.min(100, (sunriseElapsed / SUNRISE_DURATION) * 100);

    document.getElementById('timer-display').textContent = `☀ ${mins}:${secs.toString().padStart(2,'0')}`;
    document.getElementById('timer-display').style.color = pct > 80 ? '#f44' : (pct > 50 ? '#fa5' : '#a86');
    document.getElementById('sunrise-fill').style.width = pct + '%';
    document.getElementById('sunrise-fill').style.background = 'linear-gradient(90deg, #421, #f84)';
    const r = Math.floor(20 + pct * 1.5), g = Math.floor(10 + pct * 0.6), bv = Math.floor(30 - pct * 0.3);
    canvas.style.background = `rgb(${r},${g},${Math.max(0,bv)})`;

    if (remaining <= 0) sunriseGameOver();
  }

  // Damnation display
  if (!isEternalDamnationRun) {
    const damnColor = progression.devilsBargainCount >= 4 ? '#f44' : (progression.devilsBargainCount > 0 ? '#f84' : '#666');
    document.getElementById('damnation-display').innerHTML = `<span style="color:${damnColor}">☠ Bargains: ${progression.devilsBargainCount}/${ETERNAL_DAMNATION.triggerThreshold}</span>`;
  } else {
    document.getElementById('damnation-display').innerHTML = '<span style="color:#f00">💀 ETERNAL DAMNATION</span>';
  }

  // Level name
  if (currentLevelConfig) {
    document.getElementById('level-name-display').textContent = currentLevelConfig.name || '';
    document.getElementById('level-name-display').style.color = currentLevelConfig.color || '#fff';
  }
}

// ─── Wave Banner ──────────────────────────────────────────
let waveBannerTimer = 0;
function drawWaveBanner() {
  if (waveBannerTimer > 0) {
    waveBannerTimer--;
    const alpha = Math.min(1, waveBannerTimer / 30);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px Courier New';
    ctx.textAlign = 'center';
    const label = currentLevelConfig?.difficulty === 'Boss' ? '— THE DEMON LORD —' : `— WAVE ${waveNumber} —`;
    ctx.fillText(label, W/2, H/2 - 40);
    if (currentLevelConfig?.difficulty !== 'Boss') {
      ctx.font = '16px Courier New';
      ctx.fillStyle = '#aaa';
      const rawCount = currentLevelConfig ? currentLevelConfig.enemyCountBase + waveNumber * (currentLevelConfig.enemyCountScale || 0) : waveTotalEnemies;
      const count = Math.max(1, Math.floor(rawCount * 0.5));
      ctx.fillText(`${count} enemies`, W/2, H/2 - 10);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }
}

// ─── Debug Panel ──────────────────────────────────────────
function initDebugPanel() {
  document.getElementById('dbg-speed')?.addEventListener('input', e => {
    dbg.gameSpeed = parseFloat(e.target.value);
    document.getElementById('dbg-speed-val').textContent = dbg.gameSpeed.toFixed(1) + 'x';
  });
  document.getElementById('dbg-espeed')?.addEventListener('input', e => {
    dbg.enemySpeedMult = parseFloat(e.target.value);
    document.getElementById('dbg-espeed-val').textContent = dbg.enemySpeedMult.toFixed(1) + 'x';
  });
  document.getElementById('dbg-pspeed')?.addEventListener('input', e => {
    dbg.playerSpeedMult = parseFloat(e.target.value);
    document.getElementById('dbg-pspeed-val').textContent = dbg.playerSpeedMult.toFixed(1) + 'x';
  });
  document.getElementById('dbg-god')?.addEventListener('change', e => { dbg.godMode = e.target.checked; });
  document.getElementById('dbg-unlock-levels')?.addEventListener('change', e => { 
    dbg.unlockLevels = e.target.checked; 
    if (gameScreen === 'level-select-screen') renderLevelScreen();
  });
  document.getElementById('dbg-showcombos')?.addEventListener('change', e => { dbg.showCombos = e.target.checked; });
  document.getElementById('dbg-count')?.addEventListener('input', e => {
    document.getElementById('dbg-count-val').textContent = e.target.value;
  });
  document.getElementById('dbg-spawn')?.addEventListener('click', () => {
    const n = parseInt(document.getElementById('dbg-count').value);
    for (let i = 0; i < n; i++) {
      const e = createEnemy(waveNumber || 1, currentLevelConfig || LEVELS[0]);
      e.x = W + 30 + i * 60 + Math.random() * 40;
      enemies.push(e); enemiesRemaining++;
    }
  });
  document.getElementById('dbg-kill-all')?.addEventListener('click', () => {
    enemies.forEach(e => { if (!e.dead) killEnemy(e); });
  });
  document.getElementById('dbg-heal')?.addEventListener('click', () => { player.hp = player.maxHp; });
  document.getElementById('dbg-clear-fb')?.addEventListener('click', () => { fireballs.length = 0; });
  document.getElementById('dbg-clear-inv')?.addEventListener('click', () => {
    resetAllProgression();
    showCombo('PROGRESSION RESET', '#f84');
  });
  document.getElementById('dbg-max-res')?.addEventListener('click', () => {
    progression.fragments = 99;
    progression.sheetMusic = 99;
    progression.echoes += 100000;
    progression.bossesDefeated = 3;
    savePersistent();
    showCombo('MAX RESOURCES GRANTED', '#8f4');
    if (gameScreen === 'level-select-screen') renderLevelScreen();
  });
}

// ─── Pause Menu ───────────────────────────────────────────
let pauseTimestamp = 0; // when pause started (to freeze sunrise)

function togglePause() {
  if (!gameRunning || corrosionActive || fragmentWinActive) return;
  // Don't toggle if bargain screen is active
  if (gameScreen === 'bargain-screen') return;

  if (gamePaused && gameScreen === 'pause-screen') {
    resumeGame();
  } else if (!gamePaused) {
    pauseGame();
  }
}

function pauseGame() {
  gamePaused = true;
  pauseTimestamp = Date.now();
  showScreen('pause-screen');
}

function resumeGame() {
  // Adjust sunrise start to account for pause duration
  if (sunriseStart > 0 && pauseTimestamp > 0) {
    const pauseDuration = Date.now() - pauseTimestamp;
    sunriseStart += pauseDuration;
  }
  pauseTimestamp = 0;
  gamePaused = false;
  showScreen(null); // back to gameplay
}

document.getElementById('pause-resume-btn')?.addEventListener('click', () => {
  resumeGame();
});

document.getElementById('pause-settings-btn')?.addEventListener('click', () => {
  pauseOrigin = 'pause';
  showSettings();
});

document.getElementById('pause-inventory-btn')?.addEventListener('click', () => {
  pauseOrigin = 'pause';
  showStats();
});

document.getElementById('pause-home-btn')?.addEventListener('click', () => {
  gamePaused = false;
  gameRunning = false;
  pauseTimestamp = 0;
  savePersistent();
  stopMusic();
  if (typeof bossIntroAudio !== 'undefined' && bossIntroAudio) {
    try { bossIntroAudio.pause(); } catch (e) { /* ignore */ }
    bossIntroAudio = null;
  }
  if (typeof bossIntroShakeInterval !== 'undefined' && bossIntroShakeInterval) {
    clearInterval(bossIntroShakeInterval);
    bossIntroShakeInterval = null;
  }
  if (typeof bossIntroActive !== 'undefined') bossIntroActive = false;
  showScreen('home-screen');
});

document.getElementById('hud-pause-btn')?.addEventListener('click', () => {
  if (gameRunning && !gamePaused) {
    togglePause();
  }
});

// ─── Shop Screen ──────────────────────────────────────────
function showShop() {
  showScreen('shop-screen');
  renderShopItems();
}

function renderShopItems() {
  const container = document.getElementById('shop-items');
  container.innerHTML = '';
  const tier = getShopTier();

  document.getElementById('shop-echoes').textContent = progression.echoes;
  document.getElementById('shop-tier').textContent = tier;
  document.getElementById('shop-tier').style.color = ['#888','#5af','#fa0','#f0f'][tier];

  for (let t = 0; t <= 3; t++) {
    const tierItems = SHOP_ITEMS.filter(i => i.tier === t);
    if (tierItems.length === 0) continue;

    const tierHeader = document.createElement('div');
    tierHeader.className = 'shop-tier-header' + (t <= tier ? '' : ' locked');
    tierHeader.innerHTML = t <= tier
      ? `<span>Tier ${t}${t === 0 ? ' — Starter Gear' : t === 1 ? ' — Journeyman' : t === 2 ? ' — Veteran' : ' — Legendary'}</span>`
      : `<span>🔒 Tier ${t} — Defeat ${t} Boss${t > 1 ? 'es' : ''} to unlock</span>`;
    container.appendChild(tierHeader);

    const row = document.createElement('div');
    row.className = 'shop-row';

    tierItems.forEach(item => {
      const owned = progression.purchasedItems.includes(item.id);
      const canAfford = progression.echoes >= item.cost && !owned;
      const tierLocked = t > tier;

      const card = document.createElement('div');
      card.className = 'shop-item' + (owned ? ' owned' : '') + (tierLocked ? ' tier-locked' : '') + (canAfford ? ' affordable' : '');

      card.innerHTML = `
        <div class="shop-icon">${item.icon}</div>
        <div class="shop-item-name">${item.name}</div>
        <div class="shop-item-cat">${item.category}</div>
        <div class="shop-item-desc">${item.desc}</div>
        <div class="shop-item-cost">${owned ? '✓ OWNED' : (tierLocked ? '🔒' : `${item.cost} echoes`)}</div>
      `;

      if (canAfford && !tierLocked) {
        card.addEventListener('click', () => {
          purchaseItem(item);
        });
      }

      row.appendChild(card);
    });

    container.appendChild(row);
  }
}

function purchaseItem(item) {
  if (progression.purchasedItems.includes(item.id)) return;
  if (progression.echoes < item.cost) return;

  progression.echoes -= item.cost;
  progression.purchasedItems.push(item.id);
  savePersistent();
  playSound('purchase');
  showCombo(item.name.toUpperCase() + ' ACQUIRED!', '#5f5');
  renderShopItems();
}

document.getElementById('shop-back-btn')?.addEventListener('click', () => {
  showScreen('home-screen');
});
