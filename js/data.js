// ═══════════════════════════════════════════════════════════
//  DATA.JS — All game configuration arrays & constants
// ═══════════════════════════════════════════════════════════

// ─── Circles: 3 circles, each = Easy + Medium + Boss ──────
const LEVELS = [
  // ── Circle 1 ─────────────────────────────────────────────
  {
    id: 1, circle: 1,
    name: "Twilight Grounds",
    difficulty: "Low",
    waves: 8,
    enemyHpBase: 3, enemyHpScale: 0,
    enemyCountBase: 3, enemyCountScale: 2,
    fragmentDropRate: 0.12, fragmentDropRateScale: 0,
    maxFragments: 3,
    maxFireballs: 4,
    unlockRequirement: null,
    description: "The hunting grounds stir. Collect your first fragments.",
    color: "#5af", icon: "⚔"
  },
  {
    id: 2, circle: 1,
    name: "Crimson Depths",
    difficulty: "Medium",
    waves: 10,
    enemyHpBase: 5, enemyHpScale: 0.01,
    enemyCountBase: 4, enemyCountScale: 2,
    fragmentDropRate: 0.15, fragmentDropRateScale: 0.01,
    maxFragments: 8,
    maxFireballs: 6,
    unlockRequirement: { fragments: 3 },
    description: "Deeper you descend. Enemies grow stronger, but the rewards are greater.",
    color: "#f55", icon: "🔥"
  },
  {
    id: 3, circle: 1,
    name: "The Abyss",
    difficulty: "Boss",
    waves: 1,
    enemyHpBase: 0, bossHp: 80,
    maxFireballs: 99,
    unlockRequirement: { sheetMusic: 1 },
    description: "Summon the Demon Lord with your Sheet Music. Defeat it to learn a Riff.",
    color: "#f0f", icon: "☠",
    reward: { riff: "infernal_chord" }
  },

  // ── Circle 2 ─────────────────────────────────────────────
  {
    id: 4, circle: 2,
    name: "Hollow Wastes",
    difficulty: "Low",
    waves: 8,
    enemyHpBase: 6, enemyHpScale: 0.02,
    enemyCountBase: 4, enemyCountScale: 3,
    fragmentDropRate: 0.12, fragmentDropRateScale: 0.005,
    maxFragments: 4,
    maxFireballs: 4,
    unlockRequirement: { bossesDefeated: 1 },
    description: "The wastes echo with forgotten screams. Harder foes await.",
    color: "#af5", icon: "🌀"
  },
  {
    id: 5, circle: 2,
    name: "Iron Furnace",
    difficulty: "Medium",
    waves: 10,
    enemyHpBase: 8, enemyHpScale: 0.02,
    enemyCountBase: 5, enemyCountScale: 3,
    fragmentDropRate: 0.16, fragmentDropRateScale: 0.01,
    maxFragments: 8,
    maxFireballs: 6,
    unlockRequirement: { fragments: 4 },
    description: "The heat warps reality. Molten enemies pour from the dark.",
    color: "#f84", icon: "⚙"
  },
  {
    id: 6, circle: 2,
    name: "The Crucible",
    difficulty: "Boss",
    waves: 1,
    enemyHpBase: 0, bossHp: 140,
    maxFireballs: 99,
    unlockRequirement: { sheetMusic: 1 },
    description: "The Forge Titan awaits. Sheet Music fuels the summoning.",
    color: "#fa0", icon: "⚒",
    reward: { riff: "power_chord" }
  },

  // ── Circle 3 ─────────────────────────────────────────────
  {
    id: 7, circle: 3,
    name: "Obsidian Spire",
    difficulty: "Low",
    waves: 8,
    enemyHpBase: 10, enemyHpScale: 0.03,
    enemyCountBase: 5, enemyCountScale: 3,
    fragmentDropRate: 0.13, fragmentDropRateScale: 0.008,
    maxFragments: 5,
    maxFireballs: 4,
    unlockRequirement: { bossesDefeated: 2 },
    description: "Obsidian towers pierce a burning sky. The final circle begins.",
    color: "#c5f", icon: "🗼"
  },
  {
    id: 8, circle: 3,
    name: "Ragnarok Pit",
    difficulty: "Medium",
    waves: 10,
    enemyHpBase: 14, enemyHpScale: 0.03,
    enemyCountBase: 6, enemyCountScale: 3,
    fragmentDropRate: 0.18, fragmentDropRateScale: 0.012,
    maxFragments: 8,
    maxFireballs: 6,
    unlockRequirement: { fragments: 5 },
    description: "The world burns. Survive the pit or burn with it.",
    color: "#f44", icon: "🔥"
  },
  {
    id: 9, circle: 3,
    name: "Throne of Ash",
    difficulty: "Boss",
    waves: 1,
    enemyHpBase: 0, bossHp: 220,
    maxFireballs: 99,
    unlockRequirement: { sheetMusic: 1 },
    description: "The Ash King's throne. Defeat him to end the nightmare.",
    color: "#fff", icon: "👑",
    reward: { riff: "final_shred" }
  }
];

