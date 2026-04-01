// ═══════════════════════════════════════════════════════════
//  ENEMIES.JS — Regular enemies + Boss demon
// ═══════════════════════════════════════════════════════════

const enemyWalkSprite = new Image();
enemyWalkSprite.src = 'sprites/enemy-low-walking.png';
const enemyAtkSprite = new Image();
enemyAtkSprite.src = 'sprites/enemy-low-attack.png';

function createEnemy(wave, levelConfig, fromLeft) {
  const baseHp = levelConfig ? levelConfig.enemyHpBase : 3;
  const hpScale = levelConfig ? (levelConfig.enemyHpScale || 0) : 0;
  const hp = Math.ceil(baseHp * (1 + hpScale * wave));
  const speed = 0.8 + wave * 0.06 + Math.random() * 0.3;

  const spawnX = fromLeft
    ? -(Math.random() * 200 + 30)
    : W + Math.random() * 200;

  return {
    x: spawnX,
    y: GROUND_Y + 50 - 66,
    w: 39, h: 66,
    speed, hp, maxHp: hp,
    facing: fromLeft ? 1 : -1,
    dead: false,
    deathTimer: 0,
    hitFlash: 0,
    knockback: 0,
    fireTimer: 0,
    animTimer: Math.random() * 100,
    isBoss: false,
    meleeRange: 45,
    meleeCooldown: 0,
    meleeMaxCooldown: 100 + Math.floor(Math.random() * 40),
    meleeWindup: 0,
    meleeWindupDuration: 25,
    meleeSwing: 0,
    meleeSwingDuration: 15,
    isAttacking: false,
    fireballCooldown: 120 + Math.floor(Math.random() * 180),
    fireballMaxCooldown: 180 + Math.floor(Math.random() * 120),
    fireballCharging: false,
    fireballChargeTimer: 0,
    fireballChargeDuration: 40,

    update() { return updateRegularEnemy(this); },
    draw() { drawRegularEnemy(this); },
    doMeleeHit() { enemyMeleeHit(this); },
    shootFireball() { enemyShootFireball(this); }
  };
}

function updateRegularEnemy(e) {
  e.animTimer++;
  if (e.dead) { e.deathTimer--; e.y -= 1; return e.deathTimer <= 0; }

  if (e.knockback !== 0) {
    e.x += e.knockback;
    e.knockback *= 0.8;
    if (Math.abs(e.knockback) < 0.2) e.knockback = 0;
  }

  // Fire DoT
  if (e.fireTimer > 0) {
    e.fireTimer--;
    if (e.fireTimer % 30 === 0) {
      e.hp -= 1; e.hitFlash = 4;
      spawnParticles(e.x + e.w/2, e.y + e.h/2, 2, '#f80');
      if (e.hp <= 0) { killEnemy(e); return true; }
    }
    if (Math.random() < 0.1) spawnParticles(e.x + e.w/2, e.y + e.h/2, 1, '#f40');
  }

  if (e.hitFlash > 0) e.hitFlash--;
  if (e.meleeCooldown > 0) e.meleeCooldown--;
  if (e.fireballCooldown > 0) e.fireballCooldown--;

  const dx = player.x - e.x;
  const dist = Math.abs(dx);
  e.facing = dx >= 0 ? 1 : -1;

  // Melee state machine
  if (e.isAttacking) {
    if (e.meleeWindup > 0) {
      e.meleeWindup--;
      if (e.meleeWindup <= 0) {
        e.meleeSwing = e.meleeSwingDuration;
        playSound('enemyAttack');
        e.doMeleeHit();
      }
      return false;
    }
    if (e.meleeSwing > 0) {
      e.meleeSwing--;
      if (e.meleeSwing <= 0) { e.isAttacking = false; e.meleeCooldown = e.meleeMaxCooldown; }
      return false;
    }
    return false;
  }

  // Fireball charging
  if (e.fireballCharging) {
    e.fireballChargeTimer--;
    if (e.fireballChargeTimer <= 0) {
      e.fireballCharging = false;
      e.fireballCooldown = e.fireballMaxCooldown;
      e.shootFireball();
    }
    return false;
  }

  // Movement
  if (dist > e.meleeRange) e.x += e.facing * e.speed * dbg.enemySpeedMult;

  // Separation
  for (const other of enemies) {
    if (other === e || other.dead) continue;
    const ox = (e.x + e.w/2) - (other.x + other.w/2);
    const sepDist = Math.abs(ox);
    const minSep = (e.w + other.w) / 2 + 6;
    if (sepDist < minSep && sepDist > 0) e.x += (minSep - sepDist) * 0.3 * Math.sign(ox);
    else if (sepDist === 0) e.x += (Math.random() - 0.5) * 4;
  }

  // Decide melee
  if (dist <= e.meleeRange && e.meleeCooldown <= 0 && !e.fireballCharging) {
    e.isAttacking = true; e.meleeWindup = e.meleeWindupDuration;
  }

  // Decide fireball
  if (dist > 80 && dist < 500 && e.fireballCooldown <= 0 && !e.isAttacking) {
    e.fireballCharging = true; e.fireballChargeTimer = e.fireballChargeDuration;
  }

  if (e.y + e.h > GROUND_Y + 50) e.y = GROUND_Y + 50 - e.h;
  if (e.x < -10) e.x = -10;
  if (e.x + e.w > W + 10) e.x = W + 10 - e.w;
  return false;
}

