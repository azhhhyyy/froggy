// ═══════════════════════════════════════════════════════════
//  COMBAT.JS — Combo system, riff/special attacks
// ═══════════════════════════════════════════════════════════

// ─── Kill handler ─────────────────────────────────────────
function killEnemy(e) {
  e.dead = true;
  e.deathTimer = e.isBoss ? 60 : 20;
  score++;
  enemiesRemaining--;

  const shopBuffs = getShopBuffs();
  const echoBase = darkPowers.includes('echosiphon') ? 20 : 10;
  progression.echoes += Math.floor(echoBase * shopBuffs.echoMultiplier);
  spawnParticles(e.x + e.w/2, e.y + e.h/2, 10, '#fa5');
  for (let i = 0; i < 3; i++) spawnParticles(e.x + e.w/2 + (Math.random()-0.5)*20, e.y + e.h/2, 2, '#ff0');

  // Riff charge
  if (hasUnlockedRiff()) {
    const chargeBoost = 1 + (shopBuffs.riffChargeBonus || 0);
    riffCharge = Math.min(riffCharge + chargeBoost, RIFFS[0].chargeRequired);
  }

  // Lifesteal
  if (darkPowers.includes('lifesteal')) {
    lifestealCounter++;
    if (lifestealCounter >= 3) {
      lifestealCounter = 0;
      player.hp = Math.min(player.hp + 1, player.maxHp);
      spawnParticles(player.x + player.w/2, player.y + player.h/2, 4, '#0f0');
    }
  }

  // Soul Chain
  if (darkPowers.includes('soulchain')) {
    player.hp = player.maxHp;
    spawnParticles(player.x + player.w/2, player.y + player.h/2, 6, '#f0f');
  }

  playSound('hit');
  savePersistent();
}

// ─── Riff / Special Attack ────────────────────────────────
function activateRiff() {
  if (!hasUnlockedRiff()) return;
  const riff = RIFFS.find(r => r.id === progression.riffs[0]);
  if (!riff || riffCharge < riff.chargeRequired || riffActive) return;

  riffCharge = 0;
  riffActive = true;
  playSound('riff');
  shakeTimer = 15;
  shakeIntensity = 5;

  // Visual burst
  for (let i = 0; i < 20; i++) spawnParticles(player.x + player.w/2, player.y + player.h/2, 1, riff.color);

  // Fire beam
  const shopBuffs = getShopBuffs();
  riffBeam = {
    x: player.x + player.w/2,
    y: player.y + player.h/2,
    vx: player.facing * 12,
    width: 60,
    killsLeft: riff.killCount + (shopBuffs.riffKillBonus || 0),
    life: 60,
    color: riff.beamColor || '#a0f'
  };

  showCombo(riff.name.toUpperCase(), riff.color);
  setTimeout(() => { riffActive = false; }, 1000);
}

// ─── Combo System ─────────────────────────────────────────
const comboHistory = [];
const COMBO_WINDOW = 35;
let comboDisplayTimer = 0;
let comboDisplayText = '';
let comboSpecialTimer = 0;
let comboSpecialType = '';

function recordAction(action) {
  comboHistory.push({ action, time: performance.now(), airborne: !player.onGround, crouching: player.crouching });
  if (comboHistory.length > 8) comboHistory.shift();
  checkCombos();
}

function recentActions(n) {
  if (comboHistory.length < n) return null;
  const recent = comboHistory.slice(-n);
  if (performance.now() - recent[0].time > COMBO_WINDOW * n * 16.67) return null;
  return recent;
}

function showCombo(name, color) {
  comboDisplayText = name;
  comboDisplayTimer = 90;
  const el = document.getElementById('combo-display');
  el.textContent = '★ ' + name + ' ★';
  el.style.color = color || '#ff0';
  el.style.opacity = '1';
  setTimeout(() => { el.style.opacity = '0'; }, 1500);
  if (dbg.showCombos) {
    const log = document.getElementById('dbg-combo-log');
    if (log) log.innerHTML = `<div style="color:${color||'#ff0'}">${name}</div>` + log.innerHTML;
  }
}

