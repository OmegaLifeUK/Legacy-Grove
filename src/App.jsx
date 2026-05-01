import { useState, useEffect, useCallback, useRef } from "react";
import logoImg from "/logo.png";

// ─── DATA ─────────────────────────────────────────────────────────────────────
const SPECIES = {
  apple:    { name: "Apple",           emoji: "🍎", color: "#C45C3A", tips: ["Pollinators help fruit set", "Balanced water is key"], waterTol: 1,    lightTol: 1,   growthSpeed: 1   },
  rowan:    { name: "Rowan",           emoji: "🌸", color: "#E07B54", tips: ["Berries feed birds all winter", "Hardy in cold snaps"], waterTol: 0.9,  lightTol: 1,   growthSpeed: 0.9 },
  hazel:    { name: "Hazel",           emoji: "🌰", color: "#8B6914", tips: ["Catkins feed bees in February", "Coppice for hedges"], waterTol: 1,    lightTol: 1,   growthSpeed: 1.2 },
  fieldmaple:{ name: "Field Maple",   emoji: "🍁", color: "#D4A017", tips: ["UK native – great for bees", "Adapts to many soils"], waterTol: 0.9,  lightTol: 1,   growthSpeed: 1   },
  holly:    { name: "Holly",           emoji: "🎄", color: "#1B5E20", tips: ["Evergreen shelter for birds", "Berries last all winter"], waterTol: 0.9, lightTol: 0.8, growthSpeed: 0.7 },
  silverbirch:{ name: "Silver Birch", emoji: "🌲", color: "#89A86D", tips: ["Supports hundreds of insects", "Light elegant canopy"], waterTol: 0.8,  lightTol: 1.2, growthSpeed: 1.3 },
  hornbeam: { name: "Hornbeam",        emoji: "🌳", color: "#4A7A3A", tips: ["Dense canopy for wildlife", "Papery winged seeds"], waterTol: 1,    lightTol: 0.9, growthSpeed: 0.8 },
  crabapple:{ name: "Crab Apple",     emoji: "🍏", color: "#C84B3A", tips: ["Pink blossom loved by bees", "Small fruit for birds"], waterTol: 1,    lightTol: 1,   growthSpeed: 1   },
  amelanchier:{ name: "Amelanchier",  emoji: "🫐", color: "#6A4C93", tips: ["White spring blossom is stunning", "Purple berries for birds"], waterTol: 0.9, lightTol: 1.1, growthSpeed: 1.1 },
  lombardy: { name: "Lombardy Poplar",emoji: "🏛️", color: "#5C7A2A", tips: ["Very fast growth!", "Brilliant for carbon capture"], waterTol: 1.2,  lightTol: 1.1, growthSpeed: 1.8 },
};

const ACTIONS = [
  { key: "water", label: "Water", emoji: "💧", desc: "Give your tree a drink", cooldown: 0, apply: (s) => ({ h2o: Math.min(100, s.h2o + 25) }) },
  { key: "light", label: "Move to Light", emoji: "☀️", desc: "Find the best spot for sunlight", cooldown: 0, apply: (s) => ({ light: Math.min(100, s.light + 20) }) },
  { key: "shade", label: "Add Shade", emoji: "⛱️", desc: "Protect from scorching heat", cooldown: 0, apply: (s) => ({ light: Math.max(0, s.light - 15) }) },
  { key: "feed", label: "Feed Soil", emoji: "🌱", desc: "Compost pellets for nutrients", cooldown: 0, apply: (s) => ({ soil: Math.min(100, s.soil + 20) }) },
  { key: "mulch", label: "Mulch", emoji: "🍂", desc: "Reduce water loss & protect roots", cooldown: 0, apply: (s) => ({ mulched: true, h2o: Math.min(100, s.h2o + 5) }) },
  { key: "prune", label: "Prune", emoji: "✂️", desc: "Remove sick leaves & branches", cooldown: 0, apply: (s) => ({ soil: Math.min(100, s.soil + 5), bio: Math.min(100, s.bio + 5) }) },
  { key: "stake", label: "Stake/Windbreak", emoji: "🪵", desc: "Protect against storms", cooldown: 0, apply: (s) => ({ staked: true }) },
  { key: "birdhouse", label: "Birdhouse", emoji: "🏠", desc: "Attract birds & reduce pests", cooldown: 0, apply: (s) => ({ bio: Math.min(100, s.bio + 15), hasBirdhouse: true }) },
  { key: "wildflowers", label: "Wildflowers", emoji: "🌼", desc: "Boost pollinators & biodiversity", cooldown: 0, apply: (s) => ({ bio: Math.min(100, s.bio + 20) }) },
  { key: "clean", label: "Clean Litter", emoji: "🧹", desc: "Tidy up – neighbours will notice!", cooldown: 0, apply: (s) => ({ clean: Math.min(100, s.clean + 30) }) },
  { key: "drain", label: "Drain Soil", emoji: "🌊", desc: "Fix waterlogged roots", cooldown: 0, apply: (s) => ({ h2o: Math.max(0, s.h2o - 20) }) },
  { key: "pest_spray", label: "Natural Spray", emoji: "🫙", desc: "Soap water – safe for bees", cooldown: 0, apply: (s) => ({ infested: false }) },
  { key: "fungus_cure", label: "Fungus Cure", emoji: "🔬", desc: "Improve airflow & prune", cooldown: 0, apply: (s) => ({ fungal: false, h2o: Math.max(0, s.h2o - 10) }) },
];

const MISSIONS = [
  { key: "walk_to_school", title: "Walk or Wheel to School", emoji: "🚶", desc: "Instead of a car trip", boost: { bio: 5, clean: 5 } },
  { key: "meat_free", title: "Try a Meat-Free Meal", emoji: "🥗", desc: "Good for the planet and you", boost: { soil: 5 } },
  { key: "pick_litter", title: "Pick Up 3 Bits of Litter", emoji: "♻️", desc: "Make your street shine", boost: { clean: 15 } },
  { key: "turn_off_taps", title: "Turn Off Taps While Brushing", emoji: "🚿", desc: "Save water – every drop counts", boost: { h2o: 8 } },
  { key: "plant_seed", title: "Plant a Seed or Bug Hotel", emoji: "🐞", desc: "Help nature at home", boost: { bio: 15 } },
  { key: "kind_word", title: "Share a Kind Word", emoji: "💬", desc: "To someone older or younger", boost: { mood: 10 } },
];

const BADGES = [
  { key: "water_wise", name: "Water Wise", emoji: "💧", condition: "Perfect watering for 3 days", desc: "You know exactly when your tree needs a drink! Trees love keepers who pay attention.", color: "#4A9FE6" },
  { key: "shade_hero", name: "Shade Hero", emoji: "⛱️", condition: "Used shade during a heat wave", desc: "You protected your tree from the scorching sun — quick thinking saves lives!", color: "#FF9E4A" },
  { key: "storm_shield", name: "Storm Shield", emoji: "🌪️", condition: "Protected tree in a storm", desc: "When the winds blew hard, you kept your tree safe. That's real care!", color: "#7A8CAA" },
  { key: "pollinator_pal", name: "Pollinator Pal", emoji: "🐝", condition: "Reached 80+ biodiversity", desc: "Bees, butterflies, and birds love your tree! You created a mini nature reserve.", color: "#FFD93D" },
  { key: "litter_lifter", name: "Litter Lifter", emoji: "♻️", condition: "Cleaned litter 3 times", desc: "You made the world cleaner — every piece of litter you pick up helps!", color: "#6FCF97" },
  { key: "compost_captain", name: "Compost Captain", emoji: "🌱", condition: "Fed soil 3 times", desc: "Rich soil grows strong trees! You're feeding the earth, not just your tree.", color: "#8B6914" },
  { key: "kindness_courier", name: "Kindness Courier", emoji: "💌", condition: "Passed on a tree with a kind note", desc: "Your kind words will travel with this tree forever. That's the power of the chain!", color: "#E07B9F" },
];

const PASS_ON_TEMPLATES = [
  { key: "t1", text: "I watered you every day. You grew so much! 🌱" },
  { key: "t2", text: "I hope you love this tree as much as I do 💚" },
  { key: "t3", text: "Remember to water me when it's sunny! ☀️" },
  { key: "t4", text: "You're in good hands now. Keep growing! 🌿" },
  { key: "t5", text: "The birds love this tree – watch out for visitors! 🐦" },
];

const STATE_CONFIG = {
  Thriving: { color: "#2D9E5C", bg: "#E8F8EE", icon: "✨", msg: "Your tree is thriving! Keep it up!" },
  Healthy: { color: "#4A9E6F", bg: "#EAF5EE", icon: "🌿", msg: "Looking healthy and strong!" },
  Okay: { color: "#B5A642", bg: "#FAF7E0", icon: "🌤", msg: "Doing okay – a little care will help!" },
  Stressed: { color: "#D4783A", bg: "#FAF0E6", icon: "😟", msg: "Your tree is stressed. Let's help together!" },
  Withering: { color: "#C24D2C", bg: "#FDE8E0", icon: "🥀", msg: "Oh no – wilting! Time to act quickly!" },
  Dormant: { color: "#5B9FBF", bg: "#EAF4FB", icon: "❄️", msg: "Resting peacefully through the cold. Safe and ready to bloom again! ❄️" },
  Infested: { color: "#8B6914", bg: "#FBF3E0", icon: "🐛", msg: "Pests spotted! Use natural spray." },
  Fungal: { color: "#7A5C8A", bg: "#F3EDF8", icon: "🍄", msg: "Fungus detected! Drain and prune." },
  Polluted: { color: "#6B7A8D", bg: "#EEF0F3", icon: "🗑️", msg: "Litter and pollution – clean it up!" },
  "Storm-Damaged": { color: "#5A5A7A", bg: "#EEEEF5", icon: "🌪️", msg: "Storm damage! Stake for protection." },
  "Sun-Scorched": { color: "#C25A1A", bg: "#FDE8D8", icon: "🔥", msg: "Too much sun! Add shade quickly." },
  Dead: { color: "#5A5A5A", bg: "#EEEEEE", icon: "💀", msg: "Your tree has died. Time to begin again." },
};

// ─── GAME ENGINE ──────────────────────────────────────────────────────────────
function computeState(tree) {
  const { h2o, light, soil, bio, clean, infested, fungal } = tree;
  const stats = [h2o, light, soil, bio, clean];
  const minStat = Math.min(...stats);
  const countBelow30 = stats.filter(v => v < 30).length;

  if (stats.every(v => v <= 2)) return "Dead";
  if (fungal) return "Fungal";
  if (infested) return "Infested";
  if (clean < 25) return "Polluted";
  if (minStat < 20 || countBelow30 >= 2) return "Withering";
  if (minStat < 40) {
    // Dormant overrides Stressed only if light is the sole stat below 40
    const lightIsOnlyLow = light < 40 && h2o >= 40 && soil >= 40 && bio >= 40 && clean >= 40;
    if (lightIsOnlyLow && (tree.currentEvent === "storm" || light < 30)) return "Dormant";
    return "Stressed";
  }
  if (light > 85 && h2o < 40) return "Sun-Scorched";
  if (stats.every(v => v >= 80)) return "Thriving";
  if (stats.every(v => v >= 60)) return "Healthy";
  return "Okay";
}

function applyNaturalDrift(tree, species) {
  const sp = SPECIES[species] || SPECIES.apple;
  // During dormancy the tree rests safely — no stat decay
  if (computeState(tree) === "Dormant") return { h2o: tree.h2o, light: tree.light, soil: tree.soil, bio: tree.bio, clean: tree.clean };
  const isHeatWave = tree.currentEvent === "heatwave";
  const h2oDrift = isHeatWave ? -25 : -15 * sp.waterTol;
  const mulchBonus = tree.mulched ? 0.7 : 1;
  // Eco-shield prevents clean from decreasing for 1 day (3 ticks in demo)
  const shieldActive = tree.ecoShieldExpiry && Date.now() < tree.ecoShieldExpiry;
  return {
    h2o: Math.max(0, tree.h2o + h2oDrift * mulchBonus),
    light: tree.light,
    soil: Math.max(0, tree.soil - 5),
    bio: Math.max(0, tree.bio - 2),
    clean: shieldActive ? tree.clean : Math.max(0, tree.clean - 5),
  };
};

// ─── TREE VISUAL ──────────────────────────────────────────────────────────────
// Growth stages: seed (day 1), sapling (days 2-3), mid (day 4), full (days 5-7)
function getGrowthStage(day) {
  if (day <= 1) return "seed";
  if (day <= 3) return "sapling";
  if (day <= 4) return "mid";
  return "full";
}