function enemyMeleeHit(e) {
  const atkBox = { x: e.facing === 1 ? e.x + e.w : e.x - 40, y: e.y, w: 40, h: e.h };
  if (player.iFrames <= 0 && !player.dashing && !dbg.godMode && rectsOverlap(atkBox, player)) {
    let dmg = 1;
    if (darkPowers.includes('bonearmor')) dmg = Math.max(1, dmg - 1);
    dmg = Math.max(1, dmg - (getShopBuffs().dmgReduce || 0));
    player.hp -= dmg;
    player.iFrames = 60;
    shakeTimer = 6; shakeIntensity = 4;
    player.x += e.facing * 30;
    spawnParticles(player.x + player.w/2, player.y + player.h/2, 5, '#f55');
    playSound('hurt');
    if (player.hp <= 0) gameOver();
  }
}

function enemyShootFireball(e) {
  // Enforce fireball cap
  const maxFb = currentLevelConfig?.maxFireballs || 99;
  if (fireballs.length >= maxFb) return;

  const fx = e.x + e.w/2, fy = e.y + e.h/2;
  const targetX = player.x + player.w/2, targetY = player.y + player.h/2;
  const angle = Math.atan2(targetY - fy, targetX - fx);
  const fbSpeed = 3.5 + waveNumber * 0.15;
  fireballs.push({
    x: fx, y: fy,
    vx: Math.cos(angle) * fbSpeed, vy: Math.sin(angle) * fbSpeed,
    radius: 6, trackStrength: 0.015 + Math.random() * 0.01, life: 180, trail: []
  });
  spawnParticles(fx, fy, 4, '#f80');
}

