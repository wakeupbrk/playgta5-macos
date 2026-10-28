# Generator for cheats.js and game.js updates
import os

CHEATS_CODE = r"""// GTA V Desktop In-Game Cheat & Customization Menu
// Ported from iOS SandboxApp.swift with native rage::scrThread::Wait bridge
// Bound to Command+X (⌘X). Silent, instantaneous, zero-latency execution.

(function() {
  if (window.__gtav_cheats_installed) return;
  window.__gtav_cheats_installed = true;
  window.__gtav_cheat_menu_open = false;

  const VEHICLES = [
    { label: "Adder", model: "adder" },
    { label: "Zentorno", model: "zentorno" },
    { label: "T20", model: "t20" },
    { label: "Turismo R", model: "turismor" },
    { label: "Entity XF", model: "entityxf" },
    { label: "Infernus", model: "infernus" },
    { label: "Kuruma", model: "kuruma2" },
    { label: "Insurgent", model: "insurgent" },
    { label: "Police", model: "police3" },
    { label: "Rhino Tank", model: "rhino" },
    { label: "Bati 801", model: "bati" },
    { label: "Sanchez", model: "sanchez" },
    { label: "Faggio", model: "faggio2" },
    { label: "BMX", model: "bmx" },
    { label: "Monster", model: "monster" },
    { label: "Dune", model: "dune" },
    { label: "Buzzard", model: "buzzard" },
    { label: "Frogger", model: "frogger" },
    { label: "Duster", model: "duster" },
    { label: "Mallard", model: "stunt" },
    { label: "Speedo", model: "speedo" },
    { label: "Bus", model: "bus" },
    { label: "Osiris", model: "osiris" },
    { label: "Cheetah", model: "cheetah" },
    { label: "Vacca", model: "vacca" },
    { label: "Bullet", model: "bullet" },
    { label: "Banshee", model: "banshee" },
    { label: "Comet", model: "comet2" },
    { label: "Carbonizzare", model: "carbonizzare" },
    { label: "Elegy", model: "elegy2" },
    { label: "Sultan", model: "sultan" },
    { label: "Dominator", model: "dominator" },
    { label: "Gauntlet", model: "gauntlet" },
    { label: "Sabre", model: "sabregt" },
    { label: "Baller", model: "baller" },
    { label: "Mesa", model: "mesa" },
    { label: "Hakuchou", model: "hakuchou" },
    { label: "Akuma", model: "akuma" },
    { label: "PCJ 600", model: "pcj" },
    { label: "Police bike", model: "policeb" },
    { label: "FBI", model: "fbi" },
    { label: "Ambulance", model: "ambulance" },
    { label: "Fire truck", model: "firetruk" },
    { label: "Barracks", model: "barracks" },
    { label: "Annihilator", model: "annihilator" },
    { label: "Maverick", model: "maverick" },
    { label: "Cargobob", model: "cargobob" },
    { label: "Luxor", model: "luxor" },
    { label: "Jetmax", model: "jetmax" },
    { label: "Seashark", model: "seashark" },
    { label: "Submarine", model: "submersible" },
    { label: "Tractor", model: "tractor2" },
    { label: "Golf cart", model: "caddy" }
  ];

  const SKINS = [
    { label: "Michael", model: "player_zero" },
    { label: "Franklin", model: "player_one" },
    { label: "Trevor", model: "player_two" },
    { label: "Cop", model: "s_m_y_cop_01" },
    { label: "SWAT", model: "s_m_y_swat_01" },
    { label: "Marine", model: "s_m_y_marine_03" },
    { label: "Fireman", model: "s_m_y_fireman_01" },
    { label: "Paramedic", model: "s_m_m_paramedic_01" },
    { label: "Alien", model: "s_m_m_movalien_01" },
    { label: "Astronaut", model: "s_m_m_movspace_01" },
    { label: "Clown", model: "s_m_y_clown_01" },
    { label: "Mime", model: "s_m_y_mime" },
    { label: "Zombie", model: "u_m_y_zombie_01" },
    { label: "Pogo", model: "u_m_y_pogo_01" },
    { label: "Impotent Rage", model: "u_m_y_imporage" },
    { label: "Business", model: "a_m_y_business_01" },
    { label: "Skater", model: "a_m_y_skater_01" },
    { label: "Beach", model: "a_f_y_beach_01" },
    { label: "Hipster", model: "a_m_y_hipster_01" },
    { label: "Hillbilly", model: "a_m_m_hillbilly_01" }
  ];

  const PLACES = [
    { label: "Michael's house", coords: "-813,179,72.2" },
    { label: "Franklin's house", coords: "7.9,548,175.5" },
    { label: "Trevor's trailer", coords: "1985,3812,32.2" },
    { label: "Maze Bank roof", coords: "-75,-818,326.2" },
    { label: "Mount Chiliad", coords: "501,5604,797.9" },
    { label: "LS Airport", coords: "-1336,-3044,13.9" },
    { label: "Fort Zancudo", coords: "-2047,3132,32.8" },
    { label: "Sandy Shores", coords: "1747,3273,41.1" },
    { label: "Paleto Bay", coords: "-275,6635,7.4" },
    { label: "Vinewood sign", coords: "711,1198,348.5" },
    { label: "Del Perro Pier", coords: "-1850,-1231,13" },
    { label: "Legion Square", coords: "195,-934,30.7" },
    { label: "Humane Labs", coords: "3617,3739,28.7" },
    { label: "Vespucci Beach", coords: "-1223,-1491,4.4" },
    { label: "Mount Gordo", coords: "2877,5911,369" },
    { label: "Grove Street", coords: "-60,-1817,26.7" }
  ];

  const WEATHERS = [
    { label: "Extra sunny", id: "EXTRASUNNY" },
    { label: "Clear", id: "CLEAR" },
    { label: "Clouds", id: "CLOUDS" },
    { label: "Rain", id: "RAIN" },
    { label: "Thunder", id: "THUNDER" },
    { label: "Fog", id: "FOGGY" },
    { label: "Snow", id: "XMAS" },
    { label: "Halloween", id: "HALLOWEEN" }
  ];

  const TIMES = [
    { label: "Dawn", hour: 6, sub: "06:00" },
    { label: "Noon", hour: 12, sub: "12:00" },
    { label: "Sunset", hour: 19, sub: "19:00" },
    { label: "Midnight", hour: 0, sub: "00:00" }
  ];

  const toggles = {
    god: false,
    neverWanted: false,
    infiniteAmmo: false,
    superJump: false,
    fastRun: false,
    noRagdoll: false,
    explosiveAmmo: false,
    fireAmmo: false,
    explosiveMelee: false,
    slowmo: false,
    invisible: false,
    stamina: false,
    vehicleGod: false,
    freezeTime: false,
    noTraffic: false,
    riot: false,
    moonGravity: false
  };

  let activeTab = 0;
  let isOpen = false;
  let trainerHooked = false;
  let currentWanted = 0;
  let inVehicle = false;

  const trainerBc = new BroadcastChannel("gtav-trainer");
  trainerBc.onmessage = (ev) => {
    const d = ev.data;
    if (!d) return;
    if (d.type === "trainer_state") {
      trainerHooked = !!d.hooked;
      inVehicle = !!d.inVehicle;
      currentWanted = d.wanted | 0;
      if (d.toggles) {
        Object.assign(toggles, d.toggles);
      }
      updateStatusBadge();
    } else if (d.type === "toast") {
      showToast(d.text);
    }
  };

  // Toast Notification
  const toastEl = document.createElement("div");
  toastEl.id = "cheat-toast";
  document.body.appendChild(toastEl);
  let toastTimer = null;

  function showToast(msg) {
    if (!msg) return;
    toastEl.textContent = msg;
    toastEl.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove("visible");
    }, 1800);
  }

  function dispatchAction(cmd, payload) {
    const msg = Object.assign({ type: "action", cmd: cmd }, payload || {});
    fetch("/log", { method: "POST", body: "[cheats] dispatchAction: " + cmd + " " + JSON.stringify(payload || {}) }).catch(()=>{});
    trainerBc.postMessage(msg);
  }

  function dispatchToggle(key, label) {
    toggles[key] = !toggles[key];
    if (key === "explosiveAmmo" && toggles[key]) toggles.fireAmmo = false;
    if (key === "fireAmmo" && toggles[key]) toggles.explosiveAmmo = false;
    fetch("/log", { method: "POST", body: "[cheats] dispatchToggle: " + key + " = " + toggles[key] }).catch(()=>{});
    trainerBc.postMessage({ type: "toggle", cheat: key, val: toggles[key] });
    showToast(label + " " + (toggles[key] ? "ON" : "OFF"));
    renderContent();
  }

  // Load current settings profile
  let profile = { res: "1920x1080", fps: "60", low: "0", args: "" };
  fetch("/local-profile.json", { cache: "no-store" })
    .then(r => r.ok ? r.json() : {})
    .then(p => { Object.assign(profile, p); })
    .catch(() => {});

  // Build UI Elements
  const overlay = document.createElement("div");
  overlay.id = "cheat-overlay";
  overlay.innerHTML = `
    <style>
      #cheat-toast {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-20px);
        background: rgba(18, 18, 22, 0.92);
        color: #f5f5f7;
        font: 700 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Chalet", sans-serif;
        padding: 8px 18px;
        border-radius: 9999px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
        pointer-events: none;
        opacity: 0;
        transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s ease;
        z-index: 100000;
      }
      #cheat-toast.visible {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }

      #cheat-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.38);
        z-index: 99999;
        display: none !important;
        pointer-events: none !important;
        opacity: 0;
        transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        align-items: center;
        justify-content: flex-end;
        padding-right: 28px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Chalet", Helvetica, Arial, sans-serif;
        user-select: none;
      }
      #cheat-overlay.visible {
        display: flex !important;
        opacity: 1;
        pointer-events: auto !important;
      }

      #cheat-card {
        width: 480px;
        max-height: calc(100vh - 48px);
        background: rgba(18, 18, 22, 0.88);
        -webkit-backdrop-filter: blur(28px);
        backdrop-filter: blur(28px);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 20px;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.75);
        color: #fff;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: cheatSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes cheatSlideIn {
        from { transform: translateX(36px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }

      #cheat-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      #cheat-title {
        font-size: 17px;
        font-weight: 900;
        letter-spacing: 0.6px;
        color: #fff;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      #cheat-header-right {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      #cheat-status-badge {
        font-size: 11px;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 9999px;
        background: rgba(255, 255, 255, 0.08);
        color: #ff9f0a;
        transition: color 0.2s ease, background 0.2s ease;
      }
      #cheat-status-badge.live {
        color: #30d158;
        background: rgba(48, 209, 88, 0.12);
      }
      #cheat-close-btn {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.12);
        border: none;
        color: #ccc;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s ease, color 0.15s ease;
      }
      #cheat-close-btn:hover {
        background: rgba(255, 255, 255, 0.22);
        color: #fff;
      }

      /* Segmented Tabs */
      #cheat-tabs {
        display: flex;
        background: rgba(0, 0, 0, 0.28);
        padding: 4px;
        margin: 12px 18px 8px;
        border-radius: 12px;
        gap: 3px;
      }
      .cheat-tab-btn {
        flex: 1;
        padding: 7px 0;
        background: transparent;
        border: none;
        border-radius: 9px;
        color: rgba(255, 255, 255, 0.65);
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.16s ease;
        text-align: center;
      }
      .cheat-tab-btn:hover {
        color: #fff;
      }
      .cheat-tab-btn.active {
        background: rgba(255, 255, 255, 0.15);
        color: #fff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
      }

      #cheat-scroll {
        flex: 1;
        overflow-y: auto;
        padding: 10px 18px 20px;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      #cheat-scroll::-webkit-scrollbar {
        width: 5px;
      }
      #cheat-scroll::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.16);
        border-radius: 4px;
      }

      .cheat-section-title {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.8px;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.45);
        margin-top: 4px;
      }

      /* Action Grid */
      .cheat-grid-chips {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(134px, 1fr));
        gap: 8px;
      }
      .cheat-chip {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 10px;
        padding: 9px 12px;
        color: #fff;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        text-align: center;
        transition: all 0.14s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 40px;
      }
      .cheat-chip:hover {
        background: rgba(255, 255, 255, 0.16);
        border-color: rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
      }
      .cheat-chip:active {
        transform: translateY(0);
        background: rgba(255, 255, 255, 0.24);
      }
      .cheat-chip.active {
        background: rgba(48, 209, 88, 0.2);
        border-color: #30d158;
        color: #30d158;
      }
      .cheat-chip-sub {
        font-size: 10px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.45);
        margin-top: 2px;
      }

      /* Toggle Grid */
      .cheat-grid-toggles {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      .cheat-toggle-card {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 10px;
        padding: 10px 12px;
        color: #fff;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
        transition: all 0.14s ease;
      }
      .cheat-toggle-card:hover {
        background: rgba(255, 255, 255, 0.14);
      }
      .cheat-toggle-card.active {
        background: rgba(48, 209, 88, 0.16);
        border-color: rgba(48, 209, 88, 0.35);
      }
      .cheat-toggle-indicator {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 1.5px solid rgba(255, 255, 255, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        color: transparent;
        transition: all 0.16s ease;
      }
      .cheat-toggle-card.active .cheat-toggle-indicator {
        background: #30d158;
        border-color: #30d158;
        color: #000;
        font-weight: 900;
      }

      /* Reload button */
      .cheat-reload-btn {
        margin-top: 12px;
        padding: 12px;
        background: #0a84ff;
        border: none;
        border-radius: 12px;
        color: #fff;
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
        transition: background 0.15s ease, transform 0.15s ease;
        text-align: center;
      }
      .cheat-reload-btn:hover {
        background: #0071e3;
        transform: translateY(-1px);
      }
    </style>
    <div id="cheat-card">
      <div id="cheat-header">
        <div id="cheat-title">SANDBOX MENU</div>
        <div id="cheat-header-right">
          <div id="cheat-status-badge">○ Trainer starting…</div>
          <button id="cheat-close-btn" title="Close (⌘X or Esc)">✕</button>
        </div>
      </div>
      <div id="cheat-tabs">
        <button class="cheat-tab-btn active" data-tab="0">Player</button>
        <button class="cheat-tab-btn" data-tab="1">Vehicles</button>
        <button class="cheat-tab-btn" data-tab="2">Skins</button>
        <button class="cheat-tab-btn" data-tab="3">World</button>
        <button class="cheat-tab-btn" data-tab="4">Settings</button>
      </div>
      <div id="cheat-scroll"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const statusBadge = document.getElementById("cheat-status-badge");
  const scrollContainer = document.getElementById("cheat-scroll");
  const closeBtn = document.getElementById("cheat-close-btn");

  function updateStatusBadge() {
    if (trainerHooked) {
      statusBadge.textContent = "● Trainer live";
      statusBadge.className = "live";
    } else {
      statusBadge.textContent = "○ Trainer starting…";
      statusBadge.className = "";
    }
  }

  // Render content based on activeTab
  function renderContent() {
    scrollContainer.innerHTML = "";

    if (activeTab === 0) {
      // --- PLAYER TAB ---
      const actionsTitle = document.createElement("div");
      actionsTitle.className = "cheat-section-title";
      actionsTitle.textContent = "Instant Actions";
      scrollContainer.appendChild(actionsTitle);

      const actionsGrid = document.createElement("div");
      actionsGrid.className = "cheat-grid-chips";
      const playerActions = [
        { label: "Heal + armour", cmd: "heal" },
        { label: "All weapons", cmd: "weapons" },
        { label: "Max money ($999M)", cmd: "money" },
        { label: "Clear wanted", cmd: "clear" },
        { label: "Wanted +1", cmd: "wanted" },
        { label: "5 stars", cmd: "wanted_max" },
        { label: "Teleport to waypoint", cmd: "teleport_waypoint" }
      ];
      playerActions.forEach(a => {
        const chip = document.createElement("button");
        chip.className = "cheat-chip";
        chip.textContent = a.label;
        chip.onclick = () => dispatchAction(a.cmd);
        actionsGrid.appendChild(chip);
      });
      scrollContainer.appendChild(actionsGrid);

      const togglesTitle = document.createElement("div");
      togglesTitle.className = "cheat-section-title";
      togglesTitle.textContent = "Player Toggles";
      scrollContainer.appendChild(togglesTitle);

      const togglesGrid = document.createElement("div");
      togglesGrid.className = "cheat-grid-toggles";
      const playerToggles = [
        { label: "God mode", key: "god" },
        { label: "Never wanted", key: "neverWanted" },
        { label: "Infinite ammo", key: "infiniteAmmo" },
        { label: "Super jump", key: "superJump" },
        { label: "Fast run", key: "fastRun" },
        { label: "No ragdoll", key: "noRagdoll" },
        { label: "Explosive ammo", key: "explosiveAmmo" },
        { label: "Fire ammo", key: "fireAmmo" },
        { label: "Explosive punch", key: "explosiveMelee" },
        { label: "Slow motion", key: "slowmo" },
        { label: "Invisible", key: "invisible" },
        { label: "Unlimited stamina", key: "stamina" }
      ];
      playerToggles.forEach(t => {
        const card = document.createElement("div");
        card.className = "cheat-toggle-card" + (toggles[t.key] ? " active" : "");
        card.innerHTML = `<span>${t.label}</span><div class="cheat-toggle-indicator">✓</div>`;
        card.onclick = () => dispatchToggle(t.key, t.label);
        togglesGrid.appendChild(card);
      });
      scrollContainer.appendChild(togglesGrid);

    } else if (activeTab === 1) {
      // --- VEHICLES TAB ---
      const actionsTitle = document.createElement("div");
      actionsTitle.className = "cheat-section-title";
      actionsTitle.textContent = "Current Vehicle Actions";
      scrollContainer.appendChild(actionsTitle);

      const actionsGrid = document.createElement("div");
      actionsGrid.className = "cheat-grid-chips";
      const vehActions = [
        { label: "Repair", cmd: "repair" },
        { label: "Flip upright", cmd: "flip" },
        { label: "Boost (+45m/s)", cmd: "boost" },
        { label: "Max tune", cmd: "tune" },
        { label: "Random paint", cmd: "paint" }
      ];
      vehActions.forEach(a => {
        const chip = document.createElement("button");
        chip.className = "cheat-chip";
        chip.textContent = a.label;
        chip.onclick = () => dispatchAction(a.cmd);
        actionsGrid.appendChild(chip);
      });
      scrollContainer.appendChild(actionsGrid);

      const vehToggle = document.createElement("div");
      vehToggle.className = "cheat-toggle-card" + (toggles.vehicleGod ? " active" : "");
      vehToggle.innerHTML = `<span>Indestructible vehicle</span><div class="cheat-toggle-indicator">✓</div>`;
      vehToggle.onclick = () => dispatchToggle("vehicleGod", "Indestructible Vehicle");
      scrollContainer.appendChild(vehToggle);

      const spawnTitle = document.createElement("div");
      spawnTitle.className = "cheat-section-title";
      spawnTitle.textContent = "Spawn and Drive (53 Vehicles)";
      scrollContainer.appendChild(spawnTitle);

      const spawnGrid = document.createElement("div");
      spawnGrid.className = "cheat-grid-chips";
      VEHICLES.forEach(v => {
        const chip = document.createElement("button");
        chip.className = "cheat-chip";
        chip.innerHTML = `<span>${v.label}</span><span class="cheat-chip-sub">${v.model}</span>`;
        chip.onclick = () => {
          dispatchAction("spawn_vehicle", { model: v.model, label: v.label });
          closeCheatMenu();
        };
        spawnGrid.appendChild(chip);
      });
      scrollContainer.appendChild(spawnGrid);

    } else if (activeTab === 2) {
      // --- SKINS TAB ---
      const skinsTitle = document.createElement("div");
      skinsTitle.className = "cheat-section-title";
      skinsTitle.textContent = "Character Skins (20 Models)";
      scrollContainer.appendChild(skinsTitle);

      const skinsGrid = document.createElement("div");
      skinsGrid.className = "cheat-grid-chips";
      SKINS.forEach(s => {
        const chip = document.createElement("button");
        chip.className = "cheat-chip";
        chip.innerHTML = `<span>${s.label}</span>`;
        chip.onclick = () => {
          dispatchAction("spawn_skin", { model: s.model, label: s.label });
          closeCheatMenu();
        };
        skinsGrid.appendChild(chip);
      });
      scrollContainer.appendChild(skinsGrid);

    } else if (activeTab === 3) {
      // --- WORLD TAB ---
      const timeTitle = document.createElement("div");
      timeTitle.className = "cheat-section-title";
      timeTitle.textContent = "World Time";
      scrollContainer.appendChild(timeTitle);

      const timeGrid = document.createElement("div");
      timeGrid.className = "cheat-grid-chips";
      TIMES.forEach(t => {
        const chip = document.createElement("button");
        chip.className = "cheat-chip";
        chip.innerHTML = `<span>${t.label}</span><span class="cheat-chip-sub">${t.sub}</span>`;
        chip.onclick = () => dispatchAction("time", { hour: t.hour, label: t.label + " (" + t.sub + ")" });
        timeGrid.appendChild(chip);
      });
      scrollContainer.appendChild(timeGrid);

      const weatherTitle = document.createElement("div");
      weatherTitle.className = "cheat-section-title";
      weatherTitle.textContent = "Weather Presets";
      scrollContainer.appendChild(weatherTitle);

      const weatherGrid = document.createElement("div");
      weatherGrid.className = "cheat-grid-chips";
      WEATHERS.forEach(w => {
        const chip = document.createElement("button");
        chip.className = "cheat-chip";
        chip.textContent = w.label;
        chip.onclick = () => dispatchAction("weather", { weather: w.id, label: w.label });
        weatherGrid.appendChild(chip);
      });
      scrollContainer.appendChild(weatherGrid);

      const worldTogglesTitle = document.createElement("div");
      worldTogglesTitle.className = "cheat-section-title";
      worldTogglesTitle.textContent = "World Toggles";
      scrollContainer.appendChild(worldTogglesTitle);

      const worldTogglesGrid = document.createElement("div");
      worldTogglesGrid.className = "cheat-grid-toggles";
      const worldToggles = [
        { label: "Freeze time", key: "freezeTime" },
        { label: "No traffic / peds", key: "noTraffic" },
        { label: "Riot mode", key: "riot" },
        { label: "Moon gravity", key: "moonGravity" }
      ];
      worldToggles.forEach(t => {
        const card = document.createElement("div");
        card.className = "cheat-toggle-card" + (toggles[t.key] ? " active" : "");
        card.innerHTML = `<span>${t.label}</span><div class="cheat-toggle-indicator">✓</div>`;
        card.onclick = () => dispatchToggle(t.key, t.label);
        worldTogglesGrid.appendChild(card);
      });
      scrollContainer.appendChild(worldTogglesGrid);

      const tpTitle = document.createElement("div");
      tpTitle.className = "cheat-section-title";
      tpTitle.textContent = "Teleport Locations (16 Places)";
      scrollContainer.appendChild(tpTitle);

      const tpGrid = document.createElement("div");
      tpGrid.className = "cheat-grid-chips";
      PLACES.forEach(p => {
        const chip = document.createElement("button");
        chip.className = "cheat-chip";
        chip.textContent = p.label;
        chip.onclick = () => {
          dispatchAction("teleport_coords", { coords: p.coords, label: p.label });
          closeCheatMenu();
        };
        tpGrid.appendChild(chip);
      });
      scrollContainer.appendChild(tpGrid);

    } else if (activeTab === 4) {
      // --- SETTINGS TAB ---
      const resTitle = document.createElement("div");
      resTitle.className = "cheat-section-title";
      resTitle.textContent = "Resolution (Requires Reload)";
      scrollContainer.appendChild(resTitle);

      const resGrid = document.createElement("div");
      resGrid.className = "cheat-grid-chips";
      const resolutions = [
        { label: "720p", val: "1280x720" },
        { label: "900p", val: "1600x900" },
        { label: "1080p", val: "1920x1080" },
        { label: "1440p", val: "2560x1440" }
      ];
      resolutions.forEach(r => {
        const chip = document.createElement("button");
        chip.className = "cheat-chip" + (profile.res === r.val ? " active" : "");
        chip.innerHTML = `<span>${r.label}</span><span class="cheat-chip-sub">${r.val}</span>`;
        chip.onclick = () => {
          profile.res = r.val;
          renderContent();
        };
        resGrid.appendChild(chip);
      });
      scrollContainer.appendChild(resGrid);

      const fpsTitle = document.createElement("div");
      fpsTitle.className = "cheat-section-title";
      fpsTitle.textContent = "Frame Cap (Requires Reload)";
      scrollContainer.appendChild(fpsTitle);

      const fpsGrid = document.createElement("div");
      fpsGrid.className = "cheat-grid-chips";
      const fpsOptions = [
        { label: "30 FPS", val: "30" },
        { label: "60 FPS", val: "60" },
        { label: "Uncapped", val: "0" }
      ];
      fpsOptions.forEach(f => {
        const chip = document.createElement("button");
        chip.className = "cheat-chip" + (profile.fps === f.val ? " active" : "");
        chip.textContent = f.label;
        chip.onclick = () => {
          profile.fps = f.val;
          renderContent();
        };
        fpsGrid.appendChild(chip);
      });
      scrollContainer.appendChild(fpsGrid);

      const gfxTitle = document.createElement("div");
      gfxTitle.className = "cheat-section-title";
      gfxTitle.textContent = "Graphics Preset (Requires Reload)";
      scrollContainer.appendChild(gfxTitle);

      const gfxGrid = document.createElement("div");
      gfxGrid.className = "cheat-grid-chips";
      const gfxPresets = [
        { label: "Low (Fast)", low: "1", args: "" },
        { label: "Balanced", low: "0", args: "-textureQuality=1,-shadowQuality=1,-reflectionQuality=1" },
        { label: "Ultra", low: "0", args: "-textureQuality=2,-shadowQuality=2,-reflectionQuality=2" }
      ];
      gfxPresets.forEach(g => {
        const isSel = profile.low === g.low && profile.args === g.args;
        const chip = document.createElement("button");
        chip.className = "cheat-chip" + (isSel ? " active" : "");
        chip.textContent = g.label;
        chip.onclick = () => {
          profile.low = g.low;
          profile.args = g.args;
          renderContent();
        };
        gfxGrid.appendChild(chip);
      });
      scrollContainer.appendChild(gfxGrid);

      const reloadBtn = document.createElement("button");
      reloadBtn.className = "cheat-reload-btn";
      reloadBtn.textContent = "Apply Settings & Reload Game";
      reloadBtn.onclick = async () => {
        try {
          await fetch("/local-profile.json", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(profile)
          });
        } catch (e) {}
        location.reload();
      };
      scrollContainer.appendChild(reloadBtn);
    }
  }

  // Tab switching
  document.querySelectorAll(".cheat-tab-btn").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".cheat-tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeTab = parseInt(btn.dataset.tab, 10) || 0;
      fetch("/log", { method: "POST", body: "[cheats] activeTab changed to " + activeTab }).catch(()=>{});
      renderContent();
    };
  });

  function openCheatMenu() {
    if (isOpen) return;
    isOpen = true;
    window.__gtav_cheat_menu_open = true;

    // Release mouse and game input cleanly
    if (window.__gtav_isolate_input) {
      window.__gtav_isolate_input(true);
    }
    if (document.exitPointerLock) {
      try { document.exitPointerLock(); } catch (e) {}
    }

    overlay.style.display = "flex";
    overlay.style.pointerEvents = "auto";
    requestAnimationFrame(() => {
      overlay.classList.add("visible");
    });
    renderContent();
    updateStatusBadge();
    const card = document.getElementById("cheat-card");
    const r = card.getBoundingClientRect();
    const chips = Array.from(document.querySelectorAll(".cheat-chip")).slice(0, 3).map(c => {
      const cr = c.getBoundingClientRect();
      return { text: c.textContent, x: Math.round(cr.x), y: Math.round(cr.y), w: Math.round(cr.width), h: Math.round(cr.height) };
    });
    fetch("/log", { method: "POST", body: "[cheats] menu opened via ⌘X | card: " + JSON.stringify({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), winW: window.innerWidth, winH: window.innerHeight }) + " | chips: " + JSON.stringify(chips) }).catch(()=>{});
  }

  function closeCheatMenu() {
    if (!isOpen) return;
    isOpen = false;
    window.__gtav_cheat_menu_open = false;

    overlay.classList.remove("visible");
    overlay.style.display = "none";
    overlay.style.pointerEvents = "none";

    // Restore gameplay input without requesting pointer lock immediately
    // Let the player click the canvas naturally to acquire pointer lock
    if (window.__gtav_isolate_input) {
      window.__gtav_isolate_input(false);
    }
    fetch("/log", { method: "POST", body: "[cheats] menu closed cleanly" }).catch(()=>{});
  }

  function toggleCheatMenu() {
    if (isOpen) closeCheatMenu();
    else openCheatMenu();
  }

  closeBtn.onclick = (e) => {
    e.stopPropagation();
    closeCheatMenu();
  };

  overlay.onclick = (e) => {
    if (e.target === overlay) {
      closeCheatMenu();
    }
  };

  // Keyboard shortcut: ONLY Command+X (or Ctrl+X) and Escape to close
  const handleKey = (e) => {
    if ((e.metaKey || e.ctrlKey) && (e.code === "KeyX" || e.key.toLowerCase() === "x" || e.keyCode === 88)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      toggleCheatMenu();
      return;
    }
    if (e.code === "Escape" && isOpen) {
      e.preventDefault();
      e.stopImmediatePropagation();
      closeCheatMenu();
      return;
    }
  };

  window.addEventListener("keydown", handleKey, { capture: true });
  document.addEventListener("keydown", handleKey, { capture: true });

  window.__gtav_open_cheats = openCheatMenu;
  window.__gtav_close_cheats = closeCheatMenu;
  window.__gtav_toggle_cheats = toggleCheatMenu;

  console.log("[cheats] iOS-style GTA V Sandbox cheat menu loaded. Shortcut: ⌘X");
})();
"""

for target in ["mirror/playgta5.com/cheats.js", "cheats.js"]:
    with open(target, "w") as f:
        f.write(CHEATS_CODE)
    print("Wrote", target, "len:", len(CHEATS_CODE))