function TreeVisual({ tree, state, species, day, animate }) {
  const sp = SPECIES[species] || SPECIES.apple;
  const health = (tree.h2o + tree.light + tree.soil + tree.bio + tree.clean) / 5;
  const stateConf = STATE_CONFIG[state] || STATE_CONFIG.Okay;
  const growthStage = getGrowthStage(day);

  // ── SPECIES VISUAL PROFILES ────────────────────────────────────────────────
  // Each species has: trunk color, healthy leaf colors [primary, secondary, highlight],
  // shape type (round|tall|narrow|bushy|multi|columnar|spreading), and fruit/blossom details
  const speciesProfiles = {
    apple:      { trunk:"#7A5230", lh:["#5A9E3A","#7CC24A","#4A8E2A"], shape:"spreading", fruit:["#E8503A","#E8503A","#F4C430"] },
    rowan:      { trunk:"#6B4A2A", lh:["#4A8A3A","#6AB04A","#3A7A2A"], shape:"round",     blossom:"#FFDDD2", fruit:["#E07B54","#E87B40"] },
    hazel:      { trunk:"#7A5A2A", lh:["#6A9E3A","#8AC04A","#5A8E2A"], shape:"bushy",     catkins:true },
    fieldmaple: { trunk:"#7A5230", lh:["#5A9A3A","#7AB844","#4A8A2A"], shape:"round",     autumnKeys:true },
    holly:      { trunk:"#4A3A2A", lh:["#1B5E20","#2A7A2A","#14521A"], shape:"round",     berries:["#CC2222","#EE3333"] },
    silverbirch:{ trunk:"#D8D0C0", lh:["#7AB84A","#96CC5A","#6AAA3A"], shape:"narrow",    barkMarks:true },
    hornbeam:   { trunk:"#6A5A4A", lh:["#4A8A3A","#6AAE4A","#3A7A2A"], shape:"round",     wings:true },
    crabapple:  { trunk:"#7A5230", lh:["#4A9A3A","#6AB844","#3A8A2A"], shape:"spreading", blossom:"#F9A8D4", fruit:["#CC3A22","#E04A2A"] },
    amelanchier:{ trunk:"#6A4A3A", lh:["#5A9A3A","#78B84A","#4A8A2A"], shape:"multi",     blossom:"#FFFFFF", berries2:["#6A4C93","#7A5CA3"] },
    lombardy:   { trunk:"#5A4A2A", lh:["#5A9A2A","#72B43A","#4A8A1A"], shape:"columnar",  fastGrow:true },
  };

  // State leaf color overrides
  const stateLeafOverride = {
    Okay:          ["#B5A642","#9DAE3A"],
    Stressed:      ["#C4813A","#B06830"],
    Withering:     ["#8B6914","#7A5C20"],
    Dead:          ["#555","#3A3A3A"],
    Fungal:        ["#7A5C8A","#A07AB0"],
    Infested:      ["#8B6914","#6B4A10"],
    Polluted:      ["#7A8C6B","#6A7C5B"],
    "Storm-Damaged":["#6A7A9A","#5A6A8A"],
    "Sun-Scorched":["#C45A1A","#B04A10"],
    Dormant:       ["#8A9A8A","#7A8A7A"],
  };

  const prof = speciesProfiles[species] || speciesProfiles.apple;
  const isDead = state === "Dead";
  const isNegState = isDead || ["Withering","Stressed","Fungal","Infested","Polluted","Storm-Damaged","Sun-Scorched","Dormant"].includes(state);
  const lc = stateLeafOverride[state] || (state === "Thriving" ? [prof.lh[0], prof.lh[2], "#4DB84E"] : state === "Healthy" ? [prof.lh[0], prof.lh[1]] : prof.lh);
  const trunkColor = isDead ? "#888" : prof.trunk;
  const isColumnar = prof.shape === "columnar";
  const isBushy = prof.shape === "bushy" || prof.shape === "multi";
  const isNarrow = prof.shape === "narrow";
  const visitors = tree.bio > 70 ? ["🐝","🦋","🐦"] : tree.bio > 40 ? ["🐦"] : [];

  // ── SHARED HELPERS ────────────────────────────────────────────────────────
  const dormantOverlay = (x, y, w, h) => (
    <>
      <ellipse cx={x} cy={y} rx={w} ry={h} fill="#A8D8F0" opacity={0.25} filter="url(#dormantGlow)" />
      <ellipse cx={x} cy={y} rx={w} ry={h} fill="#C8EAFA" opacity={0.7} />
    </>
  );
  const StateOverlays = ({ cx=100, seedY=0, size=1 }) => (
    <>
      {state === "Infested" && <text x={cx-8} y={seedY-8} fontSize={13*size}>🐛</text>}
      {state === "Fungal"   && <text x={cx-8} y={seedY}   fontSize={13*size}>🍄</text>}
      {state === "Polluted" && <text x={cx-20} y={196}    fontSize={13*size}>🗑️</text>}
      {tree.hasBirdhouse    && <text x={cx-32} y={seedY+10} fontSize={15*size}>🏠</text>}
      {state === "Thriving" && <><text x={cx+42} y={seedY-20} fontSize={11}>✨</text><text x={cx-52} y={seedY-10} fontSize={9}>⭐</text></>}
    </>
  );
  const WitheringLeaves = ({ count=5 }) => (
    <>{[...Array(count)].map((_,i)=><text key={i} x={60+i*16} y={200+i%2*6} fontSize={9} opacity={0.75}>🍂</text>)}</>
  );

  // ── STAGE: SEED ──────────────────────────────────────────────────────────
  const SeedStage = () => {
    const seedColor = isDead ? "#888" : prof.trunk;
    const seedAccent = isDead ? "#aaa" : prof.lh[0];
    return (
      <>
        <ellipse cx={100} cy={188} rx={38} ry={10} fill="#A0784A" opacity={0.7}/>
        <ellipse cx={100} cy={185} rx={26} ry={7} fill="#C4A57B" opacity={0.6}/>
        <ellipse cx={100} cy={180} rx={9} ry={7} fill={seedColor}/>
        <ellipse cx={100} cy={180} rx={6} ry={4.5} fill={seedAccent} opacity={0.6}/>
        <ellipse cx={97} cy={177} rx={2.5} ry={1.5} fill="white" opacity={0.25}/>
        {!isDead && state !== "Dormant" && (
          <>
            <line x1={100} y1={173} x2={100} y2={165} stroke="#5A8A40" strokeWidth={1.5}/>
            <path d="M100,170 Q94,163 96,159 Q99,165 100,168" fill={lc[0]} opacity={0.9}/>
            <path d="M100,170 Q106,163 104,159 Q101,165 100,168" fill={lc[1]||lc[0]} opacity={0.85}/>
            {isColumnar && <line x1={100} y1={165} x2={100} y2={155} stroke="#5A8A40" strokeWidth={1.5}/>}
          </>
        )}
        {state === "Dormant" && (
          <>
            <ellipse cx={100} cy={180} rx={13} ry={10} fill="none" stroke="#A8D8F0" strokeWidth={2.5} opacity={0.7} filter="url(#dormantGlow)"/>
            <ellipse cx={100} cy={180} rx={16} ry={13} fill="none" stroke="#C8EAFA" strokeWidth={1.5} opacity={0.4} filter="url(#dormantGlow)"/>
          </>
        )}
        {state === "Withering" && <text x={90} y={160} fontSize={10} opacity={0.7}>😢</text>}
        {state === "Sun-Scorched" && <text x={88} y={160} fontSize={11}>🔥</text>}
        {tree.mulched && <ellipse cx={100} cy={188} rx={30} ry={7} fill="#8B6914" opacity={0.35}/>}
        <text x={100} y={222} fontSize={9} fill="#9A7A5A" fontWeight="600" textAnchor="middle">Seed</text>
      </>
    );
  };

  // ── STAGE: SAPLING ────────────────────────────────────────────────────────
  const SaplingStage = () => {
    const trunkW = isColumnar ? 5 : isBushy ? 7 : isNarrow ? 4 : 6;
    const trunkX = 100 - trunkW/2;
    const branchSpread = isColumnar ? 8 : isBushy ? 22 : isNarrow ? 12 : 18;
    const canopyR = isColumnar ? 10 : isBushy ? 20 : isNarrow ? 13 : 17;
    const canopyY = isColumnar ? 142 : 148;
    const showLeaves = !isDead && !["Withering","Stressed","Dormant"].includes(state);
    return (
      <>
        <ellipse cx={100} cy={200} rx={isColumnar ? 30 : 46} ry={10} fill="#C4A57B" opacity={0.5}/>
        {tree.mulched && <ellipse cx={100} cy={198} rx={32} ry={7} fill="#8B6914" opacity={0.35}/>}
        {/* Trunk */}
        <rect x={trunkX} y={155} width={trunkW} height={45} rx={trunkW/2} fill={trunkColor}/>
        {/* Branches */}
        {!isDead && !isColumnar && (
          <>
            <line x1={100} y1={175} x2={100-branchSpread} y2={163} stroke={trunkColor} strokeWidth={2.5} strokeLinecap="round"/>
            <line x1={100} y1={175} x2={100+branchSpread} y2={163} stroke={trunkColor} strokeWidth={2.5} strokeLinecap="round"/>
            {isBushy && <>
              <line x1={100} y1={168} x2={80} y2={155} stroke={trunkColor} strokeWidth={2} strokeLinecap="round"/>
              <line x1={100} y1={168} x2={120} y2={155} stroke={trunkColor} strokeWidth={2} strokeLinecap="round"/>
            </>}
          </>
        )}
        {/* Canopy */}
        {showLeaves && !isColumnar && (
          <>
            <circle cx={100} cy={canopyY} r={canopyR} fill={lc[0]} opacity={0.92}/>
            <circle cx={100-branchSpread+2} cy={canopyY+6} r={canopyR*0.75} fill={lc[1]||lc[0]} opacity={0.82}/>
            <circle cx={100+branchSpread-2} cy={canopyY+5} r={canopyR*0.7} fill={lc[0]} opacity={0.78}/>
            {isBushy && <>
              <circle cx={80} cy={canopyY-4} r={canopyR*0.6} fill={lc[1]||lc[0]} opacity={0.8}/>
              <circle cx={120} cy={canopyY-3} r={canopyR*0.55} fill={lc[0]} opacity={0.78}/>
            </>}
          </>
        )}
        {showLeaves && isColumnar && (
          <>
            <ellipse cx={100} cy={155} rx={9} ry={14} fill={lc[0]} opacity={0.92}/>
            <ellipse cx={100} cy={142} rx={7} ry={10} fill={lc[1]||lc[0]} opacity={0.85}/>
          </>
        )}
        {/* Dormant */}
        {state === "Dormant" && (
          <>
            <rect x={trunkX-3} y={153} width={trunkW+6} height={49} rx={5} fill="#C8EAFA" opacity={0.8}/>
            <rect x={trunkX} y={155} width={trunkW} height={45} rx={trunkW/2} fill={trunkColor}/>
            {!isColumnar && <>
              <line x1={100} y1={175} x2={100-branchSpread} y2={163} stroke="#C8EAFA" strokeWidth={6} strokeLinecap="round" opacity={0.85}/>
              <line x1={100} y1={175} x2={100+branchSpread} y2={163} stroke="#C8EAFA" strokeWidth={6} strokeLinecap="round" opacity={0.85}/>
              <line x1={100} y1={175} x2={100-branchSpread} y2={163} stroke={trunkColor} strokeWidth={2.5} strokeLinecap="round"/>
              <line x1={100} y1={175} x2={100+branchSpread} y2={163} stroke={trunkColor} strokeWidth={2.5} strokeLinecap="round"/>
            </>}
          </>
        )}
        {state === "Withering" && !isDead && (
          <>
            <circle cx={100-branchSpread+2} cy={canopyY+6} r={canopyR*0.7} fill="#8B6914" opacity={0.85}/>
            <circle cx={100+branchSpread-2} cy={canopyY+5} r={canopyR*0.65} fill="#D4C48A" opacity={0.8}/>
            <WitheringLeaves count={4}/>
          </>
        )}
        {state === "Stressed" && !isDead && (
          <>
            <circle cx={100} cy={canopyY} r={canopyR} fill={lc[0]} opacity={0.88}/>
            <circle cx={100-branchSpread+2} cy={canopyY+6} r={canopyR*0.7} fill={lc[1]||lc[0]} opacity={0.8}/>
            <WitheringLeaves count={2}/>
          </>
        )}
        {/* Silver birch bark marks */}
        {species === "silverbirch" && !isDead && (
          <>
            <rect x={trunkX+1} y={170} width={trunkW-2} height={2} rx={1} fill="#8A8A8A" opacity={0.5}/>
            <rect x={trunkX+1} y={182} width={trunkW-2} height={1.5} rx={1} fill="#8A8A8A" opacity={0.4}/>
          </>
        )}
        {state === "Infested"      && <text x={88} y={138} fontSize={12}>🐛</text>}
        {state === "Fungal"        && <text x={85} y={140} fontSize={12}>🍄</text>}
        {state === "Polluted"      && <text x={80} y={205} fontSize={12}>🗑️</text>}
        {state === "Storm-Damaged" && <line x1={100} y1={155} x2={118} y2={148} stroke="#888" strokeWidth={2} opacity={0.7}/>}
        {state === "Sun-Scorched"  && <text x={108} y={148} fontSize={9}>🔥</text>}
        {tree.hasBirdhouse && <text x={64} y={172} fontSize={14}>🏠</text>}
        {state === "Thriving" && <><text x={120} y={139} fontSize={10}>✨</text><text x={62} y={149} fontSize={9}>⭐</text></>}
        <text x={100} y={222} fontSize={9} fill="#9A7A5A" fontWeight="600" textAnchor="middle">Sapling</text>
      </>
    );
  };

  // ── STAGE: MID ────────────────────────────────────────────────────────────
  const MidStage = () => {
    const h = isColumnar ? 90 : 75;  // trunk height
    const trunkW = isColumnar ? 7 : isBushy ? 11 : isNarrow ? 6 : 10;
    const trunkY = 200 - h;
    const bSpread = isColumnar ? 10 : isBushy ? 36 : isNarrow ? 18 : 28;
    const cR = isColumnar ? 14 : isBushy ? 32 : isNarrow ? 20 : 28;
    const cY = trunkY - 10;
    const showLeaves = !isDead && !["Withering","Stressed","Dormant"].includes(state);
    return (
      <>
        <ellipse cx={100} cy={202} rx={isColumnar ? 32 : 58} ry={11} fill="#C4A57B" opacity={0.5}/>
        {tree.mulched && <ellipse cx={100} cy={200} rx={40} ry={8} fill="#8B6914" opacity={0.38}/>}
        {/* Trunk */}
        <rect x={100-trunkW/2} y={trunkY} width={trunkW} height={h} rx={trunkW/2} fill={trunkColor}/>
        {/* Main branches */}
        {!isDead && (
          <>
            {isColumnar ? (
              <>
                <line x1={100} y1={trunkY+20} x2={100-bSpread} y2={trunkY+15} stroke={trunkColor} strokeWidth={4} strokeLinecap="round"/>
                <line x1={100} y1={trunkY+20} x2={100+bSpread} y2={trunkY+15} stroke={trunkColor} strokeWidth={4} strokeLinecap="round"/>
                <line x1={100} y1={trunkY+40} x2={100-bSpread+4} y2={trunkY+35} stroke={trunkColor} strokeWidth={3} strokeLinecap="round"/>
                <line x1={100} y1={trunkY+40} x2={100+bSpread-4} y2={trunkY+35} stroke={trunkColor} strokeWidth={3} strokeLinecap="round"/>
              </>
            ) : (
              <>
                <line x1={100} y1={trunkY+h*0.55} x2={100-bSpread} y2={trunkY+h*0.35} stroke={trunkColor} strokeWidth={5} strokeLinecap="round"/>
                <line x1={100} y1={trunkY+h*0.55} x2={100+bSpread} y2={trunkY+h*0.35} stroke={trunkColor} strokeWidth={5} strokeLinecap="round"/>
                <line x1={100} y1={trunkY+h*0.3} x2={100} y2={trunkY} stroke={trunkColor} strokeWidth={4} strokeLinecap="round"/>
                {isBushy && <>
                  <line x1={100-bSpread} y1={trunkY+h*0.35} x2={100-bSpread-16} y2={trunkY+h*0.15} stroke={trunkColor} strokeWidth={3} strokeLinecap="round"/>
                  <line x1={100+bSpread} y1={trunkY+h*0.35} x2={100+bSpread+16} y2={trunkY+h*0.15} stroke={trunkColor} strokeWidth={3} strokeLinecap="round"/>
                </>}
              </>
            )}
          </>
        )}
        {/* Canopy */}
        {showLeaves && (
          <>
            {isColumnar ? (
              <>
                <ellipse cx={100} cy={cY} rx={cR} ry={cR*2.5} fill={lc[0]} opacity={0.92}/>
                <ellipse cx={100} cy={cY+10} rx={cR-2} ry={cR*2} fill={lc[1]||lc[0]} opacity={0.8}/>
              </>
            ) : isBushy ? (
              <>
                <circle cx={100} cy={cY} r={cR} fill={lc[0]} opacity={0.9}/>
                <circle cx={100-bSpread+4} cy={cY+10} r={cR*0.8} fill={lc[1]||lc[0]} opacity={0.82}/>
                <circle cx={100+bSpread-4} cy={cY+8} r={cR*0.75} fill={lc[0]} opacity={0.8}/>
                <circle cx={100-bSpread-8} cy={cY+18} r={cR*0.6} fill={lc[1]||lc[0]} opacity={0.78}/>
                <circle cx={100+bSpread+8} cy={cY+16} r={cR*0.55} fill={lc[0]} opacity={0.76}/>
                <circle cx={82} cy={cY-12} r={cR*0.5} fill={lc[1]||lc[0]} opacity={0.8}/>
                <circle cx={118} cy={cY-10} r={cR*0.48} fill={lc[0]} opacity={0.78}/>
              </>
            ) : isNarrow ? (
              <>
                <ellipse cx={100} cy={cY} rx={cR} ry={cR*1.3} fill={lc[0]} opacity={0.9}/>
                <ellipse cx={95} cy={cY+10} rx={cR*0.75} ry={cR*0.9} fill={lc[1]||lc[0]} opacity={0.82}/>
                <ellipse cx={106} cy={cY-8} rx={cR*0.6} ry={cR*0.75} fill={lc[0]} opacity={0.78}/>
              </>
            ) : (
              <>
                <circle cx={100} cy={cY} r={cR} fill={lc[0]} opacity={0.9}/>
                <circle cx={100-bSpread+6} cy={cY+10} r={cR*0.72} fill={lc[1]||lc[0]} opacity={0.82}/>
                <circle cx={100+bSpread-6} cy={cY+8} r={cR*0.68} fill={lc[0]} opacity={0.8}/>
                <circle cx={80} cy={cY+16} r={cR*0.52} fill={lc[1]||lc[0]} opacity={0.78}/>
                <circle cx={120} cy={cY+14} r={cR*0.5} fill={lc[0]} opacity={0.76}/>
              </>
            )}
          </>
        )}
        {/* Dormant */}
        {state === "Dormant" && (
          <>
            <rect x={100-trunkW/2-3} y={trunkY-2} width={trunkW+6} height={h+4} rx={6} fill="#C8EAFA" opacity={0.8}/>
            <rect x={100-trunkW/2} y={trunkY} width={trunkW} height={h} rx={trunkW/2} fill={trunkColor}/>
            {!isColumnar && <>
              <line x1={100} y1={trunkY+h*0.55} x2={100-bSpread} y2={trunkY+h*0.35} stroke="#C8EAFA" strokeWidth={10} strokeLinecap="round" opacity={0.85}/>
              <line x1={100} y1={trunkY+h*0.55} x2={100+bSpread} y2={trunkY+h*0.35} stroke="#C8EAFA" strokeWidth={10} strokeLinecap="round" opacity={0.85}/>
              <line x1={100} y1={trunkY+h*0.55} x2={100-bSpread} y2={trunkY+h*0.35} stroke={trunkColor} strokeWidth={5} strokeLinecap="round"/>
              <line x1={100} y1={trunkY+h*0.55} x2={100+bSpread} y2={trunkY+h*0.35} stroke={trunkColor} strokeWidth={5} strokeLinecap="round"/>
            </>}
          </>
        )}
        {state === "Withering" && !isDead && <><circle cx={100-bSpread+4} cy={cY+10} r={cR*0.7} fill="#8B6914" opacity={0.82}/><circle cx={100} cy={cY} r={cR*0.55} fill="#D4C48A" opacity={0.75}/><WitheringLeaves count={5}/></>}
        {state === "Stressed"  && !isDead && <><circle cx={100} cy={cY} r={cR} fill={lc[0]} opacity={0.88}/><circle cx={100-bSpread+4} cy={cY+10} r={cR*0.68} fill={lc[1]||lc[0]} opacity={0.8}/><WitheringLeaves count={3}/></>}
        {/* Species fruit/blossom overlays */}
        {showLeaves && prof.fruit  && <><circle cx={85} cy={cY+8} r={5} fill={prof.fruit[0]} opacity={0.9}/><circle cx={114} cy={cY+6} r={4.5} fill={prof.fruit[1]||prof.fruit[0]} opacity={0.85}/></>}
        {showLeaves && prof.blossom && !["Withering","Dead"].includes(state) && <><circle cx={82} cy={cY+6} r={4} fill={prof.blossom} opacity={0.85}/><circle cx={116} cy={cY+4} r={3.8} fill={prof.blossom} opacity={0.8}/></>}
        {showLeaves && prof.berries && <><circle cx={84} cy={cY+8} r={4} fill={prof.berries[0]} opacity={0.9}/><circle cx={115} cy={cY+6} r={3.8} fill={prof.berries[1]||prof.berries[0]} opacity={0.85}/></>}
        {showLeaves && prof.berries2 && <><circle cx={83} cy={cY+7} r={4} fill={prof.berries2[0]} opacity={0.9}/><circle cx={116} cy={cY+5} r={3.8} fill={prof.berries2[1]||prof.berries2[0]} opacity={0.85}/></>}
        {/* Silver birch bark */}
        {species === "silverbirch" && !isDead && <>
          <rect x={100-trunkW/2+1} y={trunkY+20} width={trunkW-2} height={2.5} rx={1} fill="#8A8A8A" opacity={0.45}/>
          <rect x={100-trunkW/2+1} y={trunkY+40} width={trunkW-2} height={2} rx={1} fill="#8A8A8A" opacity={0.35}/>
        </>}
        {state === "Infested"      && <text x={88} y={cY-5} fontSize={13}>🐛</text>}
        {state === "Fungal"        && <text x={84} y={cY+4} fontSize={13}>🍄</text>}
        {state === "Polluted"      && <text x={76} y={205} fontSize={13}>🗑️</text>}
        {state === "Storm-Damaged" && <line x1={100} y1={trunkY+10} x2={128} y2={trunkY-5} stroke="#888" strokeWidth={3} opacity={0.7}/>}
        {state === "Sun-Scorched"  && <text x={120} y={cY-8} fontSize={10}>🔥</text>}
        {tree.hasBirdhouse && <text x={56} y={trunkY+h*0.6+14} fontSize={16}>🏠</text>}
        {state === "Thriving" && <><text x={138} y={cY-12} fontSize={12}>✨</text><text x={54} y={cY+4} fontSize={10}>⭐</text></>}
        <text x={100} y={222} fontSize={9} fill="#9A7A5A" fontWeight="600" textAnchor="middle">Growing</text>
      </>
    );
  };

  // ── STAGE: FULL ────────────────────────────────────────────────────────────
  const FullStage = () => {
    // Species-specific full shapes
    const profiles = {
      // Columnar narrow tall trees
      lombardy: () => {
        const showLeaves = !isDead && !["Withering","Stressed","Dormant"].includes(state);
        return (
          <>
            <ellipse cx={100} cy={202} rx={28} ry={9} fill="#C4A57B" opacity={0.5}/>
            {tree.mulched && <ellipse cx={100} cy={200} rx={20} ry={6} fill="#8B6914" opacity={0.38}/>}
            <rect x={96} y={105} width={8} height={97} rx={4} fill={trunkColor}/>
            {/* Tight columnar branches */}
            {!isDead && [...Array(5)].map((_,i)=>(
              <g key={i}>
                <line x1={100} y1={115+i*18} x2={88} y2={112+i*18} stroke={trunkColor} strokeWidth={3} strokeLinecap="round"/>
                <line x1={100} y1={115+i*18} x2={112} y2={112+i*18} stroke={trunkColor} strokeWidth={3} strokeLinecap="round"/>
              </g>
            ))}
            {showLeaves && <ellipse cx={100} cy={108} rx={16} ry={100} fill={lc[0]} opacity={0.88}/>}
            {showLeaves && <ellipse cx={98} cy={115} rx={10} ry={88} fill={lc[1]||lc[0]} opacity={0.6}/>}
            {state === "Dormant" && <>
              <ellipse cx={100} cy={150} rx={20} ry={98} fill="#C8EAFA" opacity={0.7}/>
              <rect x={96} y={105} width={8} height={97} rx={4} fill={trunkColor}/>
              {[...Array(5)].map((_,i)=>(
                <g key={i}>
                  <line x1={100} y1={115+i*18} x2={88} y2={112+i*18} stroke={trunkColor} strokeWidth={3} strokeLinecap="round"/>
                  <line x1={100} y1={115+i*18} x2={112} y2={112+i*18} stroke={trunkColor} strokeWidth={3} strokeLinecap="round"/>
                </g>
              ))}
            </>}
            {state === "Withering" && !isDead && <><ellipse cx={100} cy={108} rx={14} ry={85} fill="#8B6914" opacity={0.82}/><WitheringLeaves count={4}/></>}
            {state === "Stressed"  && !isDead && <><ellipse cx={100} cy={108} rx={15} ry={90} fill={lc[0]} opacity={0.88}/><WitheringLeaves count={2}/></>}
            {state === "Infested"  && <text x={108} y={80} fontSize={13}>🐛</text>}
            {state === "Fungal"    && <text x={108} y={90} fontSize={13}>🍄</text>}
            {state === "Polluted"  && <text x={76} y={205} fontSize={13}>🗑️</text>}
            {state === "Storm-Damaged" && <line x1={100} y1={115} x2={130} y2={100} stroke="#888" strokeWidth={3} opacity={0.7}/>}
            {state === "Sun-Scorched"  && <text x={116} y={90} fontSize={10}>🔥</text>}
            {tree.hasBirdhouse && <text x={52} y={160} fontSize={16}>🏠</text>}
            {state === "Thriving" && <><text x={118} y={70} fontSize={12}>✨</text><text x={68} y={82} fontSize={10}>⭐</text></>}
          </>
        );
      },

      // Silver birch – elegant narrow slightly weeping
      silverbirch: () => {
        const showLeaves = !isDead && !["Withering","Stressed","Dormant"].includes(state);
        const bt = "#D8D0C0";
        return (
          <>
            <ellipse cx={100} cy={202} rx={52} ry={11} fill="#C4A57B" opacity={0.5}/>
            {tree.mulched && <ellipse cx={100} cy={200} rx={36} ry={7} fill="#8B6914" opacity={0.38}/>}
            {/* White bark trunk */}
            <rect x={95} y={115} width={10} height={87} rx={5} fill={isDead ? "#888" : bt}/>
            {!isDead && <>
              <rect x={96} y={135} width={8} height={3} rx={1.5} fill="#8A8A8A" opacity={0.5}/>
              <rect x={96} y={155} width={8} height={2.5} rx={1} fill="#8A8A8A" opacity={0.4}/>
              <rect x={96} y={172} width={8} height={2} rx={1} fill="#8A8A8A" opacity={0.35}/>
            </>}
            {/* Weeping branches */}
            {!isDead && <>
              <path d="M100,130 Q128,145 135,165" stroke={bt} strokeWidth={5} fill="none" strokeLinecap="round"/>
              <path d="M100,130 Q72,145 65,165" stroke={bt} strokeWidth={5} fill="none" strokeLinecap="round"/>
              <path d="M100,118 Q118,132 122,148" stroke={bt} strokeWidth={3.5} fill="none" strokeLinecap="round"/>
              <path d="M100,118 Q82,132 78,148" stroke={bt} strokeWidth={3.5} fill="none" strokeLinecap="round"/>
              <path d="M135,165 Q138,180 132,192" stroke={bt} strokeWidth={3} fill="none" strokeLinecap="round"/>
              <path d="M65,165 Q62,180 68,192" stroke={bt} strokeWidth={3} fill="none" strokeLinecap="round"/>
            </>}
            {showLeaves && <>
              <ellipse cx={100} cy={108} rx={36} ry={32} fill={lc[0]} opacity={0.88}/>
              <ellipse cx={78} cy={118} rx={22} ry={18} fill={lc[1]||lc[0]} opacity={0.8}/>
              <ellipse cx={122} cy={116} rx={20} ry={16} fill={lc[0]} opacity={0.78}/>
              <ellipse cx={60} cy={128} rx={16} ry={14} fill={lc[1]||lc[0]} opacity={0.7}/>
              <ellipse cx={140} cy={126} rx={15} ry={13} fill={lc[0]} opacity={0.68}/>
              {/* Pendulous leaf clusters */}
              <circle cx={135} cy={168} r={8} fill={lc[0]} opacity={0.65}/>
              <circle cx={65} cy={166} r={8} fill={lc[1]||lc[0]} opacity={0.62}/>
              <circle cx={132} cy={185} r={6} fill={lc[0]} opacity={0.55}/>
              <circle cx={68} cy={183} r={6} fill={lc[1]||lc[0]} opacity={0.52}/>
            </>}
            {state === "Dormant" && <>
              <path d="M100,130 Q128,145 135,165" stroke="#C8EAFA" strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.8}/>
              <path d="M100,130 Q72,145 65,165" stroke="#C8EAFA" strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.8}/>
              <path d="M100,130 Q128,145 135,165" stroke={bt} strokeWidth={5} fill="none" strokeLinecap="round"/>
              <path d="M100,130 Q72,145 65,165" stroke={bt} strokeWidth={5} fill="none" strokeLinecap="round"/>
            </>}
            {state === "Withering" && !isDead && <><ellipse cx={100} cy={108} rx={34} ry={30} fill="#8B6914" opacity={0.82}/><ellipse cx={78} cy={118} rx={18} ry={15} fill="#D4C48A" opacity={0.75}/><WitheringLeaves count={6}/></>}
            {state === "Stressed"  && !isDead && <><ellipse cx={100} cy={108} rx={34} ry={30} fill={lc[0]} opacity={0.88}/><ellipse cx={78} cy={118} rx={20} ry={16} fill={lc[1]||lc[0]} opacity={0.8}/><WitheringLeaves count={3}/></>}
            {state === "Infested"  && <text x={88} y={76} fontSize={14}>🐛</text>}
            {state === "Fungal"    && <text x={84} y={82} fontSize={13}>🍄</text>}
            {state === "Polluted"  && <text x={74} y={205} fontSize={13}>🗑️</text>}
            {state === "Storm-Damaged" && <path d="M100,130 Q125,140 130,160" stroke="#888" strokeWidth={3} fill="none" strokeDasharray="4,2"/>}
            {state === "Sun-Scorched"  && <text x={140} y={100} fontSize={10}>🔥</text>}
            {tree.hasBirdhouse && <text x={56} y={155} fontSize={16}>🏠</text>}
            {state === "Thriving" && <><text x={148} y={88} fontSize={12}>✨</text><text x={48} y={104} fontSize={10}>⭐</text></>}
          </>
        );
      },

      // Hazel – multi-stem bushy shrubby tree
      hazel: () => {
        const showLeaves = !isDead && !["Withering","Stressed","Dormant"].includes(state);
        const stemPaths = [
          {x1:90, y1:200, x2:84, y2:140, w:5},
          {x1:100,y1:200, x2:100,y2:128, w:6},
          {x1:112,y1:200, x2:118,y2:138, w:5},
          {x1:82, y1:200, x2:72, y2:152, w:4},
          {x1:118,y1:200, x2:128,y2:150, w:4},
        ];
        return (
          <>
            <ellipse cx={100} cy={202} rx={60} ry={11} fill="#C4A57B" opacity={0.5}/>
            {tree.mulched && <ellipse cx={100} cy={200} rx={44} ry={8} fill="#8B6914" opacity={0.38}/>}
            {/* Multiple stems */}
            {!isDead && <>
              <line x1={90} y1={200} x2={84} y2={140} stroke={trunkColor} strokeWidth={5} strokeLinecap="round"/>
              <line x1={100} y1={200} x2={100} y2={128} stroke={trunkColor} strokeWidth={6} strokeLinecap="round"/>
              <line x1={112} y1={200} x2={118} y2={138} stroke={trunkColor} strokeWidth={5} strokeLinecap="round"/>
              <line x1={82} y1={200} x2={72} y2={152} stroke={trunkColor} strokeWidth={4} strokeLinecap="round"/>
              <line x1={118} y1={200} x2={128} y2={150} stroke={trunkColor} strokeWidth={4} strokeLinecap="round"/>
            </>}
            {isDead && <line x1={100} y1={200} x2={100} y2={140} stroke="#888" strokeWidth={6} strokeLinecap="round"/>}
            {/* Canopy clusters per stem */}
            {showLeaves && <>
              <circle cx={84} cy={128} r={24} fill={lc[0]} opacity={0.9}/>
              <circle cx={100} cy={116} r={26} fill={lc[1]||lc[0]} opacity={0.88}/>
              <circle cx={118} cy={126} r={24} fill={lc[0]} opacity={0.86}/>
              <circle cx={72} cy={140} r={18} fill={lc[1]||lc[0]} opacity={0.8}/>
              <circle cx={128} cy={138} r={18} fill={lc[0]} opacity={0.78}/>
              <circle cx={62} cy={154} r={14} fill={lc[1]||lc[0]} opacity={0.72}/>
              <circle cx={138} cy={152} r={13} fill={lc[0]} opacity={0.70}/>
            </>}
            {/* Hazel catkins when thriving/healthy */}
            {showLeaves && (state === "Thriving" || state === "Healthy") && <>
              <line x1={80} y1={132} x2={76} y2={144} stroke="#D4B84A" strokeWidth={3} strokeLinecap="round"/>
              <line x1={116} y1={130} x2={120} y2={142} stroke="#D4B84A" strokeWidth={3} strokeLinecap="round"/>
            </>}
            {/* Hazelnuts when fully grown & okay+ */}
            {showLeaves && (state === "Thriving" || state === "Healthy") && <>
              <circle cx={94} cy={128} r={5} fill="#8B6914" opacity={0.9}/>
              <ellipse cx={94} cy={125} rx={4} ry={3} fill="#A07828" opacity={0.7}/>
              <circle cx={108} cy={122} r={5} fill="#8B6914" opacity={0.85}/>
            </>}
            {state === "Dormant" && <>
              <line x1={90} y1={200} x2={84} y2={140} stroke="#C8EAFA" strokeWidth={10} strokeLinecap="round" opacity={0.8}/>
              <line x1={100} y1={200} x2={100} y2={128} stroke="#C8EAFA" strokeWidth={12} strokeLinecap="round" opacity={0.8}/>
              <line x1={112} y1={200} x2={118} y2={138} stroke="#C8EAFA" strokeWidth={10} strokeLinecap="round" opacity={0.8}/>
              <line x1={90} y1={200} x2={84} y2={140} stroke={trunkColor} strokeWidth={5} strokeLinecap="round"/>
              <line x1={100} y1={200} x2={100} y2={128} stroke={trunkColor} strokeWidth={6} strokeLinecap="round"/>
              <line x1={112} y1={200} x2={118} y2={138} stroke={trunkColor} strokeWidth={5} strokeLinecap="round"/>
            </>}
            {state === "Withering" && !isDead && <><circle cx={84} cy={128} r={22} fill="#8B6914" opacity={0.82}/><circle cx={100} cy={116} r={24} fill="#D4C48A" opacity={0.75}/><circle cx={118} cy={126} r={22} fill="#8B6914" opacity={0.78}/><WitheringLeaves count={6}/></>}
            {state === "Stressed"  && !isDead && <><circle cx={84} cy={128} r={22} fill={lc[0]} opacity={0.88}/><circle cx={100} cy={116} r={24} fill={lc[1]||lc[0]} opacity={0.85}/><WitheringLeaves count={3}/></>}
            {state === "Infested"  && <text x={88} y={100} fontSize={14}>🐛</text>}
            {state === "Fungal"    && <text x={84} y={108} fontSize={13}>🍄</text>}
            {state === "Polluted"  && <text x={72} y={205} fontSize={13}>🗑️</text>}
            {state === "Storm-Damaged" && <line x1={100} y1={128} x2={128} y2={112} stroke="#888" strokeWidth={3} opacity={0.7}/>}
            {state === "Sun-Scorched"  && <text x={136} y={116} fontSize={10}>🔥</text>}
            {tree.hasBirdhouse && <text x={54} y={162} fontSize={16}>🏠</text>}
            {state === "Thriving" && <><text x={148} y={96} fontSize={12}>✨</text><text x={46} y={112} fontSize={10}>⭐</text></>}
          </>
        );
      },

      // Generic spreading/round tree (apple, rowan, fieldmaple, hornbeam, crabapple, amelanchier, holly)
      default: () => {
        const canopyR = 30 + Math.min(health * 0.33, 33);
        const trunkTop = 200 - 100;
        const canopyOffset = 50;
        const cTop = trunkTop + canopyOffset;
        const showLeaves = !isDead && !["Withering","Stressed","Dormant"].includes(state);
        // Holly is more compact/dense
        const hollyMod = species === "holly" ? 0.8 : 1;
        // Amelanchier has slightly more spread (multi-stem-ish)
        const amelMod = species === "amelanchier" ? 1.1 : 1;
        const cR = canopyR * hollyMod * amelMod;
        return (
          <>
            <ellipse cx={100} cy={202} rx={66} ry={13} fill="#A07848" opacity={0.3}/>
            <ellipse cx={100} cy={200} rx={62} ry={11} fill="#C4A57B" opacity={0.5}/>
            {tree.mulched && <ellipse cx={100} cy={198} rx={46} ry={8} fill="#8B6914" opacity={0.38}/>}
            {/* Trunk */}
            <rect x={88} y={162} width={24} height={40} rx={7} fill={trunkColor}/>
            {!isDead && <>
              <line x1={93} y1={164} x2={93} y2={196} stroke="#4A2010" strokeWidth={1.5} opacity={0.3}/>
              {/* Spreading root buttresses */}
              <path d="M88,194 Q72,193 60,200" stroke={trunkColor} strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.9}/>
              <path d="M112,194 Q128,193 140,200" stroke={trunkColor} strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.9}/>
              {/* Primary branches */}
              <line x1={100} y1={170} x2={58} y2={152} stroke={trunkColor} strokeWidth={9} strokeLinecap="round"/>
              <line x1={100} y1={170} x2={142} y2={152} stroke={trunkColor} strokeWidth={9} strokeLinecap="round"/>
              <line x1={58} y1={152} x2={30} y2={138} stroke={trunkColor} strokeWidth={6} strokeLinecap="round"/>
              <line x1={142} y1={152} x2={170} y2={138} stroke={trunkColor} strokeWidth={6} strokeLinecap="round"/>
              <line x1={100} y1={162} x2={100} y2={128} stroke={trunkColor} strokeWidth={6} strokeLinecap="round"/>
              <line x1={100} y1={135} x2={78} y2={112} stroke={trunkColor} strokeWidth={3.5} strokeLinecap="round"/>
              <line x1={100} y1={135} x2={122} y2={112} stroke={trunkColor} strokeWidth={3.5} strokeLinecap="round"/>
              {/* For amelanchier – extra multi-stem feel */}
              {species === "amelanchier" && <>
                <line x1={88} y1={168} x2={70} y2={145} stroke={trunkColor} strokeWidth={4} strokeLinecap="round"/>
                <line x1={112} y1={168} x2={130} y2={145} stroke={trunkColor} strokeWidth={4} strokeLinecap="round"/>
              </>}
            </>}
            {/* Main canopy */}
            {showLeaves && <>
              <ellipse cx={100} cy={cTop - cR*0.6} rx={cR*1.15} ry={cR*0.88} fill={lc[0]} opacity={0.88}/>
              <circle cx={42} cy={cTop - cR*0.2} r={cR*0.72} fill={lc[1]||lc[0]} opacity={0.82}/>
              <circle cx={158} cy={cTop - cR*0.18} r={cR*0.68} fill={lc[0]} opacity={0.80}/>
              <ellipse cx={100} cy={cTop - cR} rx={cR*0.78} ry={cR*0.65} fill={lc[1]||lc[0]} opacity={0.78}/>
              <circle cx={62} cy={cTop - cR*0.82} r={cR*0.52} fill={lc[0]} opacity={0.75}/>
              <circle cx={138} cy={cTop - cR*0.8} r={cR*0.48} fill={lc[1]||lc[0]} opacity={0.72}/>
              <circle cx={24} cy={cTop - cR*0.05} r={cR*0.4} fill={lc[0]} opacity={0.70}/>
              <circle cx={176} cy={cTop - cR*0.02} r={cR*0.38} fill={lc[1]||lc[0]} opacity={0.68}/>
              <circle cx={84} cy={cTop - cR*1.22} r={cR*0.32} fill={lc[1]||lc[0]} opacity={0.72}/>
              <circle cx={116} cy={cTop - cR*1.2} r={cR*0.28} fill={lc[0]} opacity={0.68}/>
              {/* Holly gets spiky texture hint */}
              {species === "holly" && <>
                <ellipse cx={100} cy={cTop - cR*0.6} rx={cR*1.1} ry={cR*0.82} fill={lc[0]} opacity={0.35}/>
              </>}
            </>}
            {/* Dormant */}
            {state === "Dormant" && <>
              <line x1={100} y1={170} x2={58} y2={152} stroke="#C8EAFA" strokeWidth={14} strokeLinecap="round" opacity={0.9}/>
              <line x1={100} y1={170} x2={142} y2={152} stroke="#C8EAFA" strokeWidth={14} strokeLinecap="round" opacity={0.9}/>
              <line x1={58} y1={152} x2={30} y2={138} stroke="#C8EAFA" strokeWidth={11} strokeLinecap="round" opacity={0.9}/>
              <line x1={142} y1={152} x2={170} y2={138} stroke="#C8EAFA" strokeWidth={11} strokeLinecap="round" opacity={0.9}/>
              <line x1={100} y1={162} x2={100} y2={128} stroke="#C8EAFA" strokeWidth={11} strokeLinecap="round" opacity={0.9}/>
              <line x1={100} y1={170} x2={58} y2={152} stroke={trunkColor} strokeWidth={9} strokeLinecap="round"/>
              <line x1={100} y1={170} x2={142} y2={152} stroke={trunkColor} strokeWidth={9} strokeLinecap="round"/>
              <line x1={58} y1={152} x2={30} y2={138} stroke={trunkColor} strokeWidth={6} strokeLinecap="round"/>
              <line x1={142} y1={152} x2={170} y2={138} stroke={trunkColor} strokeWidth={6} strokeLinecap="round"/>
              <line x1={100} y1={162} x2={100} y2={128} stroke={trunkColor} strokeWidth={6} strokeLinecap="round"/>
              <rect x={88} y={162} width={24} height={40} rx={7} fill={trunkColor}/>
            </>}
            {/* Withering */}
            {!isDead && state === "Withering" && <>
              <ellipse cx={60} cy={cTop - cR*0.25} rx={cR*0.7} ry={cR*0.55} fill="#8B6914" opacity={0.82}/>
              <circle cx={88} cy={cTop - cR} r={cR*0.42} fill="#D4C48A" opacity={0.75}/>
              <circle cx={130} cy={cTop - cR*0.75} r={cR*0.38} fill="#8B6914" opacity={0.70}/>
              <WitheringLeaves count={7}/>
            </>}
            {!isDead && state === "Stressed" && <>
              <ellipse cx={100} cy={cTop - cR*0.6} rx={cR*1.1} ry={cR*0.82} fill={lc[0]} opacity={0.88}/>
              <circle cx={42} cy={cTop - cR*0.2} r={cR*0.68} fill={lc[1]||lc[0]} opacity={0.82}/>
              <ellipse cx={100} cy={cTop - cR} rx={cR*0.7} ry={cR*0.58} fill={lc[1]||lc[0]} opacity={0.78}/>
              <WitheringLeaves count={3}/>
            </>}
            {/* Species-specific fruit/blossom overlays */}
            {showLeaves && (species === "apple" || species === "crabapple") && <>
              <circle cx={80} cy={cTop - cR*0.5} r={5.5} fill={prof.fruit ? prof.fruit[0] : "#E8503A"} opacity={0.9}/>
              <circle cx={118} cy={cTop - cR*0.48} r={5} fill={prof.fruit ? prof.fruit[1] : "#E8503A"} opacity={0.85}/>
              <circle cx={100} cy={cTop - cR*0.78} r={4.5} fill={prof.fruit ? prof.fruit[2]||prof.fruit[0] : "#F4C430"} opacity={0.85}/>
            </>}
            {showLeaves && species === "rowan" && <>
              <circle cx={84} cy={cTop - cR*0.58} r={4} fill="#E07B54" opacity={0.85}/>
              <circle cx={116} cy={cTop - cR*0.56} r={3.8} fill="#E07B54" opacity={0.8}/>
              <circle cx={100} cy={cTop - cR*0.9} r={3.5} fill="#FFAA80" opacity={0.8}/>
            </>}
            {showLeaves && species === "holly" && <>
              <circle cx={84} cy={cTop - cR*0.5} r={4} fill="#CC2222" opacity={0.9}/>
              <circle cx={116} cy={cTop - cR*0.52} r={3.8} fill="#EE3333" opacity={0.85}/>
              <circle cx={100} cy={cTop - cR*0.3} r={4} fill="#CC2222" opacity={0.88}/>
            </>}
            {showLeaves && (species === "crabapple" || species === "amelanchier") && state !== "Withering" && <>
              <circle cx={76} cy={cTop - cR*0.44} r={5.5} fill={prof.blossom||"#F9A8D4"} opacity={0.82}/>
              <circle cx={122} cy={cTop - cR*0.42} r={5} fill={prof.blossom||"#F9A8D4"} opacity={0.8}/>
            </>}
            {showLeaves && species === "amelanchier" && <>
              <circle cx={80} cy={cTop - cR*0.55} r={4} fill="#6A4C93" opacity={0.85}/>
              <circle cx={120} cy={cTop - cR*0.53} r={3.8} fill="#7A5CA3" opacity={0.8}/>
            </>}
            {showLeaves && species === "fieldmaple" && <>
              <ellipse cx={84} cy={cTop - cR*0.4} rx={5} ry={3} fill="#D4A017" opacity={0.85}/>
              <ellipse cx={116} cy={cTop - cR*0.38} rx={5} ry={3} fill="#D4A017" opacity={0.8}/>
            </>}
            {showLeaves && species === "hornbeam" && <>
              <ellipse cx={86} cy={cTop - cR*0.42} rx={4} ry={6} fill="#7A7A3A" opacity={0.75}/>
              <ellipse cx={114} cy={cTop - cR*0.4} rx={4} ry={6} fill="#7A7A3A" opacity={0.7}/>
            </>}
            {state === "Infested" && <><text x={88} y={cTop - cR - 2} fontSize={14}>🐛</text><circle cx={74} cy={cTop - cR*0.45} r={8} fill="transparent" stroke="#8B6914" strokeWidth={2} strokeDasharray="2,2"/></>}
            {state === "Fungal"   && <text x={84} y={cTop - cR + 8} fontSize={14}>🍄</text>}
            {state === "Polluted" && <text x={78} y={205} fontSize={14}>🗑️</text>}
            {state === "Storm-Damaged" && <line x1={100} y1={162} x2={148} y2={138} stroke="#888" strokeWidth={3}/>}
            {state === "Sun-Scorched"  && <text x={152} y={cTop - cR + 20} fontSize={10}>🔥</text>}
            {tree.hasBirdhouse && <text x={59} y={cTop + 43} fontSize={16}>🏠</text>}
            {state === "Thriving" && <><text x={148} y={cTop - cR - 5} fontSize={13}>✨</text><text x={48} y={cTop - cR + 12} fontSize={11}>⭐</text><text x={100} y={cTop - cR*1.4} fontSize={11}>🌟</text></>}
          </>
        );
      },
    };

    const renderProfile = profiles[species] || profiles.default;
    return (
      <>
        {renderProfile()}
        <text x={91} y={215} fontSize={9} fill="#7A5C3C" fontFamily="Georgia, serif">
          {Array(Math.min(day, 7)).fill("◦").join("")}
        </text>
        {isDead && <>
          <text x={54} y={199} fontSize={11} opacity={0.65}>🍂</text>
          <text x={71} y={207} fontSize={12} opacity={0.75}>🍂</text>
          <text x={110} y={206} fontSize={11} opacity={0.7}>🍂</text>
          <text x={130} y={206} fontSize={12} opacity={0.65}>🍂</text>
        </>}
        <text x={100} y={222} fontSize={9} fill="#9A7A5A" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">Fully Grown</text>
      </>
    );
  };

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={200} height={230} viewBox="0 0 200 230"
        style={{ filter: animate ? "drop-shadow(0 0 14px rgba(100,200,100,0.35))" : "none", transition: "filter 0.5s" }}>
        <defs>
          <filter id="dormantGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.5" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>
        {tree.currentEvent === "heatwave" && <ellipse cx={162} cy={28} rx={26} ry={22} fill="#FFB627" opacity={0.5}/>}
        {tree.currentEvent === "storm" && <>
          <ellipse cx={80} cy={18} rx={52} ry={20} fill="#7A8CAA" opacity={0.4}/>
          <text x={142} y={38} fontSize={20}>⚡</text>
        </>}
        {growthStage === "seed" && <SeedStage />}
        {growthStage === "sapling" && <SaplingStage />}
        {growthStage === "mid" && <MidStage />}
        {growthStage === "full" && <FullStage />}
      </svg>
      <div style={{ display: "flex", gap: 4, marginTop: -10, fontSize: 18 }}>
        {visitors.map((v, i) => (
          <span key={i} style={{ animation: "float 2s ease-in-out infinite", animationDelay: `${i * 0.5}s` }}>{v}</span>
        ))}
      </div>
    </div>
  );
}