function drawRegularEnemy(e) {
  ctx.save();
  const cx = e.x + e.w/2, by = e.y + e.h;
  if (e.dead) ctx.globalAlpha = e.deathTimer / 20;
  ctx.translate(cx, by);

  if (enemyWalkSprite.complete && enemyAtkSprite.complete) {
    ctx.scale(-e.facing, 1);
    let frame = 0;
    let sprite = enemyWalkSprite;

    if (e.isAttacking) {
      sprite = enemyAtkSprite;
      const total = e.meleeWindupDuration + e.meleeSwingDuration;
      const current = (e.meleeWindup > 0) ? (e.meleeWindupDuration - e.meleeWindup) : (e.meleeWindupDuration + (e.meleeSwingDuration - e.meleeSwing));
      const p = current / total;
      frame = Math.min(8, Math.floor(p * 9));
    } else {
      frame = Math.floor(e.animTimer / ((e.speed+1)*3)) % 6; // slightly scale animate with speed
    }

    if (e.hitFlash > 0) ctx.filter = 'brightness(200%) saturate(200%)';
    ctx.drawImage(sprite, frame * 64, 0, 64, 64, -48, -96, 96, 96);
    if (e.hitFlash > 0) ctx.filter = 'none';

    ctx.scale(-e.facing, 1);

    // Fireball charge visual
    if (e.fireballCharging) {
      const progress = 1 - e.fireballChargeTimer / e.fireballChargeDuration;
      const orbSize = 3 + progress * 6;
      ctx.fillStyle = `rgba(255, 136, 0, ${0.5 + progress * 0.5})`;
      ctx.beginPath(); ctx.arc(e.facing * 18, -e.h * 0.4, orbSize, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(255, 200, 0, ${progress * 0.6})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(e.facing * 18, -e.h * 0.4, orbSize + 4, 0, Math.PI * 2); ctx.stroke();
    }
  } else {
    const baseColor = e.hitFlash > 0 ? '#fff' : (e.fireballCharging ? '#f80' : '#f55');
    ctx.strokeStyle = baseColor; ctx.lineWidth = 2;
    ctx.strokeRect(-e.w/2, -e.h, e.w, e.h);

    // Head triangle
    ctx.beginPath();
    ctx.moveTo(-8, -e.h); ctx.lineTo(0, -e.h - 16); ctx.lineTo(8, -e.h); ctx.closePath(); ctx.stroke();

    // Eyes
    if (e.fireballCharging) { ctx.fillStyle = '#ff0'; ctx.shadowColor = '#f80'; ctx.shadowBlur = 8; }
    else ctx.fillStyle = baseColor;
    ctx.fillRect(-7, -e.h + 6, 4, 3); ctx.fillRect(3, -e.h + 6, 4, 3);
    ctx.shadowBlur = 0;

    // Mouth
    ctx.strokeStyle = baseColor;
    ctx.beginPath();
    ctx.moveTo(-4, -e.h + 14); ctx.lineTo(4, -e.h + 20);
    ctx.moveTo(4, -e.h + 14); ctx.lineTo(-4, -e.h + 20);
    ctx.stroke();

    // Legs
    const bob = Math.sin(e.animTimer * 0.1) * 4;
    ctx.beginPath();
    ctx.moveTo(-5, 0); ctx.lineTo(-5 + bob, 8);
    ctx.moveTo(5, 0); ctx.lineTo(5 - bob, 8);
    ctx.stroke();

    // Melee visuals
    if (e.isAttacking) {
      const armX = e.facing * 10;
      if (e.meleeWindup > 0) {
        const pull = 1 - e.meleeWindup / e.meleeWindupDuration;
        ctx.strokeStyle = '#f88'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(armX, -e.h * 0.5);
        ctx.lineTo(armX - e.facing * (15 + pull * 10), -e.h * 0.5 - pull * 15); ctx.stroke();
        ctx.strokeStyle = `rgba(255,100,100,${0.3 + pull * 0.5})`;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(e.facing === 1 ? e.w/2 : -e.w/2 - 40, -e.h, 40, e.h);
        ctx.setLineDash([]);
      } else if (e.meleeSwing > 0) {
        const progress = 1 - e.meleeSwing / e.meleeSwingDuration;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
        const swingAngle = -Math.PI * 0.3 + progress * Math.PI * 0.6;
        ctx.beginPath(); ctx.moveTo(armX, -e.h * 0.5);
        ctx.lineTo(armX + Math.cos(swingAngle) * 30 * e.facing, -e.h * 0.5 + Math.sin(swingAngle) * 30); ctx.stroke();
      }
    }

    // Fireball charge visual
    if (e.fireballCharging) {
      const progress = 1 - e.fireballChargeTimer / e.fireballChargeDuration;
      const orbSize = 3 + progress * 6;
      ctx.fillStyle = `rgba(255, 136, 0, ${0.5 + progress * 0.5})`;
      ctx.beginPath(); ctx.arc(e.facing * 18, -e.h * 0.4, orbSize, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(255, 200, 0, ${progress * 0.6})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(e.facing * 18, -e.h * 0.4, orbSize + 4, 0, Math.PI * 2); ctx.stroke();
    }
  }

  // HP bar
  if (e.hp < e.maxHp && !e.dead) {
    const barW = 30, barH = 4;
    ctx.fillStyle = '#333'; ctx.fillRect(-barW/2, -e.h - 24, barW, barH);
    ctx.fillStyle = '#f55'; ctx.fillRect(-barW/2, -e.h - 24, barW * (e.hp / e.maxHp), barH);
  }

  ctx.restore();
}

// ═══════════════════════════════════════════════════════════
//  BOSS DEMON
// ═══════════════════════════════════════════════════════════
function createBoss() {
  return {
    x: W - 150, y: GROUND_Y - 30,
    w: 60, h: 80,
    speed: 0.5,
    hp: 80, maxHp: 80,
    facing: -1,
    dead: false,
    deathTimer: 0,
    hitFlash: 0,
    knockback: 0,
    fireTimer: 0,
    animTimer: 0,
    isBoss: true,

    // Phase tracking
    phase: 1,
    phaseTransitionTimer: 0,

    // Melee
    meleeRange: 70,
    meleeCooldown: 60,
    meleeMaxCooldown: 120,
    meleeWindup: 0,
    meleeWindupDuration: 35,
    meleeSwing: 0,
    meleeSwingDuration: 20,
    isAttacking: false,
    meleeDmg: 2,

    // Fireball
    fireballCooldown: 90,
    fireballMaxCooldown: 150,
    fireballCharging: false,
    fireballChargeTimer: 0,
    fireballChargeDuration: 50,

    // Ground pound (phase 2+)
    groundPounding: false,
    gpJumpTimer: 0,
    gpSlamTimer: 0,
    gpCooldown: 0,
    gpMaxCooldown: 300,
    originalY: GROUND_Y - 30,

    // Minion spawning (phase 3)
    minionTimer: 0,
    minionInterval: 600,

    update() { return updateBoss(this); },
    draw() { drawBoss(this); },
    doMeleeHit() { bossMeleeHit(this); },
    shootFireball() { bossShootFireball(this); }
  };
}

function getBossPhase(boss) {
  const pct = boss.hp / boss.maxHp;
  if (pct > 0.6) return 1;
  if (pct > 0.3) return 2;
  return 3;
}

function updateBoss(b) {
  b.animTimer++;
  if (b.dead) { b.deathTimer--; return b.deathTimer <= 0; }

  const newPhase = getBossPhase(b);
  if (newPhase !== b.phase) {
    b.phase = newPhase;
    b.phaseTransitionTimer = 60;
    shakeTimer = 20; shakeIntensity = 8;
    spawnParticles(b.x + b.w/2, b.y + b.h/2, 20, b.phase === 3 ? '#f00' : '#f80');
    playSound('bargain');
    // Phase adjustments
    if (b.phase === 2) {
      b.speed = 0.8; b.meleeMaxCooldown = 90; b.fireballMaxCooldown = 120;
    }
    if (b.phase === 3) {
      b.speed = 1.2; b.meleeMaxCooldown = 60; b.fireballMaxCooldown = 80; b.meleeDmg = 3;
    }
  }

  if (b.phaseTransitionTimer > 0) { b.phaseTransitionTimer--; return false; }

  // Knockback
  if (b.knockback !== 0) {
    b.x += b.knockback * 0.3; // Boss resists knockback
    b.knockback *= 0.8;
    if (Math.abs(b.knockback) < 0.2) b.knockback = 0;
  }

  if (b.hitFlash > 0) b.hitFlash--;
  if (b.meleeCooldown > 0) b.meleeCooldown--;
  if (b.fireballCooldown > 0) b.fireballCooldown--;
  if (b.gpCooldown > 0) b.gpCooldown--;

  const dx = player.x - b.x;
  const dist = Math.abs(dx);
  b.facing = dx >= 0 ? 1 : -1;

  // Ground pound
  if (b.groundPounding) {
    if (b.gpJumpTimer > 0) {
      b.gpJumpTimer--;
      b.y -= 4;
    } else if (b.gpSlamTimer > 0) {
      b.gpSlamTimer--;
      b.y += 8;
      if (b.y >= b.originalY) {
        b.y = b.originalY;
        b.groundPounding = false;
        b.gpCooldown = b.gpMaxCooldown;
        // Shockwave
        shakeTimer = 15; shakeIntensity = 8;
        const shockBox = { x: b.x - 100, y: GROUND_Y + 50 - 40, w: b.w + 200, h: 40 };
        if (player.iFrames <= 0 && !player.dashing && !dbg.godMode && rectsOverlap(shockBox, player)) {
          player.hp -= 2; player.iFrames = 60;
          player.vy = -8;
          playSound('hurt');
          if (player.hp <= 0) gameOver();
        }
        for (let i = 0; i < 20; i++) spawnParticles(b.x + b.w/2 + (Math.random()-0.5)*200, GROUND_Y + 50, 1, '#f80');
      }
    }
    return false;
  }

  // Melee state machine
  if (b.isAttacking) {
    if (b.meleeWindup > 0) {
      b.meleeWindup--;
      if (b.meleeWindup <= 0) { b.meleeSwing = b.meleeSwingDuration; b.doMeleeHit(); }
      return false;
    }
    if (b.meleeSwing > 0) {
      b.meleeSwing--;
      if (b.meleeSwing <= 0) { b.isAttacking = false; b.meleeCooldown = b.meleeMaxCooldown; }
      return false;
    }
    return false;
  }

  // Fireball charging
  if (b.fireballCharging) {
    b.fireballChargeTimer--;
    if (b.fireballChargeTimer <= 0) {
      b.fireballCharging = false;
      b.fireballCooldown = b.fireballMaxCooldown;
      b.shootFireball();
    }
    return false;
  }

  // Movement
  if (dist > b.meleeRange) b.x += b.facing * b.speed * dbg.enemySpeedMult;

  // Decide actions
  // Phase 2+: ground pound
  if (b.phase >= 2 && b.gpCooldown <= 0 && dist < 200 && !b.isAttacking) {
    b.groundPounding = true;
    b.gpJumpTimer = 20; b.gpSlamTimer = 30;
    return false;
  }
  // Melee
  if (dist <= b.meleeRange && b.meleeCooldown <= 0) {
    b.isAttacking = true; b.meleeWindup = b.meleeWindupDuration;
  }
  // Fireball
  if (dist > 60 && dist < 600 && b.fireballCooldown <= 0 && !b.isAttacking) {
    b.fireballCharging = true; b.fireballChargeTimer = b.fireballChargeDuration;
  }

  // Phase 3: spawn minions
  if (b.phase === 3) {
    b.minionTimer++;
    if (b.minionTimer >= b.minionInterval) {
      b.minionTimer = 0;
      for (let i = 0; i < 2; i++) {
        const minion = createEnemy(5, { enemyHpBase: 2, enemyHpScale: 0 });
        minion.x = b.x + (i === 0 ? -60 : b.w + 30);
        minion.maxHp = 2; minion.hp = 2;
        enemies.push(minion);
        enemiesRemaining++;
      }
      spawnParticles(b.x + b.w/2, b.y + b.h/2, 10, '#f44');
    }
  }

  if (b.x < 20) b.x = 20;
  if (b.x + b.w > W - 20) b.x = W - 20 - b.w;
  return false;
}

function bossMeleeHit(b) {
  const atkBox = { x: b.facing === 1 ? b.x + b.w : b.x - 70, y: b.y, w: 70, h: b.h };
  if (player.iFrames <= 0 && !player.dashing && !dbg.godMode && rectsOverlap(atkBox, player)) {
    let dmg = b.meleeDmg;
    if (darkPowers.includes('bonearmor')) dmg = Math.max(1, dmg - 1);
    dmg = Math.max(1, dmg - (getShopBuffs().dmgReduce || 0));
    player.hp -= dmg;
    player.iFrames = 60;
    shakeTimer = 10; shakeIntensity = 6;
    player.x += b.facing * 50;
    spawnParticles(player.x + player.w/2, player.y + player.h/2, 8, '#f55');
    playSound('hurt');
    if (player.hp <= 0) gameOver();
  }
}

function bossShootFireball(b) {
  const fx = b.x + b.w/2, fy = b.y + b.h * 0.3;
  const targetX = player.x + player.w/2, targetY = player.y + player.h/2;
  const baseAngle = Math.atan2(targetY - fy, targetX - fx);
  const count = b.phase === 1 ? 1 : (b.phase === 2 ? 3 : 5);
  const spread = 0.2;
  const maxFb = currentLevelConfig?.maxFireballs || 99;

  for (let i = 0; i < count; i++) {
    if (fireballs.length >= maxFb) break;
    const angle = baseAngle + (i - Math.floor(count/2)) * spread;
    const fbSpeed = b.phase === 1 ? 3 : (b.phase === 2 ? 4 : 5);
    fireballs.push({
      x: fx, y: fy,
      vx: Math.cos(angle) * fbSpeed, vy: Math.sin(angle) * fbSpeed,
      radius: b.phase >= 2 ? 8 : 6, trackStrength: 0.01, life: 200, trail: []
    });
  }
  spawnParticles(fx, fy, 6, '#f80');
}

function drawBoss(b) {
  ctx.save();
  const cx = b.x + b.w/2, by = b.y + b.h;
  if (b.dead) ctx.globalAlpha = b.deathTimer / 40;
  ctx.translate(cx, by);

  // Enrage glow (phase 3)
  if (b.phase === 3) {
    ctx.shadowColor = '#f00';
    ctx.shadowBlur = 15 + Math.sin(b.animTimer * 0.1) * 5;
  }

  const baseColor = b.hitFlash > 0 ? '#fff' : (b.phase === 3 ? '#f22' : (b.phase === 2 ? '#f80' : '#f55'));
  ctx.strokeStyle = baseColor; ctx.lineWidth = 3;

  // Body
  ctx.strokeRect(-b.w/2, -b.h, b.w, b.h);

  // Horns
  ctx.beginPath();
  ctx.moveTo(-20, -b.h); ctx.lineTo(-30, -b.h - 30); ctx.lineTo(-10, -b.h);
  ctx.moveTo(20, -b.h); ctx.lineTo(30, -b.h - 30); ctx.lineTo(10, -b.h);
  ctx.stroke();

  // Eyes (large, menacing)
  ctx.fillStyle = b.phase === 3 ? '#ff0' : (b.fireballCharging ? '#ff0' : baseColor);
  if (b.fireballCharging || b.phase === 3) { ctx.shadowColor = '#f80'; ctx.shadowBlur = 12; }
  ctx.fillRect(-15, -b.h + 15, 8, 6);
  ctx.fillRect(7, -b.h + 15, 8, 6);
  ctx.shadowBlur = 0;

  // Mouth
  ctx.strokeStyle = baseColor; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = -12; i < 12; i += 6) {
    ctx.moveTo(i, -b.h + 35); ctx.lineTo(i + 3, -b.h + 40);
  }
  ctx.stroke();

  // Melee visual
  if (b.isAttacking) {
    if (b.meleeWindup > 0) {
      const pull = 1 - b.meleeWindup / b.meleeWindupDuration;
      ctx.strokeStyle = '#f88'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(b.facing * 25, -b.h * 0.4);
      ctx.lineTo(b.facing * (25 - b.facing * (20 + pull * 20)), -b.h * 0.4 - pull * 25); ctx.stroke();
    } else if (b.meleeSwing > 0) {
      const progress = 1 - b.meleeSwing / b.meleeSwingDuration;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
      const swingAngle = -Math.PI * 0.4 + progress * Math.PI * 0.8;
      ctx.beginPath(); ctx.moveTo(b.facing * 25, -b.h * 0.4);
      ctx.lineTo(b.facing * 25 + Math.cos(swingAngle) * 50 * b.facing, -b.h * 0.4 + Math.sin(swingAngle) * 50);
      ctx.stroke();
    }
  }

  // Ground pound visual
  if (b.groundPounding && b.gpSlamTimer > 0) {
    ctx.strokeStyle = '#f80'; ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const ox = (Math.random() - 0.5) * 30;
      ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, 30); ctx.stroke();
    }
  }

  // Fireball charge
  if (b.fireballCharging) {
    const progress = 1 - b.fireballChargeTimer / b.fireballChargeDuration;
    const orbSize = 5 + progress * 12;
    ctx.fillStyle = `rgba(255, 136, 0, ${0.5 + progress * 0.5})`;
    ctx.beginPath(); ctx.arc(b.facing * 35, -b.h * 0.3, orbSize, 0, Math.PI * 2); ctx.fill();
  }

  // Phase transition flash
  if (b.phaseTransitionTimer > 0) {
    ctx.globalAlpha = b.phaseTransitionTimer / 60;
    ctx.fillStyle = '#fff';
    ctx.fillRect(-b.w/2 - 10, -b.h - 30, b.w + 20, b.h + 40);
  }

  ctx.restore();
}

// Draw boss HP bar at top of screen
function drawBossHpBar() {
  const boss = enemies.find(e => e.isBoss && !e.dead);
  if (!boss) return;
  const barW = W * 0.6, barH = 12;
  const bx = (W - barW) / 2, by = 50;

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(bx - 4, by - 4, barW + 8, barH + 8);
  ctx.fillStyle = '#333';
  ctx.fillRect(bx, by, barW, barH);

  const pct = boss.hp / boss.maxHp;
  const color = boss.phase === 3 ? '#f22' : (boss.phase === 2 ? '#f80' : '#f55');
  ctx.fillStyle = color;
  ctx.fillRect(bx, by, barW * pct, barH);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText(`DEMON LORD — ${Math.ceil(boss.hp)} / ${boss.maxHp}`, W/2, by + 10);
  ctx.textAlign = 'left';

  // Phase indicator
  ctx.fillStyle = '#aaa';
  ctx.font = '10px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText(`Phase ${boss.phase}`, W/2, by + 24);
  ctx.textAlign = 'left';
}