const ETERNAL_DAMNATION = {
  id: 99,
  name: "Eternal Damnation",
  difficulty: "DAMNATION",
  waves: 8,
  enemyHpBase: 5,
  enemyCountBase: 4,
  enemyCountScale: 2,
  maxFireballs: 6,
  playerHp: 1,
  triggerThreshold: 5,
  rewards: { echoes: 10000, fragments: 6, weapon: "arkangel_stratocaster" },
  penalty: "lose_all_resources",
  description: "Your soul is forfeit. Survive with a single heartbeat.",
  color: "#f00",
  icon: "💀"
};

const WEAPONS = [
  { id: "base_sword", name: "Rusty Blade", damageMultiplier: 1, description: "A worn but trusty blade." },
  { id: "arkangel_stratocaster", name: "Arkangel Stratocaster", damageMultiplier: 3, description: "A guitar forged in hellfire. 3x damage." }
];

const RIFFS = [
  {
    id: "infernal_chord",
    name: "Infernal Chord",
    chargeRequired: 20, killCount: 5,
    description: "Launch a devastating beam that kills 5 enemies at once.",
    color: "#a0f", beamColor: "#c4f"
  },
  {
    id: "power_chord",
    name: "Power Chord",
    chargeRequired: 15, killCount: 7,
    description: "A crushing wave that obliterates 7 enemies.",
    color: "#fa0", beamColor: "#f80"
  },
  {
    id: "final_shred",
    name: "Final Shred",
    chargeRequired: 12, killCount: 10,
    description: "The ultimate shred. Annihilates 10 enemies in a blazing arc.",
    color: "#fff", beamColor: "#ff0"
  }
];

const DARK_POWER_LIST = [
  { name: 'Lifesteal', desc: 'Heal 1 HP for every 3 kills', key: 'lifesteal' },
  { name: 'Fire Fists', desc: 'Light attacks set enemies on fire (DoT)', key: 'firefists' },
  { name: 'Shadow Dash', desc: 'Dash deals damage to enemies you pass through', key: 'shadowdash' },
  { name: 'Blood Rage', desc: 'Heavy attacks deal double damage', key: 'bloodrage' },
  { name: 'Echo Siphon', desc: 'Earn 2x echoes from kills', key: 'echosiphon' },
  { name: 'Bone Armor', desc: 'Take 1 less damage from all sources (min 1)', key: 'bonearmor' },
  { name: 'Hellfire', desc: 'Enemies near you slowly take fire damage', key: 'hellfire' },
  { name: 'Soul Chain', desc: 'Killing an enemy heals you to full HP', key: 'soulchain' }
];

const FRAGMENTS_FOR_SHEET_MUSIC = 8;

