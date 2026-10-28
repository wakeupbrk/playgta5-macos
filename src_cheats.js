// GTA V Desktop In-Game Trainer Menu (redesign 19 Oct 2026)
// SharedArrayBuffer bridge to the trainer hook in game.js (src_trainer.js). Toggle bits: word 2 (bank A) and word 44 (bank B).
// Open/close with Command+X (Ctrl+X), F4, ` or \. Opening releases pointer lock; closing re-locks it so mouse look resumes without a click.

(function() {
  if (window.__gtav_cheats_installed) return;
  window.__gtav_cheats_installed = true;
  window.__gtav_cheat_menu_open = false;

  // ---------------------------------------------------------------- trainer bridge
  if (!window.__gtav_trainer_sab) {
    try {
      window.__gtav_trainer_sab = new SharedArrayBuffer(65536);
    } catch (e) {
      console.error("[cheats] Failed to create SharedArrayBuffer:", e);
    }
  }

  let T32 = null, TF32 = null, TU8 = null;
  function bindBuffer() {
    if (T32) return true;
    if (!window.__gtav_trainer_sab) return false;
    T32 = new Int32Array(window.__gtav_trainer_sab);
    TF32 = new Float32Array(window.__gtav_trainer_sab);
    TU8 = new Uint8Array(window.__gtav_trainer_sab);
    return true;
  }
  if (bindBuffer()) Atomics.store(T32, 0, 0x47544154); // 'GTAT'

  const textEncoder = new TextEncoder();
  const textDecoder = new TextDecoder();
  const WORD_A = 2, WORD_B = 44;       // toggle words in the SAB (desired bits)

  // Command IDs (must match executeCommand in src_trainer.js)
  const CMD = {
    HEAL: 1, WEAPONS: 2, MONEY: 3, CLEAR_WANTED: 4, WANTED_UP: 5, WANTED_MAX: 6, REPAIR: 7, FLIP: 8, BOOST: 9, TUNE: 10, PAINT: 11,
    TELEPORT_WAYPOINT: 12, TELEPORT_COORDS: 13, TIME: 14, WEATHER: 15, SPAWN_VEHICLE: 16, SPAWN_SKIN: 17, CUSTOMIZE_COMPONENT: 18,
    CUSTOMIZE_PROP: 19, ARMOUR: 20, PARACHUTE: 21, CLEAN_PED: 22, CLEAR_AREA: 23, RAGDOLL: 24, SUICIDE: 25, REMOVE_WEAPONS: 26,
    VEH_JUMP: 27, VEH_STOP: 28, VEH_CLEAN: 29, VEH_DOORS: 30, VEH_EXPLODE: 31,
    WANTED_SET: 32, GIVE_WEAPON: 33, GIVE_WEAPON_SET: 34, TP_FORWARD: 35, TP_UP: 36, VEH_BOOST_N: 37, VEH_COLOR: 38, VEH_NEON: 39,
    VEH_TYRES: 40, VEH_ROOF: 41, VEH_LOCK: 42, AIRSTRIKE: 43, SPAWN_PED: 44, LAUNCH_UP: 45, HIJACK: 46, GAME_SPEED: 47, PLATE: 48,
    TINT: 49, ENGINE: 50, SAVE_NOW: 51, PROP_COURSE: 52
  };

  // Toggles: key -> { w: 0|1 (bank), b: bit }
  const TOG = {
    god: { w: 0, b: 0 }, neverWanted: { w: 0, b: 1 }, infiniteAmmo: { w: 0, b: 2 }, superJump: { w: 0, b: 3 }, fastRun: { w: 0, b: 4 },
    noRagdoll: { w: 0, b: 5 }, explosiveAmmo: { w: 0, b: 6 }, fireAmmo: { w: 0, b: 7 }, explosiveMelee: { w: 0, b: 8 }, slowmo: { w: 0, b: 9 },
    invisible: { w: 0, b: 10 }, stamina: { w: 0, b: 11 }, vehicleGod: { w: 0, b: 12 }, freezeTime: { w: 0, b: 13 }, noTraffic: { w: 0, b: 14 },
    riot: { w: 0, b: 15 }, moonGravity: { w: 0, b: 16 }, nightVision: { w: 0, b: 17 }, thermalVision: { w: 0, b: 18 }, fastSwim: { w: 0, b: 19 },
    driftMode: { w: 0, b: 20 }, bulletproofTyres: { w: 0, b: 21 },
    policeIgnore: { w: 1, b: 0 }, everyoneIgnore: { w: 1, b: 1 }, damage10x: { w: 1, b: 2 }, regen: { w: 1, b: 3 }, fireproof: { w: 1, b: 4 },
    silent: { w: 1, b: 5 }, seatbelt: { w: 1, b: 6 }, turbo: { w: 1, b: 7 }, rainbow: { w: 1, b: 8 }, invisCar: { w: 1, b: 9 },
    zeroGravity: { w: 1, b: 10 }, blackout: { w: 1, b: 11 }, floatCar: { w: 1, b: 12 }, sirens: { w: 1, b: 13 }, pedsFlee: { w: 1, b: 14 },
    gangsIgnore: { w: 1, b: 15 }, noCops: { w: 1, b: 16 }, hideHud: { w: 1, b: 17 }, superBrakes: { w: 1, b: 18 }
  };
  const toggles = {};
  for (const k of Object.keys(TOG)) toggles[k] = false;

  const VEHICLES = __RIDES_JSON_PLACEHOLDER__;
  const VEHICLE_CATEGORIES = __VEHICLE_CATEGORIES_JSON_PLACEHOLDER__;
  const SKINS = __SKINS_JSON_PLACEHOLDER__;

  const PLACES = [
    { g: "City", label: "Legion Square", coords: "195,-934,30.7" },
    { g: "City", label: "Maze Bank roof", coords: "-75,-818,326.2" },
    { g: "City", label: "FIB Headquarters roof", coords: "135.8,-749.1,262.8" },
    { g: "City", label: "Pacific Standard Bank", coords: "235,216,106" },
    { g: "City", label: "Diamond Casino & Resort", coords: "925.3,47.2,81.1" },
    { g: "City", label: "Pillbox Hill Hospital", coords: "338.8,-583.8,74.1" },
    { g: "City", label: "Los Santos Customs", coords: "-362.8,-132.8,38.6" },
    { g: "City", label: "Vanilla Unicorn", coords: "127,-1307,29" },
    { g: "City", label: "Tequi-la-la", coords: "-564,275,83" },
    { g: "City", label: "Maze Bank Arena", coords: "-254,-2000,30" },
    { g: "Homes", label: "Michael's house", coords: "-813,179,72.2" },
    { g: "Homes", label: "Franklin's house", coords: "7.9,548,175.5" },
    { g: "Homes", label: "Trevor's trailer", coords: "1985,3812,32.2" },
    { g: "Homes", label: "Grove Street", coords: "-60,-1817,26.7" },
    { g: "Coast", label: "Del Perro Pier", coords: "-1850,-1231,13" },
    { g: "Coast", label: "Vespucci Beach", coords: "-1223,-1491,4.4" },
    { g: "Coast", label: "Port of Los Santos", coords: "120.4,-3100.2,5.8" },
    { g: "Coast", label: "Chumash pier", coords: "-3240,968,12" },
    { g: "Coast", label: "Alamo Sea marina", coords: "1332.6,4230.1,33.9" },
    { g: "Air & military", label: "LS Airport runway", coords: "-1336,-3044,13.9" },
    { g: "Air & military", label: "Fort Zancudo base", coords: "-2047,3132,32.8" },
    { g: "Air & military", label: "Zancudo runway", coords: "-2622.8,3275.6,32.8" },
    { g: "Air & military", label: "Sandy Shores airfield", coords: "1747,3273,41.1" },
    { g: "Air & military", label: "McKenzie airfield", coords: "2130,4790,41" },
    { g: "Air & military", label: "Humane Labs", coords: "3617,3739,28.7" },
    { g: "Air & military", label: "Bolingbroke Penitentiary", coords: "1845,2585,46" },
    { g: "Summits & landmarks", label: "Mount Chiliad peak", coords: "501,5604,797.9" },
    { g: "Summits & landmarks", label: "Mount Gordo tower", coords: "2877,5911,369" },
    { g: "Summits & landmarks", label: "Mount Josiah ridge", coords: "-1105.7,2674.3,310.2" },
    { g: "Summits & landmarks", label: "Vinewood sign", coords: "711,1198,348.5" },
    { g: "Summits & landmarks", label: "Galileo Observatory", coords: "-438.8,1076.7,352.4" },
    { g: "Summits & landmarks", label: "Vinewood Bowl", coords: "686,577,130.4" },
    { g: "Summits & landmarks", label: "Altruist cult camp", coords: "-1170,4926,224" },
    { g: "Rural", label: "Paleto Bay sheriff", coords: "-275,6635,7.4" },
    { g: "Rural", label: "Paleto Forest sawmill", coords: "-540,5360,70" },
    { g: "Rural", label: "Palmer-Taylor Power Station", coords: "2800,1500,24" },
    { g: "Rural", label: "Los Santos Golf Club", coords: "-1370,56,53" }
  ];

  const WEATHERS = [
    { label: "Extra sunny", id: "EXTRASUNNY" }, { label: "Clear", id: "CLEAR" }, { label: "Clouds", id: "CLOUDS" },
    { label: "Overcast", id: "OVERCAST" }, { label: "Smog", id: "SMOG" }, { label: "Fog", id: "FOGGY" },
    { label: "Clearing", id: "CLEARING" }, { label: "Rain", id: "RAIN" }, { label: "Thunder", id: "THUNDER" },
    { label: "Light snow", id: "SNOWLIGHT" }, { label: "Snow", id: "SNOW" }, { label: "Blizzard", id: "BLIZZARD" },
    { label: "Christmas", id: "XMAS" }, { label: "Halloween", id: "HALLOWEEN" }, { label: "Neutral", id: "NEUTRAL" }
  ];

  // Same order as WEAPON_SETS in src_trainer.js (index = category id for CMD.GIVE_WEAPON_SET)
  const WEAPON_CATS = [
    { name: "Pistols", items: ["WEAPON_PISTOL","WEAPON_COMBATPISTOL","WEAPON_APPISTOL","WEAPON_PISTOL50","WEAPON_SNSPISTOL","WEAPON_HEAVYPISTOL","WEAPON_VINTAGEPISTOL","WEAPON_STUNGUN","WEAPON_FLAREGUN","WEAPON_MARKSMANPISTOL"] },
    { name: "SMGs & machine guns", items: ["WEAPON_MICROSMG","WEAPON_SMG","WEAPON_ASSAULTSMG","WEAPON_COMBATPDW","WEAPON_MACHINEPISTOL","WEAPON_MG","WEAPON_COMBATMG","WEAPON_GUSENBERG"] },
    { name: "Rifles", items: ["WEAPON_ASSAULTRIFLE","WEAPON_CARBINERIFLE","WEAPON_ADVANCEDRIFLE","WEAPON_SPECIALCARBINE","WEAPON_BULLPUPRIFLE"] },
    { name: "Shotguns", items: ["WEAPON_PUMPSHOTGUN","WEAPON_SAWNOFFSHOTGUN","WEAPON_ASSAULTSHOTGUN","WEAPON_BULLPUPSHOTGUN","WEAPON_HEAVYSHOTGUN","WEAPON_MUSKET"] },
    { name: "Snipers", items: ["WEAPON_SNIPERRIFLE","WEAPON_HEAVYSNIPER","WEAPON_MARKSMANRIFLE"] },
    { name: "Heavy", items: ["WEAPON_GRENADELAUNCHER","WEAPON_RPG","WEAPON_MINIGUN","WEAPON_FIREWORK","WEAPON_RAILGUN","WEAPON_HOMINGLAUNCHER","WEAPON_COMPACTLAUNCHER"] },
    { name: "Throwables & gadgets", items: ["WEAPON_GRENADE","WEAPON_STICKYBOMB","WEAPON_SMOKEGRENADE","WEAPON_BZGAS","WEAPON_MOLOTOV","WEAPON_PROXMINE","WEAPON_PETROLCAN","WEAPON_FIREEXTINGUISHER","WEAPON_FLARE","WEAPON_BALL","WEAPON_SNOWBALL"] },
    { name: "Melee", items: ["WEAPON_KNIFE","WEAPON_NIGHTSTICK","WEAPON_HAMMER","WEAPON_BAT","WEAPON_CROWBAR","WEAPON_GOLFCLUB","WEAPON_BOTTLE","WEAPON_DAGGER","WEAPON_HATCHET","WEAPON_KNUCKLE","WEAPON_MACHETE","WEAPON_FLASHLIGHT","WEAPON_SWITCHBLADE","WEAPON_POOLCUE","WEAPON_WRENCH","WEAPON_BATTLEAXE"] }
  ];
  const weaponLabel = (id) => id.replace("WEAPON_", "").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const SWATCHES = [
    { n: "Black", c: [12, 12, 14] }, { n: "White", c: [245, 245, 245] }, { n: "Silver", c: [170, 175, 182] }, { n: "Red", c: [200, 20, 25] },
    { n: "Orange", c: [255, 112, 20] }, { n: "Yellow", c: [255, 210, 20] }, { n: "Lime", c: [120, 220, 30] }, { n: "Green", c: [18, 120, 50] },
    { n: "Cyan", c: [20, 200, 230] }, { n: "Blue", c: [20, 70, 220] }, { n: "Purple", c: [130, 40, 200] }, { n: "Pink", c: [255, 70, 170] },
    { n: "Gold", c: [212, 175, 55] }, { n: "Bronze", c: [140, 90, 40] }
  ];

  const PEDS = [
    { label: "SWAT bodyguard", model: "s_m_y_swat_01", mode: 1, note: "Follows you, armed" },
    { label: "Army bodyguard", model: "s_m_y_marine_03", mode: 1, note: "Follows you, armed" },
    { label: "Blackops bodyguard", model: "s_m_y_blackops_01", mode: 1, note: "Follows you, armed" },
    { label: "Gang bodyguard", model: "g_m_y_famca_01", mode: 1, note: "Follows you, armed" },
    { label: "Chop (dog)", model: "a_c_chop", mode: 0, note: "Neutral" },
    { label: "Lamar", model: "ig_lamardavis", mode: 1, note: "Follows you" },
    { label: "Hostile cop", model: "s_m_y_cop_01", mode: 2, note: "Armed, not allied" },
    { label: "Hostile gangster", model: "g_m_y_ballasout_01", mode: 2, note: "Armed, not allied" },
    { label: "Clown", model: "s_m_y_clown_01", mode: 0, note: "Neutral" },
    { label: "Stripper", model: "s_f_y_stripper_01", mode: 0, note: "Neutral" },
    { label: "Zombie", model: "u_m_y_zombie_01", mode: 2, note: "Hostile" },
    { label: "Space Ranger", model: "u_m_y_imporage", mode: 0, note: "Neutral" }
  ];

  // ---------------------------------------------------------------- state
  let isOpen = false;
  let trainerHooked = false;
  let currentWanted = 0;
  let inVehicle = false;
  let activeTab = "player";
  let query = "";
  let activeWeather = "";
  let savedPos = null;
  try { const sp = JSON.parse(localStorage.getItem("gtav_cm_savedpos") || "null"); if (sp && isFinite(sp.x)) savedPos = sp; } catch (e) {}
  try { const t = localStorage.getItem("gtav_cm_tab"); if (t) activeTab = t; } catch (e) {}

  const live = { x: 0, y: 0, z: 0, heading: 0, speed: 0, hp: 0, armour: 0, hour: -1, minute: 0 };
  let lastWardrobeSeq = 0;
  const wardrobeState = { seq: 0, comps: {}, props: {} };

  const postLog = (m) => { try { fetch("/log", { method: "POST", body: m }).catch(() => {}); } catch (e) {} };

  // ---------------------------------------------------------------- toast
  const toastEl = document.createElement("div");
  toastEl.id = "cheat-toast";
  document.body.appendChild(toastEl);
  let toastTimer = null;
  function showToast(msg) {
    if (!msg) return;
    toastEl.textContent = msg;
    toastEl.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("visible"), 2200);
  }

  function wakeAudio() {
    if (window.__gtav_audio_ctx && window.__gtav_audio_ctx.state !== "running") {
      window.__gtav_audio_ctx.resume().catch(() => {});
    } else if (window.__gtav_init_audio) {
      window.__gtav_init_audio().catch(() => {});
    }
  }

  // ---------------------------------------------------------------- command / toggle dispatch
  function dispatchAction(cmdId, argInt = 0, floats = [0, 0, 0], str = "", toastMsg = "") {
    wakeAudio();
    if (toastMsg) showToast(toastMsg);
    if (!bindBuffer()) return;
    const head = Atomics.load(T32, 64);
    const tail = Atomics.load(T32, 65);
    const nextTail = (tail + 1) % 16;
    if (nextTail === head) {
      showToast("Trainer is busy, try again");
      return;
    }
    const slotWord = 80 + tail * 16;
    const slotByte = slotWord * 4;
    T32[slotWord + 1] = argInt | 0;
    TF32[slotWord + 2] = Number(floats[0]) || 0;
    TF32[slotWord + 3] = Number(floats[1]) || 0;
    TF32[slotWord + 4] = Number(floats[2]) || 0;
    TU8.fill(0, slotByte + 20, slotByte + 64);
    if (str) TU8.set(textEncoder.encode(String(str).slice(0, 43)), slotByte + 20);
    Atomics.store(T32, slotWord, cmdId);
    Atomics.store(T32, 65, nextTail);
    postLog("[cheats] action: cmd=" + cmdId + " " + str);
  }

  const customizeComponent = (compId, action, label = "") => dispatchAction(CMD.CUSTOMIZE_COMPONENT, ((compId & 0xffff) << 16) | (action & 0xffff), [0, 0, 0], label);
  const customizeProp = (propId, action, label = "") => dispatchAction(CMD.CUSTOMIZE_PROP, ((propId & 0xffff) << 16) | (action & 0xffff), [0, 0, 0], label);
  const setComponentDrawable = (compId, idx, label = "") => dispatchAction(CMD.CUSTOMIZE_COMPONENT, ((compId & 0xffff) << 16) | 8, [idx, 0, 0], label);
  const setComponentTexture = (compId, idx, label = "") => dispatchAction(CMD.CUSTOMIZE_COMPONENT, ((compId & 0xffff) << 16) | 15, [idx, 0, 0], label);
  const setPropIndex = (propId, idx, label = "") => dispatchAction(CMD.CUSTOMIZE_PROP, ((propId & 0xffff) << 16) | 8, [idx, 0, 0], label);
  const setPropTexture = (propId, idx, label = "") => dispatchAction(CMD.CUSTOMIZE_PROP, ((propId & 0xffff) << 16) | 15, [idx, 0, 0], label);

  function setToggleBit(key, on) {
    const t = TOG[key];
    if (!t || !bindBuffer()) return;
    const idx = t.w ? WORD_B : WORD_A;
    if (on) Atomics.or(T32, idx, 1 << t.b); else Atomics.and(T32, idx, ~(1 << t.b));
    toggles[key] = on;
  }

  function dispatchToggle(key, label) {
    wakeAudio();
    if (!bindBuffer() || !TOG[key]) return;
    const now = !toggles[key];
    if (now && key === "explosiveAmmo") setToggleBit("fireAmmo", false);
    if (now && key === "fireAmmo") setToggleBit("explosiveAmmo", false);
    if (now && key === "zeroGravity") setToggleBit("moonGravity", false);
    if (now && key === "moonGravity") setToggleBit("zeroGravity", false);
    setToggleBit(key, now);
    showToast(label + (now ? " on" : " off"));
    postLog("[cheats] toggle: " + key + " = " + now);
    refreshToggleStates();
  }

  function resetAllToggles() {
    if (!bindBuffer()) return;
    Atomics.store(T32, WORD_A, 0);
    Atomics.store(T32, WORD_B, 0);
    for (const k of Object.keys(toggles)) toggles[k] = false;
    showToast("All toggles off");
    refreshToggleStates();
  }

  // ---------------------------------------------------------------- poller: heartbeat, engine toasts, state, live values
  let lastHeartbeat = 0, lastHeartbeatTime = 0, lastToastSeq = 0;
  setInterval(() => {
    if (!bindBuffer()) return;
    const curHeartbeat = Atomics.load(T32, 1);
    const now = performance.now();
    if (curHeartbeat !== lastHeartbeat) {
      lastHeartbeat = curHeartbeat;
      lastHeartbeatTime = now;
      if (!trainerHooked) { trainerHooked = true; updateStatus(); }
    } else if (now - lastHeartbeatTime > 2500 && trainerHooked) {
      trainerHooked = false;
      updateStatus();
    }

    const curToastSeq = Atomics.load(T32, 6);
    if (curToastSeq !== lastToastSeq) {
      lastToastSeq = curToastSeq;
      let end = 28;
      while (end < 128 && TU8[end] !== 0) end++;
      if (end > 28) {
        const msg = textDecoder.decode(TU8.slice(28, end));
        if (msg) showToast(msg);
      }
    }

    const flags = Atomics.load(T32, 4);
    inVehicle = (flags & 2) !== 0;
    currentWanted = (flags >> 8) & 0xff;

    const dA = Atomics.load(T32, WORD_A), dB = Atomics.load(T32, WORD_B);
    let changed = false;
    for (const k of Object.keys(TOG)) {
      const t = TOG[k];
      const on = (((t.w ? dB : dA) >> t.b) & 1) !== 0;
      if (toggles[k] !== on) { toggles[k] = on; changed = true; }
    }
    if (changed && isOpen) refreshToggleStates();

    live.x = TF32[32]; live.y = TF32[33]; live.z = TF32[34]; live.heading = TF32[35]; live.speed = TF32[36];
    live.hp = T32[37]; live.armour = T32[38]; live.hour = T32[39]; live.minute = T32[40];
    if (isOpen) updateLive();

    const curWardrobeSeq = Atomics.load(T32, 400);
    if (curWardrobeSeq !== lastWardrobeSeq) {
      lastWardrobeSeq = curWardrobeSeq;
      for (let c = 0; c <= 11; c++) {
        const base = 410 + c * 4;
        wardrobeState.comps[c] = { curDraw: T32[base], maxDraw: T32[base + 1], curTex: T32[base + 2], maxTex: T32[base + 3] };
      }
      [0, 1, 2, 6, 7].forEach((p, i) => {
        const base = 460 + i * 4;
        wardrobeState.props[p] = { curProp: T32[base], maxProp: T32[base + 1], curTex: T32[base + 2], maxTex: T32[base + 3] };
      });
      if (isOpen && activeTab === "wardrobe" && !query) updateWardrobeUI();
    }
  }, 60);

  // ---------------------------------------------------------------- speedometer (bottom right, only while in a vehicle)
  // live.speed is GET_ENTITY_SPEED of the vehicle in m/s (true 3D speed, so it also works for planes, helis and boats).
  const speedo = { on: true, unit: "kmh" };
  try {
    const so = JSON.parse(localStorage.getItem("gtav_cm_speedo") || "null");
    if (so) { speedo.on = so.on !== false; if (so.unit === "mph") speedo.unit = "mph"; }
  } catch (e) {}
  function saveSpeedo() { try { localStorage.setItem("gtav_cm_speedo", JSON.stringify(speedo)); } catch (e) {} }
  const speedoStyle = document.createElement("style");
  speedoStyle.textContent = `
    #gtav-speedo { position: fixed; right: 26px; bottom: 22px; width: 330px; height: 285px; z-index: 1000; display: none; pointer-events: none; user-select: none;
      filter: drop-shadow(0 2px 8px rgba(0,0,0,.75)); font-family: "Barlow Condensed", "Arial Narrow", "Helvetica Neue", Arial, sans-serif; }
    #gtav-speedo.show { display: block; animation: gtav-speedo-in .3s cubic-bezier(.2,.8,.2,1); }
    @keyframes gtav-speedo-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
    #gtav-speedo svg { width: 100%; height: 100%; overflow: visible; }
    #gtav-speedo .sp-needle { filter: drop-shadow(0 0 3px rgba(255,255,255,.55)); }
    @media (prefers-reduced-motion: reduce) { #gtav-speedo.show { animation: none; } }
  `;
  document.head.appendChild(speedoStyle);
  try { const fl = document.createElement("link"); fl.rel = "stylesheet"; fl.href = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@1,500;1,600&display=swap"; document.head.appendChild(fl); } catch (e) {}
  const speedoEl = document.createElement("div");
  speedoEl.id = "gtav-speedo";
  document.body.appendChild(speedoEl);
  // Forza Horizon style: open dial with a thin needle and a red end zone, drive/reverse badge in a green ring, big italic number with dim leading zeros.
  // The game's gear and RPM are not exposed to the trainer, so the dial reads speed and the badge shows D (forward), R (reverse) or N (stopped).
  const SP_START = -215, SP_SWEEP = 245, SP_TIERS = { kmh: [360, 500, 800, 1200], mph: [220, 320, 500, 760] };
  let spTier = 0, spUnitBuilt = "", spNeedle = null, spNum = null, spGear = null, spMax = 0;
  const SP_CX = 112, SP_CY = 112;
  function spPt(r, deg) { const a = deg * Math.PI / 180; return [(SP_CX + r * Math.cos(a)).toFixed(2), (SP_CY + r * Math.sin(a)).toFixed(2)]; }
  function buildSpeedo() {
    spMax = SP_TIERS[speedo.unit][spTier];
    const major = spMax <= 300 ? 40 : spMax <= 500 ? 50 : spMax <= 800 ? 100 : 200;
    const minor = major / (major === 40 ? 4 : 5);
    let t = "";
    for (let i = 0; i * minor <= spMax + 0.01; i++) {
      const v = i * minor, deg = SP_START + v / spMax * SP_SWEEP, big = Math.abs(v / major - Math.round(v / major)) < 1e-6, hot = v > spMax * 0.86;
      const [x1, y1] = spPt(big ? 86 : 90, deg), [x2, y2] = spPt(95, deg);
      t += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${hot ? "#ff4338" : "#fff"}" stroke-width="${big ? 1.8 : 1}" opacity="${big ? .85 : .4}"/>`;
      if (big) { const [lx, ly] = spPt(72, deg); t += `<text x="${lx}" y="${ly}" fill="${hot ? "#ff6a60" : "#fff"}" opacity=".7" font-size="12" font-style="italic" font-weight="500" text-anchor="middle" dominant-baseline="central">${Math.round(v)}</text>`; }
    }
    const [ax, ay] = spPt(99, SP_START), [bx, by] = spPt(99, SP_START + SP_SWEEP);
    const [rx, ry] = spPt(99, SP_START + SP_SWEEP * 0.86);
    const mph = speedo.unit === "mph";
    speedoEl.innerHTML = `<svg viewBox="0 0 330 285">
      <defs><radialGradient id="sp-shade" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".42"/><stop offset=".75" stop-color="#000" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>
      <g transform="translate(46 4) scale(1.2)"><circle cx="${SP_CX}" cy="${SP_CY}" r="122" fill="url(#sp-shade)"/>
      <path d="M ${ax} ${ay} A 99 99 0 1 1 ${bx} ${by}" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.5"/>
      <path d="M ${rx} ${ry} A 99 99 0 0 1 ${bx} ${by}" fill="none" stroke="#ff4338" stroke-width="5" stroke-linecap="butt"/>
      ${t}
      <text x="40" y="150" fill="#fff" opacity=".28" font-size="8.5" font-weight="600" letter-spacing="1" text-anchor="middle" transform="rotate(-8 40 150)">ABS</text>
      <text x="40" y="160" fill="#fff" opacity=".28" font-size="8.5" font-weight="600" letter-spacing="1" text-anchor="middle" transform="rotate(-8 40 160)">TCR</text>
      <g class="sp-needle" transform="rotate(${SP_START} ${SP_CX} ${SP_CY})"><polygon points="${SP_CX + 92},${SP_CY} ${SP_CX + 22},${SP_CY - 1.9} ${SP_CX + 22},${SP_CY + 1.9}" fill="#fff"/></g>
      <circle cx="${SP_CX}" cy="${SP_CY + 8}" r="19" fill="#0b1a10" fill-opacity=".85" stroke="#4be07a" stroke-width="2.4"/>
      <text class="sp-gear" x="${SP_CX}" y="${SP_CY + 8}" fill="#fff" font-size="26" font-weight="600" font-style="italic" text-anchor="middle" dominant-baseline="central">N</text></g>
      <text x="322" y="176" fill="#fff" opacity=".7" font-size="17" font-weight="600" font-style="italic" letter-spacing=".5" text-anchor="end">${mph ? "MPH" : "KM/H"}</text>
      <text class="sp-num" x="322" y="252" fill="#fff" font-size="96" font-weight="500" font-style="italic" text-anchor="end" letter-spacing="-2"></text></svg>`;
    spNeedle = speedoEl.querySelector(".sp-needle"); spNum = speedoEl.querySelector(".sp-num"); spGear = speedoEl.querySelector(".sp-gear");
    spUnitBuilt = speedo.unit; spShown = -1; spGearShown = "";
  }
  let spShown = -1, spShownDeg = SP_START, spWasShown = false, spGearShown = "";
  (function speedoFrame() {
    const show = speedo.on && inVehicle && trainerHooked && !isOpen;
    if (speedoEl.classList.contains("show") !== show) speedoEl.classList.toggle("show", show);
    if (show) {
      if (!spWasShown) { spTier = 0; spUnitBuilt = ""; }
      const ms = live.speed > 0.25 && isFinite(live.speed) ? live.speed : 0;
      const v = ms * (speedo.unit === "mph" ? 2.2369363 : 3.6);
      const tiers = SP_TIERS[speedo.unit];
      while (spTier < tiers.length - 1 && v > tiers[spTier] * 0.97) spTier++;
      if (spUnitBuilt !== speedo.unit || spMax !== tiers[spTier]) buildSpeedo();
      const r = Math.round(v);
      if (r !== spShown) {
        spShown = r;
        const d = String(r).padStart(3, "0"), z = d.length - String(r).length;
        spNum.innerHTML = (z ? '<tspan fill-opacity=".3">' + d.slice(0, z) + "</tspan>" : "") + d.slice(z);
      }
      const fwd = TF32[41], g = ms < 0.5 ? "N" : (fwd < -0.5 ? "R" : "D");
      if (g !== spGearShown) { spGearShown = g; spGear.textContent = g; }
      // The needle eases toward the reading (about 1/10 s) so it sweeps instead of stepping at the 50 Hz sample rate
      spShownDeg += (SP_START + Math.min(1.03, v / spMax) * SP_SWEEP - spShownDeg) * 0.45;
      spNeedle.setAttribute("transform", "rotate(" + spShownDeg.toFixed(2) + " " + SP_CX + " " + SP_CY + ")");
    }
    spWasShown = show;
    requestAnimationFrame(speedoFrame);
  })();

  // Current settings profile (resolution, fps, graphics)
  let profile = { res: "1920x1080", fps: "60", low: "0", args: "" };
  fetch("/local-profile.json", { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})).then((p) => Object.assign(profile, p)).catch(() => {});

  // ---------------------------------------------------------------- DOM helpers
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v === undefined || v === null || v === false) continue;
        if (k === "class") el.className = v;
        else if (k === "text") el.textContent = v;
        else if (k === "html") el.innerHTML = v;
        else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? "" : v);
      }
    }
    for (const kid of kids.flat()) {
      if (kid === null || kid === undefined || kid === false) continue;
      el.appendChild(typeof kid === "string" ? document.createTextNode(kid) : kid);
    }
    return el;
  }

  const ICONS = {
    player: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6.5 8-6.5s8 2.5 8 6.5"/>',
    weapons: '<path d="M3 8h14l1.5-2H22v5h-4.5L17 14h-4l-1 5H8l1-5H3z"/>',
    vehicle: '<path d="M4 16v-5l2-5h12l2 5v5M3 16h18M3 11h18"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/>',
    spawn: '<path d="M12 5v14M5 12h14"/><circle cx="12" cy="12" r="9"/>',
    skins: '<circle cx="12" cy="12" r="9"/><path d="M8 14.5s1.5 2 4 2 4-2 4-2M9 9.5h.01M15 9.5h.01"/>',
    wardrobe: '<path d="M8 3L3 6l2 4 3-1v12h8V9l3 1 2-4-5-3a4 4 0 0 1-8 0z"/>',
    world: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3.5 3.5 3.5 14.5 0 18M12 3c-3.5 3.5-3.5 14.5 0 18"/>',
    teleport: '<path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    fun: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/>',
    mods: '<path d="M4 8h6V4.5h4V8h6v6h-3.5v4h-4v-3.5H7.5V14H4z"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    left: '<path d="M14.5 6l-6 6 6 6"/>',
    right: '<path d="M9.5 6l6 6-6 6"/>'
  };
  const icon = (name, size = 18) => h("span", { class: "cm-ico", html: '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || "") + "</svg>" });

  // ---------------------------------------------------------------- styles + shell
  const overlay = document.createElement("div");
  overlay.id = "cheat-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-label", "GTA V trainer menu");
  overlay.innerHTML = `
    <style>
      #cheat-toast {
        position: fixed; top: 22px; left: 50%; transform: translate(-50%, -16px); opacity: 0; pointer-events: none; z-index: 2147483647;
        background: #0f1318; color: #eaf0f6; border: 1px solid rgba(61, 220, 132, .55); border-radius: 8px; padding: 10px 18px;
        font: 600 14px/1.3 -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        box-shadow: 0 10px 30px rgba(0, 0, 0, .55); transition: opacity .16s ease, transform .16s ease; max-width: 70vw; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      #cheat-toast.visible { opacity: 1; transform: translate(-50%, 0); }

      #cheat-overlay {
        --bg: rgba(11, 13, 16, .50); --panel: rgba(17, 21, 26, .55); --raised: rgba(28, 34, 42, .48); --raised-2: rgba(40, 48, 58, .68); --line: rgba(255, 255, 255, .085); --line-2: rgba(255, 255, 255, .16);
        --text: #e8edf2; --muted: #8e9aa7; --accent: #3ddc84; --accent-ink: #04140b; --accent-soft: rgba(61, 220, 132, .12);
        --warn: #ffb224; --danger: #ff5c5c; --danger-soft: rgba(255, 92, 92, .12);
        position: fixed; inset: 0; z-index: 2147483000; display: none; align-items: center; justify-content: center;
        background: rgba(3, 5, 7, .12); cursor: default; user-select: none; -webkit-user-select: none;
        text-shadow: 0 1px 3px rgba(0, 0, 0, .85); font: 14px/1.4 -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: var(--text);
      }
      #cheat-overlay *, #cheat-overlay *::before, #cheat-overlay *::after { box-sizing: border-box; }
      #cheat-overlay.visible { display: flex; }
      #cheat-overlay button, #cheat-overlay input { font: inherit; color: inherit; }
      #cheat-overlay button { cursor: pointer; }
      #cheat-overlay :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
      .cm-ico { display: inline-flex; flex: none; }
      .cm-ico svg { display: block; }

      #cm-card {
        width: min(1560px, calc(100vw - 48px)); height: min(900px, calc(100vh - 48px)); background: var(--bg); border: 1px solid var(--line-2); border-radius: 14px;
        box-shadow: 0 30px 90px rgba(0, 0, 0, .45); display: grid; grid-template-columns: 236px 1fr; grid-template-rows: 68px 1fr 44px; overflow: hidden;
        animation: cm-in .16s ease-out;
      }
      @keyframes cm-in { from { opacity: 0; transform: translateY(8px) scale(.992); } to { opacity: 1; transform: none; } }

      #cm-head { grid-column: 1 / 3; display: flex; align-items: center; gap: 22px; padding: 0 18px 0 22px; border-bottom: 1px solid var(--line); background: var(--panel); }
      #cm-brand { display: flex; align-items: baseline; gap: 10px; min-width: 214px; }
      #cm-brand b { font: 800 19px/1 "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; letter-spacing: .14em; text-transform: uppercase; }
      #cm-brand span { color: var(--accent); font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
      #cm-search { position: relative; flex: 0 1 420px; }
      #cm-search .cm-ico { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: var(--muted); pointer-events: none; }
      #cm-search input { width: 100%; height: 40px; padding: 0 56px 0 40px; background: var(--bg); border: 1px solid var(--line-2); border-radius: 9px; outline: none; user-select: text; -webkit-user-select: text; }
      #cm-search input::placeholder { color: var(--muted); }
      #cm-search input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
      #cm-search kbd { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); font: 600 11px/1 ui-monospace, Menlo, monospace; color: var(--muted); border: 1px solid var(--line-2); border-radius: 5px; padding: 4px 6px; pointer-events: none; }
      #cm-live { flex: 1; display: flex; justify-content: flex-end; gap: 8px; min-width: 0; }
      .cm-stat { display: flex; flex-direction: column; justify-content: center; padding: 5px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); min-width: 84px; }
      .cm-stat small { color: var(--muted); font-size: 10.5px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; }
      .cm-stat b { font: 700 14px/1.25 ui-monospace, "SF Mono", Menlo, monospace; font-variant-numeric: tabular-nums; white-space: nowrap; }
      .cm-stat.wide { min-width: 176px; }
      #cm-status { display: flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 700; color: var(--muted); white-space: nowrap; }
      #cm-status i { width: 8px; height: 8px; border-radius: 50%; background: var(--warn); }
      #cm-status.live { color: var(--accent); }
      #cm-status.live i { background: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
      #cm-close { width: 40px; height: 40px; display: grid; place-items: center; background: transparent; border: 1px solid var(--line-2); border-radius: 9px; color: var(--muted); transition: background .12s, color .12s; }
      #cm-close:hover { background: var(--danger-soft); color: var(--danger); border-color: rgba(255, 92, 92, .5); }

      #cm-nav { grid-row: 2; background: var(--panel); border-right: 1px solid var(--line); padding: 14px 12px; display: flex; flex-direction: column; gap: 3px; overflow-y: auto; }
      .cm-navbtn { display: flex; align-items: center; gap: 12px; height: 44px; padding: 0 12px; background: transparent; border: 0; border-radius: 9px; color: var(--muted); text-align: left; font-weight: 600; transition: background .12s, color .12s; }
      .cm-navbtn:hover { background: var(--raised); color: var(--text); }
      .cm-navbtn.active { background: var(--accent-soft); color: var(--accent); box-shadow: inset 3px 0 0 var(--accent); }
      .cm-navbtn span.l { flex: 1; }
      .cm-count { min-width: 22px; height: 20px; padding: 0 6px; display: none; place-items: center; font-size: 11px; font-weight: 800; border-radius: 10px; background: var(--accent); color: var(--accent-ink); }
      .cm-count.on { display: grid; }
      .cm-navsep { height: 1px; background: var(--line); margin: 8px 6px; }

      #cm-main { grid-row: 2; overflow-y: auto; padding: 22px 26px 40px; scrollbar-width: thin; scrollbar-color: #2a323c transparent; }
      #cm-main::-webkit-scrollbar { width: 10px; } #cm-main::-webkit-scrollbar-thumb { background: #2a323c; border-radius: 5px; border: 2px solid var(--bg); }
      .cm-h1 { margin: 0 0 4px; font: 800 24px/1.2 "SF Pro Display", -apple-system, "Segoe UI", sans-serif; letter-spacing: -.01em; }
      .cm-sub { margin: 0 0 20px; color: var(--muted); }
      .cm-group { margin: 0 0 26px; }
      .cm-gt { display: flex; align-items: center; gap: 12px; margin: 0 0 11px; color: var(--muted); font-size: 11.5px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
      .cm-gt::after { content: ""; flex: 1; height: 1px; background: var(--line); }
      .cm-gt button { order: 3; height: 26px; padding: 0 10px; border: 1px solid var(--line-2); background: transparent; border-radius: 6px; color: var(--text); font-size: 11px; font-weight: 700; letter-spacing: .04em; }
      .cm-gt button:hover { border-color: var(--accent); color: var(--accent); }
      .cm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(268px, 1fr)); gap: 10px; }
      .cm-grid.tight { grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 8px; }
      .cm-grid.wide { grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); }

      .cm-tile { display: flex; align-items: center; gap: 12px; min-height: 58px; padding: 10px 14px; text-align: left; background: var(--raised); border: 1px solid var(--line); border-radius: 10px; transition: background .12s, border-color .12s, transform .06s; }
      .cm-tile:hover { background: var(--raised-2); border-color: var(--line-2); }
      .cm-tile:active { transform: scale(.985); }
      .cm-tile .t { flex: 1; min-width: 0; }
      .cm-tile .t b { display: block; font-weight: 700; }
      .cm-tile .t small { display: block; color: var(--muted); font-size: 12px; margin-top: 1px; }
      .cm-tile.sm { min-height: 44px; padding: 8px 12px; }
      .cm-tile.sm .t b { font-weight: 600; font-size: 13.5px; }
      .cm-tile.danger:hover { border-color: rgba(255, 92, 92, .6); background: var(--danger-soft); }
      .cm-tile.danger .t b { color: #ff9b9b; }
      .cm-tile.is-on { background: linear-gradient(90deg, var(--accent-soft), var(--raised) 70%); border-color: rgba(61, 220, 132, .55); }
      .cm-tile.sel { border-color: var(--accent); background: var(--accent-soft); }
      .cm-tile .go { color: var(--muted); display: inline-flex; }
      .cm-tile:hover .go { color: var(--accent); }
      .cm-sw { position: relative; flex: none; width: 42px; height: 24px; border-radius: 12px; background: #2a323c; transition: background .14s; }
      .cm-sw::after { content: ""; position: absolute; left: 3px; top: 3px; width: 18px; height: 18px; border-radius: 50%; background: #9aa5b1; transition: transform .14s, background .14s; }
      .cm-tile.is-on .cm-sw { background: var(--accent); }
      .cm-tile.is-on .cm-sw::after { transform: translateX(18px); background: var(--accent-ink); }
      .cm-onlabel { flex: none; width: 24px; font-size: 10.5px; font-weight: 800; letter-spacing: .06em; color: var(--muted); text-align: right; }
      .cm-tile.is-on .cm-onlabel { color: var(--accent); }

      .cm-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
      .cm-pill { height: 34px; padding: 0 14px; background: var(--raised); border: 1px solid var(--line); border-radius: 17px; color: var(--text); font-weight: 600; font-size: 13px; white-space: nowrap; transition: background .12s, border-color .12s; }
      .cm-pill:hover { border-color: var(--line-2); background: var(--raised-2); }
      .cm-pill.sel { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }
      .cm-pill small { opacity: .65; margin-left: 6px; font-weight: 700; }
      .cm-btn { height: 40px; padding: 0 16px; background: var(--raised); border: 1px solid var(--line-2); border-radius: 9px; font-weight: 700; transition: background .12s, border-color .12s; }
      .cm-btn:hover { background: var(--raised-2); border-color: var(--accent); }
      .cm-btn.primary { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }
      .cm-btn.primary:hover { filter: brightness(1.08); }
      .cm-btn.sm { height: 34px; padding: 0 12px; font-size: 13px; }
      .cm-stars { display: flex; gap: 8px; }
      .cm-star { width: 60px; height: 46px; display: grid; place-items: center; background: var(--raised); border: 1px solid var(--line); border-radius: 9px; font: 800 16px/1 ui-monospace, Menlo, monospace; }
      .cm-star:hover { border-color: var(--warn); }
      .cm-star.sel { background: var(--warn); border-color: var(--warn); color: #231600; }
      .cm-sw-row { display: flex; flex-wrap: wrap; gap: 8px; }
      .cm-color { width: 38px; height: 38px; border-radius: 9px; border: 2px solid var(--line-2); padding: 0; transition: transform .08s; }
      .cm-color:hover { transform: scale(1.08); border-color: #fff; }
      .cm-panelbox { background: var(--raised); border: 1px solid var(--line); border-radius: 10px; padding: 14px 16px; }
      .cm-slider { display: flex; align-items: center; gap: 14px; }
      .cm-slider input[type=range] { flex: 1; accent-color: var(--accent); height: 28px; }
      .cm-slider .v { min-width: 64px; text-align: right; font: 700 15px/1 ui-monospace, Menlo, monospace; font-variant-numeric: tabular-nums; }
      .cm-step { width: 34px; height: 34px; display: grid; place-items: center; background: var(--bg); border: 1px solid var(--line-2); border-radius: 8px; }
      .cm-step:hover { border-color: var(--accent); color: var(--accent); }
      .cm-input { height: 40px; padding: 0 12px; background: var(--bg); border: 1px solid var(--line-2); border-radius: 9px; outline: none; user-select: text; -webkit-user-select: text; }
      .cm-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
      .cm-wcard { background: var(--raised); border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 9px; }
      .cm-wcard header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
      .cm-wcard header b { font-weight: 700; }
      .cm-badge { font: 700 12px/1 ui-monospace, Menlo, monospace; color: var(--muted); background: var(--bg); padding: 5px 8px; border-radius: 6px; }
      .cm-more { margin-top: 12px; }
      .cm-empty { padding: 60px 0; text-align: center; color: var(--muted); }
      .cm-note { color: var(--muted); font-size: 12.5px; margin: 8px 0 0; }
      .cm-vehbadge { font: 600 11px/1 ui-monospace, Menlo, monospace; color: var(--muted); background: var(--bg); padding: 4px 6px; border-radius: 5px; }

      #cm-foot { grid-column: 1 / 3; display: flex; align-items: center; gap: 18px; padding: 0 22px; border-top: 1px solid var(--line); background: var(--panel); color: var(--muted); font-size: 12.5px; }
      #cm-foot kbd { font: 700 11px/1 ui-monospace, Menlo, monospace; color: var(--text); border: 1px solid var(--line-2); background: var(--bg); border-radius: 5px; padding: 4px 6px; margin-right: 5px; }
      #cm-foot .sp { flex: 1; }
      #cm-foot button { height: 28px; padding: 0 12px; background: transparent; border: 1px solid var(--line-2); border-radius: 6px; color: var(--text); font-size: 12px; font-weight: 700; }
      #cm-foot button:hover { border-color: var(--danger); color: var(--danger); }
      @media (max-width: 1180px) { #cm-card { grid-template-columns: 64px 1fr; } .cm-navbtn .l, #cm-brand span, #cm-live .cm-stat.opt { display: none; } #cm-brand { min-width: 0; } }
      @media (prefers-reduced-motion: reduce) { #cm-card { animation: none; } #cheat-overlay *, #cheat-toast { transition: none !important; } }
    </style>
    <div id="cm-card">
      <div id="cm-head">
        <div id="cm-brand"><b>Trainer</b><span>Los Santos</span></div>
        <label id="cm-search"><span id="cm-search-ico"></span><input id="cm-q" type="text" placeholder="Search every cheat, vehicle, skin, place" autocomplete="off" spellcheck="false" aria-label="Search"><kbd>/</kbd></label>
        <div id="cm-live"></div>
        <div id="cm-status"><i></i><span>Starting</span></div>
        <button id="cm-close" title="Close (Cmd+X or Esc)" aria-label="Close menu"></button>
      </div>
      <nav id="cm-nav" aria-label="Sections"></nav>
      <main id="cm-main"></main>
      <div id="cm-foot">
        <span><kbd>Cmd X</kbd>close</span><span><kbd>Esc</kbd>close</span><span><kbd>/</kbd>search</span>
        <span id="cm-active-count"></span>
        <span class="sp"></span>
        <button id="cm-reset" title="Turn every toggle off">Turn all toggles off</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const $ = (sel) => overlay.querySelector(sel);
  const mainEl = $("#cm-main");
  const navEl = $("#cm-nav");
  const qInput = $("#cm-q");
  $("#cm-search-ico").replaceWith(icon("search", 17));
  $("#cm-close").appendChild(icon("close", 18));
  const statusEl = $("#cm-status");
  const liveEl = $("#cm-live");

  const liveEls = {};
  [["pos", "Position", "wide opt"], ["spd", "Speed", "opt"], ["time", "Time", ""], ["hp", "Health", ""]].forEach(([k, label, cls]) => {
    const b = h("b", { text: "-" });
    liveEls[k] = b;
    liveEl.appendChild(h("div", { class: "cm-stat " + cls }, h("small", { text: label }), b));
  });
  liveEls.stars = h("b", { text: "0" });
  liveEl.appendChild(h("div", { class: "cm-stat" }, h("small", { text: "Wanted" }), liveEls.stars));

  function updateStatus() {
    statusEl.className = trainerHooked ? "live" : "";
    statusEl.lastChild.textContent = trainerHooked ? "Trainer live" : "Waiting for game";
  }
  updateStatus();

  function updateLive() {
    const n = (v) => (isFinite(v) ? v.toFixed(0) : "-");
    liveEls.pos.textContent = n(live.x) + ", " + n(live.y) + ", " + n(live.z);
    liveEls.spd.textContent = n(live.speed * 3.6) + " km/h";
    liveEls.time.textContent = live.hour >= 0 && live.hour < 24 ? String(live.hour).padStart(2, "0") + ":" + String(live.minute).padStart(2, "0") : "-";
    liveEls.hp.textContent = live.hp > 0 ? Math.max(0, live.hp - 100) + (live.armour > 0 ? " + " + live.armour : "") : "-";
    liveEls.stars.textContent = currentWanted ? String(currentWanted) + " star" + (currentWanted > 1 ? "s" : "") : "None";
    // keep time slider in sync unless it is being dragged
    if (hourSlider && document.activeElement !== hourSlider && live.hour >= 0) { hourSlider.value = live.hour; hourVal.textContent = String(live.hour).padStart(2, "0") + ":00"; }
    document.querySelectorAll("[data-star]").forEach((el) => el.classList.toggle("sel", +el.dataset.star === currentWanted));
  }
  let hourSlider = null, hourVal = null;

  // ---------------------------------------------------------------- item registry
  const T = (key, label, desc) => ({ t: "toggle", key, label, desc });
  const A = (label, desc, run, o) => Object.assign({ t: "action", label, desc, run }, o || {});
  const C = (label, desc, cmd, arg, o) => A(label, desc, () => dispatchAction(cmd, arg || 0, [0, 0, 0], (o && o.str) || "", ""), o);
  const Wd = (label, render, tags) => ({ t: "widget", label, render, tags: tags || "" });

  function teleportTo(label, coords) {
    const p = coords.split(",").map(Number);
    dispatchAction(CMD.TELEPORT_COORDS, 0, [p[0], p[1], p[2] || 0], label);
  }

  // ---- widgets
  function wStars() {
    const row = h("div", { class: "cm-stars" });
    for (let i = 0; i <= 5; i++) {
      row.appendChild(h("button", { class: "cm-star" + (i === currentWanted ? " sel" : ""), "data-star": i, text: i === 0 ? "0" : String(i), title: i + " star" + (i === 1 ? "" : "s"),
        onclick: () => dispatchAction(CMD.WANTED_SET, i, [0, 0, 0], "", "Wanted level " + i) }));
    }
    return row;
  }

  function wSwatches(kind) {
    const row = h("div", { class: "cm-sw-row" });
    SWATCHES.forEach((s) => {
      row.appendChild(h("button", { class: "cm-color", title: s.n, "aria-label": s.n, style: "background:rgb(" + s.c.join(",") + ")",
        onclick: () => dispatchAction(kind === "neon" ? CMD.VEH_NEON : CMD.VEH_COLOR, 1, s.c, s.n) }));
    });
    if (kind === "neon") row.appendChild(h("button", { class: "cm-btn sm", text: "Neon off", onclick: () => dispatchAction(CMD.VEH_NEON, 0, [0, 0, 0], "") }));
    else row.appendChild(h("button", { class: "cm-btn sm", text: "Random", onclick: () => dispatchAction(CMD.PAINT, 0, [0, 0, 0], "") }));
    return row;
  }

  function wTint() {
    const names = ["None", "Pure black", "Dark smoke", "Light smoke", "Stock", "Limo", "Green"];
    return h("div", { class: "cm-row" }, names.map((n, i) => h("button", { class: "cm-pill", text: n, onclick: () => dispatchAction(CMD.TINT, i, [0, 0, 0], "") })));
  }

  function wPlate() {
    const inp = h("input", { class: "cm-input", type: "text", maxlength: "8", placeholder: "Plate text", value: "GTA V", style: "width:170px;text-transform:uppercase" });
    const go = () => dispatchAction(CMD.PLATE, 0, [0, 0, 0], (inp.value || "GTA V").toUpperCase().slice(0, 8));
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
    return h("div", { class: "cm-row" }, inp, h("button", { class: "cm-btn primary", text: "Set plate", onclick: go }),
      ["LS 2013", "WASTED", "FRANKLIN", "TREVOR", "ALGERIA"].map((p) => h("button", { class: "cm-pill", text: p, onclick: () => { inp.value = p; go(); } })));
  }

  function wTime() {
    const wrap = h("div", { class: "cm-panelbox", style: "display:flex;flex-direction:column;gap:14px" });
    hourVal = h("span", { class: "v", text: live.hour >= 0 ? String(live.hour).padStart(2, "0") + ":00" : "--:--" });
    hourSlider = h("input", { type: "range", min: "0", max: "23", step: "1", value: String(Math.max(0, live.hour)) });
    hourSlider.addEventListener("input", () => { hourVal.textContent = String(hourSlider.value).padStart(2, "0") + ":00"; });
    hourSlider.addEventListener("change", () => dispatchAction(CMD.TIME, +hourSlider.value, [0, 0, 0], String(hourSlider.value).padStart(2, "0") + ":00"));
    wrap.appendChild(h("div", { class: "cm-slider" }, h("button", { class: "cm-step", title: "-1 hour", onclick: () => shiftHour(-1) }, icon("left", 16)), hourSlider,
      h("button", { class: "cm-step", title: "+1 hour", onclick: () => shiftHour(1) }, icon("right", 16)), hourVal));
    wrap.appendChild(h("div", { class: "cm-row" }, [["Dawn", 6], ["Morning", 9], ["Noon", 12], ["Afternoon", 15], ["Sunset", 19], ["Night", 22], ["Midnight", 0], ["3 AM", 3]]
      .map(([n, hr]) => h("button", { class: "cm-pill", text: n, onclick: () => dispatchAction(CMD.TIME, hr, [0, 0, 0], n) }))));
    return wrap;
  }
  function shiftHour(d) {
    const cur = live.hour >= 0 ? live.hour : 12;
    const next = (cur + d + 24) % 24;
    dispatchAction(CMD.TIME, next, [0, 0, 0], String(next).padStart(2, "0") + ":00");
  }

  function wWeather() {
    return h("div", { class: "cm-row" }, WEATHERS.map((w) => h("button", { class: "cm-pill" + (activeWeather === w.id ? " sel" : ""), text: w.label, "data-weather": w.id,
      onclick: () => { activeWeather = w.id; dispatchAction(CMD.WEATHER, 0, [0, 0, 0], w.id, "Weather: " + w.label); overlay.querySelectorAll("[data-weather]").forEach((b) => b.classList.toggle("sel", b.dataset.weather === w.id)); } })));
  }

  function wSpeed() {
    return h("div", { class: "cm-row" }, [0.1, 0.25, 0.5, 1, 1.5, 2, 3].map((v) => h("button", { class: "cm-pill", text: v === 1 ? "Normal" : "x" + v,
      onclick: () => { if (toggles.slowmo) setToggleBit("slowmo", false); dispatchAction(CMD.GAME_SPEED, 0, [v, 0, 0], ""); refreshToggleStates(); } })));
  }

  function wCoords() {
    const inp = h("input", { class: "cm-input", type: "text", placeholder: "x, y, z   e.g. 195, -934, 31", style: "width:300px" });
    const go = () => {
      const p = inp.value.split(/[ ,;]+/).filter(Boolean).map(Number);
      if (p.length < 2 || p.some((v) => !isFinite(v))) { showToast("Enter x, y and optionally z"); return; }
      dispatchAction(CMD.TELEPORT_COORDS, 0, [p[0], p[1], p[2] || 0], "coordinates");
      closeCheatMenu();
    };
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
    const saved = h("span", { class: "cm-note", text: savedPos ? "Saved: " + savedPos.x.toFixed(0) + ", " + savedPos.y.toFixed(0) + ", " + savedPos.z.toFixed(0) : "No saved position yet" });
    return h("div", { class: "cm-panelbox", style: "display:flex;flex-direction:column;gap:12px" },
      h("div", { class: "cm-row" }, inp, h("button", { class: "cm-btn primary", text: "Teleport", onclick: go })),
      h("div", { class: "cm-row" },
        h("button", { class: "cm-btn", text: "Save current position", onclick: () => {
          savedPos = { x: live.x, y: live.y, z: live.z };
          try { localStorage.setItem("gtav_cm_savedpos", JSON.stringify(savedPos)); } catch (e) {}
          saved.textContent = "Saved: " + savedPos.x.toFixed(0) + ", " + savedPos.y.toFixed(0) + ", " + savedPos.z.toFixed(0);
          showToast("Position saved");
        } }),
        h("button", { class: "cm-btn", text: "Return to saved position", onclick: () => {
          if (!savedPos) { showToast("Nothing saved yet"); return; }
          dispatchAction(CMD.TELEPORT_COORDS, 0, [savedPos.x, savedPos.y, savedPos.z], "saved position");
          closeCheatMenu();
        } }), saved));
  }

  const SECTIONS = [
    { id: "player", label: "Player", ico: "player", sub: "Health, abilities and how the world reacts to you.", groups: [
      { title: "Quick actions", cls: "tight", items: [
        C("Heal + armour", "Full health, armour, repairs your vehicle", CMD.HEAL), C("Full armour", "Armour to 100%", CMD.ARMOUR),
        C("Max money", "Sets cash to $999,999,999", CMD.MONEY), C("Parachute", "Equip a parachute", CMD.PARACHUTE),
        C("Clean up", "Wash off blood, dirt and water", CMD.CLEAN_PED), C("Ragdoll", "Fall over for four seconds", CMD.RAGDOLL),
        C("Clear area", "Remove traffic and peds within 120 m", CMD.CLEAR_AREA), C("Kill player", "Instant wasted", CMD.SUICIDE, 0, { danger: true })
      ] },
      { title: "Abilities", items: [
        T("god", "God mode", "Invincible, health refills"), T("stamina", "Unlimited stamina", "Sprint and swim forever"),
        T("superJump", "Super jump", "Jump much higher"), T("fastRun", "Fast run", "Sprint 1.5x faster"), T("fastSwim", "Fast swim", "Swim 1.5x faster"),
        T("noRagdoll", "Unshakeable", "Never knocked over"), T("invisible", "Invisible", "Ghost mode"), T("regen", "Rapid health regeneration", "Heals itself quickly to full"),
        T("fireproof", "Fire, explosion and drown proof", "Immune without full god mode"), T("silent", "Silent footsteps", "Stealth, enemies hear nothing"), T("damage10x", "10x damage", "Guns and melee hit ten times harder")
      ] },
      { title: "Wanted level", items: [
        Wd("Set wanted level", wStars, "stars police"),
        T("neverWanted", "Never wanted", "Wanted level stays at zero"), T("policeIgnore", "Police ignore you", "Cops do not react to crimes"),
        T("everyoneIgnore", "Everyone ignores you", "Peds do not notice you"), T("noCops", "No random cops", "Stops random police spawns"), T("gangsIgnore", "Gangs leave you alone", "No gang harassment")
      ] }
    ] },
    { id: "weapons", label: "Weapons", ico: "weapons", sub: "Click a weapon to equip it. Weapons this build lacks are skipped.", groups: [
      { title: "Loadout", cls: "tight", items: [
        C("Give every weapon", "Full arsenal with 9999 ammo", CMD.WEAPONS), C("Refill all ammo", "Max ammo on every weapon you own", CMD.GIVE_WEAPON_SET, -1),
        C("Remove all weapons", "Empty your hands", CMD.REMOVE_WEAPONS, 0, { danger: true })
      ] },
      { title: "Ammo and damage", items: [
        T("infiniteAmmo", "Infinite ammo", "Never reload"), T("explosiveAmmo", "Explosive bullets", "Every shot explodes"), T("fireAmmo", "Incendiary bullets", "Every shot ignites"),
        T("explosiveMelee", "Explosive punches", "Melee blows explode"), T("damage10x", "10x damage", "Guns and melee hit ten times harder")
      ] }
    ].concat(WEAPON_CATS.map((cat, ci) => ({ title: cat.name, cls: "tight", head: C("Give all " + cat.name.toLowerCase(), "", CMD.GIVE_WEAPON_SET, ci), items:
      cat.items.map((w) => A(weaponLabel(w), "", () => dispatchAction(CMD.GIVE_WEAPON, 0, [0, 0, 0], w), { sm: true, tags: "weapon gun " + w })) }))) },
    { id: "vehicle", label: "Vehicle", ico: "vehicle", sub: "Acts on the vehicle you are driving.", groups: [
      { title: "Repair and handling", cls: "tight", items: [
        C("Repair", "Fix damage and engine", CMD.REPAIR), C("Wash", "Clean and remove dents", CMD.VEH_CLEAN), C("Flip upright", "Put wheels back down", CMD.FLIP),
        C("Max tune", "All mods and turbo", CMD.TUNE), C("Hijack nearest", "Jump into the closest vehicle", CMD.HIJACK), C("Emergency stop", "Zero speed", CMD.VEH_STOP)
      ] },
      { title: "Speed", cls: "tight", items: [
        C("Boost 45 m/s", "Quick shove forward", CMD.BOOST), A("Boost 90 m/s", "Rocket start", () => dispatchAction(CMD.VEH_BOOST_N, 90, [0, 0, 0], "")), A("Boost 150 m/s", "Ludicrous speed", () => dispatchAction(CMD.VEH_BOOST_N, 150, [0, 0, 0], "")),
        C("Bunny hop", "Small jump", CMD.VEH_JUMP), A("Launch skyward", "Throw the vehicle up", () => dispatchAction(CMD.LAUNCH_UP, 30, [0, 0, 0], ""))
      ] },
      { title: "Toggles", items: [
        T("vehicleGod", "Indestructible vehicle", "Cannot be damaged, always repaired"), T("bulletproofTyres", "Bulletproof tyres", "Tyres cannot be shot out"), T("driftMode", "Drift mode", "Reduced grip"),
        T("turbo", "Turbo engine", "More power and a higher top speed"), T("superBrakes", "Super brakes", "Hold S to brake much harder (not an instant stop). Space stays a normal handbrake for drifting"), T("seatbelt", "Seatbelt", "You never fall off bikes or through windscreens"),
        T("rainbow", "Rainbow paint", "Colour cycles continuously"), T("invisCar", "Invisible vehicle", "Only you remain visible"), T("floatCar", "Floating vehicle", "Gravity off for the vehicle"), T("sirens", "Sirens on", "Lights and siren always running")
      ] },
      { title: "Paint", items: [Wd("Paint colour", () => wSwatches("paint"), "colour color paint random")] },
      { title: "Neon", items: [Wd("Neon underglow", () => wSwatches("neon"), "neon light underglow")] },
      { title: "Body", cls: "tight", items: [
        A("Open doors", "", () => dispatchAction(CMD.VEH_DOORS, 1, [0, 0, 0], "")), A("Close doors", "", () => dispatchAction(CMD.VEH_DOORS, 0, [0, 0, 0], "")),
        A("Lock doors", "", () => dispatchAction(CMD.VEH_LOCK, 2, [0, 0, 0], "")), A("Unlock doors", "", () => dispatchAction(CMD.VEH_LOCK, 1, [0, 0, 0], "")),
        A("Convertible roof down", "", () => dispatchAction(CMD.VEH_ROOF, 1, [0, 0, 0], "")), A("Convertible roof up", "", () => dispatchAction(CMD.VEH_ROOF, 0, [0, 0, 0], "")),
        A("Burst tyres", "", () => dispatchAction(CMD.VEH_TYRES, 1, [0, 0, 0], "")), A("Fix tyres", "", () => dispatchAction(CMD.VEH_TYRES, 0, [0, 0, 0], "")),
        A("Engine on", "", () => dispatchAction(CMD.ENGINE, 1, [0, 0, 0], "")), A("Engine off", "", () => dispatchAction(CMD.ENGINE, 0, [0, 0, 0], "")),
        C("Self destruct", "Blow it up with you inside", CMD.VEH_EXPLODE, 0, { danger: true })
      ] },
      { title: "Window tint", items: [Wd("Window tint", wTint, "windows tint")] },
      { title: "Number plate", items: [Wd("Number plate", wPlate, "plate license")] }
    ] },
    { id: "spawner", label: "Spawn vehicle", ico: "spawn", custom: true, sub: "Choose a category and click to spawn and drive." },
    { id: "skins", label: "Skins", ico: "skins", custom: true, sub: "Change your character model." },
    { id: "wardrobe", label: "Wardrobe", ico: "wardrobe", custom: true, sub: "Clothing and props for the current character." },
    { id: "world", label: "World", ico: "world", sub: "Time, weather and the environment.", groups: [
      { title: "Time of day", items: [Wd("Time of day", wTime, "clock hour")] },
      { title: "Weather", items: [Wd("Weather", wWeather, "rain snow fog")] },
      { title: "Game speed", items: [Wd("Game speed", wSpeed, "slow motion time scale")] },
      { title: "Environment", items: [
        T("freezeTime", "Freeze time", "Clock stops"), T("noTraffic", "No traffic or peds", "Empty streets"), T("riot", "Riot mode", "Everyone fights"), T("pedsFlee", "Peds flee", "Pedestrians run from you"),
        T("moonGravity", "Moon gravity", "Low gravity"), T("zeroGravity", "Zero gravity", "Float freely"), T("slowmo", "Slow motion", "Game at 0.4x speed"),
        T("blackout", "Blackout", "Street lights and signs off"), T("nightVision", "Night vision", "Green goggles"), T("thermalVision", "Thermal vision", "Heat view"), T("hideHud", "Hide HUD and radar", "Clean screenshots")
      ] }
    ] },
    { id: "teleport", label: "Teleport", ico: "teleport", custom: true, sub: "Jump somewhere. Ground height is found automatically." },
    { id: "fun", label: "Chaos and spawns", ico: "fun", sub: "Explosions, launches, bodyguards and extras.", groups: [
      { title: "Chaos", cls: "tight", items: [
        C("Airstrike", "Explosions in a ring around you", CMD.AIRSTRIKE), A("Launch me up", "Rocket yourself skyward", () => dispatchAction(CMD.LAUNCH_UP, 45, [0, 0, 0], "")),
        A("Skydive", "Teleport 800 m up with a parachute", () => dispatchAction(CMD.TP_UP, 800, [1, 0, 0], "")), A("Up 50 m", "", () => dispatchAction(CMD.TP_UP, 50, [0, 0, 0], "")),
        A("Up 200 m", "", () => dispatchAction(CMD.TP_UP, 200, [0, 0, 0], "")), A("Down 20 m", "", () => dispatchAction(CMD.TP_UP, -20, [0, 0, 0], "")),
        A("Forward 25 m", "", () => dispatchAction(CMD.TP_FORWARD, 25, [0, 0, 0], "")), A("Forward 100 m", "", () => dispatchAction(CMD.TP_FORWARD, 100, [0, 0, 0], "")),
        A("Forward 500 m", "", () => dispatchAction(CMD.TP_FORWARD, 500, [0, 0, 0], "")), A("Back 25 m", "", () => dispatchAction(CMD.TP_FORWARD, -25, [0, 0, 0], "")),
        C("Ragdoll", "Fall over", CMD.RAGDOLL), C("Wanted: 5 stars", "Bring the heat", CMD.WANTED_MAX, 0, { danger: true })
      ] },
      { title: "People", head: null, items: PEDS.map((p) => A(p.label, p.note, () => dispatchAction(CMD.SPAWN_PED, p.mode, [0, 0, 0], p.model, "Spawning " + p.label), { tags: "ped spawn bodyguard " + p.model })) },
      { title: "Visual effects", items: [T("nightVision", "Night vision", "Green goggles"), T("thermalVision", "Thermal vision", "Heat view"), T("blackout", "Blackout", "Lights out"), T("slowmo", "Slow motion", "0.4x speed"), T("zeroGravity", "Zero gravity", "Float freely"), T("riot", "Riot mode", "Everyone fights")] }
    ] },
    { id: "mods", label: "Mods", ico: "mods", custom: true, sub: "Buttons added by the mods you switched on. Manage them from the title screen." },
    { id: "settings", label: "Settings", ico: "settings", custom: true, sub: "Display options, saved games and menu preferences." }
  ];

  // Flattened list used by global search
  const ALL_ITEMS = [];
  SECTIONS.forEach((s) => (s.groups || []).forEach((g) => g.items.forEach((it) => {
    if (it.t === "toggle" && ALL_ITEMS.some((x) => x.item.t === "toggle" && x.item.key === it.key)) return;
    ALL_ITEMS.push({ item: it, sec: s, group: g });
  })));
  PLACES.forEach((p) => ALL_ITEMS.push({ sec: SECTIONS.find((s) => s.id === "teleport"), group: { title: p.g },
    item: A(p.label, p.g, () => { teleportTo(p.label, p.coords); closeCheatMenu(); }, { tags: "teleport place " + p.g, go: true }) }));

  // ---------------------------------------------------------------- item rendering
  function renderItem(it) {
    if (it.t === "toggle") {
      const el = h("button", { class: "cm-tile" + (it.sm ? " sm" : "") + (toggles[it.key] ? " is-on" : ""), "data-tkey": it.key, role: "switch", "aria-checked": toggles[it.key] ? "true" : "false",
        onclick: () => dispatchToggle(it.key, it.label) },
        h("span", { class: "t" }, h("b", { text: it.label }), it.desc ? h("small", { text: it.desc }) : null), h("span", { class: "cm-onlabel", text: toggles[it.key] ? "ON" : "OFF" }), h("span", { class: "cm-sw" }));
      return el;
    }
    if (it.t === "action") {
      return h("button", { class: "cm-tile" + (it.danger ? " danger" : "") + (it.sm || !it.desc ? " sm" : ""), onclick: () => { it.run(); if (it.close) closeCheatMenu(); } },
        h("span", { class: "t" }, h("b", { text: it.label }), it.desc ? h("small", { text: it.desc }) : null));
    }
    if (it.t === "widget") return h("div", { class: "cm-wide", style: "grid-column:1/-1" }, it.render());
    return h("div");
  }

  function refreshToggleStates() {
    overlay.querySelectorAll("[data-tkey]").forEach((el) => {
      const on = !!toggles[el.dataset.tkey];
      el.classList.toggle("is-on", on);
      el.setAttribute("aria-checked", on ? "true" : "false");
      const lab = el.querySelector(".cm-onlabel");
      if (lab) lab.textContent = on ? "ON" : "OFF";
    });
    let total = 0;
    SECTIONS.forEach((s) => {
      const keys = new Set();
      (s.groups || []).forEach((g) => g.items.forEach((it) => { if (it.t === "toggle") keys.add(it.key); }));
      let n = 0;
      keys.forEach((k) => { if (toggles[k]) n++; });
      const badge = navEl.querySelector('[data-count="' + s.id + '"]');
      if (badge) { badge.textContent = n; badge.classList.toggle("on", n > 0); }
    });
    for (const k of Object.keys(toggles)) if (toggles[k]) total++;
    $("#cm-active-count").textContent = total ? total + " toggle" + (total === 1 ? "" : "s") + " active" : "No toggles active";
  }

  function group(title, body, headBtn) {
    return h("section", { class: "cm-group" }, h("div", { class: "cm-gt" }, h("span", { text: title }), headBtn || null), body);
  }

  function renderGroups(sec) {
    const frag = document.createDocumentFragment();
    sec.groups.forEach((g) => {
      const items = g.items;
      const hasWidgetOnly = items.every((i) => i.t === "widget");
      const body = hasWidgetOnly ? h("div", {}, items.map(renderItem)) : h("div", { class: "cm-grid" + (g.cls === "tight" ? " tight" : "") }, items.map(renderItem));
      let headBtn = null;
      if (g.head) headBtn = h("button", { text: g.head.label, onclick: g.head.run });
      frag.appendChild(group(g.title, body, headBtn));
    });
    return frag;
  }

  // ---------------------------------------------------------------- custom sections
  let spCat = null, spLimit = 90;
  function vehCard(v) {
    return h("button", { class: "cm-tile sm", onclick: () => { dispatchAction(CMD.SPAWN_VEHICLE, v.styleId || 0, [0, 0, 0], v.model, "Spawning " + v.label); closeCheatMenu(); } },
      h("span", { class: "t" }, h("b", { text: v.label }), v.desc ? h("small", { text: v.desc }) : null), h("span", { class: "cm-vehbadge", text: v.model }));
  }
  function renderSpawner(frag) {
    const quick = [
      ["Police DZ", "police", 1], ["Gendarmerie 4x4", "sheriff2", 2], ["Renault Symbol", "premier", 7], ["Toyota Hilux DZ", "rebel2", 11], ["Hamoud truck", "mule", 12],
      ["Adder", "adder"], ["Zentorno", "zentorno"], ["T20", "t20"], ["Rhino tank", "rhino"], ["Buzzard", "buzzard"], ["Lazer jet", "lazer"], ["Bati 801", "bati"], ["BMX", "bmx"], ["Seashark", "seashark"]
    ];
    frag.appendChild(group("Favourites", h("div", { class: "cm-row" }, quick.map(([l, m, s]) => h("button", { class: "cm-pill", text: l,
      onclick: () => { dispatchAction(CMD.SPAWN_VEHICLE, s || 0, [0, 0, 0], m, "Spawning " + l); closeCheatMenu(); } })))));
    if (!spCat) spCat = VEHICLE_CATEGORIES.length ? VEHICLE_CATEGORIES[0].id : "";
    const pills = h("div", { class: "cm-row" }, VEHICLE_CATEGORIES.map((c) => h("button", { class: "cm-pill" + (c.id === spCat ? " sel" : ""), onclick: () => { spCat = c.id; spLimit = 90; renderMain(); } },
      c.title, h("small", { text: String(VEHICLES.filter((v) => v.cat === c.id).length) }))));
    frag.appendChild(group("Categories", pills));
    const list = VEHICLES.filter((v) => v.cat === spCat);
    const cur = VEHICLE_CATEGORIES.find((c) => c.id === spCat);
    const grid = h("div", { class: "cm-grid" }, list.slice(0, spLimit).map(vehCard));
    const body = h("div", {}, grid);
    if (list.length > spLimit) body.appendChild(h("button", { class: "cm-btn cm-more", text: "Show more (" + (list.length - spLimit) + " left)", onclick: () => { spLimit += 120; renderMain(); } }));
    frag.appendChild(group((cur ? cur.title : "Vehicles") + " (" + list.length + ")", body));
  }

  const SKIN_CATS = [["Animals", "Animals"], ["Protagonists", "Protagonists"], ["Story", "Story cast"], ["Services", "Services"], ["Gangs", "Gangs"], ["Special", "Special"], ["Civilians", "Civilians"]];
  let skCat = "Protagonists", skSub = "All", skLimit = 120;
  function renderSkins(frag) {
    frag.appendChild(group("Category", h("div", { class: "cm-row" }, SKIN_CATS.map(([id, label]) => h("button", { class: "cm-pill" + (id === skCat ? " sel" : ""),
      onclick: () => { skCat = id; skSub = "All"; skLimit = 120; renderMain(); } }, label, h("small", { text: String(SKINS.filter((s) => s.cat === id).length) }))))));
    const inCat = SKINS.filter((s) => s.cat === skCat);
    const subs = Array.from(new Set(inCat.map((s) => s.sub)));
    if (subs.length > 1) {
      frag.appendChild(group("Subcategory", h("div", { class: "cm-row" }, ["All"].concat(subs).map((sb) => h("button", { class: "cm-pill" + (sb === skSub ? " sel" : ""), text: sb,
        onclick: () => { skSub = sb; skLimit = 120; renderMain(); } })))));
    }
    const list = inCat.filter((s) => skSub === "All" || s.sub === skSub);
    const body = h("div", {}, h("div", { class: "cm-grid tight" }, list.slice(0, skLimit).map(skinCard)));
    if (list.length > skLimit) body.appendChild(h("button", { class: "cm-btn cm-more", text: "Show more (" + (list.length - skLimit) + " left)", onclick: () => { skLimit += 150; renderMain(); } }));
    frag.appendChild(group("Skins (" + list.length + ")", body));
  }
  function skinCard(s) {
    return h("button", { class: "cm-tile sm", onclick: () => dispatchAction(CMD.SPAWN_SKIN, 0, [0, 0, 0], s.model, "Applying " + s.label) },
      h("span", { class: "t" }, h("b", { text: s.label }), h("small", { text: s.sub || s.cat })));
  }

  const COMPS = [
    { id: 11, name: "Top and jackets", clear: 4 }, { id: 8, name: "Undershirt", clear: 4 }, { id: 4, name: "Legs" }, { id: 6, name: "Shoes", clear: 10 }, { id: 2, name: "Hair" },
    { id: 1, name: "Mask", clear: 11 }, { id: 9, name: "Body armour", clear: 12 }, { id: 3, name: "Torso and arms" }, { id: 5, name: "Bags and parachute", clear: 13 }, { id: 7, name: "Accessories", clear: 14 },
    { id: 10, name: "Decals" }, { id: 0, name: "Head" }
  ];
  const PROPS = [{ id: 0, name: "Hats and helmets" }, { id: 1, name: "Glasses" }, { id: 2, name: "Ear items" }, { id: 6, name: "Watches" }, { id: 7, name: "Bracelets" }];
  let wardEls = { comps: {}, props: {} };

  function stepper(label, onPrev, onNext, onSlide, slider0) {
    const slider = h("input", { type: "range", min: String(slider0.min), max: String(slider0.max), value: String(slider0.val) });
    const val = h("span", { class: "v", text: slider0.text });
    slider.addEventListener("input", () => { onSlide(parseInt(slider.value, 10) || 0); });
    return { slider, val, row: h("div", { class: "cm-slider" }, h("span", { style: "width:46px;color:var(--muted);font-size:12.5px;font-weight:700", text: label }),
      h("button", { class: "cm-step", onclick: onPrev, "aria-label": "Previous" }, icon("left", 16)), slider, h("button", { class: "cm-step", onclick: onNext, "aria-label": "Next" }, icon("right", 16)), val) };
  }

  function renderWardrobe(frag) {
    wardEls = { comps: {}, props: {} };
    frag.appendChild(group("Outfit presets", h("div", { class: "cm-grid tight" }, [
      A("Bare torso", "Remove shirt", () => customizeComponent(11, 4, "Bare torso")), A("Underwear", "Boxers only", () => customizeComponent(4, 5, "Underwear")),
      A("Barefoot", "No shoes", () => customizeComponent(6, 10, "Barefoot")), A("Beach look", "Swimwear", () => { customizeComponent(11, 4, "Bare torso"); customizeComponent(4, 5, "Boxers"); customizeComponent(6, 10, "Barefoot"); }),
      A("Put shirt on", "Default top", () => customizeComponent(11, 9, "Shirt on")), A("Random outfit", "Surprise me", () => customizeComponent(0, 6, "Random outfit")),
      A("Reset clothes", "Back to default", () => customizeComponent(0, 7, "Reset clothes")), A("Clear all props", "Hats, glasses, watches", () => customizeProp(0, 5, "Clear props"), { danger: true })
    ].map(renderItem))));
    const compGrid = h("div", { class: "cm-grid wide" });
    COMPS.forEach((c) => {
      const st = wardrobeState.comps[c.id] || { curDraw: 0, maxDraw: 1, curTex: 0, maxTex: 1 };
      const badge = h("span", { class: "cm-badge", text: "#" + st.curDraw + " / " + Math.max(0, st.maxDraw - 1) });
      const draw = stepper("Style",
        () => { const s = wardrobeState.comps[c.id] || st; setComponentDrawable(c.id, s.maxDraw > 0 ? (s.curDraw - 1 + s.maxDraw) % s.maxDraw : 0, c.name); },
        () => { const s = wardrobeState.comps[c.id] || st; setComponentDrawable(c.id, s.maxDraw > 0 ? (s.curDraw + 1) % s.maxDraw : 0, c.name); },
        (v) => setComponentDrawable(c.id, v, c.name), { min: 0, max: Math.max(0, st.maxDraw - 1), val: Math.max(0, st.curDraw), text: "#" + st.curDraw });
      const tex = stepper("Colour",
        () => { const s = wardrobeState.comps[c.id] || st; setComponentTexture(c.id, s.maxTex > 0 ? (s.curTex - 1 + s.maxTex) % s.maxTex : 0, c.name); },
        () => { const s = wardrobeState.comps[c.id] || st; setComponentTexture(c.id, s.maxTex > 0 ? (s.curTex + 1) % s.maxTex : 0, c.name); },
        (v) => setComponentTexture(c.id, v, c.name), { min: 0, max: Math.max(0, st.maxTex - 1), val: Math.max(0, st.curTex), text: "#" + st.curTex });
      wardEls.comps[c.id] = { badge, draw, tex };
      compGrid.appendChild(h("div", { class: "cm-wcard" }, h("header", {}, h("b", { text: c.name }), h("span", { class: "cm-row" }, badge, c.clear ? h("button", { class: "cm-btn sm", text: "Remove", onclick: () => customizeComponent(c.id, c.clear, c.name) }) : null)), draw.row, tex.row));
    });
    frag.appendChild(group("Clothing", compGrid));
    const propGrid = h("div", { class: "cm-grid wide" });
    PROPS.forEach((p) => {
      const st = wardrobeState.props[p.id] || { curProp: -1, maxProp: 1, curTex: 0, maxTex: 1 };
      const txt = (s) => (s.curProp < 0 ? "None" : "#" + s.curProp);
      const badge = h("span", { class: "cm-badge", text: txt(st) });
      const style = stepper("Style",
        () => customizeProp(p.id, 2, p.name), () => customizeProp(p.id, 1, p.name), (v) => setPropIndex(p.id, v, p.name),
        { min: -1, max: Math.max(0, st.maxProp - 1), val: st.curProp, text: txt(st) });
      const tex = stepper("Colour", () => customizeProp(p.id, 3, p.name), () => customizeProp(p.id, 3, p.name), (v) => setPropTexture(p.id, v, p.name),
        { min: 0, max: Math.max(0, st.maxTex - 1), val: Math.max(0, st.curTex), text: "#" + st.curTex });
      wardEls.props[p.id] = { badge, style, tex };
      propGrid.appendChild(h("div", { class: "cm-wcard" }, h("header", {}, h("b", { text: p.name }), h("span", { class: "cm-row" }, badge, h("button", { class: "cm-btn sm", text: "Remove", onclick: () => setPropIndex(p.id, -1, p.name) }))), style.row, tex.row));
    });
    frag.appendChild(group("Props", propGrid));
  }

  function updateWardrobeUI() {
    for (const id of Object.keys(wardEls.comps)) {
      const st = wardrobeState.comps[id], e = wardEls.comps[id];
      if (!st || !e) continue;
      e.badge.textContent = "#" + st.curDraw + " / " + Math.max(0, st.maxDraw - 1);
      e.draw.val.textContent = "#" + st.curDraw;
      if (document.activeElement !== e.draw.slider) { e.draw.slider.max = Math.max(0, st.maxDraw - 1); e.draw.slider.value = Math.max(0, st.curDraw); }
      e.tex.val.textContent = "#" + st.curTex;
      if (document.activeElement !== e.tex.slider) { e.tex.slider.max = Math.max(0, st.maxTex - 1); e.tex.slider.value = Math.max(0, st.curTex); }
    }
    for (const id of Object.keys(wardEls.props)) {
      const st = wardrobeState.props[id], e = wardEls.props[id];
      if (!st || !e) continue;
      const t = st.curProp < 0 ? "None" : "#" + st.curProp;
      e.badge.textContent = t; e.style.val.textContent = t;
      if (document.activeElement !== e.style.slider) { e.style.slider.max = Math.max(0, st.maxProp - 1); e.style.slider.value = st.curProp; }
      e.tex.val.textContent = "#" + st.curTex;
      if (document.activeElement !== e.tex.slider) { e.tex.slider.max = Math.max(0, st.maxTex - 1); e.tex.slider.value = Math.max(0, st.curTex); }
    }
  }

  function renderTeleport(frag) {
    frag.appendChild(group("Quick moves", h("div", { class: "cm-grid tight" }, [
      A("Waypoint", "Teleport to your map marker", () => { dispatchAction(CMD.TELEPORT_WAYPOINT, 0, [0, 0, 0], ""); closeCheatMenu(); }),
      A("Forward 100 m", "", () => dispatchAction(CMD.TP_FORWARD, 100, [0, 0, 0], "")), A("Up 100 m", "", () => dispatchAction(CMD.TP_UP, 100, [0, 0, 0], "")),
      A("Nearest vehicle", "Get in the closest one", () => dispatchAction(CMD.HIJACK, 0, [0, 0, 0], ""))
    ].map(renderItem))));
    frag.appendChild(group("Coordinates and saved spot", wCoords()));
    const groups = Array.from(new Set(PLACES.map((p) => p.g)));
    groups.forEach((gn) => {
      frag.appendChild(group(gn, h("div", { class: "cm-grid tight" }, PLACES.filter((p) => p.g === gn).map((p) =>
        h("button", { class: "cm-tile sm", onclick: () => { teleportTo(p.label, p.coords); closeCheatMenu(); } }, h("span", { class: "t" }, h("b", { text: p.label })), h("span", { class: "go" }, icon("right", 15)))))));
    });
  }

  // Mods: every enabled mod that called GTAV.registerMod(id, { menu: [{ label, desc, run }] }) gets a group of buttons here.
  function renderModsSection(frag) {
    const G = window.GTAV, reg = (G && G._reg) || {}, ids = Object.keys(reg);
    const list = (G && G.mods) || [];
    const info = (id) => list.find((m) => m.id === id);
    let any = false;
    for (const id of ids) {
      const items = (reg[id] && Array.isArray(reg[id].menu)) ? reg[id].menu : [];
      if (!items.length) continue;
      any = true;
      const m = info(id);
      frag.appendChild(group(m ? m.name : id, h("div", { class: "cm-grid" }, items.map((it) => renderItem(A(String(it.label || "Mod action"), String(it.desc || ""),
        () => { try { it.run(); } catch (e) { showToast("Mod error: " + (e && e.message || e)); postLog("[page mod] " + id + " action failed: " + (e && e.message || e)); } }))))));
    }
    if (!any) frag.appendChild(h("div", { class: "cm-empty", text: ids.length ? "The mods that are on have no menu buttons." : "No mods are running. Turn mods on from the title screen (Mods), then start the game." }));
  }

  function renderSettings(frag) {
    const pill = (label, on, fn) => h("button", { class: "cm-pill" + (on ? " sel" : ""), text: label, onclick: fn });
    // One-click presets for this Mac (8 cores, 32 GB; the engine uses 2 cores). Each sets resolution, frame cap and graphics together; "Apply settings and reload game" below applies them.
    const PRESETS = [
      ["Performance", "Smoothest: 900p, 60 FPS cap, low textures and shadows", { res: "1600x900", fps: "60", low: "0", args: "-textureQuality=0,-shadowQuality=0,-reflectionQuality=0,-particleQuality=0,-grassQuality=0,-pedVariety=0,-vehicleVariety=0" }],
      ["Cool", "Coolest and quietest: 1080p, 30 FPS cap (about half the CPU of 60 FPS)", { res: "1920x1080", fps: "30", low: "0", args: "-textureQuality=1,-shadowQuality=1,-reflectionQuality=1" }],
      ["Balanced", "Recommended: 1080p, 60 FPS cap, medium graphics", { res: "1920x1080", fps: "60", low: "0", args: "-textureQuality=1,-shadowQuality=1,-reflectionQuality=1" }],
      ["Quality", "1080p, 60 FPS cap, high textures and shadows (heavier)", { res: "1920x1080", fps: "60", low: "0", args: "-textureQuality=2,-shadowQuality=2,-reflectionQuality=2" }],
    ];
    const presetOn = (v) => Object.keys(v).every((k) => String(profile[k] || "") === v[k]);
    frag.appendChild(group("Preset", h("div", {},
      h("div", { class: "cm-row" }, PRESETS.map(([l, , v]) => pill(l, presetOn(v), () => { Object.assign(profile, v, { cores: "2" }); renderMain(); }))),
      h("p", { class: "cm-note", text: (PRESETS.find(([, , v]) => presetOn(v)) || ["", "Custom: pick a preset or set each option below."])[1] }))));
    frag.appendChild(group("Resolution", h("div", { class: "cm-row" }, [["720p", "1280x720"], ["900p", "1600x900"], ["1080p", "1920x1080"], ["1440p", "2560x1440"]].map(([l, v]) => pill(l, profile.res === v, () => { profile.res = v; renderMain(); })))));
    frag.appendChild(group("Frame rate", h("div", { class: "cm-row" }, [["30 FPS", "30"], ["60 FPS", "60"], ["Uncapped", "0"]].map(([l, v]) => pill(l, profile.fps === v, () => { profile.fps = v; renderMain(); })))));
    frag.appendChild(group("Graphics", h("div", { class: "cm-row" }, [["Low", "1", ""], ["Balanced", "0", "-textureQuality=1,-shadowQuality=1,-reflectionQuality=1"], ["Ultra", "0", "-textureQuality=2,-shadowQuality=2,-reflectionQuality=2"]]
      .map(([l, low, args]) => pill(l, profile.low === low && profile.args === args, () => { profile.low = low; profile.args = args; renderMain(); })))));
    frag.appendChild(group("Speedometer", h("div", {},
      h("div", { class: "cm-row" },
        [["On", true], ["Off", false]].map(([l, v]) => pill(l, speedo.on === v, () => { speedo.on = v; saveSpeedo(); renderMain(); })),
        [["KM/H", "kmh"], ["MPH", "mph"]].map(([l, v]) => pill(l, speedo.unit === v, () => { speedo.unit = v; saveSpeedo(); renderMain(); }))),
      h("p", { class: "cm-note", text: "Shows your speed in the bottom right corner while you are in a car, bike, boat, helicopter or plane." }))));
    frag.appendChild(group("Diagnostics log", h("div", {},
      h("div", { class: "cm-row" }, [["On", "1"], ["Off (lightest)", "0"]].map(([l, v]) => pill(l, String(profile.log || "1") === v, () => { profile.log = v; renderMain(); }))),
      h("p", { class: "cm-note", text: "Writes fps, stutter and data-read lines to work/game-diagnostics.log every few seconds. Cheap; turn it off for the lightest run." }))));
    frag.appendChild(h("div", { class: "cm-row", style: "margin-bottom:26px" }, h("button", { class: "cm-btn primary", text: "Apply settings and reload game", onclick: async () => {
      try { await fetch("/local-profile.json", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) }); } catch (e) {}
      const params = new URLSearchParams(window.location.search);
      if (profile.res) params.set("res", profile.res);
      if (profile.fps) params.set("fps", profile.fps);
      if (profile.args) params.set("args", profile.args); else params.delete("args");
      if (profile.cores) params.set("cores", profile.cores);
      if (profile.log) params.set("log", profile.log);
      if (profile.low === "1") params.set("low", "1"); else params.delete("low");
      if (window.GTAV && window.GTAV.mode) { params.set("mode", window.GTAV.mode === "story" ? "story" : "sandbox"); if (window.GTAV.mode === "env_test") params.set("map", "env_test"); else params.delete("map"); }
      window.location.search = params.toString();
    } })));
    frag.appendChild(group("Saved game", h("div", { class: "cm-panelbox" },
      h("p", { class: "cm-note", style: "margin-top:0", text: "Story Mode saves itself every few minutes while you are free to roam (no mission, wanted level or cutscene). Saves are kept in the browser and mirrored to work/userdata on disk." }),
      h("div", { class: "cm-row" }, h("button", { class: "cm-btn primary", text: "Save game now", onclick: () => dispatchAction(CMD.SAVE_NOW, 0, [0, 0, 0], "", "Saving...") })))));
    frag.appendChild(group("Audio", h("div", { class: "cm-row" }, h("button", { class: "cm-btn", text: "Unmute / resume audio", onclick: async () => {
      if (window.__gtav_audio_ctx) { try { await window.__gtav_audio_ctx.resume(); } catch (e) {} } else if (window.__gtav_init_audio) { try { await window.__gtav_init_audio(); } catch (e) {} }
      showToast(window.__gtav_audio_ctx && window.__gtav_audio_ctx.state === "running" ? "Audio running" : "Audio requested");
    } }))));
    frag.appendChild(group("Shortcuts", h("div", { class: "cm-panelbox" }, h("p", { class: "cm-note", style: "margin:0", text: "Cmd+X (Ctrl+X), F4, ` or \\ opens and closes the menu. Cmd+S (Ctrl+S) or F9 saves the Story game. Esc closes it. / jumps to search. Opening the menu frees the mouse cursor; closing it hides the cursor and resumes mouse look automatically." }))));
  }

  // ---------------------------------------------------------------- search
  function renderSearch(frag, qs) {
    const toks = qs.toLowerCase().split(/\s+/).filter(Boolean);
    const hit = (s) => toks.every((t) => s.includes(t));
    const found = ALL_ITEMS.filter(({ item, sec, group: g }) => hit((item.label + " " + (item.desc || "") + " " + (item.tags || "") + " " + sec.label + " " + (g.title || "")).toLowerCase()));
    const wxs = WEATHERS.filter((w) => hit(("weather " + w.label).toLowerCase()));
    if (found.length || wxs.length) {
      const grid = h("div", { class: "cm-grid" });
      found.slice(0, 80).forEach(({ item }) => grid.appendChild(renderItem(item)));
      wxs.forEach((w) => grid.appendChild(renderItem(A(w.label, "Weather", () => { activeWeather = w.id; dispatchAction(CMD.WEATHER, 0, [0, 0, 0], w.id, "Weather: " + w.label); }))));
      frag.appendChild(group("Cheats (" + (found.length + wxs.length) + ")", grid));
    }
    const vs = VEHICLES.filter((v) => hit((v.label + " " + v.model + " " + (v.desc || "") + " " + (v.catTitle || v.cat || "")).toLowerCase()));
    if (vs.length) frag.appendChild(group("Vehicles (" + vs.length + ")", h("div", { class: "cm-grid" }, vs.slice(0, 60).map(vehCard))));
    const ss = SKINS.filter((s) => hit((s.label + " " + s.model + " " + s.cat + " " + (s.sub || "")).toLowerCase()));
    if (ss.length) frag.appendChild(group("Skins (" + ss.length + ")", h("div", { class: "cm-grid tight" }, ss.slice(0, 80).map(skinCard))));
    if (!found.length && !wxs.length && !vs.length && !ss.length) frag.appendChild(h("div", { class: "cm-empty", text: 'Nothing matches "' + qs + '"' }));
  }

  // ---------------------------------------------------------------- main render + nav
  function renderNav() {
    navEl.innerHTML = "";
    SECTIONS.forEach((s, i) => {
      if (i === 3 || i === 6 || i === 9) navEl.appendChild(h("div", { class: "cm-navsep" }));
      navEl.appendChild(h("button", { class: "cm-navbtn" + (!query && s.id === activeTab ? " active" : ""), "data-tab": s.id,
        onclick: () => { activeTab = s.id; try { localStorage.setItem("gtav_cm_tab", s.id); } catch (e) {} query = ""; qInput.value = ""; renderNav(); renderMain(); mainEl.scrollTop = 0; } },
        icon(s.ico, 19), h("span", { class: "l", text: s.label }), h("span", { class: "cm-count", "data-count": s.id, text: "0" })));
    });
    refreshToggleStates();
  }

  function renderMain() {
    const prevScroll = mainEl.scrollTop;
    mainEl.innerHTML = "";
    hourSlider = null; hourVal = null;
    const frag = document.createDocumentFragment();
    if (query) {
      frag.appendChild(h("h1", { class: "cm-h1", text: "Search" }));
      frag.appendChild(h("p", { class: "cm-sub", text: 'Results for "' + query + '" across cheats, vehicles, skins and places' }));
      renderSearch(frag, query);
    } else {
      const sec = SECTIONS.find((s) => s.id === activeTab) || SECTIONS[0];
      frag.appendChild(h("h1", { class: "cm-h1", text: sec.label }));
      frag.appendChild(h("p", { class: "cm-sub", text: sec.sub || "" }));
      if (sec.id === "spawner") renderSpawner(frag);
      else if (sec.id === "skins") renderSkins(frag);
      else if (sec.id === "wardrobe") renderWardrobe(frag);
      else if (sec.id === "teleport") renderTeleport(frag);
      else if (sec.id === "mods") renderModsSection(frag);
      else if (sec.id === "settings") renderSettings(frag);
      else frag.appendChild(renderGroups(sec));
    }
    mainEl.appendChild(frag);
    mainEl.scrollTop = prevScroll;
    refreshToggleStates();
    updateLive();
  }

  let searchTimer = null;
  qInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { query = qInput.value.trim(); renderNav(); mainEl.scrollTop = 0; renderMain(); }, 120);
  });
  $("#cm-reset").addEventListener("click", resetAllToggles);

  // ---------------------------------------------------------------- open / close, cursor handling
  function getCanvas() { return document.getElementById("canvas") || document.querySelector("canvas"); }

  // Re-acquire pointer lock so mouse look resumes without a click. Called from a key/click handler, so the browser still sees a user gesture.
  function relockPointer() {
    const c = getCanvas();
    if (!c) return;
    const attempt = (retry) => {
      if (isOpen || document.pointerLockElement === c) return;
      const fail = () => { if (retry) setTimeout(() => attempt(false), 140); else postLog("[cheats] pointer re-lock refused (click the game once)"); };
      try {
        const p = c.requestPointerLock({ unadjustedMovement: true });
        if (p && p.catch) p.catch(() => {
          try { const p2 = c.requestPointerLock(); if (p2 && p2.catch) p2.catch(fail); } catch (e) { fail(); }
        });
      } catch (e) {
        try { c.requestPointerLock(); } catch (e2) { fail(); }
      }
    };
    attempt(true);
    try { if (navigator.keyboard && navigator.keyboard.lock) navigator.keyboard.lock(["KeyW", "KeyQ", "KeyX", "Escape", "Tab"]).catch(() => {}); } catch (e) {}
  }

  document.addEventListener("pointerlockchange", () => {
    if (performance.now() - lastClosedAt < 3000) postLog("[cheats] pointer lock " + (document.pointerLockElement ? "on" : "off") + " after menu close");
  });
  let lastClosedAt = -1e9;

  function openCheatMenu() {
    if (isOpen) return;
    isOpen = true;
    window.__gtav_cheat_menu_open = true;
    wakeAudio();
    if (window.__gtav_isolate_input) window.__gtav_isolate_input(true);   // releases keys, buttons and pointer lock in the page
    try { if (document.exitPointerLock && document.pointerLockElement) document.exitPointerLock(); } catch (e) {}
    query = ""; qInput.value = "";
    overlay.classList.add("visible");
    renderNav();
    renderMain();
    updateStatus();
    updateLive();
    postLog("[cheats] menu opened");
  }

  function closeCheatMenu() {
    if (!isOpen) return;
    isOpen = false;
    window.__gtav_cheat_menu_open = false;
    lastClosedAt = performance.now();
    overlay.classList.remove("visible");
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    if (window.__gtav_isolate_input) window.__gtav_isolate_input(false);
    relockPointer();
    postLog("[cheats] menu closed");
  }

  function toggleCheatMenu() {
    if (isOpen) closeCheatMenu(); else openCheatMenu();
  }

  $("#cm-close").addEventListener("click", (e) => { e.stopPropagation(); closeCheatMenu(); });
  overlay.addEventListener("mousedown", (e) => { if (e.target === overlay) closeCheatMenu(); });

  let lastToggleTime = 0;
  const handleKey = (e) => {
    if ((e.metaKey || e.ctrlKey) && (e.code === "KeyW" || e.code === "KeyQ")) {
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      return;
    }
    if (e.repeat) return;
    const k = (e.key || "").toLowerCase();
    const isCmdX = (e.metaKey || e.ctrlKey) && (e.code === "KeyX" || k === "x" || e.keyCode === 88);
    const isF4 = e.code === "F4" || e.key === "F4";
    const isF8 = e.code === "F8" || e.key === "F8";
    const isTilde = e.code === "Backquote" || e.key === "`" || e.key === "~";
    const isBackslash = e.code === "Backslash" || e.key === "\\";
    const inField = e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA");
    // Save the Story game: Cmd+S / Ctrl+S or F9 (the browser's own "save page" is suppressed). The trainer queues the save if the game cannot save right now.
    if (!inField && (((e.metaKey || e.ctrlKey) && (e.code === "KeyS" || k === "s")) || e.code === "F9")) {
      e.preventDefault(); e.stopImmediatePropagation();
      dispatchAction(CMD.SAVE_NOW, 0, [0, 0, 0], "", "");
      return;
    }

    if (isOpen && inField && !isCmdX && e.code !== "Escape" && !isF4 && !isF8) return;   // typing in a field

    if (isCmdX || isF4 || isF8 || isTilde || isBackslash) {
      const now = performance.now();
      if (now - lastToggleTime < 250) return;
      lastToggleTime = now;
      e.preventDefault();
      e.stopImmediatePropagation();
      toggleCheatMenu();
      return;
    }
    if (isOpen && e.code === "Escape") {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (query || qInput.value) { qInput.value = ""; query = ""; qInput.blur(); renderNav(); renderMain(); return; }
      closeCheatMenu();
      return;
    }
    if (isOpen && !inField && e.key === "/") {
      e.preventDefault();
      qInput.focus();
      qInput.select();
    }
  };
  window.addEventListener("keydown", handleKey, { capture: true });

  if (window.GTAV) { window.GTAV.commands = CMD; window.GTAV._dispatch = dispatchAction; window.GTAV._toast = showToast; }
  window.__gtav_open_cheats = openCheatMenu;
  window.__gtav_close_cheats = closeCheatMenu;
  window.__gtav_toggle_cheats = toggleCheatMenu;

  renderNav();
  console.log("[cheats] GTA V trainer menu loaded. Shortcut: Cmd+X or Ctrl+X");
})();