function checkCombos() {
  const r3l = recentActions(3);
  if (r3l && r3l.every(a => a.action === 'light') && !r3l[0].airborne) {
    comboHistory.length = 0; showCombo('FLURRY RUSH', '#f5f'); doFlurryRush(); return;
  }
  const r3u = recentActions(3);
  if (r3u && r3u[0].action === 'light' && r3u[1].action === 'light' && r3u[2].action === 'heavy' && player.heavyCooldown <= 0) {
    comboHistory.length = 0; player.heavyCooldown = player.heavyMaxCooldown; showCombo('UPPERCUT LAUNCH', '#5ff'); doUppercutLaunch(); return;
  }
  const r2ds = recentActions(2);
  if (r2ds && r2ds[0].action === 'dash' && r2ds[1].action === 'light' && player.dashing) {
    comboHistory.length = 0; showCombo('DASH STRIKE', '#5af'); doDashStrike(); return;
  }
  const r1gp = recentActions(1);
  if (r1gp && r1gp[0].action === 'heavy' && r1gp[0].airborne && player.heavyCooldown <= 0) {
    comboHistory.length = 0; player.heavyCooldown = player.heavyMaxCooldown; showCombo('GROUND POUND', '#fa5'); doGroundPound(); return;
  }
  const r4ms = recentActions(4);
  if (r4ms && r4ms[0].action === 'jump' && r4ms[1].action === 'light' && r4ms[2].action === 'light' && r4ms[3].action === 'heavy' && !player.onGround && player.heavyCooldown <= 0) {
    comboHistory.length = 0; player.heavyCooldown = player.heavyMaxCooldown; showCombo('METEOR SLASH', '#f55'); doMeteorSlash(); return;
  }
  const r1w = recentActions(1);
  if (r1w && r1w[0].action === 'heavy' && r1w[0].crouching && player.heavyCooldown <= 0) {
    comboHistory.length = 0; player.heavyCooldown = player.heavyMaxCooldown; showCombo('WHIRLWIND', '#5f5'); doWhirlwind(); return;
  }
  const r4dc = recentActions(4);
  if (r4dc && r4dc[0].action === 'light' && r4dc[1].action === 'light' && r4dc[2].action === 'dash' && r4dc[3].action === 'light') {
    comboHistory.length = 0; showCombo('DASH CANCEL', '#ff5'); doDashCancel(); return;
  }
}

// ─── Combo Effects ────────────────────────────────────────
function doFlurryRush() {
  const box = { x: player.facing === 1 ? player.x + player.w : player.x - 60, y: player.y - 10, w: 60, h: player.h + 20 };
  const wpn = getWeaponData();
  enemies.forEach(e => {
    if (!e.dead && rectsOverlap(box, e)) {
      e.hp -= 2 * wpn.damageMultiplier; e.hitFlash = 10; e.knockback = player.facing * 6;
      spawnParticles(e.x + e.w/2, e.y + e.h/2, 6, '#f5f');
      if (e.hp <= 0) killEnemy(e);
    }
  });
  shakeTimer = 8; shakeIntensity = 3;
}

function doUppercutLaunch() {
  const box = { x: player.facing === 1 ? player.x + player.w : player.x - 50, y: player.y - 20, w: 50, h: player.h + 20 };
  const wpn = getWeaponData();
  getClosestEnemies(box, 4).forEach(e => {
    e.hp -= 2 * wpn.damageMultiplier; e.hitFlash = 15; e.knockback = player.facing * 4; e.y -= 60;
    spawnParticles(e.x + e.w/2, e.y + e.h/2, 8, '#5ff');
    if (e.hp <= 0) killEnemy(e);
  });
  shakeTimer = 6; shakeIntensity = 3;
}

