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

  const VEHICLES = [{"label":"Police Alg\u00e9rienne (S\u00fbret\u00e9 Nationale)","model":"police","styleId":1,"cat":"Algerian","catTitle":"Algerian Cars","icon":"\ud83d\ude93","desc":"Algerian Police \u2022 White & Navy Blue \u2022 Plate: POLICE17"},{"label":"Gendarmerie Nationale 4x4 (Toyota Land Cruiser)","model":"sheriff2","styleId":2,"cat":"Algerian","catTitle":"Algerian Cars","icon":"\ud83d\udea8","desc":"Algerian Gendarmerie Heavy Patrol \u2022 Green & White \u2022 Plate: GEND 16"},{"label":"Gendarmerie Nationale (Canis Mesa 4x4)","model":"mesa3","styleId":3,"cat":"Algerian","catTitle":"Algerian Cars","icon":"\ud83e\ude96","desc":"Gendarmerie Rapid Intervention \u2022 Green & White \u2022 Plate: GN-0016"},{"label":"B.R.I. Alg\u00e9rie (Tactical Intervention)","model":"fbi2","styleId":4,"cat":"Algerian","catTitle":"Algerian Cars","icon":"\ud83d\udee1\ufe0f","desc":"Brigade de Recherche & d'Intervention \u2022 Midnight Black \u2022 Plate: BRI 16"},{"label":"Blind\u00e9 B.R.I. (Fourgon Tactique DZ)","model":"riot","styleId":5,"cat":"Algerian","catTitle":"Algerian Cars","icon":"\ud83d\udee1\ufe0f","desc":"Fourgon Blind\u00e9 Anti-\u00c9meute DZ \u2022 Tactical Armor \u2022 Plate: BRI TACT"},{"label":"Protection Civile Alg\u00e9rie (Ambulance DZ)","model":"ambulance","styleId":6,"cat":"Algerian","catTitle":"Algerian Cars","icon":"\ud83d\ude91","desc":"Protection Civile Alg\u00e9rienne (14) \u2022 Red & White \u2022 Plate: PC 14 DZ"},{"label":"Renault Symbol DZ (Le Roi d'Oran)","model":"premier","styleId":7,"cat":"Algerian","catTitle":"Algerian Cars","icon":"\ud83d\ude97","desc":"Montage Oued Tlelat Oran \u2022 Blanc Glacier \u2022 Plate: 12331 15"},{"label":"Dacia Sandero Stepway / Logan DZ","model":"asea","styleId":8,"cat":"Algerian","catTitle":"Algerian Cars","icon":"\ud83d\ude95","desc":"Bestseller Alg\u00e9rien \u2022 Bleu Cosmos M\u00e9tallis\u00e9 \u2022 Plate: 45616 16"},{"label":"Renault Clio 4 RS DZ (Sport Hatch)","model":"blista","styleId":9,"cat":"Algerian","catTitle":"Algerian Cars","icon":"\ud83c\udfce\ufe0f","desc":"Fleuron Sportif Jeunesse \u2022 Jaune Sirius & Toit Noir \u2022 Plate: 00716 18"},{"label":"Peugeot 208 DZ (Lion d'Alger)","model":"issi2","styleId":10,"cat":"Algerian","catTitle":"Algerian Cars","icon":"\ud83d\ude99","desc":"Lion d'Alger \u2022 Gris Aluminium & Noir \u2022 Plate: 09916 17"},{"label":"Toyota Hilux DZ (Guerrier du Sahara 4x4)","model":"rebel2","styleId":11,"cat":"Algerian","catTitle":"Algerian Cars","icon":"\ud83c\udfdc\ufe0f","desc":"Indestructible Sahara 4x4 (Ouargla) \u2022 Sand Dune \u2022 Plate: 08830 12"},{"label":"Camion Hamoud Boualem (Livraison DZ)","model":"mule","styleId":12,"cat":"Algerian","catTitle":"Algerian Cars","icon":"\ud83d\ude9a","desc":"Livraison Selecto & Hamoud \u2022 Rouge & Cr\u00e8me \u2022 Plate: HAMOUD16"},{"label":"Taxi Alg\u00e9rois (Taxi Service DZ)","model":"taxi","styleId":13,"cat":"Algerian","catTitle":"Algerian Cars","icon":"\ud83d\ude95","desc":"Taxi Ville d'Alger \u2022 Jaune Taxi DZ & Blanc \u2022 Plate: TAXI 16"},{"label":"Bus Interurbain DZ (Trans-Alg\u00e9rie Express)","model":"coach","styleId":14,"cat":"Algerian","catTitle":"Algerian Cars","icon":"\ud83d\ude8c","desc":"Liaison Inter-Wilayas \u2022 Vert National & Blanc \u2022 Plate: 01116 15"},{"label":"Mercedes G-Wagon DZ (Escorte VIP)","model":"dubsta","styleId":15,"cat":"Algerian","catTitle":"Algerian Cars","icon":"\ud83d\udda4","desc":"Escorte VIP & Pr\u00e9sidence \u2022 Obsidian Black \u2022 Plate: PR 01 DZ"},{"label":"Scooter DZ (Style 103 / Booster)","model":"faggio2","styleId":16,"cat":"Algerian","catTitle":"Algerian Cars","icon":"\ud83d\udef5","desc":"Scooter Populaire des Quartiers \u2022 Bleu C\u00e9leste \u2022 Plate: DZ 16 M"},{"label":"Dune Buggy Sahara DZ (Grand Erg Occidental)","model":"dune","styleId":17,"cat":"Algerian","catTitle":"Algerian Cars","icon":"\ud83c\udfdc\ufe0f","desc":"Buggy Raid Dunes de Beni Abb\u00e8s \u2022 Sahara Ochre \u2022 Plate: SAHARA30"},{"label":"Coil Voltic","model":"voltic","cat":"Supercars","catTitle":"Supercars","icon":"\ud83c\udfce\ufe0f"},{"label":"Grotti Cheetah","model":"cheetah","cat":"Supercars","catTitle":"Supercars","icon":"\ud83c\udfce\ufe0f"},{"label":"Overflod Entity XF","model":"entityxf","cat":"Supercars","catTitle":"Supercars","icon":"\ud83c\udfce\ufe0f"},{"label":"Pegassi Infernus","model":"infernus","cat":"Supercars","catTitle":"Supercars","icon":"\ud83c\udfce\ufe0f"},{"label":"Pegassi Vacca","model":"vacca","cat":"Supercars","catTitle":"Supercars","icon":"\ud83c\udfce\ufe0f"},{"label":"Truffade Adder","model":"adder","cat":"Supercars","catTitle":"Supercars","icon":"\ud83c\udfce\ufe0f"},{"label":"Vapid Bullet","model":"bullet","cat":"Supercars","catTitle":"Supercars","icon":"\ud83c\udfce\ufe0f"},{"label":"Annis Elegy RH8","model":"elegy2","cat":"Fast cars","catTitle":"Sports & Tuners","icon":"\ud83c\udfc1"},{"label":"Benefactor Feltzer","model":"feltzer2","cat":"Fast cars","catTitle":"Sports & Tuners","icon":"\ud83c\udfc1"},{"label":"Benefactor Schwartzer","model":"schwarzer","cat":"Fast cars","catTitle":"Sports & Tuners","icon":"\ud83c\udfc1"},{"label":"Benefactor Surano","model":"surano","cat":"Fast cars","catTitle":"Sports & Tuners","icon":"\ud83c\udfc1"},{"label":"Bravado Banshee","model":"banshee","cat":"Fast cars","catTitle":"Sports & Tuners","icon":"\ud83c\udfc1"},{"label":"Bravado Buffalo","model":"buffalo","cat":"Fast cars","catTitle":"Sports & Tuners","icon":"\ud83c\udfc1"},{"label":"Bravado Buffalo S","model":"buffalo2","cat":"Fast cars","catTitle":"Sports & Tuners","icon":"\ud83c\udfc1"},{"label":"Dewbauchee Rapid GT","model":"rapidgt","cat":"Fast cars","catTitle":"Sports & Tuners","icon":"\ud83c\udfc1"},{"label":"Dewbauchee Rapid GT Cabrio","model":"rapidgt2","cat":"Fast cars","catTitle":"Sports & Tuners","icon":"\ud83c\udfc1"},{"label":"Grotti Carbonizzare","model":"carbonizzare","cat":"Fast cars","catTitle":"Sports & Tuners","icon":"\ud83c\udfc1"},{"label":"Hijak Khamelion","model":"khamelion","cat":"Fast cars","catTitle":"Sports & Tuners","icon":"\ud83c\udfc1"},{"label":"Invetero Coquette","model":"coquette","cat":"Fast cars","catTitle":"Sports & Tuners","icon":"\ud83c\udfc1"},{"label":"Karin Futo","model":"futo","cat":"Fast cars","catTitle":"Sports & Tuners","icon":"\ud83c\udfc1"},{"label":"Karin Sultan","model":"sultan","cat":"Fast cars","catTitle":"Sports & Tuners","icon":"\ud83c\udfc1"},{"label":"Maibatsu Penumbra","model":"penumbra","cat":"Fast cars","catTitle":"Sports & Tuners","icon":"\ud83c\udfc1"},{"label":"Obey 9F","model":"ninef","cat":"Fast cars","catTitle":"Sports & Tuners","icon":"\ud83c\udfc1"},{"label":"Obey 9F Cabrio","model":"ninef2","cat":"Fast cars","catTitle":"Sports & Tuners","icon":"\ud83c\udfc1"},{"label":"Pfister Comet","model":"comet2","cat":"Fast cars","catTitle":"Sports & Tuners","icon":"\ud83c\udfc1"},{"label":"Schyster Fusilade","model":"fusilade","cat":"Fast cars","catTitle":"Sports & Tuners","icon":"\ud83c\udfc1"},{"label":"Albany Manana","model":"manana","cat":"Classics","catTitle":"Sports Classics","icon":"\ud83d\udcfb"},{"label":"Declasse Tornado","model":"tornado","cat":"Classics","catTitle":"Sports Classics","icon":"\ud83d\udcfb"},{"label":"Declasse Tornado Convertible","model":"tornado2","cat":"Classics","catTitle":"Sports Classics","icon":"\ud83d\udcfb"},{"label":"Declasse Tornado Mariachi","model":"tornado4","cat":"Classics","catTitle":"Sports Classics","icon":"\ud83d\udcfb"},{"label":"Declasse Tornado Rusty","model":"tornado3","cat":"Classics","catTitle":"Sports Classics","icon":"\ud83d\udcfb"},{"label":"Dewbauchee JB 700","model":"jb700","cat":"Classics","catTitle":"Sports Classics","icon":"\ud83d\udcfb"},{"label":"Grotti Stinger","model":"stinger","cat":"Classics","catTitle":"Sports Classics","icon":"\ud83d\udcfb"},{"label":"Grotti Stinger GT","model":"stingergt","cat":"Classics","catTitle":"Sports Classics","icon":"\ud83d\udcfb"},{"label":"Pegassi Monroe","model":"monroe","cat":"Classics","catTitle":"Sports Classics","icon":"\ud83d\udcfb"},{"label":"Truffade Z-Type","model":"ztype","cat":"Classics","catTitle":"Sports Classics","icon":"\ud83d\udcfb"},{"label":"Vapid Peyote","model":"peyote","cat":"Classics","catTitle":"Sports Classics","icon":"\ud83d\udcfb"},{"label":"Albany Buccaneer","model":"buccaneer","cat":"Muscle","catTitle":"Muscle Cars","icon":"\ud83d\udcaa"},{"label":"Bravado Gauntlet","model":"gauntlet","cat":"Muscle","catTitle":"Muscle Cars","icon":"\ud83d\udcaa"},{"label":"Cheval Picador","model":"picador","cat":"Muscle","catTitle":"Muscle Cars","icon":"\ud83d\udcaa"},{"label":"Declasse Sabre Turbo","model":"sabregt","cat":"Muscle","catTitle":"Muscle Cars","icon":"\ud83d\udcaa"},{"label":"Declasse Vigero","model":"vigero","cat":"Muscle","catTitle":"Muscle Cars","icon":"\ud83d\udcaa"},{"label":"Declasse Voodoo","model":"voodoo2","cat":"Muscle","catTitle":"Muscle Cars","icon":"\ud83d\udcaa"},{"label":"Imponte Phoenix","model":"phoenix","cat":"Muscle","catTitle":"Muscle Cars","icon":"\ud83d\udcaa"},{"label":"Imponte Ruiner","model":"ruiner","cat":"Muscle","catTitle":"Muscle Cars","icon":"\ud83d\udcaa"},{"label":"Rat-Loader","model":"ratloader","cat":"Muscle","catTitle":"Muscle Cars","icon":"\ud83d\udcaa"},{"label":"Vapid Dominator","model":"dominator","cat":"Muscle","catTitle":"Muscle Cars","icon":"\ud83d\udcaa"},{"label":"Vapid Hotknife","model":"hotknife","cat":"Muscle","catTitle":"Muscle Cars","icon":"\ud83d\udcaa"},{"label":"Albany Cavalcade","model":"cavalcade","cat":"SUVs","catTitle":"SUVs & 4x4s","icon":"\ud83d\ude99"},{"label":"Albany Cavalcade II","model":"cavalcade2","cat":"SUVs","catTitle":"SUVs & 4x4s","icon":"\ud83d\ude99"},{"label":"Benefactor Dubsta","model":"dubsta","cat":"SUVs","catTitle":"SUVs & 4x4s","icon":"\ud83d\ude99"},{"label":"Benefactor Dubsta Sport","model":"dubsta2","cat":"SUVs","catTitle":"SUVs & 4x4s","icon":"\ud83d\ude99"},{"label":"Benefactor Serrano","model":"serrano","cat":"SUVs","catTitle":"SUVs & 4x4s","icon":"\ud83d\ude99"},{"label":"Bravado Gresley","model":"gresley","cat":"SUVs","catTitle":"SUVs & 4x4s","icon":"\ud83d\ude99"},{"label":"Canis Mesa","model":"mesa","cat":"SUVs","catTitle":"SUVs & 4x4s","icon":"\ud83d\ude99"},{"label":"Canis Mesa Snow","model":"mesa2","cat":"SUVs","catTitle":"SUVs & 4x4s","icon":"\ud83d\ude99"},{"label":"Canis Seminole","model":"seminole","cat":"SUVs","catTitle":"SUVs & 4x4s","icon":"\ud83d\ude99"},{"label":"Declasse Granger","model":"granger","cat":"SUVs","catTitle":"SUVs & 4x4s","icon":"\ud83d\ude99"},{"label":"Dundreary Landstalker","model":"landstalker","cat":"SUVs","catTitle":"SUVs & 4x4s","icon":"\ud83d\ude99"},{"label":"Emperor Habanero","model":"habanero","cat":"SUVs","catTitle":"SUVs & 4x4s","icon":"\ud83d\ude99"},{"label":"Fathom FQ 2","model":"fq2","cat":"SUVs","catTitle":"SUVs & 4x4s","icon":"\ud83d\ude99"},{"label":"Gallivanter Baller","model":"baller","cat":"SUVs","catTitle":"SUVs & 4x4s","icon":"\ud83d\ude99"},{"label":"Gallivanter Baller Sport","model":"baller2","cat":"SUVs","catTitle":"SUVs & 4x4s","icon":"\ud83d\ude99"},{"label":"Karin BeeJay XL","model":"bjxl","cat":"SUVs","catTitle":"SUVs & 4x4s","icon":"\ud83d\ude99"},{"label":"Mammoth Patriot","model":"patriot","cat":"SUVs","catTitle":"SUVs & 4x4s","icon":"\ud83d\ude99"},{"label":"Obey Rocoto","model":"rocoto","cat":"SUVs","catTitle":"SUVs & 4x4s","icon":"\ud83d\ude99"},{"label":"Vapid Radi","model":"radi","cat":"SUVs","catTitle":"SUVs & 4x4s","icon":"\ud83d\ude99"},{"label":"Albany Emperor","model":"emperor","cat":"Sedans","catTitle":"Sedans & Saloons","icon":"\ud83d\ude97"},{"label":"Albany Primo","model":"primo","cat":"Sedans","catTitle":"Sedans & Saloons","icon":"\ud83d\ude97"},{"label":"Albany Rusty Emperor","model":"emperor2","cat":"Sedans","catTitle":"Sedans & Saloons","icon":"\ud83d\ude97"},{"label":"Albany Snow Emperor","model":"emperor3","cat":"Sedans","catTitle":"Sedans & Saloons","icon":"\ud83d\ude97"},{"label":"Albany Washington","model":"washington","cat":"Sedans","catTitle":"Sedans & Saloons","icon":"\ud83d\ude97"},{"label":"Benefactor Schafter","model":"schafter2","cat":"Sedans","catTitle":"Sedans & Saloons","icon":"\ud83d\ude97"},{"label":"Chariot Romero","model":"romero","cat":"Sedans","catTitle":"Sedans & Saloons","icon":"\ud83d\ude97"},{"label":"Cheval Fugitive","model":"fugitive","cat":"Sedans","catTitle":"Sedans & Saloons","icon":"\ud83d\ude97"},{"label":"Cheval Surge","model":"surge","cat":"Sedans","catTitle":"Sedans & Saloons","icon":"\ud83d\ude97"},{"label":"Declasse Asea","model":"asea","cat":"Sedans","catTitle":"Sedans & Saloons","icon":"\ud83d\ude97"},{"label":"Declasse Premier","model":"premier","cat":"Sedans","catTitle":"Sedans & Saloons","icon":"\ud83d\ude97"},{"label":"Declasse Snow Asea","model":"asea2","cat":"Sedans","catTitle":"Sedans & Saloons","icon":"\ud83d\ude97"},{"label":"Dundreary Regina","model":"regina","cat":"Sedans","catTitle":"Sedans & Saloons","icon":"\ud83d\ude97"},{"label":"Dundreary Stretch","model":"stretch","cat":"Sedans","catTitle":"Sedans & Saloons","icon":"\ud83d\ude97"},{"label":"Enus Super Diamond","model":"superd","cat":"Sedans","catTitle":"Sedans & Saloons","icon":"\ud83d\ude97"},{"label":"Karin Asterope","model":"asterope","cat":"Sedans","catTitle":"Sedans & Saloons","icon":"\ud83d\ude97"},{"label":"Karin Intruder","model":"intruder","cat":"Sedans","catTitle":"Sedans & Saloons","icon":"\ud83d\ude97"},{"label":"Obey Tailgater","model":"tailgater","cat":"Sedans","catTitle":"Sedans & Saloons","icon":"\ud83d\ude97"},{"label":"Vapid Stanier","model":"stanier","cat":"Sedans","catTitle":"Sedans & Saloons","icon":"\ud83d\ude97"},{"label":"Vulcar Ingot","model":"ingot","cat":"Sedans","catTitle":"Sedans & Saloons","icon":"\ud83d\ude97"},{"label":"Zirconium Stratum","model":"stratum","cat":"Sedans","catTitle":"Sedans & Saloons","icon":"\ud83d\ude97"},{"label":"Dewbauchee Exemplar","model":"exemplar","cat":"Coupes","catTitle":"Coupes & Cabrio","icon":"\ud83d\ude98"},{"label":"Enus Cognoscenti Cabrio","model":"cogcabrio","cat":"Coupes","catTitle":"Coupes & Cabrio","icon":"\ud83d\ude98"},{"label":"Lampadati Felon","model":"felon","cat":"Coupes","catTitle":"Coupes & Cabrio","icon":"\ud83d\ude98"},{"label":"Lampadati Felon GT","model":"felon2","cat":"Coupes","catTitle":"Coupes & Cabrio","icon":"\ud83d\ude98"},{"label":"Ocelot F620","model":"f620","cat":"Coupes","catTitle":"Coupes & Cabrio","icon":"\ud83d\ude98"},{"label":"Ocelot Jackal","model":"jackal","cat":"Coupes","catTitle":"Coupes & Cabrio","icon":"\ud83d\ude98"},{"label":"Ubermacht Oracle","model":"oracle","cat":"Coupes","catTitle":"Coupes & Cabrio","icon":"\ud83d\ude98"},{"label":"Ubermacht Oracle XS","model":"oracle2","cat":"Coupes","catTitle":"Coupes & Cabrio","icon":"\ud83d\ude98"},{"label":"Ubermacht Sentinel","model":"sentinel","cat":"Coupes","catTitle":"Coupes & Cabrio","icon":"\ud83d\ude98"},{"label":"Ubermacht Sentinel XS","model":"sentinel2","cat":"Coupes","catTitle":"Coupes & Cabrio","icon":"\ud83d\ude98"},{"label":"Ubermacht Zion","model":"zion","cat":"Coupes","catTitle":"Coupes & Cabrio","icon":"\ud83d\ude98"},{"label":"Ubermacht Zion Cabrio","model":"zion2","cat":"Coupes","catTitle":"Coupes & Cabrio","icon":"\ud83d\ude98"},{"label":"Bollokan Prairie","model":"prairie","cat":"Compacts","catTitle":"Compacts & Hatch","icon":"\ud83d\ude99"},{"label":"Dinka Blista","model":"blista","cat":"Compacts","catTitle":"Compacts & Hatch","icon":"\ud83d\ude99"},{"label":"Karin Dilettante","model":"dilettante","cat":"Compacts","catTitle":"Compacts & Hatch","icon":"\ud83d\ude99"},{"label":"Karin Dilettante Patrol","model":"dilettante2","cat":"Compacts","catTitle":"Compacts & Hatch","icon":"\ud83d\ude99"},{"label":"Weeny Issi","model":"issi2","cat":"Compacts","catTitle":"Compacts & Hatch","icon":"\ud83d\ude99"},{"label":"Dinka Akuma","model":"akuma","cat":"Motorcycles","catTitle":"Motorcycles & Bikes","icon":"\ud83c\udfcd\ufe0f"},{"label":"Dinka Double","model":"double","cat":"Motorcycles","catTitle":"Motorcycles & Bikes","icon":"\ud83c\udfcd\ufe0f"},{"label":"LCC Hexer","model":"hexer","cat":"Motorcycles","catTitle":"Motorcycles & Bikes","icon":"\ud83c\udfcd\ufe0f"},{"label":"Maibatsu Sanchez","model":"sanchez","cat":"Motorcycles","catTitle":"Motorcycles & Bikes","icon":"\ud83c\udfcd\ufe0f"},{"label":"Maibatsu Sanchez Sport","model":"sanchez2","cat":"Motorcycles","catTitle":"Motorcycles & Bikes","icon":"\ud83c\udfcd\ufe0f"},{"label":"Nagasaki Carbon RS","model":"carbonrs","cat":"Motorcycles","catTitle":"Motorcycles & Bikes","icon":"\ud83c\udfcd\ufe0f"},{"label":"Pegassi Bati","model":"bati","cat":"Motorcycles","catTitle":"Motorcycles & Bikes","icon":"\ud83c\udfcd\ufe0f"},{"label":"Pegassi Bati 801RR","model":"bati2","cat":"Motorcycles","catTitle":"Motorcycles & Bikes","icon":"\ud83c\udfcd\ufe0f"},{"label":"Pegassi Faggio","model":"faggio2","cat":"Motorcycles","catTitle":"Motorcycles & Bikes","icon":"\ud83c\udfcd\ufe0f"},{"label":"Pegassi Ruffian","model":"ruffian","cat":"Motorcycles","catTitle":"Motorcycles & Bikes","icon":"\ud83c\udfcd\ufe0f"},{"label":"Principe Nemesis","model":"nemesis","cat":"Motorcycles","catTitle":"Motorcycles & Bikes","icon":"\ud83c\udfcd\ufe0f"},{"label":"Shitzu PCJ-600","model":"pcj","cat":"Motorcycles","catTitle":"Motorcycles & Bikes","icon":"\ud83c\udfcd\ufe0f"},{"label":"Shitzu Vader","model":"vader","cat":"Motorcycles","catTitle":"Motorcycles & Bikes","icon":"\ud83c\udfcd\ufe0f"},{"label":"Western Bagger","model":"bagger","cat":"Motorcycles","catTitle":"Motorcycles & Bikes","icon":"\ud83c\udfcd\ufe0f"},{"label":"Western Daemon","model":"daemon","cat":"Motorcycles","catTitle":"Motorcycles & Bikes","icon":"\ud83c\udfcd\ufe0f"},{"label":"BF Dune","model":"dune","cat":"Off-road","catTitle":"Off-Road & Dunes","icon":"\ud83e\uddd7"},{"label":"BF Injection","model":"bfinjection","cat":"Off-road","catTitle":"Off-Road & Dunes","icon":"\ud83e\uddd7"},{"label":"Bravado Duneloader","model":"dloader","cat":"Off-road","catTitle":"Off-Road & Dunes","icon":"\ud83e\uddd7"},{"label":"Canis Bodhi","model":"bodhi2","cat":"Off-road","catTitle":"Off-Road & Dunes","icon":"\ud83e\uddd7"},{"label":"Canis Mesa Merryweather","model":"mesa3","cat":"Off-road","catTitle":"Off-Road & Dunes","icon":"\ud83e\uddd7"},{"label":"Declasse Rancher XL","model":"rancherxl","cat":"Off-road","catTitle":"Off-Road & Dunes","icon":"\ud83e\uddd7"},{"label":"Declasse Rancher XL Snow","model":"rancherxl2","cat":"Off-road","catTitle":"Off-Road & Dunes","icon":"\ud83e\uddd7"},{"label":"Karin Rebel","model":"rebel2","cat":"Off-road","catTitle":"Off-Road & Dunes","icon":"\ud83e\uddd7"},{"label":"Karin Rusty Rebel","model":"rebel","cat":"Off-road","catTitle":"Off-Road & Dunes","icon":"\ud83e\uddd7"},{"label":"Nagasaki Blazer","model":"blazer","cat":"Off-road","catTitle":"Off-Road & Dunes","icon":"\ud83e\uddd7"},{"label":"Nagasaki Blazer Lifeguard","model":"blazer2","cat":"Off-road","catTitle":"Off-Road & Dunes","icon":"\ud83e\uddd7"},{"label":"Nagasaki Hot Rod Blazer","model":"blazer3","cat":"Off-road","catTitle":"Off-Road & Dunes","icon":"\ud83e\uddd7"},{"label":"Space Docker","model":"dune2","cat":"Off-road","catTitle":"Off-Road & Dunes","icon":"\ud83e\uddd7"},{"label":"Vapid Sandking","model":"sandking","cat":"Off-road","catTitle":"Off-Road & Dunes","icon":"\ud83e\uddd7"},{"label":"Vapid Sandking SWB","model":"sandking2","cat":"Off-road","catTitle":"Off-Road & Dunes","icon":"\ud83e\uddd7"},{"label":"Ambulance","model":"ambulance","cat":"Emergency","catTitle":"Emergency & Police","icon":"\ud83d\udea8"},{"label":"FIB","model":"fbi","cat":"Emergency","catTitle":"Emergency & Police","icon":"\ud83d\udea8"},{"label":"FIB SUV","model":"fbi2","cat":"Emergency","catTitle":"Emergency & Police","icon":"\ud83d\udea8"},{"label":"Fire Truck","model":"firetruk","cat":"Emergency","catTitle":"Emergency & Police","icon":"\ud83d\udea8"},{"label":"Lifeguard","model":"lguard","cat":"Emergency","catTitle":"Emergency & Police","icon":"\ud83d\udea8"},{"label":"Park Ranger","model":"pranger","cat":"Emergency","catTitle":"Emergency & Police","icon":"\ud83d\udea8"},{"label":"Police Bike","model":"policeb","cat":"Emergency","catTitle":"Emergency & Police","icon":"\ud83d\udea8"},{"label":"Police Buffalo","model":"police2","cat":"Emergency","catTitle":"Emergency & Police","icon":"\ud83d\udea8"},{"label":"Police Cruiser","model":"police","cat":"Emergency","catTitle":"Emergency & Police","icon":"\ud83d\udea8"},{"label":"Police Interceptor","model":"police3","cat":"Emergency","catTitle":"Emergency & Police","icon":"\ud83d\udea8"},{"label":"Police Rancher","model":"policeold1","cat":"Emergency","catTitle":"Emergency & Police","icon":"\ud83d\udea8"},{"label":"Police Roadcruiser","model":"policeold2","cat":"Emergency","catTitle":"Emergency & Police","icon":"\ud83d\udea8"},{"label":"Police Transporter","model":"policet","cat":"Emergency","catTitle":"Emergency & Police","icon":"\ud83d\udea8"},{"label":"Prison Bus","model":"pbus","cat":"Emergency","catTitle":"Emergency & Police","icon":"\ud83d\udea8"},{"label":"Riot","model":"riot","cat":"Emergency","catTitle":"Emergency & Police","icon":"\ud83d\udea8"},{"label":"Sheriff","model":"sheriff","cat":"Emergency","catTitle":"Emergency & Police","icon":"\ud83d\udea8"},{"label":"Sheriff SUV","model":"sheriff2","cat":"Emergency","catTitle":"Emergency & Police","icon":"\ud83d\udea8"},{"label":"Unmarked Cruiser","model":"police4","cat":"Emergency","catTitle":"Emergency & Police","icon":"\ud83d\udea8"},{"label":"Barracks","model":"barracks","cat":"Military","catTitle":"Military & Armed","icon":"\ud83c\udf96\ufe0f"},{"label":"Canis Crusader","model":"crusader","cat":"Military","catTitle":"Military & Armed","icon":"\ud83c\udf96\ufe0f"},{"label":"HVY Barracks Semi","model":"barracks2","cat":"Military","catTitle":"Military & Armed","icon":"\ud83c\udf96\ufe0f"},{"label":"Rhino","model":"rhino","cat":"Military","catTitle":"Military & Armed","icon":"\ud83c\udf96\ufe0f"},{"label":"Airport Bus","model":"airbus","cat":"Service","catTitle":"Service & Transit","icon":"\ud83d\ude8c"},{"label":"Bus","model":"bus","cat":"Service","catTitle":"Service & Transit","icon":"\ud83d\ude8c"},{"label":"Dashound","model":"coach","cat":"Service","catTitle":"Service & Transit","icon":"\ud83d\ude8c"},{"label":"Rental Shuttle","model":"rentalbus","cat":"Service","catTitle":"Service & Transit","icon":"\ud83d\ude8c"},{"label":"Taxi","model":"taxi","cat":"Service","catTitle":"Service & Transit","icon":"\ud83d\ude8c"},{"label":"Tourbus","model":"tourbus","cat":"Service","catTitle":"Service & Transit","icon":"\ud83d\ude8c"},{"label":"Trashmaster","model":"trash","cat":"Service","catTitle":"Service & Transit","icon":"\ud83d\ude8c"},{"label":"Blimp","model":"blimp","cat":"Airplanes","catTitle":"Planes & Jets","icon":"\u2708\ufe0f"},{"label":"Buckingham Luxor","model":"luxor","cat":"Airplanes","catTitle":"Planes & Jets","icon":"\u2708\ufe0f"},{"label":"Buckingham Shamal","model":"shamal","cat":"Airplanes","catTitle":"Planes & Jets","icon":"\u2708\ufe0f"},{"label":"Cargo Plane","model":"cargoplane","cat":"Airplanes","catTitle":"Planes & Jets","icon":"\u2708\ufe0f"},{"label":"Cuban 800","model":"cuban800","cat":"Airplanes","catTitle":"Planes & Jets","icon":"\u2708\ufe0f"},{"label":"Duster","model":"duster","cat":"Airplanes","catTitle":"Planes & Jets","icon":"\u2708\ufe0f"},{"label":"Jet","model":"jet","cat":"Airplanes","catTitle":"Planes & Jets","icon":"\u2708\ufe0f"},{"label":"Mallard","model":"stunt","cat":"Airplanes","catTitle":"Planes & Jets","icon":"\u2708\ufe0f"},{"label":"Mammatus","model":"mammatus","cat":"Airplanes","catTitle":"Planes & Jets","icon":"\u2708\ufe0f"},{"label":"P-996 LAZER","model":"lazer","cat":"Airplanes","catTitle":"Planes & Jets","icon":"\u2708\ufe0f"},{"label":"Titan","model":"titan","cat":"Airplanes","catTitle":"Planes & Jets","icon":"\u2708\ufe0f"},{"label":"Velum","model":"velum","cat":"Airplanes","catTitle":"Planes & Jets","icon":"\u2708\ufe0f"},{"label":"Annihilator","model":"annihilator","cat":"Helicopters","catTitle":"Helicopters","icon":"\ud83d\ude81"},{"label":"Buzzard","model":"buzzard","cat":"Helicopters","catTitle":"Helicopters","icon":"\ud83d\ude81"},{"label":"Cargobob","model":"cargobob","cat":"Helicopters","catTitle":"Helicopters","icon":"\ud83d\ude81"},{"label":"Civilian Frogger","model":"frogger2","cat":"Helicopters","catTitle":"Helicopters","icon":"\ud83d\ude81"},{"label":"Frogger","model":"frogger","cat":"Helicopters","catTitle":"Helicopters","icon":"\ud83d\ude81"},{"label":"Jetsam Cargobob","model":"cargobob2","cat":"Helicopters","catTitle":"Helicopters","icon":"\ud83d\ude81"},{"label":"Maverick","model":"maverick","cat":"Helicopters","catTitle":"Helicopters","icon":"\ud83d\ude81"},{"label":"Police Maverick","model":"polmav","cat":"Helicopters","catTitle":"Helicopters","icon":"\ud83d\ude81"},{"label":"Skylift","model":"skylift","cat":"Helicopters","catTitle":"Helicopters","icon":"\ud83d\ude81"},{"label":"TPE Cargobob","model":"cargobob3","cat":"Helicopters","catTitle":"Helicopters","icon":"\ud83d\ude81"},{"label":"Unarmed Buzzard","model":"buzzard2","cat":"Helicopters","catTitle":"Helicopters","icon":"\ud83d\ude81"},{"label":"Dinka Marquis","model":"marquis","cat":"Boats","catTitle":"Boats & Marine","icon":"\ud83d\udea4"},{"label":"Nagasaki Dinghy","model":"dinghy","cat":"Boats","catTitle":"Boats & Marine","icon":"\ud83d\udea4"},{"label":"Nagasaki Dinghy 2-seat","model":"dinghy2","cat":"Boats","catTitle":"Boats & Marine","icon":"\ud83d\udea4"},{"label":"Predator","model":"predator","cat":"Boats","catTitle":"Boats & Marine","icon":"\ud83d\udea4"},{"label":"Shitzu Jetmax","model":"jetmax","cat":"Boats","catTitle":"Boats & Marine","icon":"\ud83d\udea4"},{"label":"Shitzu Squalo","model":"squalo","cat":"Boats","catTitle":"Boats & Marine","icon":"\ud83d\udea4"},{"label":"Shitzu Suntrap","model":"suntrap","cat":"Boats","catTitle":"Boats & Marine","icon":"\ud83d\udea4"},{"label":"Shitzu Tropic","model":"tropic","cat":"Boats","catTitle":"Boats & Marine","icon":"\ud83d\udea4"},{"label":"Speedophile Lifeguard Seashark","model":"seashark2","cat":"Boats","catTitle":"Boats & Marine","icon":"\ud83d\udea4"},{"label":"Speedophile Seashark","model":"seashark","cat":"Boats","catTitle":"Boats & Marine","icon":"\ud83d\udea4"},{"label":"Submersible","model":"submersible","cat":"Boats","catTitle":"Boats & Marine","icon":"\ud83d\udea4"},{"label":"BF Rusty Surfer","model":"surfer2","cat":"Vans","catTitle":"Vans & Commercial","icon":"\ud83d\ude90"},{"label":"BF Surfer","model":"surfer","cat":"Vans","catTitle":"Vans & Commercial","icon":"\ud83d\ude90"},{"label":"Boxville","model":"boxville","cat":"Vans","catTitle":"Vans & Commercial","icon":"\ud83d\ude90"},{"label":"Boxville 2","model":"boxville2","cat":"Vans","catTitle":"Vans & Commercial","icon":"\ud83d\ude90"},{"label":"Bravado Bison","model":"bison","cat":"Vans","catTitle":"Vans & Commercial","icon":"\ud83d\ude90"},{"label":"Bravado Bison 2","model":"bison2","cat":"Vans","catTitle":"Vans & Commercial","icon":"\ud83d\ude90"},{"label":"Bravado Bison Work","model":"bison3","cat":"Vans","catTitle":"Vans & Commercial","icon":"\ud83d\ude90"},{"label":"Bravado Rumpo","model":"rumpo","cat":"Vans","catTitle":"Vans & Commercial","icon":"\ud83d\ude90"},{"label":"Bravado Rumpo 2","model":"rumpo2","cat":"Vans","catTitle":"Vans & Commercial","icon":"\ud83d\ude90"},{"label":"Bravado Youga","model":"youga","cat":"Vans","catTitle":"Vans & Commercial","icon":"\ud83d\ude90"},{"label":"Brute Boxville","model":"boxville3","cat":"Vans","catTitle":"Vans & Commercial","icon":"\ud83d\ude90"},{"label":"Brute Camper","model":"camper","cat":"Vans","catTitle":"Vans & Commercial","icon":"\ud83d\ude90"},{"label":"Brute Pony","model":"pony","cat":"Vans","catTitle":"Vans & Commercial","icon":"\ud83d\ude90"},{"label":"Brute Pony 2","model":"pony2","cat":"Vans","catTitle":"Vans & Commercial","icon":"\ud83d\ude90"},{"label":"Declasse Burrito","model":"burrito","cat":"Vans","catTitle":"Vans & Commercial","icon":"\ud83d\ude90"},{"label":"Declasse Burrito 2","model":"burrito2","cat":"Vans","catTitle":"Vans & Commercial","icon":"\ud83d\ude90"},{"label":"Declasse Burrito 3","model":"burrito3","cat":"Vans","catTitle":"Vans & Commercial","icon":"\ud83d\ude90"},{"label":"Declasse Burrito 4","model":"burrito4","cat":"Vans","catTitle":"Vans & Commercial","icon":"\ud83d\ude90"},{"label":"Declasse Burrito 5","model":"burrito5","cat":"Vans","catTitle":"Vans & Commercial","icon":"\ud83d\ude90"},{"label":"Declasse Gang Burrito","model":"gburrito","cat":"Vans","catTitle":"Vans & Commercial","icon":"\ud83d\ude90"},{"label":"Taco Van","model":"taco","cat":"Vans","catTitle":"Vans & Commercial","icon":"\ud83d\ude90"},{"label":"Vapid Bobcat XL","model":"bobcatxl","cat":"Vans","catTitle":"Vans & Commercial","icon":"\ud83d\ude90"},{"label":"Vapid Clown Van","model":"speedo2","cat":"Vans","catTitle":"Vans & Commercial","icon":"\ud83d\ude90"},{"label":"Vapid Minivan","model":"minivan","cat":"Vans","catTitle":"Vans & Commercial","icon":"\ud83d\ude90"},{"label":"Vapid Speedo","model":"speedo","cat":"Vans","catTitle":"Vans & Commercial","icon":"\ud83d\ude90"},{"label":"Zirconium Journey","model":"journey","cat":"Vans","catTitle":"Vans & Commercial","icon":"\ud83d\ude90"},{"label":"BMX","model":"bmx","cat":"Cycles","catTitle":"Bicycles","icon":"\ud83d\udeb2"},{"label":"Cruiser","model":"cruiser","cat":"Cycles","catTitle":"Bicycles","icon":"\ud83d\udeb2"},{"label":"Endurex","model":"tribike2","cat":"Cycles","catTitle":"Bicycles","icon":"\ud83d\udeb2"},{"label":"Fixter","model":"fixter","cat":"Cycles","catTitle":"Bicycles","icon":"\ud83d\udeb2"},{"label":"Scorcher","model":"scorcher","cat":"Cycles","catTitle":"Bicycles","icon":"\ud83d\udeb2"},{"label":"Tri-Cycles","model":"tribike3","cat":"Cycles","catTitle":"Bicycles","icon":"\ud83d\udeb2"},{"label":"Whippet","model":"tribike","cat":"Cycles","catTitle":"Bicycles","icon":"\ud83d\udeb2"},{"label":"Brute Stockade","model":"stockade","cat":"Trucks","catTitle":"Heavy Trucks","icon":"\ud83d\ude9b"},{"label":"Brute Stockade Snow","model":"stockade3","cat":"Trucks","catTitle":"Heavy Trucks","icon":"\ud83d\ude9b"},{"label":"HVY Biff","model":"biff","cat":"Trucks","catTitle":"Heavy Trucks","icon":"\ud83d\ude9b"},{"label":"JoBuilt Hauler","model":"hauler","cat":"Trucks","catTitle":"Heavy Trucks","icon":"\ud83d\ude9b"},{"label":"JoBuilt Phantom","model":"phantom","cat":"Trucks","catTitle":"Heavy Trucks","icon":"\ud83d\ude9b"},{"label":"Maibatsu Mule","model":"mule","cat":"Trucks","catTitle":"Heavy Trucks","icon":"\ud83d\ude9b"},{"label":"Maibatsu Mule 2","model":"mule2","cat":"Trucks","catTitle":"Heavy Trucks","icon":"\ud83d\ude9b"},{"label":"MTL Packer","model":"packer","cat":"Trucks","catTitle":"Heavy Trucks","icon":"\ud83d\ude9b"},{"label":"MTL Pounder","model":"pounder","cat":"Trucks","catTitle":"Heavy Trucks","icon":"\ud83d\ude9b"},{"label":"Vapid Benson","model":"benson","cat":"Trucks","catTitle":"Heavy Trucks","icon":"\ud83d\ude9b"},{"label":"Brute Tipper","model":"tiptruck","cat":"Industrial","catTitle":"Industrial & Mining","icon":"\ud83c\udfd7\ufe0f"},{"label":"Dock Handler","model":"handler","cat":"Industrial","catTitle":"Industrial & Mining","icon":"\ud83c\udfd7\ufe0f"},{"label":"HVY Cutter","model":"cutter","cat":"Industrial","catTitle":"Industrial & Mining","icon":"\ud83c\udfd7\ufe0f"},{"label":"HVY Dozer","model":"bulldozer","cat":"Industrial","catTitle":"Industrial & Mining","icon":"\ud83c\udfd7\ufe0f"},{"label":"HVY Dump","model":"dump","cat":"Industrial","catTitle":"Industrial & Mining","icon":"\ud83c\udfd7\ufe0f"},{"label":"HVY Mixer","model":"mixer","cat":"Industrial","catTitle":"Industrial & Mining","icon":"\ud83c\udfd7\ufe0f"},{"label":"HVY Mixer 2","model":"mixer2","cat":"Industrial","catTitle":"Industrial & Mining","icon":"\ud83c\udfd7\ufe0f"},{"label":"JoBuilt Rubble","model":"rubble","cat":"Industrial","catTitle":"Industrial & Mining","icon":"\ud83c\udfd7\ufe0f"},{"label":"MTL Flatbed","model":"flatbed","cat":"Industrial","catTitle":"Industrial & Mining","icon":"\ud83c\udfd7\ufe0f"},{"label":"Tipper","model":"tiptruck2","cat":"Industrial","catTitle":"Industrial & Mining","icon":"\ud83c\udfd7\ufe0f"},{"label":"Cable Car","model":"cablecar","cat":"Trains","catTitle":"Trains & Rail","icon":"\ud83d\ude86"},{"label":"Container Car","model":"freightcont1","cat":"Trains","catTitle":"Trains & Rail","icon":"\ud83d\ude86"},{"label":"Container Car 2","model":"freightcont2","cat":"Trains","catTitle":"Trains & Rail","icon":"\ud83d\ude86"},{"label":"Freight","model":"freight","cat":"Trains","catTitle":"Trains & Rail","icon":"\ud83d\ude86"},{"label":"Freight Car","model":"freightcar","cat":"Trains","catTitle":"Trains & Rail","icon":"\ud83d\ude86"},{"label":"Grain Car","model":"freightgrain","cat":"Trains","catTitle":"Trains & Rail","icon":"\ud83d\ude86"},{"label":"Metro","model":"metrotrain","cat":"Trains","catTitle":"Trains & Rail","icon":"\ud83d\ude86"},{"label":"Tanker Car","model":"tankercar","cat":"Trains","catTitle":"Trains & Rail","icon":"\ud83d\ude86"},{"label":"Airtug","model":"airtug","cat":"Utility","catTitle":"Utility & Maintenance","icon":"\ud83d\ude9c"},{"label":"Bunker Caddy","model":"caddy2","cat":"Utility","catTitle":"Utility & Maintenance","icon":"\ud83d\ude9c"},{"label":"Caddy","model":"caddy","cat":"Utility","catTitle":"Utility & Maintenance","icon":"\ud83d\ude9c"},{"label":"Docktug","model":"docktug","cat":"Utility","catTitle":"Utility & Maintenance","icon":"\ud83d\ude9c"},{"label":"HVY Forklift","model":"forklift","cat":"Utility","catTitle":"Utility & Maintenance","icon":"\ud83d\ude9c"},{"label":"Mower","model":"mower","cat":"Utility","catTitle":"Utility & Maintenance","icon":"\ud83d\ude9c"},{"label":"Ripley","model":"ripley","cat":"Utility","catTitle":"Utility & Maintenance","icon":"\ud83d\ude9c"},{"label":"Scrap Truck","model":"scrap","cat":"Utility","catTitle":"Utility & Maintenance","icon":"\ud83d\ude9c"},{"label":"Stanley Fieldmaster","model":"tractor2","cat":"Utility","catTitle":"Utility & Maintenance","icon":"\ud83d\ude9c"},{"label":"Stanley Snow Fieldmaster","model":"tractor3","cat":"Utility","catTitle":"Utility & Maintenance","icon":"\ud83d\ude9c"},{"label":"Towtruck","model":"towtruck","cat":"Utility","catTitle":"Utility & Maintenance","icon":"\ud83d\ude9c"},{"label":"Towtruck 2","model":"towtruck2","cat":"Utility","catTitle":"Utility & Maintenance","icon":"\ud83d\ude9c"},{"label":"Tractor","model":"tractor","cat":"Utility","catTitle":"Utility & Maintenance","icon":"\ud83d\ude9c"},{"label":"Utility Pickup","model":"utillitruck2","cat":"Utility","catTitle":"Utility & Maintenance","icon":"\ud83d\ude9c"},{"label":"Utility Truck","model":"utillitruck","cat":"Utility","catTitle":"Utility & Maintenance","icon":"\ud83d\ude9c"},{"label":"Utility Van","model":"utillitruck3","cat":"Utility","catTitle":"Utility & Maintenance","icon":"\ud83d\ude9c"},{"label":"Vapid Sadler","model":"sadler","cat":"Utility","catTitle":"Utility & Maintenance","icon":"\ud83d\ude9c"},{"label":"Vapid Sadler Snow","model":"sadler2","cat":"Utility","catTitle":"Utility & Maintenance","icon":"\ud83d\ude9c"},{"label":"Army Tanker","model":"armytanker","cat":"Trailers","catTitle":"Trailers","icon":"\ud83d\ude9a"},{"label":"Army Trailer","model":"armytrailer","cat":"Trailers","catTitle":"Trailers","icon":"\ud83d\ude9a"},{"label":"Army Trailer 2","model":"armytrailer2","cat":"Trailers","catTitle":"Trailers","icon":"\ud83d\ude9a"},{"label":"Bale Trailer","model":"baletrailer","cat":"Trailers","catTitle":"Trailers","icon":"\ud83d\ude9a"},{"label":"Boat Trailer","model":"boattrailer","cat":"Trailers","catTitle":"Trailers","icon":"\ud83d\ude9a"},{"label":"Car Carrier","model":"tr2","cat":"Trailers","catTitle":"Trailers","icon":"\ud83d\ude9a"},{"label":"Car Carrier 2","model":"tr3","cat":"Trailers","catTitle":"Trailers","icon":"\ud83d\ude9a"},{"label":"Car Carrier 3","model":"tr4","cat":"Trailers","catTitle":"Trailers","icon":"\ud83d\ude9a"},{"label":"Dock Trailer","model":"docktrailer","cat":"Trailers","catTitle":"Trailers","icon":"\ud83d\ude9a"},{"label":"Flat Trailer","model":"trflat","cat":"Trailers","catTitle":"Trailers","icon":"\ud83d\ude9a"},{"label":"Freight Trailer","model":"freighttrailer","cat":"Trailers","catTitle":"Trailers","icon":"\ud83d\ude9a"},{"label":"Grain Trailer","model":"graintrailer","cat":"Trailers","catTitle":"Trailers","icon":"\ud83d\ude9a"},{"label":"Log Trailer","model":"trailerlogs","cat":"Trailers","catTitle":"Trailers","icon":"\ud83d\ude9a"},{"label":"Prop Trailer","model":"proptrailer","cat":"Trailers","catTitle":"Trailers","icon":"\ud83d\ude9a"},{"label":"Rake Trailer","model":"raketrailer","cat":"Trailers","catTitle":"Trailers","icon":"\ud83d\ude9a"},{"label":"Small Trailer","model":"trailersmall","cat":"Trailers","catTitle":"Trailers","icon":"\ud83d\ude9a"},{"label":"Tanker","model":"tanker","cat":"Trailers","catTitle":"Trailers","icon":"\ud83d\ude9a"},{"label":"Trailer","model":"trailers","cat":"Trailers","catTitle":"Trailers","icon":"\ud83d\ude9a"},{"label":"Trailer 2","model":"trailers2","cat":"Trailers","catTitle":"Trailers","icon":"\ud83d\ude9a"},{"label":"Trailer 3","model":"trailers3","cat":"Trailers","catTitle":"Trailers","icon":"\ud83d\ude9a"},{"label":"TV Trailer","model":"tvtrailer","cat":"Trailers","catTitle":"Trailers","icon":"\ud83d\ude9a"},{"label":"Dodo","model":"dodo","cat":"Special","catTitle":"Special & Unique","icon":"\u2b50"},{"label":"Duke O'Death","model":"duke2","cat":"Special","catTitle":"Special & Unique","icon":"\u2b50"},{"label":"Kraken","model":"kraken","cat":"Special","catTitle":"Special & Unique","icon":"\u2b50"},{"label":"Pegassi Zentorno","model":"zentorno","cat":"Supercars","catTitle":"Supercars","icon":"\ud83c\udfce\ufe0f"},{"label":"Progen T20","model":"t20","cat":"Supercars","catTitle":"Supercars","icon":"\ud83c\udfce\ufe0f"},{"label":"Grotti Turismo R","model":"turismor","cat":"Supercars","catTitle":"Supercars","icon":"\ud83c\udfce\ufe0f"},{"label":"Pegassi Osiris","model":"osiris","cat":"Supercars","catTitle":"Supercars","icon":"\ud83c\udfce\ufe0f"},{"label":"Karin Kuruma","model":"kuruma2","cat":"Fast cars","catTitle":"Sports & Tuners","icon":"\ud83c\udfc1"},{"label":"HVY Insurgent","model":"insurgent","cat":"Off-road","catTitle":"Off-Road & Dunes","icon":"\ud83e\uddd7"},{"label":"Cheval Marshall","model":"monster","cat":"Off-road","catTitle":"Off-Road & Dunes","icon":"\ud83e\uddd7"},{"label":"Shitzu Hakuchou","model":"hakuchou","cat":"Motorcycles","catTitle":"Motorcycles & Bikes","icon":"\ud83c\udfcd\ufe0f"},{"label":"Dinka Enduro","model":"enduro","cat":"Motorcycles","catTitle":"Motorcycles & Bikes","icon":"\ud83c\udfcd\ufe0f"},{"label":"Progen GP1","model":"gp1","cat":"Supercars","catTitle":"Supercars","icon":"\ud83c\udfce\ufe0f"}];
  const VEHICLE_CATEGORIES = [{"id":"Algerian","title":"Algerian Cars","icon":"\ud83c\udde9\ud83c\uddff","desc":"Police S\u00fbret\u00e9, Gendarmerie 4x4, B.R.I., Protection Civile, Symbol, Dacia, Clio, Hilux, Hamoud, Taxi","count":17},{"id":"Supercars","title":"Supercars","icon":"\ud83c\udfce\ufe0f","desc":"Adder, Cheetah, Entity XF, Infernus, Vacca, Voltic, Zentorno, T20","count":12},{"id":"Fast cars","title":"Sports & Tuners","icon":"\ud83c\udfc1","desc":"Elegy RH8, Banshee, Sultan, Buffalo, Carbonizzare, Jester","count":20},{"id":"Classics","title":"Sports Classics","icon":"\ud83d\udcfb","desc":"Tornado, Stinger, Z-Type, Roosevelt, JB 700, Monroe","count":11},{"id":"Muscle","title":"Muscle Cars","icon":"\ud83d\udcaa","desc":"Dominator, Gauntlet, Sabre Turbo, Buccaneer, Ruiner, Vigero","count":11},{"id":"SUVs","title":"SUVs & 4x4s","icon":"\ud83d\ude99","desc":"Dubsta, Baller, Cavalcade, Patriot, Granger, Rocoto","count":19},{"id":"Sedans","title":"Sedans & Saloons","icon":"\ud83d\ude97","desc":"Schafter, Tailgater, Emperor, Super Diamond, Stretch Limo","count":21},{"id":"Coupes","title":"Coupes & Cabrio","icon":"\ud83d\ude98","desc":"Exemplar, Cognoscenti, Felon, F620, Sentinel, Oracle","count":12},{"id":"Compacts","title":"Compacts & Hatch","icon":"\ud83d\ude99","desc":"Blista, Dilettante, Panto, Prairie, Issi, Rhapsody","count":5},{"id":"Motorcycles","title":"Motorcycles & Bikes","icon":"\ud83c\udfcd\ufe0f","desc":"Bati 801, Sanchez, Akuma, Hakuchou, Hexer, PCJ-600","count":17},{"id":"Off-road","title":"Off-Road & Dunes","icon":"\ud83e\uddd7","desc":"Dune Buggy, Sandking, Bodhi, Insurgent, Monster, Rebel","count":17},{"id":"Emergency","title":"Emergency & Police","icon":"\ud83d\udea8","desc":"Police Cruiser, Interceptor, FIB Buffalo, Ambulance, Firetruck","count":18},{"id":"Military","title":"Military & Armed","icon":"\ud83c\udf96\ufe0f","desc":"Rhino Tank, Crusader, Barracks, Barracks Semi","count":4},{"id":"Service","title":"Service & Transit","icon":"\ud83d\ude8c","desc":"City Bus, Taxi, Dashound, Airport Bus, Trashmaster","count":7},{"id":"Airplanes","title":"Planes & Jets","icon":"\u2708\ufe0f","desc":"Lazer Jet, Luxor, Cargo Plane, Shamal, Mallard, Titan","count":12},{"id":"Helicopters","title":"Helicopters","icon":"\ud83d\ude81","desc":"Buzzard Attack Chopper, Annihilator, Maverick, Cargobob, Frogger","count":11},{"id":"Boats","title":"Boats & Marine","icon":"\ud83d\udea4","desc":"Jetmax, Seashark, Marquis, Speeder, Dinghy, Submersible","count":11},{"id":"Vans","title":"Vans & Commercial","icon":"\ud83d\ude90","desc":"Speedo, Burrito, Surfer, Gang Burrito, Youga, Boxville","count":26},{"id":"Cycles","title":"Bicycles","icon":"\ud83d\udeb2","desc":"BMX, Cruiser, Endurex, Fixter, Scorcher, Whippet","count":7},{"id":"Trucks","title":"Heavy Trucks","icon":"\ud83d\ude9b","desc":"Hauler, Phantom, Packer, Pounder, Mule, Benson, Biff","count":10},{"id":"Industrial","title":"Industrial & Mining","icon":"\ud83c\udfd7\ufe0f","desc":"Dozer, Dump Truck, Cutter, Tipper, Rubble, Mixer","count":10},{"id":"Utility","title":"Utility & Maintenance","icon":"\ud83d\ude9c","desc":"Golf Caddy, Tractor, Forklift, Lawn Mower, Towtruck, Sadler","count":18},{"id":"Trains","title":"Trains & Rail","icon":"\ud83d\ude86","desc":"Freight Train, Container Car, Tanker, Cable Car","count":8},{"id":"Trailers","title":"Trailers","icon":"\ud83d\ude9a","desc":"Tanker, Boat Trailer, Freight Trailer, Army Trailer","count":21},{"id":"Special","title":"Special & Unique","icon":"\u2b50","desc":"Blimp, Space Docker, Duke O'Death, Kraken Sub","count":3}];
  const SKINS = [{"label":"Franklin Clinton","model":"player_one","cat":"Protagonists","sub":"Main Story","icon":"\u2b50"},{"label":"Michael De Santa","model":"player_zero","cat":"Protagonists","sub":"Main Story","icon":"\u2b50"},{"label":"Trevor Philips","model":"player_two","cat":"Protagonists","sub":"Main Story","icon":"\u2b50"},{"label":"GTA Online Male","model":"mp_m_freemode_01","cat":"Protagonists","sub":"GTA Online","icon":"\ud83d\udc64"},{"label":"GTA Online Female","model":"mp_f_freemode_01","cat":"Protagonists","sub":"GTA Online","icon":"\ud83d\udc69"},{"label":"Abigail","model":"ig_abigail","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Amanda","model":"ig_amandatownley","cat":"Story","sub":"De Santa Family","icon":"\ud83c\udfe1"},{"label":"Andreas","model":"ig_andreas","cat":"Story","sub":"Villains & FIB","icon":"\ud83d\udd75\ufe0f"},{"label":"Ashley","model":"ig_ashley","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Ballas OG","model":"ig_ballasog","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Bankman","model":"ig_bankman","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Barry","model":"ig_barry","cat":"Story","sub":"Strangers & Freaks","icon":"\ud83c\udfaa"},{"label":"Best Men","model":"ig_bestmen","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Beverly","model":"ig_beverly","cat":"Story","sub":"Strangers & Freaks","icon":"\ud83c\udfaa"},{"label":"Brad","model":"ig_brad","cat":"Story","sub":"Key Associates","icon":"\ud83e\udd1d"},{"label":"Bride","model":"ig_bride","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Car3guy1","model":"ig_car3guy1","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Car3guy2","model":"ig_car3guy2","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Casey","model":"ig_casey","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Chef","model":"ig_chef","cat":"Story","sub":"Key Associates","icon":"\ud83e\udd1d"},{"label":"Cheng Sr","model":"ig_chengsr","cat":"Story","sub":"Villains & FIB","icon":"\ud83d\udd75\ufe0f"},{"label":"Chris Formage","model":"ig_chrisformage","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Clay","model":"ig_clay","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Clay Pain","model":"ig_claypain","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Cletus","model":"ig_cletus","cat":"Story","sub":"Strangers & Freaks","icon":"\ud83c\udfaa"},{"label":"Dale","model":"ig_dale","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Dave Norton","model":"ig_davenorton","cat":"Story","sub":"Villains & FIB","icon":"\ud83d\udd75\ufe0f"},{"label":"Denise","model":"ig_denise","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Devin","model":"ig_devin","cat":"Story","sub":"Villains & FIB","icon":"\ud83d\udd75\ufe0f"},{"label":"Dom","model":"ig_dom","cat":"Story","sub":"Strangers & Freaks","icon":"\ud83c\udfaa"},{"label":"Dr Friedlander","model":"ig_drfriedlander","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Dreyfuss","model":"ig_dreyfuss","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Fabien","model":"ig_fabien","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"FBI Suit 1","model":"ig_fbisuit_01","cat":"Story","sub":"Villains & FIB","icon":"\ud83d\udd75\ufe0f"},{"label":"Floyd","model":"ig_floyd","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Groom","model":"ig_groom","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Hao","model":"ig_hao","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Hunter","model":"ig_hunter","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Janet","model":"ig_janet","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"JAY Norris","model":"ig_jay_norris","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Jewel Ass","model":"ig_jewelass","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Jimmy Boston","model":"ig_jimmyboston","cat":"Story","sub":"De Santa Family","icon":"\ud83c\udfe1"},{"label":"Jimmy Di Santo","model":"ig_jimmydisanto","cat":"Story","sub":"De Santa Family","icon":"\ud83c\udfe1"},{"label":"Joe Minute Man","model":"ig_joeminuteman","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Johnny Klebitz","model":"ig_johnnyklebitz","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Josef","model":"ig_josef","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Josh","model":"ig_josh","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Kerry Mc Intosh","model":"ig_kerrymcintosh","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Lamar","model":"ig_lamardavis","cat":"Story","sub":"Key Associates","icon":"\ud83e\udd1d"},{"label":"Lazlow","model":"ig_lazlow","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Lester","model":"ig_lestercrest","cat":"Story","sub":"Key Associates","icon":"\ud83e\udd1d"},{"label":"Life Invad 1","model":"ig_lifeinvad_01","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Life Invad 2","model":"ig_lifeinvad_02","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Magenta","model":"ig_magenta","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Manuel","model":"ig_manuel","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Marnie","model":"ig_marnie","cat":"Story","sub":"Strangers & Freaks","icon":"\ud83c\udfaa"},{"label":"Mary Ann","model":"ig_maryann","cat":"Story","sub":"Strangers & Freaks","icon":"\ud83c\udfaa"},{"label":"Maude","model":"ig_maude","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Michelle","model":"ig_michelle","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Milton","model":"ig_milton","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Molly","model":"ig_molly","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Mrk","model":"ig_mrk","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Mrs Phillips","model":"ig_mrsphillips","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"MRS Thornhill","model":"ig_mrs_thornhill","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Natalia","model":"ig_natalia","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Nigel","model":"ig_nigel","cat":"Story","sub":"Strangers & Freaks","icon":"\ud83c\udfaa"},{"label":"O'Neil","model":"ig_oneil","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Old Man1A","model":"ig_old_man1a","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Old Man2","model":"ig_old_man2","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Omega","model":"ig_omega","cat":"Story","sub":"Strangers & Freaks","icon":"\ud83c\udfaa"},{"label":"Orleans","model":"ig_orleans","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Ortega","model":"ig_ortega","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Paper","model":"ig_paper","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Patricia","model":"ig_patricia","cat":"Story","sub":"De Santa Family","icon":"\ud83c\udfe1"},{"label":"Priest","model":"ig_priest","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Prol Sec 2","model":"ig_prolsec_02","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Ramp Gang","model":"ig_ramp_gang","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Ramp Hic","model":"ig_ramp_hic","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Ramp Hipster","model":"ig_ramp_hipster","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Ramp Mex","model":"ig_ramp_mex","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Rocco Pelosi","model":"ig_roccopelosi","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Ron","model":"ig_nervousron","cat":"Story","sub":"Key Associates","icon":"\ud83e\udd1d"},{"label":"Russian Drunk","model":"ig_russiandrunk","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Screen Writer","model":"ig_screen_writer","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Siemon Yetarian","model":"ig_siemonyetarian","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Solomon","model":"ig_solomon","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Steve Hains","model":"ig_stevehains","cat":"Story","sub":"Villains & FIB","icon":"\ud83d\udd75\ufe0f"},{"label":"Stretch","model":"ig_stretch","cat":"Story","sub":"Key Associates","icon":"\ud83e\udd1d"},{"label":"Talina","model":"ig_talina","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Tanisha","model":"ig_tanisha","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Tao Cheng","model":"ig_taocheng","cat":"Story","sub":"Villains & FIB","icon":"\ud83d\udd75\ufe0f"},{"label":"Taos Translator","model":"ig_taostranslator","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Tennis Coach","model":"ig_tenniscoach","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Terry","model":"ig_terry","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Tom Epsilon","model":"ig_tomepsilon","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Tonya","model":"ig_tonya","cat":"Story","sub":"Strangers & Freaks","icon":"\ud83c\udfaa"},{"label":"Tracy Di Santo","model":"ig_tracydisanto","cat":"Story","sub":"De Santa Family","icon":"\ud83c\udfe1"},{"label":"Traffic Warden","model":"ig_trafficwarden","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Tyler Dix","model":"ig_tylerdix","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Wade","model":"ig_wade","cat":"Story","sub":"Key Associates","icon":"\ud83e\udd1d"},{"label":"Zimbor","model":"ig_zimbor","cat":"Story","sub":"Story Characters","icon":"\ud83c\udfac"},{"label":"Air Hostess 1","model":"s_f_y_airhostess_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Air Worker","model":"s_m_y_airworker","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Ammu City 1","model":"s_m_y_ammucity_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Ammu Country","model":"s_m_m_ammucountry","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Armoured 1","model":"s_m_m_armoured_01","cat":"Services","sub":"Military & Security","icon":"\ud83c\udf96\ufe0f"},{"label":"Armoured 2","model":"s_m_m_armoured_02","cat":"Services","sub":"Military & Security","icon":"\ud83c\udf96\ufe0f"},{"label":"Army Mech 1","model":"s_m_y_armymech_01","cat":"Services","sub":"Military & Security","icon":"\ud83c\udf96\ufe0f"},{"label":"Auto Shop 1","model":"s_m_m_autoshop_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Auto Shop 2","model":"s_m_m_autoshop_02","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Autopsy 1","model":"s_m_y_autopsy_01","cat":"Services","sub":"Medical & Fire","icon":"\ud83d\ude91"},{"label":"Barman 1","model":"s_m_y_barman_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Bartender 1","model":"s_f_y_bartender_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Bay Watch 1","model":"s_m_y_baywatch_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Baywatch 1","model":"s_f_y_baywatch_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Black Ops 1","model":"s_m_y_blackops_01","cat":"Services","sub":"Military & Security","icon":"\ud83c\udf96\ufe0f"},{"label":"Black Ops 2","model":"s_m_y_blackops_02","cat":"Services","sub":"Military & Security","icon":"\ud83c\udf96\ufe0f"},{"label":"Bouncer 1","model":"s_m_m_bouncer_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Bus Boy 1","model":"s_m_y_busboy_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Chef 1","model":"s_m_y_chef_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Chem Sec 1","model":"s_m_m_chemsec_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"CIA Sec 1","model":"s_m_m_ciasec_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Clown 1","model":"s_m_y_clown_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Cntry Bar 1","model":"s_m_m_cntrybar_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Construct 1","model":"s_m_y_construct_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Construct 2","model":"s_m_y_construct_02","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Cop 1","model":"s_f_y_cop_01","cat":"Services","sub":"Police & SWAT","icon":"\ud83d\udc6e"},{"label":"Cop 1 2","model":"s_m_y_cop_01","cat":"Services","sub":"Police & SWAT","icon":"\ud83d\udc6e"},{"label":"Dealer 1","model":"s_m_y_dealer_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Devin Sec 1","model":"s_m_y_devinsec_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Dock Work 1","model":"s_m_m_dockwork_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Dock Work 1 2","model":"s_m_y_dockwork_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Doctor 1","model":"s_m_m_doctor_01","cat":"Services","sub":"Medical & Fire","icon":"\ud83d\ude91"},{"label":"Doorman 1","model":"s_m_y_doorman_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"DW Service 1","model":"s_m_y_dwservice_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"DW Service 2","model":"s_m_y_dwservice_02","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Factory 1","model":"s_f_y_factory_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Factory 1 2","model":"s_m_y_factory_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Fembarber","model":"s_f_m_fembarber","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"FIB Office 1","model":"s_m_m_fiboffice_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"FIB Office 2","model":"s_m_m_fiboffice_02","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Fireman 1","model":"s_m_y_fireman_01","cat":"Services","sub":"Medical & Fire","icon":"\ud83d\ude91"},{"label":"Gaffer 1","model":"s_m_m_gaffer_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Garbage","model":"s_m_y_garbage","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Gardener 1","model":"s_m_m_gardener_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Gen Transport","model":"s_m_m_gentransport","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Grip 1","model":"s_m_y_grip_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Hair Dress 1","model":"s_m_m_hairdress_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"High Sec 1","model":"s_m_m_highsec_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"High Sec 2","model":"s_m_m_highsec_02","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Hooker 1","model":"s_f_y_hooker_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Hooker 2","model":"s_f_y_hooker_02","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Hooker 3","model":"s_f_y_hooker_03","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Hway Cop 1","model":"s_m_y_hwaycop_01","cat":"Services","sub":"Police & SWAT","icon":"\ud83d\udc6e"},{"label":"Janitor","model":"s_m_m_janitor","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Lat Handy 1","model":"s_m_m_lathandy_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Life Invad 1","model":"s_m_m_lifeinvad_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Linecook","model":"s_m_m_linecook","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"LS Metro 1","model":"s_m_m_lsmetro_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Maid 1","model":"s_f_m_maid_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Mariachi 1","model":"s_m_m_mariachi_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Marine 1","model":"s_m_m_marine_01","cat":"Services","sub":"Military & Security","icon":"\ud83c\udf96\ufe0f"},{"label":"Marine 1 2","model":"s_m_y_marine_01","cat":"Services","sub":"Military & Security","icon":"\ud83c\udf96\ufe0f"},{"label":"Marine 2","model":"s_m_m_marine_02","cat":"Services","sub":"Military & Security","icon":"\ud83c\udf96\ufe0f"},{"label":"Marine 2 2","model":"s_m_y_marine_02","cat":"Services","sub":"Military & Security","icon":"\ud83c\udf96\ufe0f"},{"label":"Marine 3","model":"s_m_y_marine_03","cat":"Services","sub":"Military & Security","icon":"\ud83c\udf96\ufe0f"},{"label":"Migrant 1","model":"s_f_y_migrant_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Migrant 1 2","model":"s_m_m_migrant_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Mime","model":"s_m_y_mime","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Mov Alien 1","model":"s_m_m_movalien_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Mov Prem 1","model":"s_f_y_movprem_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Mov Prem 1 2","model":"s_m_m_movprem_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Mov Space 1","model":"s_m_m_movspace_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Paramedic 1","model":"s_m_m_paramedic_01","cat":"Services","sub":"Medical & Fire","icon":"\ud83d\ude91"},{"label":"Pest Cont 1","model":"s_m_y_pestcont_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Pilot 1","model":"s_m_m_pilot_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Pilot 1 2","model":"s_m_y_pilot_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Pilot 2","model":"s_m_m_pilot_02","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Postal 1","model":"s_m_m_postal_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Postal 2","model":"s_m_m_postal_02","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Pris Guard 1","model":"s_m_m_prisguard_01","cat":"Services","sub":"Police & SWAT","icon":"\ud83d\udc6e"},{"label":"Pris Muscl 1","model":"s_m_y_prismuscl_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Prisoner 1","model":"s_m_y_prisoner_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Ranger 1","model":"s_f_y_ranger_01","cat":"Services","sub":"Police & SWAT","icon":"\ud83d\udc6e"},{"label":"Ranger 1 2","model":"s_m_y_ranger_01","cat":"Services","sub":"Police & SWAT","icon":"\ud83d\udc6e"},{"label":"Robber 1","model":"s_m_y_robber_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"S M O Busker 1","model":"s_m_o_busker_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Scientist 1","model":"s_m_m_scientist_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Scrubs 1","model":"s_f_y_scrubs_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Security 1","model":"s_m_m_security_01","cat":"Services","sub":"Police & SWAT","icon":"\ud83d\udc6e"},{"label":"Sheriff 1","model":"s_f_y_sheriff_01","cat":"Services","sub":"Police & SWAT","icon":"\ud83d\udc6e"},{"label":"Sheriff 1 2","model":"s_m_y_sheriff_01","cat":"Services","sub":"Police & SWAT","icon":"\ud83d\udc6e"},{"label":"Shop HIGH","model":"s_f_m_shop_high","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Shop LOW","model":"s_f_y_shop_low","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Shop MASK","model":"s_m_y_shop_mask","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Shop MID","model":"s_f_y_shop_mid","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Snow Cop 1","model":"s_m_m_snowcop_01","cat":"Services","sub":"Police & SWAT","icon":"\ud83d\udc6e"},{"label":"Str Perf 1","model":"s_m_m_strperf_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Str Preach 1","model":"s_m_m_strpreach_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Str Vend 1","model":"s_m_y_strvend_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Str Vend 1 2","model":"s_m_m_strvend_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Stripper 1","model":"s_f_y_stripper_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Stripper 2","model":"s_f_y_stripper_02","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Stripper Lite","model":"s_f_y_stripperlite","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Swat 1","model":"s_m_y_swat_01","cat":"Services","sub":"Police & SWAT","icon":"\ud83d\udc6e"},{"label":"Sweat Shop 1","model":"s_f_m_sweatshop_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Sweat Shop 1 2","model":"s_f_y_sweatshop_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Trucker 1","model":"s_m_m_trucker_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Ups 1","model":"s_m_m_ups_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Ups 2","model":"s_m_m_ups_02","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Uscg 1","model":"s_m_y_uscg_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Valet 1","model":"s_m_y_valet_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Waiter 1","model":"s_m_y_waiter_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Win Clean 1","model":"s_m_y_winclean_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"X Mech 1","model":"s_m_y_xmech_01","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"X Mech 2","model":"s_m_y_xmech_02","cat":"Services","sub":"City Services","icon":"\ud83d\udc77"},{"label":"Arm Boss 1","model":"g_m_m_armboss_01","cat":"Gangs","sub":"Mob & Cartels","icon":"\ud83d\udd76\ufe0f"},{"label":"Arm Goon 1","model":"g_m_m_armgoon_01","cat":"Gangs","sub":"Mob & Cartels","icon":"\ud83d\udd76\ufe0f"},{"label":"Arm Goon 2","model":"g_m_y_armgoon_02","cat":"Gangs","sub":"Mob & Cartels","icon":"\ud83d\udd76\ufe0f"},{"label":"Arm Lieut 1","model":"g_m_m_armlieut_01","cat":"Gangs","sub":"Mob & Cartels","icon":"\ud83d\udd76\ufe0f"},{"label":"Azteca 1","model":"g_m_y_azteca_01","cat":"Gangs","sub":"Vagos & Aztecas","icon":"\ud83d\udfe1"},{"label":"Balla East 1","model":"g_m_y_ballaeast_01","cat":"Gangs","sub":"The Ballas","icon":"\ud83d\udfe3"},{"label":"Balla Orig 1","model":"g_m_y_ballaorig_01","cat":"Gangs","sub":"The Ballas","icon":"\ud83d\udfe3"},{"label":"Balla Sout 1","model":"g_m_y_ballasout_01","cat":"Gangs","sub":"The Ballas","icon":"\ud83d\udfe3"},{"label":"Ballas 1","model":"g_f_y_ballas_01","cat":"Gangs","sub":"The Ballas","icon":"\ud83d\udfe3"},{"label":"Chem Work 1","model":"g_m_m_chemwork_01","cat":"Gangs","sub":"Mob & Cartels","icon":"\ud83d\udd76\ufe0f"},{"label":"Chi Boss 1","model":"g_m_m_chiboss_01","cat":"Gangs","sub":"Mob & Cartels","icon":"\ud83d\udd76\ufe0f"},{"label":"Chi Cold 1","model":"g_m_m_chicold_01","cat":"Gangs","sub":"Mob & Cartels","icon":"\ud83d\udd76\ufe0f"},{"label":"Chi Goon 1","model":"g_m_m_chigoon_01","cat":"Gangs","sub":"Mob & Cartels","icon":"\ud83d\udd76\ufe0f"},{"label":"Chi Goon 2","model":"g_m_m_chigoon_02","cat":"Gangs","sub":"Mob & Cartels","icon":"\ud83d\udd76\ufe0f"},{"label":"Fam CA 1","model":"g_m_y_famca_01","cat":"Gangs","sub":"The Families","icon":"\ud83d\udfe2"},{"label":"Fam DNF 1","model":"g_m_y_famdnf_01","cat":"Gangs","sub":"The Families","icon":"\ud83d\udfe2"},{"label":"Fam For 1","model":"g_m_y_famfor_01","cat":"Gangs","sub":"The Families","icon":"\ud83d\udfe2"},{"label":"Families 1","model":"g_f_y_families_01","cat":"Gangs","sub":"The Families","icon":"\ud83d\udfe2"},{"label":"Kor Boss 1","model":"g_m_m_korboss_01","cat":"Gangs","sub":"Mob & Cartels","icon":"\ud83d\udd76\ufe0f"},{"label":"Kor Lieut 1","model":"g_m_y_korlieut_01","cat":"Gangs","sub":"Mob & Cartels","icon":"\ud83d\udd76\ufe0f"},{"label":"Korean 1","model":"g_m_y_korean_01","cat":"Gangs","sub":"Mob & Cartels","icon":"\ud83d\udd76\ufe0f"},{"label":"Korean 2","model":"g_m_y_korean_02","cat":"Gangs","sub":"Mob & Cartels","icon":"\ud83d\udd76\ufe0f"},{"label":"Lost 1","model":"g_f_y_lost_01","cat":"Gangs","sub":"The Lost MC","icon":"\ud83c\udfcd\ufe0f"},{"label":"Lost 1 2","model":"g_m_y_lost_01","cat":"Gangs","sub":"The Lost MC","icon":"\ud83c\udfcd\ufe0f"},{"label":"Lost 2","model":"g_m_y_lost_02","cat":"Gangs","sub":"The Lost MC","icon":"\ud83c\udfcd\ufe0f"},{"label":"Lost 3","model":"g_m_y_lost_03","cat":"Gangs","sub":"The Lost MC","icon":"\ud83c\udfcd\ufe0f"},{"label":"Mex Boss 1","model":"g_m_m_mexboss_01","cat":"Gangs","sub":"Mob & Cartels","icon":"\ud83d\udd76\ufe0f"},{"label":"Mex Boss 2","model":"g_m_m_mexboss_02","cat":"Gangs","sub":"Mob & Cartels","icon":"\ud83d\udd76\ufe0f"},{"label":"Mex Gang 1","model":"g_m_y_mexgang_01","cat":"Gangs","sub":"Mob & Cartels","icon":"\ud83d\udd76\ufe0f"},{"label":"Mex Goon 1","model":"g_m_y_mexgoon_01","cat":"Gangs","sub":"Mob & Cartels","icon":"\ud83d\udd76\ufe0f"},{"label":"Mex Goon 2","model":"g_m_y_mexgoon_02","cat":"Gangs","sub":"Mob & Cartels","icon":"\ud83d\udd76\ufe0f"},{"label":"Mex Goon 3","model":"g_m_y_mexgoon_03","cat":"Gangs","sub":"Mob & Cartels","icon":"\ud83d\udd76\ufe0f"},{"label":"Polo Goon 1","model":"g_m_y_pologoon_01","cat":"Gangs","sub":"Mob & Cartels","icon":"\ud83d\udd76\ufe0f"},{"label":"Polo Goon 2","model":"g_m_y_pologoon_02","cat":"Gangs","sub":"Mob & Cartels","icon":"\ud83d\udd76\ufe0f"},{"label":"Salva Boss 1","model":"g_m_y_salvaboss_01","cat":"Gangs","sub":"Mob & Cartels","icon":"\ud83d\udd76\ufe0f"},{"label":"Salva Goon 1","model":"g_m_y_salvagoon_01","cat":"Gangs","sub":"Mob & Cartels","icon":"\ud83d\udd76\ufe0f"},{"label":"Salva Goon 2","model":"g_m_y_salvagoon_02","cat":"Gangs","sub":"Mob & Cartels","icon":"\ud83d\udd76\ufe0f"},{"label":"Salva Goon 3","model":"g_m_y_salvagoon_03","cat":"Gangs","sub":"Mob & Cartels","icon":"\ud83d\udd76\ufe0f"},{"label":"Str Punk 1","model":"g_m_y_strpunk_01","cat":"Gangs","sub":"Mob & Cartels","icon":"\ud83d\udd76\ufe0f"},{"label":"Str Punk 2","model":"g_m_y_strpunk_02","cat":"Gangs","sub":"Mob & Cartels","icon":"\ud83d\udd76\ufe0f"},{"label":"Vagos 1","model":"g_f_y_vagos_01","cat":"Gangs","sub":"Vagos & Aztecas","icon":"\ud83d\udfe1"},{"label":"A Cult 1","model":"a_m_m_acult_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"A Cult 1 2","model":"a_m_y_acult_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"A Cult 1 3","model":"a_m_o_acult_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"A Cult 2","model":"a_m_y_acult_02","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"A Cult 2 2","model":"a_m_o_acult_02","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Afri Amer 1","model":"a_m_m_afriamer_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Beach 1","model":"a_m_m_beach_01","cat":"Civilians","sub":"Beach & Fitness","icon":"\ud83c\udfd6\ufe0f"},{"label":"Beach 1 2","model":"a_m_y_beach_01","cat":"Civilians","sub":"Beach & Fitness","icon":"\ud83c\udfd6\ufe0f"},{"label":"Beach 1 3","model":"a_m_o_beach_01","cat":"Civilians","sub":"Beach & Fitness","icon":"\ud83c\udfd6\ufe0f"},{"label":"Beach 2","model":"a_m_m_beach_02","cat":"Civilians","sub":"Beach & Fitness","icon":"\ud83c\udfd6\ufe0f"},{"label":"Beach 2 2","model":"a_m_y_beach_02","cat":"Civilians","sub":"Beach & Fitness","icon":"\ud83c\udfd6\ufe0f"},{"label":"Beach 3","model":"a_m_y_beach_03","cat":"Civilians","sub":"Beach & Fitness","icon":"\ud83c\udfd6\ufe0f"},{"label":"Beach Vesp 1","model":"a_m_y_beachvesp_01","cat":"Civilians","sub":"Beach & Fitness","icon":"\ud83c\udfd6\ufe0f"},{"label":"Beach Vesp 2","model":"a_m_y_beachvesp_02","cat":"Civilians","sub":"Beach & Fitness","icon":"\ud83c\udfd6\ufe0f"},{"label":"Bev Hills 1","model":"a_m_m_bevhills_01","cat":"Civilians","sub":"Business & Wealthy","icon":"\ud83d\udcbc"},{"label":"Bev Hills 1 2","model":"a_m_y_bevhills_01","cat":"Civilians","sub":"Business & Wealthy","icon":"\ud83d\udcbc"},{"label":"Bev Hills 2","model":"a_m_m_bevhills_02","cat":"Civilians","sub":"Business & Wealthy","icon":"\ud83d\udcbc"},{"label":"Bev Hills 2 2","model":"a_m_y_bevhills_02","cat":"Civilians","sub":"Business & Wealthy","icon":"\ud83d\udcbc"},{"label":"Break Dance 1","model":"a_m_y_breakdance_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Busi Cas 1","model":"a_m_y_busicas_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Business 1","model":"a_m_y_business_01","cat":"Civilians","sub":"Business & Wealthy","icon":"\ud83d\udcbc"},{"label":"Business 1 2","model":"a_m_m_business_01","cat":"Civilians","sub":"Business & Wealthy","icon":"\ud83d\udcbc"},{"label":"Business 2","model":"a_m_y_business_02","cat":"Civilians","sub":"Business & Wealthy","icon":"\ud83d\udcbc"},{"label":"Business 3","model":"a_m_y_business_03","cat":"Civilians","sub":"Business & Wealthy","icon":"\ud83d\udcbc"},{"label":"Cyclist 1","model":"a_m_y_cyclist_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"D Hill 1","model":"a_m_y_dhill_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Downtown 1","model":"a_m_y_downtown_01","cat":"Civilians","sub":"Business & Wealthy","icon":"\ud83d\udcbc"},{"label":"East SA 1","model":"a_m_m_eastsa_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"East SA 1 2","model":"a_m_y_eastsa_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"East SA 2","model":"a_m_m_eastsa_02","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"East SA 2 2","model":"a_m_y_eastsa_02","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Epsilon 1","model":"a_m_y_epsilon_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Epsilon 2","model":"a_m_y_epsilon_02","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Farmer 1","model":"a_m_m_farmer_01","cat":"Civilians","sub":"Rural & Country","icon":"\ud83d\ude9c"},{"label":"Fat Latin 1","model":"a_m_m_fatlatin_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Gay 1","model":"a_m_y_gay_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Gay 2","model":"a_m_y_gay_02","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Gen Fat 1","model":"a_m_m_genfat_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Gen Fat 2","model":"a_m_m_genfat_02","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Gen Street 1","model":"a_m_y_genstreet_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Gen Street 1 2","model":"a_m_o_genstreet_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Gen Street 2","model":"a_m_y_genstreet_02","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Golfer 1","model":"a_m_m_golfer_01","cat":"Civilians","sub":"Business & Wealthy","icon":"\ud83d\udcbc"},{"label":"Golfer 1 2","model":"a_m_y_golfer_01","cat":"Civilians","sub":"Business & Wealthy","icon":"\ud83d\udcbc"},{"label":"Has Jew 1","model":"a_m_m_hasjew_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Has Jew 1 2","model":"a_m_y_hasjew_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Hiker 1","model":"a_m_y_hiker_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Hillbilly 1","model":"a_m_m_hillbilly_01","cat":"Civilians","sub":"Rural & Country","icon":"\ud83d\ude9c"},{"label":"Hillbilly 2","model":"a_m_m_hillbilly_02","cat":"Civilians","sub":"Rural & Country","icon":"\ud83d\ude9c"},{"label":"Hippy 1","model":"a_m_y_hippy_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Hipster 1","model":"a_m_y_hipster_01","cat":"Civilians","sub":"Subcultures & Youth","icon":"\ud83d\udef9"},{"label":"Hipster 2","model":"a_m_y_hipster_02","cat":"Civilians","sub":"Subcultures & Youth","icon":"\ud83d\udef9"},{"label":"Hipster 3","model":"a_m_y_hipster_03","cat":"Civilians","sub":"Subcultures & Youth","icon":"\ud83d\udef9"},{"label":"Indian 1","model":"a_m_m_indian_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Indian 1 2","model":"a_m_y_indian_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Jetski 1","model":"a_m_y_jetski_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Juggalo 1","model":"a_m_y_juggalo_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"K Town 1","model":"a_m_m_ktown_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"K Town 1 2","model":"a_m_y_ktown_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"K Town 1 3","model":"a_m_o_ktown_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"K Town 2","model":"a_m_y_ktown_02","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Latino 1","model":"a_m_y_latino_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Malibu 1","model":"a_m_m_malibu_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Meth Head 1","model":"a_m_y_methhead_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Mex Cntry 1","model":"a_m_m_mexcntry_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Mex Labor 1","model":"a_m_m_mexlabor_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Mex Thug 1","model":"a_m_y_mexthug_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Moto X 1","model":"a_m_y_motox_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Moto X 2","model":"a_m_y_motox_02","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Muscl Beac 1","model":"a_m_y_musclbeac_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Muscl Beac 2","model":"a_m_y_musclbeac_02","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"OG Boss 1","model":"a_m_m_og_boss_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Paparazzi 1","model":"a_m_m_paparazzi_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Polynesian 1","model":"a_m_m_polynesian_01","cat":"Civilians","sub":"Subcultures & Youth","icon":"\ud83d\udef9"},{"label":"Polynesian 1 2","model":"a_m_y_polynesian_01","cat":"Civilians","sub":"Subcultures & Youth","icon":"\ud83d\udef9"},{"label":"Prol Host 1","model":"a_m_m_prolhost_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Road Cyc 1","model":"a_m_y_roadcyc_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Runner 1","model":"a_m_y_runner_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Runner 2","model":"a_m_y_runner_02","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Rur Meth 1","model":"a_m_m_rurmeth_01","cat":"Civilians","sub":"Subcultures & Youth","icon":"\ud83d\udef9"},{"label":"Salton 1","model":"a_m_m_salton_01","cat":"Civilians","sub":"Rural & Country","icon":"\ud83d\ude9c"},{"label":"Salton 1 2","model":"a_m_y_salton_01","cat":"Civilians","sub":"Rural & Country","icon":"\ud83d\ude9c"},{"label":"Salton 1 3","model":"a_m_o_salton_01","cat":"Civilians","sub":"Rural & Country","icon":"\ud83d\ude9c"},{"label":"Salton 2","model":"a_m_m_salton_02","cat":"Civilians","sub":"Rural & Country","icon":"\ud83d\ude9c"},{"label":"Salton 3","model":"a_m_m_salton_03","cat":"Civilians","sub":"Rural & Country","icon":"\ud83d\ude9c"},{"label":"Salton 4","model":"a_m_m_salton_04","cat":"Civilians","sub":"Rural & Country","icon":"\ud83d\ude9c"},{"label":"Skater 1","model":"a_m_m_skater_01","cat":"Civilians","sub":"Subcultures & Youth","icon":"\ud83d\udef9"},{"label":"Skater 1 2","model":"a_m_y_skater_01","cat":"Civilians","sub":"Subcultures & Youth","icon":"\ud83d\udef9"},{"label":"Skater 2","model":"a_m_y_skater_02","cat":"Civilians","sub":"Subcultures & Youth","icon":"\ud83d\udef9"},{"label":"Skidrow 1","model":"a_m_m_skidrow_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"So Cen Lat 1","model":"a_m_m_socenlat_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Sou Cent 1","model":"a_m_m_soucent_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Sou Cent 1 2","model":"a_m_y_soucent_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Sou Cent 1 3","model":"a_m_o_soucent_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Sou Cent 2","model":"a_m_m_soucent_02","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Sou Cent 2 2","model":"a_m_y_soucent_02","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Sou Cent 2 3","model":"a_m_o_soucent_02","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Sou Cent 3","model":"a_m_m_soucent_03","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Sou Cent 3 2","model":"a_m_y_soucent_03","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Sou Cent 3 3","model":"a_m_o_soucent_03","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Sou Cent 4","model":"a_m_m_soucent_04","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Sou Cent 4 2","model":"a_m_y_soucent_04","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"St Bla 1","model":"a_m_y_stbla_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"St Bla 2","model":"a_m_y_stbla_02","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"St Lat 1","model":"a_m_y_stlat_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"St Lat 2","model":"a_m_m_stlat_02","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"St Whi 1","model":"a_m_y_stwhi_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"St Whi 2","model":"a_m_y_stwhi_02","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Sunbathe 1","model":"a_m_y_sunbathe_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Surfer 1","model":"a_m_y_surfer_01","cat":"Civilians","sub":"Beach & Fitness","icon":"\ud83c\udfd6\ufe0f"},{"label":"Tennis 1","model":"a_m_m_tennis_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Tourist 1","model":"a_m_m_tourist_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Tramp 1","model":"a_m_m_tramp_01","cat":"Civilians","sub":"Subcultures & Youth","icon":"\ud83d\udef9"},{"label":"Tramp 1 2","model":"a_m_o_tramp_01","cat":"Civilians","sub":"Subcultures & Youth","icon":"\ud83d\udef9"},{"label":"Tramp Beac 1","model":"a_m_m_trampbeac_01","cat":"Civilians","sub":"Subcultures & Youth","icon":"\ud83d\udef9"},{"label":"Tran Vest 1","model":"a_m_m_tranvest_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Tran Vest 2","model":"a_m_m_tranvest_02","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Vin Douche 1","model":"a_m_y_vindouche_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Vinewood 1","model":"a_m_y_vinewood_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Vinewood 2","model":"a_m_y_vinewood_02","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Vinewood 3","model":"a_m_y_vinewood_03","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Vinewood 4","model":"a_m_y_vinewood_04","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Yoga 1","model":"a_m_y_yoga_01","cat":"Civilians","sub":"Beach & Fitness","icon":"\ud83c\udfd6\ufe0f"},{"label":"Beach 1","model":"a_f_m_beach_01","cat":"Civilians","sub":"Beach & Fitness","icon":"\ud83c\udfd6\ufe0f"},{"label":"Beach 1 2","model":"a_f_y_beach_01","cat":"Civilians","sub":"Beach & Fitness","icon":"\ud83c\udfd6\ufe0f"},{"label":"Bev Hills 1","model":"a_f_m_bevhills_01","cat":"Civilians","sub":"Business & Wealthy","icon":"\ud83d\udcbc"},{"label":"Bev Hills 1 2","model":"a_f_y_bevhills_01","cat":"Civilians","sub":"Business & Wealthy","icon":"\ud83d\udcbc"},{"label":"Bev Hills 2","model":"a_f_m_bevhills_02","cat":"Civilians","sub":"Business & Wealthy","icon":"\ud83d\udcbc"},{"label":"Bev Hills 2 2","model":"a_f_y_bevhills_02","cat":"Civilians","sub":"Business & Wealthy","icon":"\ud83d\udcbc"},{"label":"Bev Hills 3","model":"a_f_y_bevhills_03","cat":"Civilians","sub":"Business & Wealthy","icon":"\ud83d\udcbc"},{"label":"Bev Hills 4","model":"a_f_y_bevhills_04","cat":"Civilians","sub":"Business & Wealthy","icon":"\ud83d\udcbc"},{"label":"Body Build 1","model":"a_f_m_bodybuild_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Business 1","model":"a_f_y_business_01","cat":"Civilians","sub":"Business & Wealthy","icon":"\ud83d\udcbc"},{"label":"Business 2","model":"a_f_m_business_02","cat":"Civilians","sub":"Business & Wealthy","icon":"\ud83d\udcbc"},{"label":"Business 2 2","model":"a_f_y_business_02","cat":"Civilians","sub":"Business & Wealthy","icon":"\ud83d\udcbc"},{"label":"Business 3","model":"a_f_y_business_03","cat":"Civilians","sub":"Business & Wealthy","icon":"\ud83d\udcbc"},{"label":"Business 4","model":"a_f_y_business_04","cat":"Civilians","sub":"Business & Wealthy","icon":"\ud83d\udcbc"},{"label":"Downtown 1","model":"a_f_m_downtown_01","cat":"Civilians","sub":"Business & Wealthy","icon":"\ud83d\udcbc"},{"label":"East SA 1","model":"a_f_m_eastsa_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"East SA 1 2","model":"a_f_y_eastsa_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"East SA 2","model":"a_f_m_eastsa_02","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"East SA 2 2","model":"a_f_y_eastsa_02","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"East SA 3","model":"a_f_y_eastsa_03","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Epsilon 1","model":"a_f_y_epsilon_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Fat Bla 1","model":"a_f_m_fatbla_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Fat Cult 1","model":"a_f_m_fatcult_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Fat White 1","model":"a_f_m_fatwhite_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Fitness 1","model":"a_f_y_fitness_01","cat":"Civilians","sub":"Beach & Fitness","icon":"\ud83c\udfd6\ufe0f"},{"label":"Fitness 2","model":"a_f_y_fitness_02","cat":"Civilians","sub":"Beach & Fitness","icon":"\ud83c\udfd6\ufe0f"},{"label":"Gen Hot 1","model":"a_f_y_genhot_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Gen Street 1","model":"a_f_o_genstreet_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Golfer 1","model":"a_f_y_golfer_01","cat":"Civilians","sub":"Business & Wealthy","icon":"\ud83d\udcbc"},{"label":"Hiker 1","model":"a_f_y_hiker_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Hippie 1","model":"a_f_y_hippie_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Hipster 1","model":"a_f_y_hipster_01","cat":"Civilians","sub":"Subcultures & Youth","icon":"\ud83d\udef9"},{"label":"Hipster 2","model":"a_f_y_hipster_02","cat":"Civilians","sub":"Subcultures & Youth","icon":"\ud83d\udef9"},{"label":"Hipster 3","model":"a_f_y_hipster_03","cat":"Civilians","sub":"Subcultures & Youth","icon":"\ud83d\udef9"},{"label":"Hipster 4","model":"a_f_y_hipster_04","cat":"Civilians","sub":"Subcultures & Youth","icon":"\ud83d\udef9"},{"label":"Indian 1","model":"a_f_o_indian_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Indian 1 2","model":"a_f_y_indian_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Juggalo 1","model":"a_f_y_juggalo_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"K Town 1","model":"a_f_m_ktown_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"K Town 1 2","model":"a_f_o_ktown_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"K Town 2","model":"a_f_m_ktown_02","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Prol Host 1","model":"a_f_m_prolhost_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Runner 1","model":"a_f_y_runner_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Rur Meth 1","model":"a_f_y_rurmeth_01","cat":"Civilians","sub":"Subcultures & Youth","icon":"\ud83d\udef9"},{"label":"Salton 1","model":"a_f_m_salton_01","cat":"Civilians","sub":"Rural & Country","icon":"\ud83d\ude9c"},{"label":"Salton 1 2","model":"a_f_o_salton_01","cat":"Civilians","sub":"Rural & Country","icon":"\ud83d\ude9c"},{"label":"SC Dressy 1","model":"a_f_y_scdressy_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Skater 1","model":"a_f_y_skater_01","cat":"Civilians","sub":"Subcultures & Youth","icon":"\ud83d\udef9"},{"label":"Skid Row 1","model":"a_f_m_skidrow_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Sou Cent 1","model":"a_f_m_soucent_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Sou Cent 1 2","model":"a_f_o_soucent_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Sou Cent 1 3","model":"a_f_y_soucent_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Sou Cent 2","model":"a_f_m_soucent_02","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Sou Cent 2 2","model":"a_f_o_soucent_02","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Sou Cent 2 3","model":"a_f_y_soucent_02","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Sou Cent 3","model":"a_f_y_soucent_03","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Sou Cent MC 1","model":"a_f_m_soucentmc_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Tennis 1","model":"a_f_y_tennis_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Topless 1","model":"a_f_y_topless_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Tourist 1","model":"a_f_m_tourist_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Tourist 1 2","model":"a_f_y_tourist_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Tourist 2","model":"a_f_y_tourist_02","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Tramp 1","model":"a_f_m_tramp_01","cat":"Civilians","sub":"Subcultures & Youth","icon":"\ud83d\udef9"},{"label":"Tramp Beac 1","model":"a_f_m_trampbeac_01","cat":"Civilians","sub":"Subcultures & Youth","icon":"\ud83d\udef9"},{"label":"Vinewood 1","model":"a_f_y_vinewood_01","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Vinewood 2","model":"a_f_y_vinewood_02","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Vinewood 3","model":"a_f_y_vinewood_03","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Vinewood 4","model":"a_f_y_vinewood_04","cat":"Civilians","sub":"Urban Citizens","icon":"\ud83d\udeb6"},{"label":"Yoga 1","model":"a_f_y_yoga_01","cat":"Civilians","sub":"Beach & Fitness","icon":"\ud83c\udfd6\ufe0f"},{"label":"Abner","model":"u_m_y_abner","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Aldinapoli","model":"u_m_m_aldinapoli","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Anton B","model":"u_m_y_antonb","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Baby D","model":"u_m_y_babyd","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Bank Man","model":"u_m_m_bankman","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Baygor","model":"u_m_y_baygor","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Bike Hire 1","model":"u_m_m_bikehire_01","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Biker Chic","model":"u_f_y_bikerchic","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Burger Drug 1","model":"u_m_y_burgerdrug_01","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Chip","model":"u_m_y_chip","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"COM Jane","model":"u_f_y_comjane","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Corpse 1","model":"u_f_m_corpse_01","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Corpse 1 2","model":"u_f_y_corpse_01","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Corpse 2","model":"u_f_y_corpse_02","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Cyclist 1","model":"u_m_y_cyclist_01","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Drowned 1","model":"u_f_m_drowned_01","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"FIB Architect","model":"u_m_m_fibarchitect","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"FIB Mugger 1","model":"u_m_y_fibmugger_01","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Film Director","model":"u_m_m_filmdirector","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Film Noir","model":"u_m_o_filmnoir","cat":"Special","sub":"Vinewood Icons","icon":"\u2b50"},{"label":"Fin Guru 1","model":"u_m_o_finguru_01","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Glen Stank 1","model":"u_m_m_glenstank_01","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Griff 1","model":"u_m_m_griff_01","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Guido 1","model":"u_m_y_guido_01","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Gun Vend 1","model":"u_m_y_gunvend_01","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Hippie 1","model":"u_m_y_hippie_01","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Hot Posh 1","model":"u_f_y_hotposh_01","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Impo Rage","model":"u_m_y_imporage","cat":"Special","sub":"Sci-Fi & Heroes","icon":"\ud83d\udef8"},{"label":"Jesus 1","model":"u_m_m_jesus_01","cat":"Special","sub":"Performers & Clowns","icon":"\ud83e\udd21"},{"label":"Jewel Ass 1","model":"u_f_y_jewelass_01","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Jewel Sec 1","model":"u_m_m_jewelsec_01","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Jewel Thief","model":"u_m_m_jewelthief","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Justin","model":"u_m_y_justin","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Mani","model":"u_m_y_mani","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Mark Fost","model":"u_m_m_markfost","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Military Bum","model":"u_m_y_militarybum","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Miranda","model":"u_f_m_miranda","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Mistress","model":"u_f_y_mistress","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Movie Star","model":"u_f_o_moviestar","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Paparazzi","model":"u_m_y_paparazzi","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Party 1","model":"u_m_y_party_01","cat":"Special","sub":"Vinewood Icons","icon":"\u2b50"},{"label":"Party Target","model":"u_m_m_partytarget","cat":"Special","sub":"Vinewood Icons","icon":"\u2b50"},{"label":"Pogo 1","model":"u_m_y_pogo_01","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Poppy Mich","model":"u_f_y_poppymich","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Princess","model":"u_f_y_princess","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Prisoner 1","model":"u_m_y_prisoner_01","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Pro Mourn 1","model":"u_f_m_promourn_01","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Pro Mourn 1 2","model":"u_m_m_promourn_01","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Prol Driver 1","model":"u_m_y_proldriver_01","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Prol Host 1","model":"u_f_o_prolhost_01","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Prol Sec 1","model":"u_m_m_prolsec_01","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Rival Pap","model":"u_m_m_rivalpap","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"RS Ranger 1","model":"u_m_y_rsranger_01","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"S Bike","model":"u_m_y_sbike","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Spy Actor","model":"u_m_m_spyactor","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Spy Actress","model":"u_f_y_spyactress","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Stag Grm 1","model":"u_m_y_staggrm_01","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Street Art 1","model":"u_m_m_streetart_01","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Tap Hill Billy","model":"u_m_o_taphillbilly","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Tattoo 1","model":"u_m_y_tattoo_01","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Tramp 1","model":"u_m_o_tramp_01","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Willy Fist","model":"u_m_m_willyfist","cat":"Special","sub":"Unique Citizens","icon":"\ud83c\udfad"},{"label":"Zombie 1","model":"u_m_y_zombie_01","cat":"Special","sub":"Performers & Clowns","icon":"\ud83e\udd21"},{"label":"Wild Boar","model":"a_c_boar","cat":"Animals","sub":"Wild Land","icon":"\ud83d\udc17"},{"label":"Cat","model":"a_c_cat_01","cat":"Animals","sub":"Dogs & Pets","icon":"\ud83d\udc31"},{"label":"Chickenhawk","model":"a_c_chickenhawk","cat":"Animals","sub":"Birds","icon":"\ud83e\udd85"},{"label":"Chimpanzee","model":"a_c_chimp","cat":"Animals","sub":"Primates","icon":"\ud83d\udc12"},{"label":"Chop (Rottweiler)","model":"a_c_chop","cat":"Animals","sub":"Dogs & Pets","icon":"\ud83d\udc15"},{"label":"Cormorant","model":"a_c_cormorant","cat":"Animals","sub":"Birds","icon":"\ud83e\udd86"},{"label":"Cow","model":"a_c_cow","cat":"Animals","sub":"Wild Land","icon":"\ud83d\udc04"},{"label":"Coyote","model":"a_c_coyote","cat":"Animals","sub":"Wild Land","icon":"\ud83d\udc3a"},{"label":"Crow","model":"a_c_crow","cat":"Animals","sub":"Birds","icon":"\ud83d\udc26"},{"label":"Deer","model":"a_c_deer","cat":"Animals","sub":"Wild Land","icon":"\ud83e\udd8c"},{"label":"Dolphin","model":"a_c_dolphin","cat":"Animals","sub":"Marine Life","icon":"\ud83d\udc2c"},{"label":"Fish","model":"a_c_fish","cat":"Animals","sub":"Marine Life","icon":"\ud83d\udc1f"},{"label":"Hen / Chicken","model":"a_c_hen","cat":"Animals","sub":"Birds","icon":"\ud83d\udc14"},{"label":"Humpback Whale","model":"a_c_humpback","cat":"Animals","sub":"Marine Life","icon":"\ud83d\udc0b"},{"label":"Husky Dog","model":"a_c_husky","cat":"Animals","sub":"Dogs & Pets","icon":"\ud83d\udc15"},{"label":"Killer Whale (Orca)","model":"a_c_killerwhale","cat":"Animals","sub":"Marine Life","icon":"\ud83d\udc0b"},{"label":"Mountain Lion (Cougar)","model":"a_c_mtlion","cat":"Animals","sub":"Wild Land","icon":"\ud83e\udd81"},{"label":"Pig","model":"a_c_pig","cat":"Animals","sub":"Wild Land","icon":"\ud83d\udc16"},{"label":"Pigeon","model":"a_c_pigeon","cat":"Animals","sub":"Birds","icon":"\ud83d\udc26"},{"label":"Poodle Dog","model":"a_c_poodle","cat":"Animals","sub":"Dogs & Pets","icon":"\ud83d\udc29"},{"label":"Pug Dog","model":"a_c_pug","cat":"Animals","sub":"Dogs & Pets","icon":"\ud83d\udc15"},{"label":"Rabbit","model":"a_c_rabbit_01","cat":"Animals","sub":"Wild Land","icon":"\ud83d\udc07"},{"label":"Rat","model":"a_c_rat","cat":"Animals","sub":"Wild Land","icon":"\ud83d\udc00"},{"label":"Golden Retriever","model":"a_c_retriever","cat":"Animals","sub":"Dogs & Pets","icon":"\ud83d\udc15"},{"label":"Rhesus Monkey","model":"a_c_rhesus","cat":"Animals","sub":"Primates","icon":"\ud83d\udc12"},{"label":"Rottweiler Dog","model":"a_c_rottweiler","cat":"Animals","sub":"Dogs & Pets","icon":"\ud83d\udc15"},{"label":"Seagull","model":"a_c_seagull","cat":"Animals","sub":"Birds","icon":"\ud83d\udd4a\ufe0f"},{"label":"Hammerhead Shark","model":"a_c_sharkhammer","cat":"Animals","sub":"Marine Life","icon":"\ud83e\udd88"},{"label":"Shepherd Dog","model":"a_c_shepherd","cat":"Animals","sub":"Dogs & Pets","icon":"\ud83d\udc15"},{"label":"Stingray","model":"a_c_stingray","cat":"Animals","sub":"Marine Life","icon":"\ud83d\udc21"},{"label":"Tiger Shark","model":"a_c_sharktiger","cat":"Animals","sub":"Marine Life","icon":"\ud83e\udd88"},{"label":"Westie Terrier","model":"a_c_westy","cat":"Animals","sub":"Dogs & Pets","icon":"\ud83d\udc15"}];

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
