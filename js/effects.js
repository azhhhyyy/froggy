// ═══════════════════════════════════════════════════════════
//  EFFECTS.JS — Particles, fireballs, afterimages, platforms
// ═══════════════════════════════════════════════════════════

// ─── Particles ────────────────────────────────────────────
function spawnParticles(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6 - 2,
      life: 20 + Math.random() * 15,
      maxLife: 35,
      color,
      size: 2 + Math.random() * 3
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  particles.forEach(p => {
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  });
  ctx.globalAlpha = 1;
}

// ─── Fireballs ────────────────────────────────────────────
function updateFireballs() {
  for (let i = fireballs.length - 1; i >= 0; i--) {
    const fb = fireballs[i];
    fb.life--;

    // Slight tracking toward player
    const targetX = player.x + player.w / 2;
    const targetY = player.y + player.h / 2;
    const desiredAngle = Math.atan2(targetY - fb.y, targetX - fb.x);
    const currentAngle = Math.atan2(fb.vy, fb.vx);
    let angleDiff = desiredAngle - currentAngle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    const steer = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), fb.trackStrength);
    const newAngle = currentAngle + steer;
    const spd = Math.sqrt(fb.vx * fb.vx + fb.vy * fb.vy);
    fb.vx = Math.cos(newAngle) * spd;
    fb.vy = Math.sin(newAngle) * spd;

    fb.x += fb.vx;
    fb.y += fb.vy;

    fb.trail.push({ x: fb.x, y: fb.y });
    if (fb.trail.length > 8) fb.trail.shift();

    // Collision with player
    if (!player.dashing && player.iFrames <= 0 && !dbg.godMode) {
      const dx = fb.x - (player.x + player.w / 2);
      const dy = fb.y - (player.y + player.h / 2);
      const hitDist = fb.radius + 15;
      if (dx * dx + dy * dy < hitDist * hitDist) {
        let dmg = 1;
        if (darkPowers.includes('bonearmor')) dmg = Math.max(1, dmg - 1);
        player.hp -= dmg;
        player.iFrames = 60;
        shakeTimer = 6; shakeIntensity = 3;
        spawnParticles(fb.x, fb.y, 8, '#f80');
        playSound('hurt');
        fireballs.splice(i, 1);
        if (player.hp <= 0) gameOver();
        continue;
      }
    }

    // Remove if off-screen or expired
    if (fb.life <= 0 || fb.x < -30 || fb.x > W + 30 || fb.y < -30 || fb.y > H + 30) {
      spawnParticles(fb.x, fb.y, 3, '#f80');
      fireballs.splice(i, 1);
    }
  }
}

