// ═══════════════════════════════════════════════════════════
//  PLAYER.JS — Player object, input, drawing
// ═══════════════════════════════════════════════════════════

const froggySprite = new Image();
froggySprite.src = 'sprites/froggy-walking.png';
const froggyIdle = new Image();
froggyIdle.src = 'sprites/froggy-idle.png';
const froggyAtkLight = new Image();
froggyAtkLight.src = 'sprites/froggy-atk-light.png';
const froggyAtkLightEnergy = new Image();
froggyAtkLightEnergy.src = 'sprites/froggy-atk-light-energy.png';
const froggyAtkHeavy = new Image();
froggyAtkHeavy.src = 'sprites/froggy-atk-heavy.png';
const froggyAtkHeavyEnergy = new Image();
froggyAtkHeavyEnergy.src = 'sprites/froggy-atk-heavy-energy.png';

const keys = {};
window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; e.preventDefault(); });
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

const player = {
  x: 120, y: 0, w: 45, h: 75, // y will be set dynamically below
  vx: 0, vy: 0,
  speed: 3.2,
  jumpForce: -10,
  gravity: 0.45,
  onGround: true,
  crouching: false,
  hp: 5,
  maxHp: 5,
  facing: 1,

  // Light attack
  lightAttacking: false,
  lightAttackTimer: 0,
  lightAttackDuration: 12,
  lightAttackCooldown: 0,

  // Heavy attack
  heavyAttacking: false,
  heavyAttackTimer: 0,
  heavyAttackDuration: 20,
  heavyCooldown: 0,
  heavyMaxCooldown: 240,

  // Invincibility frames
  iFrames: 0,

  // Dash
  dashing: false,
  dashTimer: 0,
  dashDuration: 12,
  dashSpeed: 10,
  dashCooldown: 0,
  dashMaxCooldown: 90,

  // Dash Jump
  dashJumping: false,
  dashJumpTimer: 0,
  dashJumpDuration: 14,
  recentlyJumped: false,
  jumpGraceTimer: 0,
  jumpGraceWindow: 12,

  // Animation
  walkFrame: 0,
  walkTimer: 0,
  idleFrame: 0,
  idleTimer: 0,

  reset(overrideHp) {
    this.x = 120; this.y = GROUND_Y + 50 - this.h;
    this.vx = 0; this.vy = 0;
    this.maxHp = overrideHp || 5;
    this.hp = this.maxHp;
    this.onGround = true; this.crouching = false;
    this.lightAttacking = false; this.lightAttackTimer = 0; this.lightAttackCooldown = 0;
    this.heavyAttacking = false; this.heavyAttackTimer = 0; this.heavyCooldown = 0;
    this.dashing = false; this.dashTimer = 0; this.dashCooldown = 0;
    this.dashJumping = false; this.dashJumpTimer = 0;
    this.recentlyJumped = false; this.jumpGraceTimer = 0;
    this.iFrames = 0; this.facing = 1;
  },

  update() {
    const currentH = this.crouching ? 45 : 75;

    if (this.dashCooldown > 0) this.dashCooldown--;
    if (this.jumpGraceTimer > 0) this.jumpGraceTimer--;
    else this.recentlyJumped = false;

    // ── Dash Jump active ──
    if (this.dashJumping) {
      this.dashJumpTimer--;
      this.iFrames = 3;
      if (this.dashJumpTimer % 2 === 0) {
        afterimages.push({ x: this.x, y: this.y, w: this.w, h: this.h, facing: this.facing, life: 14, maxLife: 14 });
      }
      if (this.dashJumpTimer <= 0) { this.dashJumping = false; this.vy = 0; }
      this.vy += this.gravity * 0.5;
      this.x += this.vx; this.y += this.vy; this.h = currentH;
      this.onGround = false;
      checkPlatformCollision(this);
      if (this.onGround) { this.dashJumping = false; this.vy = 0; }
      if (this.y + this.h >= GROUND_Y + 50) { this.y = GROUND_Y + 50 - this.h; this.vy = 0; this.onGround = true; this.dashJumping = false; }
      if (this.x < 0) this.x = 0;
      if (this.x + this.w > W) this.x = W - this.w;
      this._tickCooldowns();
      return;
    }

    // ── Dash active ──
    if (this.dashing) {
      this.dashTimer--;
      this.vx = this.facing * this.dashSpeed;
      this.iFrames = 3;
      if (this.dashTimer % 2 === 0) {
        afterimages.push({ x: this.x, y: this.y, w: this.w, h: this.h, facing: this.facing, life: 12, maxLife: 12 });
        if (darkPowers.includes('shadowdash')) {
          enemies.forEach(e => {
            if (!e.dead && rectsOverlap({ x: this.x, y: this.y, w: this.w, h: this.h }, e)) {
              e.hp -= 1; e.hitFlash = 6;
              spawnParticles(e.x + e.w/2, e.y + e.h/2, 3, '#a5f');
              if (e.hp <= 0) killEnemy(e);
            }
          });
        }
      }
        if (this.dashTimer <= 0) { this.dashing = false; this.vx = 0; this.vy = 0; }
      this.x += this.vx; this.y += this.vy; this.h = currentH;
      // freeze gravity during normal dash
      this.onGround = false;
      checkPlatformCollision(this);
      if (this.y + this.h >= GROUND_Y + 50) { this.y = GROUND_Y + 50 - this.h; this.vy = 0; this.onGround = true; }
      if (this.x < 0) this.x = 0;
      if (this.x + this.w > W) this.x = W - this.w;
      this._tickCooldowns();
      return;
    }

    // Movement
    let moving = false;
    if (!this.heavyAttacking) {
      if (keys['a'] || keys['arrowleft']) {
        const spd = this.speed * (1 + (getShopBuffs().speedBonus || 0));
        this.vx = -spd * dbg.playerSpeedMult; this.facing = -1; moving = true;
      }
      else if (keys['d'] || keys['arrowright']) {
        const spd = this.speed * (1 + (getShopBuffs().speedBonus || 0));
        this.vx = spd * dbg.playerSpeedMult; this.facing = 1; moving = true;
      }
      else { this.vx = 0; }
    } else { this.vx = 0; }

    // Walk / Idle animation
    if (moving && this.onGround) {
      this.walkTimer++;
      if (this.walkTimer > 5) { this.walkTimer = 0; this.walkFrame = (this.walkFrame + 1) % 8; }
      this.idleFrame = 0; this.idleTimer = 0;
    } else if (this.onGround && !this.lightAttacking && !this.heavyAttacking && !this.crouching) {
      this.walkFrame = 0; this.walkTimer = 0;
      this.idleTimer++;
      if (this.idleTimer > 6) { this.idleTimer = 0; this.idleFrame = (this.idleFrame + 1) % 11; }
    } else {
      this.walkFrame = 0; this.walkTimer = 0;
      this.idleFrame = 0; this.idleTimer = 0;
    }

    // Jump
    if ((keys['w'] || keys['arrowup'] || keys[' ']) && this.onGround && !this.heavyAttacking) {
      this.vy = this.jumpForce;
      this.onGround = false;
      this.crouching = false;
      this.recentlyJumped = true;
      this.jumpGraceTimer = this.jumpGraceWindow;
    }

    // Crouch
    if ((keys['s'] || keys['arrowdown']) && this.onGround && !this.lightAttacking && !this.heavyAttacking) {
      this.crouching = true;
    } else { this.crouching = false; }

    // Gravity
    if (!this.onGround) this.vy += this.gravity;

    this.x += this.vx; this.y += this.vy; this.h = currentH;
    this.onGround = false;
    checkPlatformCollision(this);
    if (this.y + this.h >= GROUND_Y + 50) { this.y = GROUND_Y + 50 - this.h; this.vy = 0; this.onGround = true; }
    if (this.x < 0) this.x = 0;
    if (this.x + this.w > W) this.x = W - this.w;

    this._tickCooldowns();
  },

  _tickCooldowns() {
    if (this.lightAttackCooldown > 0) this.lightAttackCooldown--;
    if (this.lightAttackTimer > 0) { this.lightAttackTimer--; if (this.lightAttackTimer <= 0) this.lightAttacking = false; }
    if (this.heavyCooldown > 0) this.heavyCooldown--;
    if (this.heavyAttackTimer > 0) { this.heavyAttackTimer--; if (this.heavyAttackTimer <= 0) this.heavyAttacking = false; }
    if (this.iFrames > 0) this.iFrames--;
  },

  dash() {
    if (this.dashing || this.dashJumping || this.dashCooldown > 0 || this.heavyAttacking) return;
    // Dash Jump check
    if (this.recentlyJumped && !this.onGround && this.jumpGraceTimer > 0) {
      this.dashJumping = true;
      this.dashJumpTimer = this.dashJumpDuration;
      this.dashCooldown = Math.floor(this.dashMaxCooldown * (1 - (getShopBuffs().dashCdReduce || 0)));
      const distMult = 1 + (getShopBuffs().dashDistBonus || 0);
      this.vx = this.facing * this.dashSpeed * 1.1 * distMult;
      this.vy = -9;
      this.crouching = false; this.lightAttacking = false; this.lightAttackTimer = 0;
      this.recentlyJumped = false; this.jumpGraceTimer = 0;
      for (let i = 0; i < 10; i++) spawnParticles(this.x + this.w/2, this.y + this.h, 1, '#af5');
      showCombo('DASH JUMP', '#af5');
      return;
    }
    this.dashing = true;
    this.dashTimer = this.dashDuration;
    this.vy = 0;
    this.dashCooldown = Math.floor(this.dashMaxCooldown * (1 - (getShopBuffs().dashCdReduce || 0)));
    this.crouching = false; this.lightAttacking = false; this.lightAttackTimer = 0;
    spawnParticles(this.x + this.w/2, this.y + this.h/2, 6, '#5af');
  },

  lightAttack() {
    if (this.lightAttacking || this.heavyAttacking || this.lightAttackCooldown > 0 || this.dashing) return;
    this.lightAttacking = true;
    this.lightAttackTimer = this.lightAttackDuration;
    this.lightAttackCooldown = 8;
    playSound('lightAttack');
    this.checkLightHit();
  },

  heavyAttack() {
    if (this.heavyAttacking || this.heavyCooldown > 0 || this.lightAttacking || this.dashing) return;
    this.heavyAttacking = true;
    this.heavyAttackTimer = this.heavyAttackDuration;
    this.heavyCooldown = Math.floor(this.heavyMaxCooldown * (1 - (getShopBuffs().heavyCdReduce || 0)));
    playSound('heavyAttack');
    this.checkHeavyHit();
  },

  getAttackBox(heavy = false) {
    const range = heavy ? 70 : 45;
    const aw = range;
    const ah = heavy ? 40 : 30;
    const ax = this.facing === 1 ? this.x + this.w : this.x - aw;
    const ay = this.y + this.h / 2 - ah / 2;
    return { x: ax, y: ay, w: aw, h: ah };
  },

  checkLightHit() {
    const box = this.getAttackBox(false);
    const wpn = getWeaponData();
    enemies.forEach(e => {
      if (!e.dead && rectsOverlap(box, e)) {
        const buffs = getShopBuffs();
        e.hp -= (1 + buffs.lightDmgBonus + buffs.allDmgBonus) * wpn.damageMultiplier;
        e.hitFlash = 6;
        e.knockback = this.facing * 3;
        if (darkPowers.includes('firefists')) e.fireTimer = 180;
        spawnParticles(e.x + e.w/2, e.y + e.h/2, 3, '#fff');
        playSound('hit');
        if (e.hp <= 0) killEnemy(e);
      }
    });
  },

  checkHeavyHit() {
    const box = this.getAttackBox(true);
    shakeTimer = 10; shakeIntensity = 4;
    const closest = getClosestEnemies(box, 1);
    const wpn = getWeaponData();
    const dmgMult = darkPowers.includes('bloodrage') ? 2 : 1;
    const buffs = getShopBuffs();
    closest.forEach(e => {
      e.hp -= (3 + buffs.heavyDmgBonus + buffs.allDmgBonus) * dmgMult * wpn.damageMultiplier;
      e.hitFlash = 10;
      e.knockback = this.facing * 8;
      spawnParticles(e.x + e.w/2, e.y + e.h/2, 8, '#ff0');
      playSound('hit');
      if (e.hp <= 0) killEnemy(e);
    });
  },

  draw() {
    const flickering = this.iFrames > 0 && !this.dashing && Math.floor(this.iFrames / 3) % 2 === 0;
    if (flickering) return;
    const cx = this.x + this.w / 2;
    const by = this.y + this.h;
    ctx.save();
    ctx.translate(cx, by);

    if (this.dashing) ctx.globalAlpha = 0.7;

    const bodyColor = this.dashing ? '#5af' : (this.crouching ? '#8a8' : '#ccc');
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 2;

    // Base Character
    if (this.lightAttacking && froggyAtkLight.complete) {
      const p = 1 - (this.lightAttackTimer / this.lightAttackDuration);
      const safeFrame = Math.min(3, Math.floor(p * 4));
      ctx.scale(this.facing, 1);
      ctx.drawImage(froggyAtkLight, safeFrame * 64, 0, 64, 64, -48, -108, 96, 96);
      ctx.scale(this.facing, 1);
    } else if (this.heavyAttacking && froggyAtkHeavy.complete) {
      const p = 1 - (this.heavyAttackTimer / this.heavyAttackDuration);
      const safeFrame = Math.min(5, Math.floor(p * 6));
      ctx.scale(this.facing, 1);
      ctx.drawImage(froggyAtkHeavy, safeFrame * 64, 0, 64, 64, -48, -108, 96, 96);
      ctx.scale(this.facing, 1);
    } else if (!this.lightAttacking && !this.heavyAttacking) {
      const isMoving = Math.abs(this.vx) > 0.1;
      ctx.scale(this.facing, 1);
      if (this.crouching) ctx.scale(1, 0.6);
      
      if (!isMoving && this.onGround && !this.crouching && froggyIdle.complete) {
        ctx.drawImage(froggyIdle, this.idleFrame * 64, 0, 64, 64, -48, -108, 96, 96);
      } else if (froggySprite.complete) {
        ctx.drawImage(froggySprite, this.walkFrame * 64, 0, 64, 64, -48, -108, 96, 96);
      }
      
      if (this.crouching) ctx.scale(1, 1/0.6);
      ctx.scale(this.facing, 1);
    } else if (!this.lightAttacking && !this.heavyAttacking) {
      if (this.crouching) {
        ctx.strokeRect(-18, -this.h, 36, this.h);
        ctx.beginPath(); ctx.arc(0, -this.h - 8, 8, 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.strokeRect(-this.w / 2, -this.h, this.w, this.h);
        ctx.beginPath(); ctx.arc(0, -this.h - 12, 10, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = bodyColor;
        const eyeX = this.facing * 4;
        ctx.fillRect(eyeX - 2, -this.h - 14, 3, 3);
        const legSpread = [0, 6, 0, -6][this.walkFrame % 4];
        ctx.beginPath();
        ctx.moveTo(-5, 0); ctx.lineTo(-5 + legSpread, 8);
        ctx.moveTo(5, 0); ctx.lineTo(5 - legSpread, 8);
        ctx.stroke();
      }
    }

    // Light attack energy visual
    if (this.lightAttacking) {
      if (froggyAtkLightEnergy.complete) {
        const p = 1 - (this.lightAttackTimer / this.lightAttackDuration);
        const safeFrame = Math.min(3, Math.floor(p * 4));
        ctx.save();
        ctx.scale(this.facing, 1);
        ctx.drawImage(froggyAtkLightEnergy, safeFrame * 64, 0, 64, 64, -48, -108, 96, 96);
        ctx.restore();
      } else {
        const progress = 1 - this.lightAttackTimer / this.lightAttackDuration;
        ctx.strokeStyle = getWeaponData().id === 'arkangel_stratocaster' ? '#a0f' : '#fff';
        ctx.lineWidth = 2;
        const swingAngle = -Math.PI / 3 + progress * Math.PI * 0.8;
        const swordLen = 35;
        const sx = this.facing * 12;
        const sy = -this.h * 0.6;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(swingAngle * this.facing) * swordLen * this.facing, sy + Math.sin(swingAngle * this.facing) * swordLen);
        ctx.stroke();
        ctx.strokeStyle = getWeaponData().id === 'arkangel_stratocaster' ? 'rgba(160,0,255,0.3)' : 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(sx, sy, swordLen, this.facing === 1 ? -Math.PI/3 : Math.PI - Math.PI*0.5, this.facing === 1 ? Math.PI*0.5 : Math.PI + Math.PI/3);
        ctx.stroke();
      }
    }

    // Heavy attack energy visual
    if (this.heavyAttacking) {
      if (froggyAtkHeavyEnergy.complete) {
        const p = 1 - (this.heavyAttackTimer / this.heavyAttackDuration);
        const safeFrame = Math.min(4, Math.floor(p * 5));
        ctx.save();
        ctx.scale(this.facing, 1);
        ctx.drawImage(froggyAtkHeavyEnergy, safeFrame * 64, 0, 64, 64, -48, -108, 96, 96);
        ctx.restore();
      } else {
        const progress = 1 - this.heavyAttackTimer / this.heavyAttackDuration;
        ctx.lineWidth = 4;
        const heavyColor = getWeaponData().id === 'arkangel_stratocaster' ? '#c4f' : '#ff0';
        if (progress < 0.4) {
          ctx.strokeStyle = `rgba(255, 200, 0, ${1 - progress * 2})`;
          ctx.beginPath(); ctx.arc(0, -this.h / 2, 25 + progress * 20, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.strokeStyle = heavyColor;
        const swingAngle = -Math.PI / 2 + progress * Math.PI;
        const swordLen = 55;
        const sx = this.facing * 10;
        const sy = -this.h * 0.5;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(swingAngle * this.facing) * swordLen * this.facing, sy + Math.sin(swingAngle * this.facing) * swordLen);
        ctx.stroke();
        if (progress > 0.3 && progress < 0.6) {
          ctx.strokeStyle = `rgba(255,255,0,0.5)`;
          ctx.lineWidth = 2;
          for (let i = 0; i < 3; i++) {
            const lx = this.facing * (40 + i * 15);
            ctx.beginPath(); ctx.moveTo(lx, -this.h - 10); ctx.lineTo(lx + this.facing * 10, 10); ctx.stroke();
          }
        }
      }
    }

    // ── HP Bar above head ──
    ctx.restore(); // restore from translate so we can draw in world space
    const barW = 44;
    const barH = 5;
    const barX = this.x + this.w / 2 - barW / 2;
    const barY = this.y - 14;
    const hpPct = Math.max(0, this.hp / this.maxHp);
    const barColor = hpPct > 0.5 ? `hsl(${Math.floor(120 * (hpPct - 0.5) * 2)},90%,45%)` : `hsl(${Math.floor(60 * hpPct * 2)},90%,45%)`;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
    ctx.fillStyle = '#222';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = barColor;
    ctx.fillRect(barX, barY, Math.round(barW * hpPct), barH);
    // Label: show current HP number only if less than full
    if (this.hp < this.maxHp) {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = 'bold 7px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText(`${this.hp}/${this.maxHp}`, this.x + this.w / 2, barY - 2);
      ctx.textAlign = 'left';
    }
  }
};