// ─── STAT GAUGE ───────────────────────────────────────────────────────────────
function StatGauge({ label, emoji, value, color }) {
  const pct = Math.max(0, Math.min(100, value));
  const segColor = pct >= 60 ? "#4CAF50" : pct >= 40 ? "#FFC107" : "#F44336";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <span style={{ fontSize: 16 }}>{emoji}</span>
      <div style={{ width: 32, height: 80, background: "#E8EDE8", borderRadius: 16, position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: `${pct}%`, background: segColor,
          borderRadius: 16, transition: "height 0.6s ease",
        }} />
      </div>
      <span style={{ fontSize: 9, color: "#888", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 10, color: segColor, fontWeight: 700 }}>{Math.round(pct)}</span>
    </div>
  );
}

// ─── INITIAL TREE ──────────────────────────────────────────────────────────────
function freshTree(species) {
  return {
    h2o: 60, light: 65, soil: 60, bio: 45, clean: 70,
    mulched: false, staked: false, hasBirdhouse: false,
    infested: false, fungal: false,
    currentEvent: null,
    mood: 70,
    lastActionTimes: {},
    chain: [],
    day: 1,
    rings: 0,
    ringHistory: [], // Array of ring colors: 'gold' for Thriving days, 'green' for others
    species,
    startedAt: Date.now(),
    ecoShieldsHeld: 0,
    ecoShieldExpiry: null,
    missionsForShield: 0,
    cleanCount: 0,
    feedCount: 0,
    waterWiseDays: 0,
  };
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function LegacyGrove() {
  const [screen, setScreen] = useState("onboard");
  const [tree, setTree] = useState({ h2o: 85, light: 80, soil: 82, bio: 78, clean: 80, mulched: false, staked: false, hasBirdhouse: false, infested: false, fungal: false, currentEvent: null, mood: 85, lastActionTimes: {}, chain: [], day: 7, rings: 6, ringHistory: ["green","green","green","green","green","green"], species: "apple", startedAt: Date.now(), ecoShieldsHeld: 0, ecoShieldExpiry: null, missionsForShield: 0, cleanCount: 0, feedCount: 0, waterWiseDays: 0 });
  const [species, setSpecies] = useState("apple");
  const [state, setState] = useState("Healthy");
  const [toast, setToast] = useState(null);
  const [badges, setBadges] = useState([]);
  const [completedMissions, setCompletedMissions] = useState([]);
  const [actionAnim, setActionAnim] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [passOnNote, setPassOnNote] = useState("");
  const [passOnInitials, setPassOnInitials] = useState("");
  const [passOnDone, setPassOnDone] = useState(false);
  const [showChainModal, setShowChainModal] = useState(false);
  const [cleanupStep, setCleanupStep] = useState(0);
  const [newBadge, setNewBadge] = useState(null);
  const [badgeGlow, setBadgeGlow] = useState(false);
  const toastTimer = useRef(null);
  const badgeTimer = useRef(null);

  // Daily tick: runs every 60 seconds in demo (represents 24h)
  // TEMP TESTING: Halved to 30s to double speed (EASY TO REVERSE)
  const TICK_MS = 30000;

  const showToast = useCallback((msg, type = "info") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const showBadge = useCallback((badgeKey) => {
    const badge = BADGES.find(b => b.key === badgeKey);
    if (!badge) return;
    if (badgeTimer.current) clearTimeout(badgeTimer.current);
    setNewBadge(badge);
    badgeTimer.current = setTimeout(() => {
      setNewBadge(null);
      setBadgeGlow(true);
      setTimeout(() => setBadgeGlow(false), 800);
    }, 3000);
  }, []);

  const recalcState = useCallback((t) => {
    const s = computeState(t);
    setState(s);
    return s;
  }, []);

  // Tick simulation
  useEffect(() => {
    if (!tree || screen === "onboard") return;
    const interval = setInterval(() => {
      setTree(prev => {
        if (!prev) return prev;
        const drifted = applyNaturalDrift(prev, species);
        // Random events (low chance per tick)
        let event = prev.currentEvent;
        if (Math.random() < 0.08) event = Math.random() < 0.5 ? "heatwave" : "storm";
        else if (Math.random() < 0.15) event = null;

        const driftedStats = [drifted.h2o, drifted.light, drifted.soil, drifted.bio, drifted.clean];
        const isWitheringCondition = driftedStats.some(v => v < 20) || driftedStats.filter(v => v < 30).length >= 2;
        const infested = prev.infested || (isWitheringCondition && Math.random() < 0.15);
        const fungal = prev.fungal || (drifted.h2o > 80 && Math.random() < 0.1);

        const next = { ...prev, ...drifted, infested, fungal, currentEvent: event };
        const newState = computeState(next);

        // Ring reward (legacy counter for display)
        const rings = newState === "Thriving" ? prev.rings + 1 : prev.rings;

        // Day advance (every 3 ticks = 180s = 1 day; halved to 90s when Thriving)
        // Stressed seed/sapling/mid (day <= 4) grow at half speed; Dormant = no growth
        const isEarlyStage = prev.day <= 4;
        const growthIncrement = newState === "Dormant" ? 0
          : newState === "Thriving" ? 0.66
          : (newState === "Stressed" && isEarlyStage) ? 0.165
          : 0.33;
        const day = prev.day + growthIncrement;
        
        // Track day completion and add ring to history
        const dayJustCompleted = Math.floor(day) > Math.floor(prev.day);
        let waterWiseDays = prev.waterWiseDays || 0;
        let ringHistory = [...(prev.ringHistory || [])];
        
        if (dayJustCompleted) {
          // Add ring for the completed day
          const ringColor = newState === "Thriving" ? "gold" : "green";
          ringHistory.push(ringColor);
          
          // Water Wise tracking - check if water was kept above 60 for the full day
          if (next.h2o >= 60) {
            waterWiseDays += 1;
            if (waterWiseDays >= 3 && !badges.includes("water_wise")) {
              setBadges(b => [...b, "water_wise"]);
              showBadge("water_wise");
            }
          } else {
            waterWiseDays = 0; // Reset if water drops below 60
          }
        }

        if (event && event !== prev.currentEvent) {
          if (event === "heatwave") showToast("🌡️ Heat wave! Add shade and mulch!", "warn");
          if (event === "storm") showToast("⚡ Storm incoming! Stake your tree!", "warn");
        }

        if (newState === "Dead" && prev.day < 8) showToast("💀 Your tree has died. Begin the cleanup quest.", "error");
        if (newState === "Withering" && computeState(prev) !== "Withering") showToast("🥀 Tree is withering! Quick – water and care!", "warn");

        return { ...next, rings, day, waterWiseDays, ringHistory };
      });
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [tree, species, screen, showToast, badges, showBadge, setBadges]);

  // Recompute state whenever tree changes
  useEffect(() => {
    if (tree) recalcState(tree);
  }, [tree, recalcState]);

  const startGame = () => {
    const t = freshTree(species);
    setTree(t);
    setState(computeState(t));
    setScreen("home");
    setCompletedMissions([]);
    setBadges([]);
    setPassOnDone(false);
    showToast(`🌱 ${SPECIES[species].name} seed planted! Day 1 begins.`, "success");
  };

  const applyAction = (action) => {
    if (!tree) return;
    const now = Date.now();
    const lastTime = tree.lastActionTimes[action.key] || 0;
    if (action.cooldown > 0 && now - lastTime < action.cooldown) {
      showToast(`⏳ ${action.label} needs more time to work.`, "warn");
      return;
    }
    setActionAnim(true);
    setTimeout(() => setActionAnim(false), 800);

    setTree(prev => {
      const delta = action.apply(prev);
      const next = { ...prev, ...delta, lastActionTimes: { ...prev.lastActionTimes, [action.key]: now } };
      const newState = computeState(next);
      // Badge checks
      if (!badges.includes("pollinator_pal") && next.bio >= 80) {
        setBadges(b => [...b, "pollinator_pal"]);
        showBadge("pollinator_pal");
      }
      if (action.key === "clean") {
        const times = (prev.cleanCount || 0) + 1;
        next.cleanCount = times;
        if (times >= 3 && !badges.includes("litter_lifter")) {
          setBadges(b => [...b, "litter_lifter"]);
          showBadge("litter_lifter");
        }
      }
      if (action.key === "stake" && prev.currentEvent === "storm" && !badges.includes("storm_shield")) {
        setBadges(b => [...b, "storm_shield"]);
        showBadge("storm_shield");
      }
      if (action.key === "shade" && prev.currentEvent === "heatwave" && !badges.includes("shade_hero")) {
        setBadges(b => [...b, "shade_hero"]);
        showBadge("shade_hero");
      }
      if (action.key === "feed") {
        const times = (prev.feedCount || 0) + 1;
        next.feedCount = times;
        if (times >= 3 && !badges.includes("compost_captain")) {
          setBadges(b => [...b, "compost_captain"]);
          showBadge("compost_captain");
        }
      }
      if (action.key !== "pest_spray" && action.key !== "fungus_cure") {
        showToast(`${action.emoji} ${action.label} applied! +care`, "success");
      } else {
        showToast(`${action.emoji} Treatment applied!`, "success");
      }
      return next;
    });
    setSelectedAction(null);
  };

  const completeMission = (mission) => {
    if (completedMissions.includes(mission.key)) return;
    setCompletedMissions(prev => [...prev, mission.key]);
    setTree(prev => {
      if (!prev) return prev;
      const next = { ...prev };
      Object.entries(mission.boost).forEach(([k, v]) => {
        if (k === "mood") next.mood = Math.min(100, (next.mood || 50) + v);
        else next[k] = Math.min(100, (next[k] || 0) + v);
      });
      // Every 2 missions completed awards 1 Eco-Shield
      const newMissionsForShield = (prev.missionsForShield || 0) + 1;
      if (newMissionsForShield >= 2) {
        next.ecoShieldsHeld = (prev.ecoShieldsHeld || 0) + 1;
        next.missionsForShield = 0;
        showToast("🛡️ Eco-Shield earned! Go to Care to use it.", "success");
      } else {
        next.missionsForShield = newMissionsForShield;
        showToast(`🌍 Mission complete: ${mission.title}! (${newMissionsForShield}/2 for Eco-Shield)`, "success");
      }
      return next;
    });
  };

  const useEcoShield = () => {
    if (!tree || (tree.ecoShieldsHeld || 0) < 1) return;
    // 1 day = 3 ticks at 60s each = 180s in demo
    // TEMP TESTING: Halved to 90s to match doubled speed (EASY TO REVERSE)
    const ONE_DAY_MS = 90000;
    setTree(prev => ({
      ...prev,
      clean: Math.min(100, prev.clean + 5),
      ecoShieldsHeld: (prev.ecoShieldsHeld || 1) - 1,
      ecoShieldExpiry: Date.now() + ONE_DAY_MS,
    }));
    showToast("🛡️ Eco-Shield activated! Clean +5 & protected for 1 day.", "success");
  };

  const doPassOn = () => {
    if (!passOnInitials.trim()) { showToast("Please enter your initials!", "warn"); return; }
    const note = { initials: passOnInitials.toUpperCase().slice(0, 3), note: passOnNote, emoji: "🌿", timestamp: Date.now() };
    setTree(prev => ({
      ...prev,
      chain: [...(prev?.chain || []), note],
    }));
    if (!badges.includes("kindness_courier")) {
      setBadges(b => [...b, "kindness_courier"]);
      showBadge("kindness_courier");
    }
    setPassOnDone(true);
    showToast("🎉 Tree passed on! Receiving a new tree...", "success");
    setTimeout(() => {
      // Receive a "new" tree from the pool
      const nextSpecies = Object.keys(SPECIES)[Math.floor(Math.random() * 10)];
      const incomingChain = [
        { initials: "AJ", note: "I watered every day 💚", emoji: "🌿", timestamp: Date.now() - 86400000 },
        { initials: "BK", note: "Great in the sunshine! ☀️", emoji: "☀️", timestamp: Date.now() - 43200000 },
      ];
      const incoming = { ...freshTree(nextSpecies), chain: incomingChain, h2o: 55, bio: 60, soil: 55, clean: 65, day: 1 };
      setTree(incoming);
      setSpecies(nextSpecies);
      setState(computeState(incoming));
      setCompletedMissions([]);
      setPassOnDone(false);
      setPassOnInitials("");
      setPassOnNote("");
      setScreen("home");
      showToast(`🌳 You received a ${SPECIES[nextSpecies].name}! Carried by ${incomingChain.length} carers.`, "success");
    }, 2500);
  };

  const doCleanup = () => {
    if (cleanupStep < 2) { setCleanupStep(s => s + 1); return; }
    const nextSpecies = Object.keys(SPECIES)[Math.floor(Math.random() * 10)];
    const oldChain = tree?.chain || [];
    const t = { ...freshTree(nextSpecies), chain: oldChain };
    setTree(t);
    setSpecies(nextSpecies);
    setState(computeState(t));
    setCleanupStep(0);
    setScreen("home");
    showToast(`🌱 A new ${SPECIES[nextSpecies].name} has been planted. The chain lives on.`, "success");
  };

  // ─── SCREENS ───────────────────────────────────────────────────────────────
  const stateConf = STATE_CONFIG[state] || STATE_CONFIG.Okay;
  const isDay7 = tree && tree.day >= 7;

  const navItems = [
    { key: "home", label: "Home", emoji: "🌳" },
    { key: "care", label: "Care", emoji: "🌿" },
    { key: "missions", label: "Missions", emoji: "🌍" },
    { key: "chain", label: "Chain", emoji: "🔗" },
  ];

  // Base styles
  const S = {
    app: { fontFamily: "'Segoe UI', 'Nunito', system-ui, sans-serif", maxWidth: 420, margin: "0 auto", minHeight: "100vh", background: "#F4F8F2", display: "flex", flexDirection: "column", position: "relative", userSelect: "none" },
    header: { background: "linear-gradient(135deg, #34C759 0%, #52D273 100%)", padding: "14px 20px 10px", color: "white", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" },
    body: { flex: 1, overflowY: "auto", padding: "0 0 80px" },
    nav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 420, background: "white", borderTop: "1px solid #E0E8DC", display: "flex", justifyContent: "space-around", padding: "8px 0 10px", boxShadow: "0 -2px 12px rgba(0,0,0,0.08)", zIndex: 100 },
    navBtn: (active) => ({ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 12px", border: "none", background: "none", cursor: "pointer", color: active ? "#2D6A4F" : "#999", fontSize: 10, fontWeight: active ? 700 : 500, transition: "color 0.2s" }),
    card: { background: "white", borderRadius: 16, margin: "10px 14px", padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
    btn: (color = "#2D6A4F") => ({ background: color, color: "white", border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "transform 0.1s, opacity 0.2s", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }),
    smallBtn: (color = "#2D6A4F") => ({ background: color, color: "white", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }),
    tag: (color) => ({ background: color + "22", color: color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }),
  };

  // ── ONBOARD ─────────────────────────────────────────────────────────────────
  if (screen === "onboard") {
    const ONBOARD_SPECIES = [
      { key: "apple",       latin: "Malus domestica",         highlight: "Pollinators & fruit" },
      { key: "rowan",       latin: "Sorbus aucuparia",        highlight: "Berries for birds"   },
      { key: "hazel",       latin: "Corylus avellana",        highlight: "Nuts & catkins"      },
      { key: "fieldmaple",  latin: "Acer campestre",          highlight: "Bee-friendly native" },
      { key: "holly",       latin: "Ilex aquifolium",         highlight: "Evergreen shelter"   },
      { key: "silverbirch", latin: "Betula pendula",          highlight: "100s of insects"     },
      { key: "hornbeam",    latin: "Carpinus betulus",        highlight: "Dense wildlife home"  },
      { key: "crabapple",   latin: "Malus spp.",              highlight: "Blossom & berries"   },
      { key: "amelanchier", latin: "Amelanchier lamarckii",   highlight: "Multi-season beauty"  },
      { key: "lombardy",    latin: "Populus nigra 'Italica'", highlight: "Fast carbon capture"  },
    ];
    const selSp = SPECIES[species];
    return (
      <div style={{ ...S.app, background: "linear-gradient(180deg, #1A4A2E 0%, #2D7A4A 40%, #3FBB6A 100%)", justifyContent: "flex-start", padding: 0, overflowY: "auto" }}>
        <style>{`
          @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
          @keyframes grow { from{transform:scale(0.85) translateY(16px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
          .sp-card:hover { transform: scale(1.06); }
          .sp-card { transition: transform 0.15s; }
          .action-btn:active { transform: scale(0.95); }
        `}</style>
        <div style={{ textAlign: "center", color: "white", padding: "36px 24px 16px", animation: "grow 0.6s ease" }}>
          <img src={logoImg} alt="Legacy Grove" style={{ width: 90, height: 90, marginBottom: 6, animation: "float 3s ease-in-out infinite" }} />
          <h1 style={{ fontSize: 34, fontWeight: 900, margin: "0 0 4px", letterSpacing: -1 }}>Legacy Grove</h1>
          <p style={{ opacity: 0.7, fontSize: 13, margin: "0 0 10px" }}>7-Day Tree Keeper · Ages 7–11</p>
          <p style={{ fontSize: 13, opacity: 0.88, maxWidth: 300, margin: "0 auto", lineHeight: 1.65 }}>
            Choose your seed, care for it for 7 days, then pass it on with a kind message 💚
          </p>
        </div>
        <div style={{ background: "rgba(0,0,0,0.22)", margin: "0 14px 12px", borderRadius: 20, padding: "14px 10px" }}>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, margin: "0 0 11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, textAlign: "center" }}>
            10 native & wildlife trees
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 7 }}>
            {ONBOARD_SPECIES.map(({ key }) => {
              const sp = SPECIES[key];
              const sel = species === key;
              return (
                <div key={key} className="sp-card" onClick={() => setSpecies(key)}
                  style={{
                    background: sel ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.12)",
                    borderRadius: 12, padding: "10px 4px 8px", cursor: "pointer", textAlign: "center",
                    border: sel ? `2.5px solid ${sp.color}` : "2px solid rgba(255,255,255,0.15)",
                    boxShadow: sel ? `0 4px 14px ${sp.color}66` : "none",
                  }}>
                  <div style={{ fontSize: 22 }}>{sp.emoji}</div>
                  <div style={{ fontSize: 8, color: sel ? sp.color : "rgba(255,255,255,0.85)", fontWeight: 700, marginTop: 3, lineHeight: 1.2 }}>{sp.name}</div>
                </div>
              );
            })}
          </div>
        </div>
        {selSp && (
          <div style={{ margin: "0 14px 14px", background: "rgba(255,255,255,0.95)", borderRadius: 18, padding: "16px 16px", boxShadow: `0 4px 20px ${selSp.color}44`, animation: "grow 0.25s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 34 }}>{selSp.emoji}</div>
              <div>
                <div style={{ fontWeight: 900, fontSize: 17, color: selSp.color }}>{selSp.name}</div>
                <div style={{ fontSize: 10, color: "#999", fontStyle: "italic" }}>{ONBOARD_SPECIES.find(o=>o.key===species)?.latin}</div>
                <div style={{ fontSize: 11, color: "#4A9E6F", fontWeight: 700, marginTop: 2 }}>✦ {ONBOARD_SPECIES.find(o=>o.key===species)?.highlight}</div>
              </div>
            </div>
            <div style={{ borderTop: "1px solid #EEF", paddingTop: 10, marginBottom: 10 }}>
              {selSp.tips.map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 7, marginBottom: i < selSp.tips.length-1 ? 5 : 0 }}>
                  <span style={{ fontSize: 13, flexShrink: 0 }}>🌿</span>
                  <p style={{ color: "#555", fontSize: 12, margin: 0, lineHeight: 1.5 }}>{t}</p>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 7 }}>
              {[
                { label: "Water", val: selSp.waterTol, emoji: "💧" },
                { label: "Light",  val: selSp.lightTol,  emoji: "☀️" },
                { label: "Growth", val: selSp.growthSpeed, emoji: "🌱" },
              ].map(({ label, val, emoji }) => (
                <div key={label} style={{ flex: 1, background: "#F4F8F2", borderRadius: 10, padding: "7px 6px", textAlign: "center" }}>
                  <div style={{ fontSize: 14 }}>{emoji}</div>
                  <div style={{ fontSize: 8, color: "#999", fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 10, color: "#4A9E6F", fontWeight: 800, marginTop: 2 }}>
                    {val < 0.8 ? "Low" : val > 1.2 ? "High" : "Med"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ padding: "0 14px 32px", textAlign: "center" }}>
          <button style={{ ...S.btn("white"), color: "#1A4A2E", fontSize: 16, padding: "15px 0", borderRadius: 18, fontWeight: 900, width: "100%", display: "block" }} onClick={startGame}>
            Plant My {selSp?.name || "Seed"} 🌱
          </button>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 14 }}>No ads · No chat · Safe by design</p>
        </div>
      </div>
    );
  }

  // ── DEAD CLEANUP ────────────────────────────────────────────────────────────
  if (state === "Dead" && screen !== "onboard") {
    const steps = [
      { emoji: "🪴", title: "Say Goodbye", desc: "Your tree taught you a lot. With care and respect, it's time to let go.", btn: "Remove Gently" },
      { emoji: "🌿", title: "Return to Earth", desc: "Choose eco disposal — compost or leave as a log for creatures. Carbon returns to the soil.", btn: "Compost & Recycle" },
      { emoji: "🌱", title: "Begin Again", desc: "The chain lives on. A new seed, same story. Plant with everything you've learned.", btn: "Plant a New Seed" },
    ];
    const step = steps[cleanupStep];
    return (
      <div style={S.app}>
        <div style={{ ...S.header, background: "linear-gradient(135deg, #5A5A5A, #888)" }}>
          <span style={{ fontWeight: 900, fontSize: 18 }}>🌑 Legacy Grove</span>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginTop: 30 }}>
          <TreeVisual tree={tree} state="Dead" species={species} day={Math.floor(tree.day)} />
          <div style={{ fontSize: 52, marginBottom: 12 }}>{step.emoji}</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#5A5A5A", margin: "0 0 8px" }}>{step.title}</h2>
          <p style={{ color: "#888", fontSize: 14, maxWidth: 300, lineHeight: 1.7, marginBottom: 24 }}>{step.desc}</p>
          <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
            {steps.map((_, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i <= cleanupStep ? "#4A9E6F" : "#DDD", transition: "background 0.3s" }} />
            ))}
          </div>
          <button style={{ ...S.btn(cleanupStep < 2 ? "#888" : "#2D6A4F"), padding: "14px 32px", fontSize: 15, borderRadius: 16 }} onClick={doCleanup}>
            {step.btn}
          </button>
        </div>
      </div>
    );
  }

  // ── HOME ────────────────────────────────────────────────────────────────────
  const HomeScreen = () => {
    const daysLeft = Math.max(0, 7 - Math.floor(tree.day));
    const dailyTips = ACTIONS.filter(a =>
      (tree.h2o < 50 && a.key === "water") ||
      (tree.light < 50 && a.key === "light") ||
      (tree.soil < 50 && a.key === "feed") ||
      (tree.bio < 50 && (a.key === "birdhouse" || a.key === "wildflowers")) ||
      (tree.clean < 50 && a.key === "clean") ||
      (tree.infested && a.key === "pest_spray") ||
      (tree.fungal && a.key === "fungus_cure")
    ).slice(0, 3);

    return (
      <div>
        {/* State banner */}
        <div style={{ background: stateConf.bg, borderBottom: `3px solid ${stateConf.color}`, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>{stateConf.icon}</span>
          <div>
            <div style={{ fontWeight: 800, color: stateConf.color, fontSize: 16 }}>{state}</div>
            <div style={{ color: "#666", fontSize: 12 }}>{stateConf.msg}</div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#999" }}>Day {Math.floor(tree.day)} of 7</div>
            <div style={{ fontSize: 11, color: daysLeft <= 2 ? "#C24D2C" : "#4A9E6F", fontWeight: 700 }}>{daysLeft}d left</div>
          </div>
        </div>

        {/* Tree visual */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0 10px", background: "linear-gradient(180deg, #E8F5E9 0%, #F4F8F2 100%)" }}>
          {/* Eco-Shield active indicator */}
          {tree.ecoShieldExpiry && Date.now() < tree.ecoShieldExpiry && (
            <div style={{ position: "absolute", top: 12, left: 14, display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.85)", borderRadius: 20, padding: "4px 10px 4px 6px", boxShadow: "0 1px 6px rgba(45,106,79,0.18)" }}>
              <span style={{ fontSize: 18, animation: "pulse 2s ease-in-out infinite" }}>🛡️</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#2D6A4F" }}>Eco-Shield</span>
            </div>
          )}
          <TreeVisual tree={tree} state={state} species={species} day={Math.floor(tree.day)} animate={actionAnim} />
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <span style={S.tag(SPECIES[species].color)}>{SPECIES[species].emoji} {SPECIES[species].name}</span>
            {tree.rings > 0 && <span style={S.tag("#B5A642")}>🌀 {tree.rings} rings</span>}
            {tree.currentEvent === "heatwave" && <span style={S.tag("#E07B54")}>🌡️ Heat Wave</span>}
            {tree.currentEvent === "storm" && <span style={S.tag("#5A6A8A")}>⚡ Storm</span>}
          </div>
        </div>

        {/* Stats */}
        <div style={{ ...S.card, display: "flex", justifyContent: "space-around", alignItems: "flex-end" }}>
          <StatGauge label="Water" emoji="💧" value={tree.h2o} />
          <StatGauge label="Light" emoji="☀️" value={tree.light} />
          <StatGauge label="Soil" emoji="🌱" value={tree.soil} />
          <StatGauge label="Bio" emoji="🦋" value={tree.bio} />
          <StatGauge label="Clean" emoji="✨" value={tree.clean} />
        </div>

        {/* Weather card */}
        {tree.currentEvent && (
          <div style={{ ...S.card, background: tree.currentEvent === "heatwave" ? "#FFF3E0" : "#EEF0F5", border: `1px solid ${tree.currentEvent === "heatwave" ? "#FFAB40" : "#7A8CAA"}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 24 }}>{tree.currentEvent === "heatwave" ? "🌡️" : "⚡"}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{tree.currentEvent === "heatwave" ? "Heat Wave Warning!" : "Storm Alert!"}</div>
                <div style={{ color: "#666", fontSize: 12 }}>{tree.currentEvent === "heatwave" ? "Add shade cloth and mulch to protect your tree." : "Stake your tree now to reduce storm damage."}</div>
              </div>
            </div>
          </div>
        )}

        {/* Today's suggestions */}
        {dailyTips.length > 0 && (
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Today's Suggestions</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {dailyTips.map(a => (
                <button key={a.key} onClick={() => { applyAction(a); }} style={{ background: "#EAF7EE", color: "#2D6A4F", border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  {a.emoji} {a.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chain card */}
        {tree.chain.length > 0 && (
          <div style={{ ...S.card, cursor: "pointer" }} onClick={() => setShowChainModal(true)}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>🔗 Care Chain ({tree.chain.length})</div>
            <div style={{ display: "flex", gap: 6 }}>
              {tree.chain.slice(-5).map((c, i) => (
                <div key={i} style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #4A9E6F, #2D6A4F)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, fontWeight: 700 }}>
                  {c.initials}
                </div>
              ))}
            </div>
            <div style={{ color: "#4A9E6F", fontSize: 11, marginTop: 6 }}>Tap to see messages →</div>
          </div>
        )}

        {/* Pass on CTA */}
        {isDay7 && (
          <div style={{ ...S.card, background: "linear-gradient(135deg, #E8F5E9, #F1FFF4)", border: "2px solid #4A9E6F", textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🌍</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#2D6A4F", marginBottom: 4 }}>Day 7 — Time to Pass It On!</div>
            <div style={{ color: "#666", fontSize: 13, marginBottom: 12 }}>Pass your tree with a kind note. Another child will carry it forward.</div>
            <button style={{ ...S.btn("#2D6A4F"), width: "100%", padding: "12px", fontSize: 15 }} onClick={() => setScreen("passon")}>
              Pass On My Tree 🌱
            </button>
          </div>
        )}

      </div>
    );
  };

  // ── CARE ────────────────────────────────────────────────────────────────────
  const CareScreen = () => (
    <div>
      <div style={{ padding: "16px 14px 8px" }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#2D6A4F" }}>🌿 Care Actions</h2>
        <p style={{ margin: "4px 0 0", color: "#888", fontSize: 13 }}>Tap an action to apply it. Balance is key!</p>
      </div>
      {selectedAction && (
        <div style={{ ...S.card, background: "#EAF7EE", border: "2px solid #4A9E6F", textAlign: "center" }}>
          <div style={{ fontSize: 32 }}>{selectedAction.emoji}</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#2D6A4F" }}>{selectedAction.label}</div>
          <div style={{ color: "#666", fontSize: 13, marginBottom: 12 }}>{selectedAction.desc}</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button style={S.btn("#2D6A4F")} onClick={() => applyAction(selectedAction)}>Apply ✓</button>
            <button style={{ ...S.btn("#999"), }} onClick={() => setSelectedAction(null)}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{ padding: "0 14px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 8, marginTop: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Core Actions</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {ACTIONS.filter(a => !["drain","pest_spray","fungus_cure"].includes(a.key)).map(a => {
            const onCooldown = a.cooldown > 0 && Date.now() - (tree.lastActionTimes?.[a.key] || 0) < a.cooldown;
            return (
              <button key={a.key} className="action-btn"
                onClick={() => setSelectedAction(a)}
                style={{ background: onCooldown ? "#F0F0F0" : "white", border: `1.5px solid ${onCooldown ? "#DDD" : "#D0E8D4"}`, borderRadius: 12, padding: "12px 10px", cursor: onCooldown ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, opacity: onCooldown ? 0.5 : 1, transition: "transform 0.1s", textAlign: "left" }}>
                <span style={{ fontSize: 22 }}>{a.emoji}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#2D6A4F" }}>{a.label}</div>
                  <div style={{ fontSize: 10, color: "#999" }}>{onCooldown ? "On cooldown" : a.desc.split(".")[0]}</div>
                </div>
              </button>
            );
          })}
        </div>
        {(tree.infested || tree.fungal || tree.h2o > 75 || tree.currentEvent) && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#C24D2C", marginBottom: 8, marginTop: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>⚠️ Remedial Actions Needed</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {ACTIONS.filter(a => {
                if (a.key === "drain" && tree.h2o > 70) return true;
                if (a.key === "pest_spray" && tree.infested) return true;
                if (a.key === "fungus_cure" && tree.fungal) return true;
                return false;
              }).map(a => (
                <button key={a.key} className="action-btn" onClick={() => setSelectedAction(a)}
                  style={{ background: "#FFF4F0", border: "1.5px solid #F4A07A", borderRadius: 12, padding: "12px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "transform 0.1s", textAlign: "left" }}>
                  <span style={{ fontSize: 22 }}>{a.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#C24D2C" }}>{a.label}</div>
                    <div style={{ fontSize: 10, color: "#999" }}>{a.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      {/* Eco-Shield prize — earned via missions, used here */}
      {(tree.ecoShieldsHeld || 0) > 0 && (
        <div style={{ margin: "14px 14px 0", background: "linear-gradient(135deg, #E8F8EE, #D4F0E4)", border: "2px solid #4A9E6F", borderRadius: 16, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#2D6A4F", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>🏆 Mission Prize</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative" }}>
              <span style={{ fontSize: 40 }}>🛡️</span>
              {(tree.ecoShieldsHeld || 0) > 1 && (
                <span style={{ position: "absolute", top: -4, right: -6, background: "#2D6A4F", color: "white", borderRadius: "50%", width: 18, height: 18, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{tree.ecoShieldsHeld}</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#2D6A4F" }}>Eco-Shield {(tree.ecoShieldsHeld || 0) > 1 ? `×${tree.ecoShieldsHeld}` : "Ready!"}</div>
              <div style={{ color: "#666", fontSize: 12, marginTop: 2 }}>Clean +5 · Protects from pollution for 1 day</div>
            </div>
            <button
              onClick={useEcoShield}
              style={{ background: "#2D6A4F", color: "white", border: "none", borderRadius: 12, padding: "10px 16px", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: "0 2px 8px rgba(45,106,79,0.35)", flexShrink: 0 }}>
              Use 🛡️
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ── MISSIONS ─────────────────────────────────────────────────────────────────
  const MissionsScreen = () => {
    const todaysMissions = MISSIONS.slice(0, 4);
    return (
      <div>
        <div style={{ padding: "16px 14px 8px" }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#2D6A4F" }}>🌍 Mini-Missions</h2>
          <p style={{ margin: "4px 0 0", color: "#888", fontSize: 13 }}>Real-world pledges — 1 tap. Earn eco-boosts for your tree!</p>
        </div>
        <div style={{ padding: "0 14px" }}>
          {todaysMissions.map(m => {
            const done = completedMissions.includes(m.key);
            return (
              <div key={m.key} style={{ background: done ? "#EAF7EE" : "white", borderRadius: 14, padding: "14px 16px", marginBottom: 10, border: done ? "1.5px solid #4A9E6F" : "1.5px solid #E0E8DC", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 28, opacity: done ? 0.5 : 1 }}>{m.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: done ? "#4A9E6F" : "#333" }}>{m.title}</div>
                  <div style={{ color: "#888", fontSize: 12 }}>{m.desc}</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                    Boost: {Object.entries(m.boost).map(([k, v]) => `+${v} ${k}`).join(", ")}
                  </div>
                </div>
                {done ? (
                  <span style={{ fontSize: 22 }}>✅</span>
                ) : (
                  <button style={S.smallBtn("#2D6A4F")} onClick={() => completeMission(m)}>I did it!</button>
                )}
              </div>
            );
          })}
        </div>
        {/* Eco-Shield progress */}
        <div style={{ ...S.card, background: "linear-gradient(135deg, #F0FBF5, #E4F7EE)", border: "1.5px solid #A8D8BB" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#2D6A4F", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>🛡️ Eco-Shield Progress</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 32 }}>🛡️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#2D6A4F", marginBottom: 6 }}>
                {(tree.ecoShieldsHeld || 0) > 0
                  ? `${tree.ecoShieldsHeld} shield${tree.ecoShieldsHeld > 1 ? "s" : ""} ready — use it on the Care page!`
                  : `${tree.missionsForShield || 0}/2 missions toward next shield`}
              </div>
              <div style={{ height: 8, background: "#D4EDE0", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${((tree.missionsForShield || 0) / 2) * 100}%`, background: "linear-gradient(90deg, #4A9E6F, #7ECC5F)", borderRadius: 4, transition: "width 0.4s ease" }} />
              </div>
            </div>
          </div>
          <p style={{ fontSize: 12, color: "#666", lineHeight: 1.6, margin: "10px 0 0" }}>
            Complete every 2 missions to earn an Eco-Shield prize — then head to Care to use it! 🌿
          </p>
        </div>
      </div>
    );
  };

  // ── CHAIN ────────────────────────────────────────────────────────────────────
  const ChainScreen = () => (
    <div>
      <div style={{ padding: "16px 14px 8px" }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#2D6A4F" }}>🔗 Care Chain</h2>
        <p style={{ margin: "4px 0 0", color: "#888", fontSize: 13 }}>Every keeper who loved this tree before you.</p>
      </div>
      {tree.chain.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🌱</div>
          <div style={{ color: "#888", fontSize: 14 }}>You're the first keeper of this tree!</div>
          <div style={{ color: "#AAA", fontSize: 12, marginTop: 4 }}>When you pass it on, your note will appear here.</div>
        </div>
      ) : (
        <div style={{ padding: "0 14px" }}>
          {tree.chain.map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg, ${["#4A9E6F","#2D6A4F","#7ECC5F","#B5A642","#C4813A"][i%5]}, #1A3C2A)`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 13 }}>{c.initials}</div>
                {i < tree.chain.length - 1 && <div style={{ width: 2, height: 20, background: "#E0E8DC", margin: "4px 0" }} />}
              </div>
              <div style={{ background: "white", borderRadius: 12, padding: "10px 14px", flex: 1, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#2D6A4F" }}>{c.initials}</div>
                <div style={{ color: "#555", fontSize: 13, marginTop: 2 }}>{c.note}</div>
                <div style={{ color: "#AAA", fontSize: 10, marginTop: 4 }}>Keeper #{i + 1}</div>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #4A9E6F, #2D6A4F)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 11 }}>YOU</div>
            <div style={{ background: "#EAF7EE", borderRadius: 12, padding: "10px 14px", flex: 1, border: "1.5px dashed #4A9E6F" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#2D6A4F" }}>You (current keeper)</div>
              <div style={{ color: "#888", fontSize: 12, marginTop: 2 }}>Day {Math.floor(tree.day)} of your 7-day journey</div>
            </div>
          </div>
        </div>
      )}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#333" }}>Chain length</div>
            <div style={{ color: "#888", fontSize: 12 }}>Carers across time</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#2D6A4F" }}>{tree.chain.length + 1}</div>
        </div>
        <div style={{ marginTop: 10 }}>
          <div style={{ height: 8, background: "#E0E8DC", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min(100, (tree.chain.length + 1) * 12)}%`, background: "linear-gradient(90deg, #4A9E6F, #7ECC5F)", borderRadius: 4 }} />
          </div>
        </div>
      </div>
      {/* Tree rings visualization - shows after day 1 */}
      {Math.floor(tree.day) >= 2 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#333", marginBottom: 8 }}>Tree Rings</div>
          <div style={{ color: "#888", fontSize: 12, marginBottom: 16 }}>
            {Math.floor(tree.day) === 2 
              ? "Your tree's core has formed! Rings will grow each day."
              : "Each ring represents one day of growth. Gold rings show days when your tree was thriving!"}
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "20px 0" }}>
            <svg width="200" height="200" viewBox="0 0 200 200">
              {/* Core - shown from day 2 onwards */}
              <circle cx="100" cy="100" r="30" fill="#3FE879" opacity={0.9} />
              
              {/* Rings - start appearing from day 3 onwards (ring for day 2) */}
              {tree.ringHistory && tree.ringHistory.slice(1).map((color, idx) => {
                // idx 0 = ring for day 2 (first ring around core)
                // idx 1 = ring for day 3 (second ring)
                // etc.
                const ringNumber = idx + 1; // 1-based ring number
                const ringWidth = 12;
                const gapWidth = 3;
                const coreRadius = 30;
                const radius = coreRadius + (ringNumber * (ringWidth + gapWidth)) - (gapWidth / 2);
                
                const fillColor = color === "gold" ? "#FFD700" : "#7ECC5F";
                const strokeColor = color === "gold" ? "#FFC000" : "#5C9E47";
                
                return (
                  <circle
                    key={idx}
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="none"
                    stroke={fillColor}
                    strokeWidth={ringWidth}
                    opacity={0.85}
                  />
                );
              })}
            </svg>
          </div>
          {tree.ringHistory && tree.ringHistory.length > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#FFD700", border: "1px solid #FFC000" }} />
                <span style={{ fontSize: 12, color: "#666" }}>Thriving ({tree.ringHistory.slice(1).filter(c => c === "gold").length})</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#7ECC5F", border: "1px solid #5C9E47" }} />
                <span style={{ fontSize: 12, color: "#666" }}>Healthy ({tree.ringHistory.slice(1).filter(c => c === "green").length})</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ── PASS ON ──────────────────────────────────────────────────────────────────
  const PassOnScreen = () => (
    <div>
      <div style={{ padding: "16px 14px 8px" }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#2D6A4F" }}>🌍 Pass It On</h2>
        <p style={{ margin: "4px 0 0", color: "#888", fontSize: 13 }}>Day 7 complete! Pass your tree with a kind message.</p>
      </div>
      {passOnDone ? (
        <div style={{ padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 12, animation: "float 2s ease-in-out infinite" }}>🎉</div>
          <h3 style={{ color: "#2D6A4F", fontSize: 22, fontWeight: 800 }}>Passed On!</h3>
          <p style={{ color: "#666", fontSize: 14 }}>Finding your next tree...</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#4A9E6F", animation: `pulse 1s ease-in-out ${i * 0.3}s infinite` }} />
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding: "0 14px" }}>
          <div style={{ background: "linear-gradient(135deg, #E8F5E9, #F1FFF4)", borderRadius: 16, padding: 16, textAlign: "center", marginBottom: 12 }}>
            <TreeVisual tree={tree} state={state} species={species} day={Math.floor(tree.day)} />
            <div style={{ marginTop: 8 }}>
              <span style={S.tag(SPECIES[species].color)}>{SPECIES[species].emoji} {SPECIES[species].name}</span>
              <span style={{ ...S.tag(stateConf.color), marginLeft: 6 }}>{state}</span>
            </div>
          </div>
          <div style={{ background: "white", borderRadius: 14, padding: "14px 16px", marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#333", marginBottom: 8 }}>Your initials</div>
            <input
              value={passOnInitials}
              onChange={e => setPassOnInitials(e.target.value.slice(0, 3))}
              placeholder="e.g. AJ"
              maxLength={3}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #E0E8DC", fontSize: 16, fontWeight: 700, boxSizing: "border-box", outline: "none", textTransform: "uppercase" }}
            />
          </div>
          <div style={{ background: "white", borderRadius: 14, padding: "14px 16px", marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#333", marginBottom: 8 }}>Choose a kind note</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {PASS_ON_TEMPLATES.map(t => (
                <button key={t.key} onClick={() => setPassOnNote(t.text)}
                  style={{ background: passOnNote === t.text ? "#EAF7EE" : "#F7FAF7", border: passOnNote === t.text ? "1.5px solid #4A9E6F" : "1.5px solid #E0E8DC", borderRadius: 10, padding: "10px 12px", cursor: "pointer", textAlign: "left", fontSize: 13, color: "#333", display: "flex", alignItems: "center", gap: 8 }}>
                  {passOnNote === t.text && <span>✅</span>} {t.text}
                </button>
              ))}
            </div>
          </div>
          <button
            style={{ ...S.btn("#2D6A4F"), width: "100%", padding: "14px", fontSize: 15, borderRadius: 14, marginBottom: 20 }}
            onClick={doPassOn}
          >
            Pass On My Tree 🌱
          </button>
        </div>
      )}
    </div>
  );

  // ── CHAIN MODAL ──────────────────────────────────────────────────────────────
  const ChainModal = () => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setShowChainModal(false)}>
      <div style={{ background: "white", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 420, maxHeight: "70vh", overflowY: "auto", padding: 20 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontWeight: 800, color: "#2D6A4F" }}>🔗 Care Chain</h3>
          <button onClick={() => setShowChainModal(false)} style={{ background: "#EEE", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", fontSize: 14 }}>✕</button>
        </div>
        {tree.chain.map((c, i) => (
          <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, #4A9E6F, #1A3C2A)`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{c.initials}</div>
            <div style={{ background: "#F4F8F2", borderRadius: 10, padding: "8px 12px", flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: "#2D6A4F" }}>{c.initials}</div>
              <div style={{ color: "#555", fontSize: 13 }}>{c.note}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── BADGES ───────────────────────────────────────────────────────────────────
  const BadgesScreen = () => (
    <div>
      <div style={{ padding: "16px 14px 8px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 0 }}>←</button>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#2D6A4F" }}>🏆 Your Badges</h2>
          <p style={{ margin: "4px 0 0", color: "#888", fontSize: 13 }}>{badges.length} earned · {BADGES.length - badges.length} to go!</p>
        </div>
      </div>
      <div style={{ padding: "0 14px" }}>
        {BADGES.map(badge => {
          const earned = badges.includes(badge.key);
          return (
            <div key={badge.key} style={{ 
              background: earned ? "white" : "#F8F8F8", 
              borderRadius: 14, 
              padding: "14px 16px", 
              marginBottom: 10, 
              display: "flex", 
              alignItems: "center", 
              gap: 14,
              border: earned ? `2px solid ${badge.color}` : "2px solid #E8E8E8",
              opacity: earned ? 1 : 0.5
            }}>
              <div style={{ 
                width: 52, 
                height: 52, 
                borderRadius: "50%", 
                background: earned ? `linear-gradient(135deg, ${badge.color}, ${badge.color}dd)` : "#DDD",
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                fontSize: 26,
                flexShrink: 0,
                boxShadow: earned ? `0 2px 8px ${badge.color}44` : "none"
              }}>
                {badge.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: earned ? badge.color : "#999", marginBottom: 3 }}>{badge.name}</div>
                <div style={{ color: earned ? "#666" : "#AAA", fontSize: 13, lineHeight: 1.5 }}>{earned ? badge.desc : badge.condition}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderScreen = () => {
    if (!isDay7 && screen === "passon") return <HomeScreen />;
    switch (screen) {
      case "home": return <HomeScreen />;
      case "care": return <CareScreen />;
      case "missions": return <MissionsScreen />;
      case "chain": return <ChainScreen />;
      case "passon": return <PassOnScreen />;
      case "badges": return <BadgesScreen />;
      default: return <HomeScreen />;
    }
  };

  return (
    <div style={S.app}>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes slideDown { from{transform:translateY(-20px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes grow { from{transform:scale(0.8);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes badgePulse { 
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes badgeGlow { 
          0%, 100% { box-shadow: 0 0 0 rgba(255,215,0,0); transform: scale(1); }
          50% { box-shadow: 0 0 20px rgba(255,215,0,0.8); transform: scale(1.15); }
        }
        * { box-sizing: border-box; }
        body { margin: 0; background: #F4F8F2; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #C0D8C4; border-radius: 2px; }
        .action-btn:hover { transform: scale(1.02); }
        input:focus { border-color: #4A9E6F !important; box-shadow: 0 0 0 3px rgba(74,158,111,0.15) !important; }
      `}</style>

      {/* Header */}
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src={logoImg} alt="Legacy Grove" style={{ width: 28, height: 28, borderRadius: 4 }} />
          <span style={{ fontWeight: 900, fontSize: 17, letterSpacing: -0.5 }}>Legacy Grove</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {badges.length > 0 && (
            <span 
              onClick={() => setScreen("badges")}
              style={{ 
                fontSize: 12, 
                background: "rgba(255,255,255,0.2)", 
                borderRadius: 20, 
                padding: "2px 8px",
                cursor: "pointer",
                transition: "all 0.3s",
                animation: badgeGlow ? "badgeGlow 0.8s ease-out" : "none"
              }}>
              🏆 {badges.length}
            </span>
          )}
          <span style={{ fontSize: 12, opacity: 0.8 }}>Day {Math.floor(tree?.day || 1)}</span>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 60, left: "50%", transform: "translateX(-50%)", zIndex: 300,
          background: toast.type === "error" ? "#F44336" : toast.type === "warn" ? "#FF9800" : "#2D6A4F",
          color: "white", borderRadius: 20, padding: "10px 20px", fontSize: 13, fontWeight: 600,
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)", animation: "slideDown 0.3s ease",
          maxWidth: 360, textAlign: "center", whiteSpace: "nowrap",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Badge Popup */}
      {newBadge && (
        <div style={{
          position: "fixed", 
          inset: 0, 
          background: "rgba(0,0,0,0.6)", 
          zIndex: 400, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          animation: "slideDown 0.3s ease"
        }}>
          <div style={{
            background: "white",
            borderRadius: 24,
            padding: "32px 24px",
            textAlign: "center",
            maxWidth: 320,
            animation: "badgePulse 3s ease-out",
            boxShadow: `0 8px 32px ${newBadge.color}88`
          }}>
            <div style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${newBadge.color}, ${newBadge.color}dd)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 56,
              margin: "0 auto 20px",
              boxShadow: `0 4px 20px ${newBadge.color}66`,
              animation: "badgePulse 3s ease-out"
            }}>
              {newBadge.emoji}
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: newBadge.color, marginBottom: 8 }}>
              {newBadge.name}
            </div>
            <div style={{ fontSize: 14, color: "#666", lineHeight: 1.6 }}>
              {newBadge.desc}
            </div>
          </div>
        </div>
      )}

      {/* Body */}
      <div style={S.body}>
        {renderScreen()}
      </div>

      {/* Nav */}
      <nav style={S.nav}>
        {navItems.map(item => {
          const active = screen === item.key || (item.key === "passon" && screen === "passon");
          return (
            <button key={item.key} style={S.navBtn(active)}
              onClick={() => setScreen(item.key === "home" && isDay7 ? "home" : item.key)}>
              <span style={{ fontSize: 22 }}>{item.emoji}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
        {isDay7 && (
          <button style={S.navBtn(screen === "passon")} onClick={() => setScreen("passon")}>
            <span style={{ fontSize: 22 }}>🌍</span>
            <span>Pass On</span>
          </button>
        )}
      </nav>

      {/* Chain modal */}
      {showChainModal && <ChainModal />}
    </div>
  );
}