function drawFireballs() {
  fireballs.forEach(fb => {
    for (let i = 0; i < fb.trail.length; i++) {
      const t = fb.trail[i];
      const alpha = (i / fb.trail.length) * 0.4;
      const size = (i / fb.trail.length) * fb.radius;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#f80';
      ctx.beginPath();
      ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#f80';
    ctx.beginPath();
    ctx.arc(fb.x, fb.y, fb.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.arc(fb.x, fb.y, fb.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 136, 0, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(fb.x, fb.y, fb.radius + 3, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
}

// ─── Afterimages (dash trail) ─────────────────────────────
function updateAfterimages() {
  for (let i = afterimages.length - 1; i >= 0; i--) {
    afterimages[i].life--;
    if (afterimages[i].life <= 0) afterimages.splice(i, 1);
  }
}

function drawAfterimages() {
  afterimages.forEach(a => {
    const alpha = a.life / a.maxLife * 0.4;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#5af';
    ctx.lineWidth = 1.5;
    const cx = a.x + a.w / 2;
    const by = a.y + a.h;
    ctx.save();
    ctx.translate(cx, by);
    ctx.strokeRect(-a.w / 2, -a.h, a.w, a.h);
    ctx.beginPath();
    ctx.arc(0, -a.h - 12, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });
  ctx.globalAlpha = 1;
}

// ─── Platforms ────────────────────────────────────────────
function generatePlatforms() {
  platforms = [];
  const DASH_JUMP_HEIGHT = 140;
  const MIN_Y = GROUND_Y - DASH_JUMP_HEIGHT - 30;
  const MAX_Y = GROUND_Y - 80;
  const NUM_PLATFORMS = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < NUM_PLATFORMS; i++) {
    const pw = 60 + Math.floor(Math.random() * 50);
    const px = 50 + Math.random() * (W - 100 - pw);
    const py = MIN_Y + Math.random() * (MAX_Y - MIN_Y);
    let overlaps = false;
    for (const existing of platforms) {
      if (Math.abs(px - existing.x) < pw + 20 && Math.abs(py - existing.y) < 40) {
        overlaps = true; break;
      }
    }
    if (!overlaps) {
      platforms.push({ x: px, y: py, w: pw, h: 10, glow: Math.random() * Math.PI * 2 });
    }
  }
}

function checkPlatformCollision(entity) {
  if (entity.vy < 0) return;
  for (const plat of platforms) {
    const entityBottom = entity.y + entity.h;
    const entityPrevBottom = entityBottom - entity.vy;
    if (entity.x + entity.w > plat.x && entity.x < plat.x + plat.w &&
        entityPrevBottom <= plat.y + 4 && entityBottom >= plat.y) {
      entity.y = plat.y - entity.h;
      entity.vy = 0;
      entity.onGround = true;
    }
  }
}

function drawPlatforms() {
  platforms.forEach(plat => {
    plat.glow += 0.03;
    const glowAlpha = 0.15 + Math.sin(plat.glow) * 0.08;
    ctx.fillStyle = '#2a3a4a';
    ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
    ctx.strokeStyle = '#5af';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(plat.x, plat.y);
    ctx.lineTo(plat.x + plat.w, plat.y);
    ctx.stroke();
    ctx.fillStyle = `rgba(80, 160, 255, ${glowAlpha})`;
    ctx.fillRect(plat.x - 2, plat.y + plat.h, plat.w + 4, 6);
    ctx.fillStyle = '#5af';
    ctx.fillRect(plat.x, plat.y, 3, 3);
    ctx.fillRect(plat.x + plat.w - 3, plat.y, 3, 3);
  });
}

// ─── Riff Beam ────────────────────────────────────────────
function updateRiffBeam() {
  if (!riffBeam) return;
  riffBeam.x += riffBeam.vx;
  riffBeam.life--;

  // Check enemy collisions
  if (riffBeam.killsLeft > 0) {
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.dead) continue;
      const beamBox = { x: riffBeam.x - riffBeam.width/2, y: riffBeam.y - 25, w: riffBeam.width, h: 50 };
      if (rectsOverlap(beamBox, e)) {
        e.hp = 0;
        killEnemy(e);
        riffBeam.killsLeft--;
        spawnParticles(e.x + e.w/2, e.y + e.h/2, 15, '#a0f');
        if (riffBeam.killsLeft <= 0) break;
      }
    }
  }

  // Draw trail particles
  if (riffBeam.life > 0) {
    for (let i = 0; i < 3; i++) {
      spawnParticles(riffBeam.x + (Math.random()-0.5)*20, riffBeam.y + (Math.random()-0.5)*30, 1, riffBeam.color || '#a0f');
    }
  }

  if (riffBeam.life <= 0 || riffBeam.x < -100 || riffBeam.x > W + 100) {
    riffBeam = null;
  }
}

function drawRiffBeam() {
  if (!riffBeam) return;
  const b = riffBeam;
  ctx.save();
  ctx.globalAlpha = Math.min(1, b.life / 10);
  // Outer glow
  ctx.fillStyle = 'rgba(160, 0, 255, 0.15)';
  ctx.fillRect(b.x - b.width/2 - 10, b.y - 35, b.width + 20, 70);
  // Main beam
  const grad = ctx.createLinearGradient(b.x - b.width/2, b.y - 20, b.x - b.width/2, b.y + 20);
  grad.addColorStop(0, 'rgba(200, 80, 255, 0)');
  grad.addColorStop(0.3, 'rgba(200, 80, 255, 0.8)');
  grad.addColorStop(0.5, '#fff');
  grad.addColorStop(0.7, 'rgba(200, 80, 255, 0.8)');
  grad.addColorStop(1, 'rgba(200, 80, 255, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(b.x - b.width/2, b.y - 20, b.width, 40);
  // Core
  ctx.fillStyle = '#fff';
  ctx.fillRect(b.x - b.width/2, b.y - 5, b.width, 10);
  ctx.restore();
}

// ─── Utilities ────────────────────────────────────────────
function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

function getClosestEnemies(box, maxCount) {
  const px = player.x + player.w / 2;
  const py = player.y + player.h / 2;
  return enemies
    .filter(e => !e.dead && rectsOverlap(box, e))
    .sort((a, b) => {
      const da = Math.abs(a.x + a.w/2 - px) + Math.abs(a.y + a.h/2 - py);
      const db = Math.abs(b.x + b.w/2 - px) + Math.abs(b.y + b.h/2 - py);
      return da - db;
    })
    .slice(0, maxCount);
}

function getClosestEnemiesRadius(cx, cy, radius, maxCount) {
  return enemies
    .filter(e => {
      if (e.dead) return false;
      const dx = (e.x + e.w/2) - cx;
      const dy = (e.y + e.h/2) - cy;
      return Math.sqrt(dx*dx + dy*dy) < radius;
    })
    .sort((a, b) => {
      const da = Math.abs(a.x + a.w/2 - cx) + Math.abs(a.y + a.h/2 - cy);
      const db = Math.abs(b.x + b.w/2 - cx) + Math.abs(b.y + b.h/2 - cy);
      return da - db;
    })
    .slice(0, maxCount);
}

// ─── Drawing helpers ──────────────────────────────────────
function drawGround() {
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + 50);
  ctx.lineTo(W, GROUND_Y + 50);
  ctx.stroke();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y + 50);
    ctx.lineTo(x + 10, GROUND_Y + 60);
    ctx.stroke();
  }
  ctx.strokeStyle = '#555';
  ctx.setLineDash([5, 8]);
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + 2);
  ctx.lineTo(W, GROUND_Y + 2);
  ctx.stroke();
  ctx.setLineDash([]);
}