function doDashStrike() {
  const box = { x: Math.min(player.x, player.x + player.facing * 120), y: player.y, w: 120, h: player.h };
  const wpn = getWeaponData();
  enemies.forEach(e => {
    if (!e.dead && rectsOverlap(box, e)) {
      e.hp -= 2 * wpn.damageMultiplier; e.hitFlash = 8; e.knockback = player.facing * 10;
      spawnParticles(e.x + e.w/2, e.y + e.h/2, 5, '#5af');
      if (e.hp <= 0) killEnemy(e);
    }
  });
}

function doGroundPound() {
  player.vy = 15;
  comboSpecialType = 'groundpound'; comboSpecialTimer = 30;
}

function doMeteorSlash() {
  player.vy = 18;
  comboSpecialType = 'meteorslash'; comboSpecialTimer = 30;
}

function doWhirlwind() {
  const cx = player.x + player.w/2, cy = player.y + player.h/2;
  const wpn = getWeaponData();
  getClosestEnemiesRadius(cx, cy, 70, 4).forEach(e => {
    e.hp -= 2 * wpn.damageMultiplier; e.hitFlash = 12;
    const angle = Math.atan2((e.y+e.h/2) - cy, (e.x+e.w/2) - cx);
    e.knockback = Math.cos(angle) * 8;
    spawnParticles(e.x + e.w/2, e.y + e.h/2, 5, '#5f5');
    if (e.hp <= 0) killEnemy(e);
  });
  shakeTimer = 10; shakeIntensity = 4;
  for (let a = 0; a < Math.PI * 2; a += 0.4) spawnParticles(cx + Math.cos(a) * 50, cy + Math.sin(a) * 50, 1, '#5f5');
}

function doDashCancel() {
  player.dashCooldown = 0;
  const box = player.getAttackBox(false);
  const wpn = getWeaponData();
  enemies.forEach(e => {
    if (!e.dead && rectsOverlap(box, e)) {
      e.hp -= 2 * wpn.damageMultiplier; e.hitFlash = 8; e.knockback = player.facing * 5;
      spawnParticles(e.x + e.w/2, e.y + e.h/2, 6, '#ff5');
      if (e.hp <= 0) killEnemy(e);
    }
  });
}

function checkComboLanding() {
  if (comboSpecialTimer > 0 && player.onGround) {
    const cx = player.x + player.w/2, cy = player.y + player.h/2;
    const radius = comboSpecialType === 'meteorslash' ? 90 : 70;
    const dmg = comboSpecialType === 'meteorslash' ? 3 : 2;
    const color = comboSpecialType === 'meteorslash' ? '#f55' : '#fa5';
    const wpn = getWeaponData();
    getClosestEnemiesRadius(cx, cy, radius, 4).forEach(e => {
      e.hp -= dmg * wpn.damageMultiplier; e.hitFlash = 15;
      e.knockback = (e.x > player.x ? 1 : -1) * 8;
      spawnParticles(e.x + e.w/2, e.y + e.h/2, 8, color);
      if (e.hp <= 0) killEnemy(e);
    });
    shakeTimer = 12; shakeIntensity = 6;
    for (let a = 0; a < Math.PI * 2; a += 0.3) spawnParticles(cx + Math.cos(a) * 40, GROUND_Y + player.h, 1, color);
    comboSpecialTimer = 0; comboSpecialType = '';
  }
  if (comboSpecialTimer > 0) comboSpecialTimer--;
}

function drawComboEffects() {
  if (comboSpecialTimer > 0 && !player.onGround) {
    const cx = player.x + player.w/2, cy = player.y + player.h;
    const color = comboSpecialType === 'meteorslash' ? '#f55' : '#fa5';
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = 0.5;
    for (let i = 0; i < 3; i++) {
      const ox = (Math.random() - 0.5) * 20;
      ctx.beginPath(); ctx.moveTo(cx + ox, cy - 20); ctx.lineTo(cx + ox, cy + 30); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}