// ─── SHOP — Rock & Guitar themed items ───────────────────
// shopTier = number of bosses defeated (0,1,2,3)
const SHOP_ITEMS = [
  // ── Tier 0 (always available) ─────────────────────────
  { id: 'heavy_pick', name: 'Heavy Pick', desc: '+1 heavy attack damage', cost: 5000,
    tier: 0, icon: '🪕', buff: { type: 'heavyDmgBonus', value: 1 }, category: 'Picks' },
  { id: 'rubber_strings', name: 'Rubber Strings', desc: '+1 max HP', cost: 6000,
    tier: 0, icon: '🎸', buff: { type: 'maxHpBonus', value: 1 }, category: 'Strings' },
  { id: 'metronome', name: 'Metronome', desc: 'Heavy cooldown -15%', cost: 7000,
    tier: 0, icon: '⏱', buff: { type: 'heavyCdReduce', value: 0.15 }, category: 'Accessories' },

  // ── Tier 1 (1 boss defeated) ──────────────────────────
  { id: 'distortion_pedal', name: 'Distortion Pedal', desc: 'Light attacks deal +1 damage', cost: 12000,
    tier: 1, icon: '🎛', buff: { type: 'lightDmgBonus', value: 1 }, category: 'Pedals' },
  { id: 'steel_strings', name: 'Steel Strings', desc: '+2 max HP', cost: 15000,
    tier: 1, icon: '🎸', buff: { type: 'maxHpBonus', value: 2 }, category: 'Strings' },
  { id: 'tuner_clip', name: 'Chromatic Tuner', desc: 'Riff charge 20% faster', cost: 14000,
    tier: 1, icon: '📎', buff: { type: 'riffChargeBonus', value: 0.2 }, category: 'Accessories' },
  { id: 'practice_amp', name: 'Practice Amp', desc: 'Dash cooldown -20%', cost: 11000,
    tier: 1, icon: '🔊', buff: { type: 'dashCdReduce', value: 0.2 }, category: 'Amps' },

  // ── Tier 2 (2 bosses defeated) ────────────────────────
  { id: 'wah_pedal', name: 'Wah Pedal', desc: 'Move 15% faster', cost: 25000,
    tier: 2, icon: '🎛', buff: { type: 'speedBonus', value: 0.15 }, category: 'Pedals' },
  { id: 'tube_amp', name: 'Tube Amp', desc: 'All attacks deal +2 damage', cost: 35000,
    tier: 2, icon: '🔊', buff: { type: 'allDmgBonus', value: 2 }, category: 'Amps' },
  { id: 'gold_strings', name: 'Gold Strings', desc: '+3 max HP', cost: 30000,
    tier: 2, icon: '🎸', buff: { type: 'maxHpBonus', value: 3 }, category: 'Strings' },
  { id: 'reverb_pedal', name: 'Reverb Pedal', desc: 'Riff beam kills 3 more enemies', cost: 28000,
    tier: 2, icon: '🎛', buff: { type: 'riffKillBonus', value: 3 }, category: 'Pedals' },

  // ── Tier 3 (3 bosses defeated — all bosses) ───────────
  { id: 'floyd_rose', name: 'Floyd Rose Tremolo', desc: 'Dash distance +30%', cost: 50000,
    tier: 3, icon: '🔩', buff: { type: 'dashDistBonus', value: 0.3 }, category: 'Parts' },
  { id: 'stack_amp', name: 'Full Stack Amp', desc: 'All attacks deal +4 damage', cost: 70000,
    tier: 3, icon: '🔊', buff: { type: 'allDmgBonus', value: 4 }, category: 'Amps' },
  { id: 'diamond_pick', name: 'Diamond Pick', desc: 'Kills grant 3x echoes', cost: 60000,
    tier: 3, icon: '💎', buff: { type: 'echoMultiplier', value: 3 }, category: 'Picks' },
  { id: 'custom_strap', name: 'Spiked Leather Strap', desc: '+5 max HP, take -1 damage', cost: 80000,
    tier: 3, icon: '🖤', buff: { type: 'tankBundle', hpBonus: 5, dmgReduce: 1 }, category: 'Accessories' }
];
