// --- GTA V Web Trainer Hook ---
function installGtaTrainer(wasmExports) {
  const table = wasmExports["__indirect_function_table"] || (typeof wasmTable !== "undefined" ? wasmTable : null);
  const mem = (typeof wasmMemory !== "undefined" && wasmMemory) ? wasmMemory : (wasmExports["memory"] || null);
  if (!table || !mem) return;

  function tableGet(idx) {
    try { return table.get(BigInt(idx)); } catch (e) { return table.get(Number(idx)); }
  }
  function tableSet(idx, val) {
    try { table.set(BigInt(idx), val); } catch (e) { table.set(Number(idx), val); }
  }

  function joaat(s) {
    let h = 0;
    const str = String(s || "").toLowerCase();
    for (let i = 0; i < str.length; i++) {
      h += str.charCodeAt(i);
      h = (h + (h << 10)) >>> 0;
      h ^= (h >>> 6);
    }
    h = (h + (h << 3)) >>> 0;
    h ^= (h >>> 11);
    h = (h + (h << 15)) >>> 0;
    return h >>> 0;
  }

  let memBuf = null, I32, F32, U8, I64;
  function updateViews() {
    const b = (typeof wasmMemory !== "undefined" && wasmMemory && wasmMemory.buffer) ? wasmMemory.buffer : mem.buffer;
    if (b !== memBuf) {
      memBuf = b;
      I32 = new Int32Array(b);
      F32 = new Float32Array(b);
      U8 = new Uint8Array(b);
      I64 = new BigInt64Array(b);
    }
  }

  const enc = new TextEncoder();
  const dec = new TextDecoder();

  // Rate-limited diagnostics line to the dev server (burst of 30, then one every 2 s): a native that fails every tick used to POST /log ~50 times a second.
  let tlogTokens = 30, tlogT = 0;
  function tlog(msg) {
    const n = performance.now();
    tlogTokens = Math.min(30, tlogTokens + (n - tlogT) / 2000); tlogT = n;
    if (tlogTokens < 1) return;
    tlogTokens--;
    try { fetch("/log", { method: "POST", body: msg }).catch(() => {}); } catch (e) {}
  }
  function nat(slot, sig, args, refFloat) {
    updateViews();
    let sp = 0, rawAlloc = 0;
    try {
      sp = (typeof stackSave === "function") ? stackSave() : (wasmExports["emscripten_stack_get_current"] ? wasmExports["emscripten_stack_get_current"]() : 0);
    } catch (e) {}

    try {
      rawAlloc = (typeof stackAlloc === "function") ? stackAlloc(1536) : 0;
    } catch (e1) {
      try {
        rawAlloc = (typeof stackAlloc === "function") ? stackAlloc(1536n) : 0;
      } catch (e2) {}
    }
    if (!rawAlloc && wasmExports["_emscripten_stack_alloc"]) {
      try {
        rawAlloc = wasmExports["_emscripten_stack_alloc"](1536);
      } catch (e3) {
        try {
          rawAlloc = wasmExports["_emscripten_stack_alloc"](1536n);
        } catch (e4) {}
      }
    }

    const base = Number(rawAlloc);
    if (!base) {
      return { i: 0, f: 0, v: [0, 0, 0] };
    }

    const info = base, res = base + 32, par = base + 64, str = base + 768, cell = base + 1400;

    try {
      U8.fill(0, base, base + 1536);

      let p = par;
      let a = 0, outVecs = 0;
      let strPtr = str;

      if (sig && args) {
        for (let i = 0; i < sig.length; i++) {
          const c = sig[i];
          if (c === "i" || c === "b") {
            I32[p >> 2] = args[a++] | 0;
            p += 8;
          } else if (c === "f") {
            F32[p >> 2] = Number(args[a++]);
            p += 8;
          } else if (c === "v") {
            F32[p >> 2] = Number(args[a++]);
            F32[(p + 8) >> 2] = Number(args[a++]);
            F32[(p + 16) >> 2] = Number(args[a++]);
            p += 24;
          } else if (c === "s") {
            const bytes = enc.encode(String(args[a++])).subarray(0, 255);
            U8.set(bytes, strPtr);
            U8[strPtr + bytes.length] = 0;
            I64[p >> 3] = BigInt(strPtr);
            strPtr += (bytes.length + 8) & ~7;
            p += 8;
          } else if (c === "R") {
            F32[cell >> 2] = refFloat ? Number(refFloat.v || 0) : 0;
            I64[p >> 3] = BigInt(cell);
            p += 8;
          } else if (c === "P") {   // int passed by pointer (DELETE_OBJECT(Object*)): shares the "R" cell
            I32[cell >> 2] = args[a++] | 0;
            I64[p >> 3] = BigInt(cell);
            p += 8;
          } else if (c === "V") {   // out Vector3* (GET_MODEL_DIMENSIONS): read back into result.vo
            I64[p >> 3] = BigInt(cell + 8 + 24 * outVecs++);
            p += 8;
          } else if (c === "z") {   // null pointer
            I64[p >> 3] = 0n;
            p += 8;
          }
        }
      }

      const count = (p - par) >> 3;
      I64[info >> 3] = BigInt(res);
      I32[(info + 8) >> 2] = count;
      I64[(info + 16) >> 3] = BigInt(par);
      I32[(info + 24) >> 2] = 0;

      let fn = null;
      try { fn = (typeof getWasmTableEntry === "function") ? getWasmTableEntry(slot) : null; } catch (e) {}
      if (!fn) { try { fn = tableGet(slot); } catch (e) {} }
      if (!fn && typeof wasmTable !== "undefined" && wasmTable) {
        try { fn = wasmTable.get(BigInt(slot)); } catch (e) { try { fn = wasmTable.get(Number(slot)); } catch (e2) {} }
      }

      if (fn) {
        try {
          fn(BigInt(info));
        } catch (errBig) {
          try {
            fn(Number(info));
          } catch (errNum) {
            tlog("[trainer native err] slot=" + slot + " err=" + (errBig.message || errBig));
          }
        }
      } else {
        tlog("[trainer missing slot] " + slot);
      }

      updateViews();
      const outI = I32[res >> 2];
      const outF = F32[res >> 2];
      const outV = [F32[res >> 2], F32[(res + 8) >> 2], F32[(res + 16) >> 2]];

      if (refFloat) {
        refFloat.v = F32[cell >> 2];
      }

      // A native that fills a Vector3* writes it into the call context's temporary vectors (info + 64, 16 bytes each, count at info + 24) and leaves copying
      // them out to the caller (the script VM's CopyReferencedParametersOut), so read those when the pointed-to cells stayed empty.
      const vo = [], tempCount = I32[(info + 24) >> 2];
      for (let k = 0; k < outVecs; k++) {
        const q = cell + 8 + 24 * k, tq = info + 64 + 16 * k;
        const own = [F32[q >> 2], F32[(q + 8) >> 2], F32[(q + 16) >> 2]];
        vo.push(own.some((x) => x !== 0) || k >= tempCount ? own : [F32[tq >> 2], F32[(tq + 4) >> 2], F32[(tq + 8) >> 2]]);
      }
      return { i: outI, f: outF, v: outV, ci: I32[cell >> 2], vo };
    } finally {
      if (sp) {
        try {
          if (typeof stackRestore === "function") stackRestore(sp);
          else if (wasmExports["_emscripten_stack_restore"]) wasmExports["_emscripten_stack_restore"](sp);
        } catch (e1) {
          try {
            if (typeof stackRestore === "function") stackRestore(BigInt(sp));
            else if (wasmExports["_emscripten_stack_restore"]) wasmExports["_emscripten_stack_restore"](BigInt(sp));
          } catch (e2) {}
        }
      }
    }
  }

  // Exact native slots from Host/gta_natives.gen.h
  const N_GET_PLAYER_INDEX = 56445;
  const N_PLAYER_PED_ID = 56466;
  const N_GET_ENTITY_COORDS = 45996;
  const N_SET_ENTITY_COORDS = 46204;
  const N_SET_ENTITY_HEALTH = 46214;
  const N_GET_ENTITY_MAX_HEALTH = 46010;
  const N_SET_PED_ARMOUR = 54809;
  const N_SET_PLAYER_INVINCIBLE = 56502;
  const N_SET_PLAYER_WANTED_LEVEL = 56292;
  const N_SET_PLAYER_WANTED_LEVEL_NOW = 56296;
  const N_SET_MAX_WANTED_LEVEL = 56320;
  const N_CLEAR_PLAYER_WANTED_LEVEL = 56308;
  const N_GET_PLAYER_WANTED_LEVEL = 56318;
  const N_GIVE_WEAPON_TO_PED = 60682;
  const N_SET_SUPER_JUMP_THIS_FRAME = 49474;
  const N_SET_EXPLOSIVE_AMMO_THIS_FRAME = 49468;
  const N_SET_FIRE_AMMO_THIS_FRAME = 49470;
  const N_SET_EXPLOSIVE_MELEE_THIS_FRAME = 49472;
  const N_SET_RUN_SPRINT_MULTIPLIER_FOR_PLAYER = 56543;
  const N_SET_PLAYER_MODEL = 56266;
  const N_REQUEST_MODEL = 58014;
  const N_HAS_MODEL_LOADED = 58018;
  const N_SET_MODEL_AS_NO_LONGER_NEEDED = 58023;
  const N_CREATE_VEHICLE = 58959;
  const N_GET_ENTITY_HEADING = 46004;
  const N_SET_PED_INTO_VEHICLE = 54815;
  const N_GET_VEHICLE_PED_IS_IN = 54842;
  const N_IS_PED_IN_ANY_VEHICLE = 54753;
  const N_SET_VEHICLE_FIXED = 59619;
  const N_SET_VEHICLE_DIRT_LEVEL = 59504;
  const N_SET_VEHICLE_ON_GROUND_PROPERLY = 59000;
  const N_SET_CLOCK_TIME = 45410;
  const N_SET_WEATHER_TYPE_NOW_PERSIST = 48880;
  const N_SET_TIME_SCALE = 48818;
  const N_GET_FIRST_BLIP_INFO_ID = 47886;
  const N_DOES_BLIP_EXIST = 48047;
  const N_GET_BLIP_INFO_ID_COORD = 47890;
  const N_GET_GROUND_Z_FOR_3D_COORD = 48986;
  const N_SET_PED_INFINITE_AMMO_CLIP = 60678;
  const N_SET_ENTITY_INVINCIBLE = 46217;
  const N_GET_ENTITY_HEALTH = 46008;
  const N_SET_VEHICLE_FORWARD_SPEED = 59192;
  const N_IS_CONTROL_PRESSED = 54472;
  const N_DRAW_RECT = 46583;
  const N_SET_ENTITY_LOAD_COLLISION_FLAG = 46223;
  const N_HAS_COLLISION_LOADED_AROUND_ENTITY = 46225;
  const N_IS_ENTITY_WAITING_FOR_WORLD_COLLISION = 46126;
  const N_GET_ENTITY_PLAYER_IS_FREE_AIMING_AT = 56395;
  const N_HAS_PLAYER_DAMAGED_AT_LEAST_ONE_PED = 56533;
  const N_CLEAR_PLAYER_HAS_DAMAGED_AT_LEAST_ONE_PED = 56531;
  const N_IS_PED_DEAD_OR_DYING = 54763;
  const N_IS_PLAYER_FREE_AIMING = 56391;
  const N_IS_PAUSE_MENU_ACTIVE = 48470;
  const N_IS_DISABLED_CONTROL_PRESSED = 54492;
  const N_GET_ENTITY_SPEED_VECTOR = 46040;
  const N_SET_VEHICLE_ENGINE_ON = 59512;
  const N_GET_IS_LOADING_SCREEN_ACTIVE = 47342;
  const N_IS_PLAYER_PLAYING = 56326;
  const N_DOES_ENTITY_EXIST = 45952;
  const N_SET_PED_CAN_RAGDOLL = 55518;
  const N_SET_ENTITY_VISIBLE = 46243;
  const N_SET_VEHICLE_DENSITY_MULTIPLIER_THIS_FRAME = 59033;
  const N_SET_PED_DENSITY_MULTIPLIER_THIS_FRAME = 54849;
  const N_SET_RANDOM_VEHICLE_DENSITY_MULTIPLIER_THIS_FRAME = 59035;
  const N_SET_PARKED_VEHICLE_DENSITY_MULTIPLIER_THIS_FRAME = 59037;
  const N_SET_RIOT_MODE_ENABLED = 49446;
  const N_PAUSE_CLOCK = 45412;
  const N_RESTORE_PLAYER_STAMINA = 56413;
  const N_SET_GRAVITY_LEVEL = 49322;
  const N_STAT_SET_INT = 57349;
  const N_SET_VEHICLE_MOD = 59944;
  const N_GET_NUM_VEHICLE_MODS = 59950;
  const N_TOGGLE_VEHICLE_MOD = 59954;
  const N_SET_VEHICLE_COLOURS = 59098;
  const N_SET_VEHICLE_MOD_KIT = 59915;

  // Additional native slots
  const N_DELETE_ENTITY = 46149;
  const N_DELETE_VEHICLE = 58961;
  const N_SET_NIGHTVISION = 46684;
  const N_SET_SEETHROUGH = 46819;
  const N_CLEAR_AREA = 49047;
  const N_SET_PED_TO_RAGDOLL = 55503;
  const N_CLEAR_PED_BLOOD_DAMAGE_BY_ZONE = 55588;
  const N_CLEAR_PED_WETNESS = 55599;
  const N_CLEAR_PED_ENV_DIRT = 55606;
  const N_SET_SWIM_MULTIPLIER_FOR_PLAYER = 56541;
  const N_EXPLODE_VEHICLE = 59076;
  const N_SET_VEHICLE_DOORS_SHUT = 59250;
  const N_SET_VEHICLE_TYRES_CAN_BURST = 59253;
  const N_SET_VEHICLE_DOOR_OPEN = 59262;
  const N_SET_VEHICLE_REDUCE_GRIP = 59826;
  const N_REMOVE_ALL_PED_WEAPONS = 60686;
  const N_SET_ENTITY_VELOCITY = 46249;
  const N_SET_ENTITY_AS_NO_LONGER_NEEDED = 46183;
  const N_CREATE_OBJECT_NO_OFFSET = 54096, N_FREEZE_ENTITY_POSITION = 46153, N_SET_ENTITY_ROTATION = 46241, N_IS_MODEL_IN_CDIMAGE = 58025;

  // Algerian styling native slots
  const N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR = 59104;
  const N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR = 59112;
  const N_SET_VEHICLE_NUMBER_PLATE_TEXT = 59325;
  const N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX = 59332;
  const N_SET_VEHICLE_WINDOW_TINT = 59981;
  const N_SET_VEHICLE_EXTRA = 59651;
  const N_SET_VEHICLE_LIVERY = 59718;

  // Complete vehicle damage immunity & god mode native slots
  const N_SET_ENTITY_PROOFS = 46233;
  const N_SET_ENTITY_CAN_BE_DAMAGED = 46188;
  const N_SET_VEHICLE_CAN_BE_VISIBLY_DAMAGED = 59494;
  const N_SET_VEHICLE_STRONG = 59173;
  const N_SET_VEHICLE_CAN_BREAK = 59532;
  const N_SET_VEHICLE_WHEELS_CAN_BREAK = 59259;
  const N_SET_VEHICLE_CAN_DEFORM_WHEELS = 60123;
  const N_SET_VEHICLE_HAS_UNBREAKABLE_LIGHTS = 59496;
  const N_SET_VEHICLE_EXPLODES_ON_HIGH_EXPLOSION_DAMAGE = 59756;
  const N_SET_DISABLE_EXPLODE_FROM_BODY_DAMAGE_ON_COLLISION = 60441;
  const N_SET_DISABLE_VEHICLE_EXPLOSIONS_DAMAGE = 60536;
  const N_SET_VEHICLE_OCCUPANTS_TAKE_EXPLOSIVE_DAMAGE = 59678;
  const N_SET_VEHICLE_NO_EXPLOSION_DAMAGE_FROM_DRIVER = 60242;
  const N_SET_VEHICLE_ENGINE_CAN_DEGRADE = 60111;
  const N_SET_VEHICLE_CAN_ENGINE_MISSFIRE = 59623;
  const N_SET_VEHICLE_CAN_LEAK_OIL = 59625;
  const N_SET_VEHICLE_CAN_LEAK_PETROL = 59627;
  const N_SET_DISABLE_VEHICLE_PETROL_TANK_DAMAGE = 59631;
  const N_SET_VEHICLE_DAMAGE_SCALE = 60343;
  const N_SET_VEHICLE_DEFORMATION_FIXED = 59621;
  const N_GET_VEHICLE_BODY_HEALTH = 60291;
  const N_SET_VEHICLE_BODY_HEALTH = 60293;
  const N_GET_VEHICLE_ENGINE_HEALTH = 59680;
  const N_SET_VEHICLE_ENGINE_HEALTH = 59682;
  const N_GET_VEHICLE_PETROL_TANK_HEALTH = 59686;
  const N_SET_VEHICLE_PETROL_TANK_HEALTH = 59688;
  const N_SET_PED_CAN_FLY_THROUGH_WINDSCREEN = 55751;
  const N_SET_PED_CAN_BE_KNOCKED_OFF_VEHICLE = 55215;
  const N_GET_VEHICLE_PED_IS_USING = 55174;
  const N_DISABLE_VEHICLE_EXPLOSION_BREAK_OFF_PARTS = 60077;

  // Exact component and prop native slots
  const N_GET_PED_DRAWABLE_VARIATION = 55329;
  const N_GET_NUMBER_OF_PED_DRAWABLE_VARIATIONS = 55331;
  const N_GET_PED_TEXTURE_VARIATION = 55333;
  const N_GET_NUMBER_OF_PED_TEXTURE_VARIATIONS = 55335;
  const N_GET_NUMBER_OF_PED_PROP_DRAWABLE_VARIATIONS = 55337;
  const N_GET_NUMBER_OF_PED_PROP_TEXTURE_VARIATIONS = 55339;
  const N_SET_PED_COMPONENT_VARIATION = 55353;
  const N_SET_PED_RANDOM_COMPONENT_VARIATION = 55355;
  const N_SET_PED_RANDOM_PROPS = 55357;
  const N_SET_PED_DEFAULT_COMPONENT_VARIATION = 55359;
  const N_GET_PED_PROP_INDEX = 55451;
  const N_SET_PED_PROP_INDEX = 55453;
  const N_CLEAR_PED_PROP = 55457;
  const N_CLEAR_ALL_PED_PROPS = 55459;
  const N_GET_PED_PROP_TEXTURE_INDEX = 55463;


  // Menu redesign (19 Oct 2026): slots derived from the engine's own scrWrapped_<NATIVE> symbols (work/native-slots.json), checked against the known slots above
  const N_SET_POLICE_IGNORE_PLAYER = 56324;
  const N_SET_EVERYONE_IGNORE_PLAYER = 56328;
  const N_SET_PLAYER_WEAPON_DAMAGE_MODIFIER = 56673;
  const N_SET_PLAYER_MELEE_WEAPON_DAMAGE_MODIFIER = 56679;
  const N_SET_PLAYER_HEALTH_RECHARGE_MULTIPLIER = 56663;
  const N_SET_PLAYER_HEALTH_RECHARGE_MAX_PERCENT = 56667;
  const N_SET_PLAYER_NOISE_MULTIPLIER = 56723;
  const N_SET_PLAYER_SNEAKING_NOISE_MULTIPLIER = 56725;
  const N_SET_VEHICLE_CHEAT_POWER_INCREASE = 60024;
  const N_MODIFY_VEHICLE_TOP_SPEED = 60004;
  const N_SET_VEHICLE_NEON_ENABLED = 60277;
  const N_SET_VEHICLE_NEON_COLOUR = 60271;
  const N_SET_VEHICLE_GRAVITY = 60095;
  const N_SET_VEHICLE_DOORS_LOCKED = 59048;
  const N_LOWER_CONVERTIBLE_ROOF = 59659;
  const N_RAISE_CONVERTIBLE_ROOF = 59661;
  const N_SET_VEHICLE_TYRE_BURST = 59248;
  const N_SET_VEHICLE_TYRE_FIXED = 59323;
  const N_SET_VEHICLE_SIREN = 59165;
  const N_SET_ARTIFICIAL_LIGHTS_STATE = 46713;
  const N_GET_CLOCK_HOURS = 45419;
  const N_GET_CLOCK_MINUTES = 45421;
  const N_ADD_EXPLOSION = 46384;
  const N_CREATE_PED = 54737;
  const N_GET_PLAYER_GROUP = 56423;
  const N_SET_PED_AS_GROUP_MEMBER = 55049;
  const N_SET_PED_NEVER_LEAVES_GROUP = 55187;
  const N_SET_PED_RELATIONSHIP_GROUP_HASH = 55116;
  const N_IS_WEAPON_VALID = 60662;
  const N_GET_ENTITY_SPEED = 46038;
  const N_GET_OFFSET_FROM_ENTITY_IN_WORLD_COORDS = 46024;
  const N_SET_ALL_RANDOM_PEDS_FLEE = 56330;
  const N_SET_PLAYER_CAN_BE_HASSLED_BY_GANGS = 56401;
  const N_SET_CREATE_RANDOM_COPS = 55241;
  const N_DISPLAY_HUD = 47693;
  const N_DISPLAY_RADAR = 47699;
  const N_GET_CLOSEST_VEHICLE = 59450;
  const N_HAS_PED_GOT_WEAPON = 60664;
  const N_SET_PED_AMMO = 60674;
  const N_REMOVE_WEAPON_FROM_PED = 60688;
  const N_SET_CURRENT_PED_WEAPON = 60646;
  const N_GET_PED_ARMOUR = 54924;
  const N_SET_PED_ACCURACY = 54795;
  const N_SET_BLOCKING_OF_NON_TEMPORARY_EVENTS = 55474;

  const WEAPONS = [
    "WEAPON_PISTOL", "WEAPON_COMBATPISTOL", "WEAPON_APPISTOL", "WEAPON_PISTOL50",
    "WEAPON_MICROSMG", "WEAPON_SMG", "WEAPON_ASSAULTSMG", "WEAPON_ASSAULTRIFLE",
    "WEAPON_CARBINERIFLE", "WEAPON_ADVANCEDRIFLE", "WEAPON_MG", "WEAPON_COMBATMG",
    "WEAPON_PUMPSHOTGUN", "WEAPON_SAWNOFFSHOTGUN", "WEAPON_ASSAULTSHOTGUN",
    "WEAPON_BULLPUPSHOTGUN", "WEAPON_SNIPERRIFLE", "WEAPON_HEAVYSNIPER",
    "WEAPON_GRENADELAUNCHER", "WEAPON_RPG", "WEAPON_MINIGUN", "WEAPON_GRENADE",
    "WEAPON_STICKYBOMB", "WEAPON_MOLOTOV", "WEAPON_KNIFE", "WEAPON_BAT",
    "WEAPON_CROWBAR", "WEAPON_GOLFCLUB", "WEAPON_PARACHUTE"
  ];


  // Weapon catalog for the menu (index = category id sent in argInt of CMD 34). Unknown names are skipped via IS_WEAPON_VALID.
  const WEAPON_SETS = [
    ["WEAPON_PISTOL","WEAPON_COMBATPISTOL","WEAPON_APPISTOL","WEAPON_PISTOL50","WEAPON_SNSPISTOL","WEAPON_HEAVYPISTOL","WEAPON_VINTAGEPISTOL","WEAPON_STUNGUN","WEAPON_FLAREGUN","WEAPON_MARKSMANPISTOL"],
    ["WEAPON_MICROSMG","WEAPON_SMG","WEAPON_ASSAULTSMG","WEAPON_COMBATPDW","WEAPON_MACHINEPISTOL","WEAPON_MG","WEAPON_COMBATMG","WEAPON_GUSENBERG"],
    ["WEAPON_ASSAULTRIFLE","WEAPON_CARBINERIFLE","WEAPON_ADVANCEDRIFLE","WEAPON_SPECIALCARBINE","WEAPON_BULLPUPRIFLE"],
    ["WEAPON_PUMPSHOTGUN","WEAPON_SAWNOFFSHOTGUN","WEAPON_ASSAULTSHOTGUN","WEAPON_BULLPUPSHOTGUN","WEAPON_HEAVYSHOTGUN","WEAPON_MUSKET"],
    ["WEAPON_SNIPERRIFLE","WEAPON_HEAVYSNIPER","WEAPON_MARKSMANRIFLE"],
    ["WEAPON_GRENADELAUNCHER","WEAPON_RPG","WEAPON_MINIGUN","WEAPON_FIREWORK","WEAPON_RAILGUN","WEAPON_HOMINGLAUNCHER","WEAPON_COMPACTLAUNCHER"],
    ["WEAPON_GRENADE","WEAPON_STICKYBOMB","WEAPON_SMOKEGRENADE","WEAPON_BZGAS","WEAPON_MOLOTOV","WEAPON_PROXMINE","WEAPON_PETROLCAN","WEAPON_FIREEXTINGUISHER","WEAPON_FLARE","WEAPON_BALL","WEAPON_SNOWBALL"],
    ["WEAPON_KNIFE","WEAPON_NIGHTSTICK","WEAPON_HAMMER","WEAPON_BAT","WEAPON_CROWBAR","WEAPON_GOLFCLUB","WEAPON_BOTTLE","WEAPON_DAGGER","WEAPON_HATCHET","WEAPON_KNUCKLE","WEAPON_MACHETE","WEAPON_FLASHLIGHT","WEAPON_SWITCHBLADE","WEAPON_POOLCUE","WEAPON_WRENCH","WEAPON_BATTLEAXE"]
  ];

  function giveWeaponIfValid(ped, name, ammo, equip) {
    const h = joaat(name);
    if (!nat(N_IS_WEAPON_VALID, "i", [h]).i) return false;
    nat(N_GIVE_WEAPON_TO_PED, "iiibb", [ped, h, ammo, 0, equip ? 1 : 0]);
    return true;
  }

  function giveWeapons(ped) {
    for (let i = 0; i < WEAPONS.length; i++) {
      nat(N_GIVE_WEAPON_TO_PED, "iiibb", [ped, joaat(WEAPONS[i]), 9999, 0, 0]);
    }
  }

  let T32 = null, TF32 = null, TU8 = null;
  function getTrainerBuffer() {
    if (T32) return true;
    const sab = (typeof self !== "undefined" && self.__trainerSab) ? self.__trainerSab : ((typeof Module !== "undefined" && Module.trainerSab) ? Module.trainerSab : null);
    if (sab) {
      try {
        T32 = new Int32Array(sab);
        TF32 = new Float32Array(sab);
        TU8 = new Uint8Array(sab);
        Atomics.store(T32, 0, 0x47544154); // 'GTAT'
        tlog("[trainer buffer] initialized from SAB: len=" + sab.byteLength);
        return true;
      } catch (e) {
        tlog("[trainer buffer error] " + (e.message || e));
      }
    }
    return false;
  }

  function postEngineToast(msg) {
    if (!T32 || !TU8) return;
    const b = enc.encode(String(msg || "").slice(0, 95));
    TU8.fill(0, 28, 128);
    TU8.set(b, 28);
    Atomics.add(T32, 6, 1);
  }

  let appliedMask = 0, appliedMaskB = 0;
  const TB = 44, TB_APPLIED = 45;   // second toggle word (desired / applied) in the trainer SAB
  // Game mode, written by the page (homepage.html announceMode) into T32[56]: 0 not chosen yet, 1 Story Mode, 2 Sandbox, 3 Sandbox on env_test.
  // In Story Mode the trainer is passive: no sandbox session restore (it teleported the player to the saved sandbox spot and re-applied stored cheats while the
  // story script was setting the game up), no stored toggles, no aim-reticle overlay. Cheats still work when asked for through the menu. Story saves are the
  // game's own: storyAutosaveTick below makes sure they actually happen.
  const T_MODE = 56;
  const N_DO_AUTO_SAVE = 49117, N_IS_AUTO_SAVE_IN_PROGRESS = 49122, N_GET_MISSION_FLAG = 48822, N_GET_IS_AUTO_SAVE_OFF = 49119,
        N_DID_SAVE_COMPLETE_SUCCESSFULLY = 49068, N_IS_CUTSCENE_ACTIVE = 45499, N_IS_PLAYER_SWITCH_IN_PROGRESS = 58146, N_IS_SCREEN_FADED_OUT = 45108,
        N_IS_PLAYER_BEING_ARRESTED = 56437, N_IS_PLAYER_CONTROL_ON = 56428, N_GET_IS_DISPLAYING_SAVE_MESSAGE = 49120;
  const N_GET_ENTITY_MODEL = 46020, N_SET_ENTITY_HEADING = 46212, N_IS_MODEL_A_VEHICLE = 58033;
  const N_HAS_CODE_REQUESTED_AUTOSAVE = 49124, N_CLEAR_CODE_REQUESTED_AUTOSAVE = 49126, N_DOES_SCRIPT_EXIST = 57017, N_SCRIPT_THREADS_BY_HASH = 57041;
  const storyMode = () => !!T32 && Atomics.load(T32, T_MODE) === 1;
  const modeKnown = () => !!T32 && Atomics.load(T32, T_MODE) !== 0;
  let lastCrashThroughMs = 0, diagPrevSpeed = 0, diagLogged = 0, brakeHeldTicks = 0, lastBrakeMs = 0, cachedPlayer = -1, lastSuperJumpMs = 0, lastAimDrawMs = 0, aimShotT = -1e9, aimHitT = -1e9, aimKillT = -1e9, aimPrevShoot = false, aimLastEnt = 0, aimLastEntT = -1e9, aimHitEnt = 0, aimHitWatch = 0;
  let rainbowHue = 0, lastPowerVeh = 0, lastInvisVeh = 0, lastAntiGravVeh = 0;
  function hsvToRgb(h, sat, val) {
    const c = val * sat, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = val - c;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
  }
  let pendingModel = 0, pendingKind = "", pendingFrames = 0, pendingLabel = "", pendingStyle = 0;
  let teleportFrames = 0, tpX = 0, tpY = 0, tpTargetZ = 0;
  let lastGodVeh = 0;

  // Session persistence: position, skin, spawned vehicle and cheat toggles are autosaved to work/session-state.json (via /state) and restored once after boot.
  let restoreStage = -1;      // -1 fetching, 0..4 restoring, 9 done (autosave active)
  let restoreData = null, playingTicks = 0, restoreHeading = null, restoreT0 = 0, tpT0 = 0;
  let savedSkin = "", savedSkinHash = 0, spawnedVeh = 0, spawnedInfo = null;
  let persistErrs = 0, stateFetchT0 = 0, stateFetchTries = 0;
  function fetchSessionState() {
    stateFetchT0 = performance.now(); stateFetchTries++;
    try {
      fetch("/state", { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(j => {
        if (restoreStage >= 0) return;
        restoreData = (j && j.v === 1 && isFinite(j.x) && isFinite(j.y) && isFinite(j.z)) ? j : null;
        restoreStage = restoreData ? 0 : 9;
        tlog("[trainer persist] state " + (restoreData ? "loaded" : "none") + " (try " + stateFetchTries + ")");
      }).catch(() => { tlog("[trainer persist] state fetch failed (try " + stateFetchTries + ")"); });
    } catch (e) { tlog("[trainer persist] state fetch threw (try " + stateFetchTries + ")"); }
  }
  fetchSessionState();

  function applyVehicleGod(v, enabled, currentPed) {
    if (!v) return;
    if (enabled) {
      nat(N_SET_ENTITY_INVINCIBLE, "ib", [v, 1]);
      nat(N_SET_ENTITY_PROOFS, "ibbbbbbbb", [v, 1, 1, 1, 1, 1, 1, 1, 1]);
      nat(N_SET_ENTITY_CAN_BE_DAMAGED, "ib", [v, 0]);
      nat(N_SET_VEHICLE_CAN_BE_VISIBLY_DAMAGED, "ib", [v, 0]);
      nat(N_SET_VEHICLE_STRONG, "ib", [v, 1]);
      nat(N_SET_VEHICLE_CAN_BREAK, "ib", [v, 0]);
      nat(N_SET_VEHICLE_TYRES_CAN_BURST, "ib", [v, 0]);
      nat(N_SET_VEHICLE_WHEELS_CAN_BREAK, "ib", [v, 0]);
      nat(N_SET_VEHICLE_CAN_DEFORM_WHEELS, "ib", [v, 0]);
      nat(N_SET_VEHICLE_HAS_UNBREAKABLE_LIGHTS, "ib", [v, 1]);
      nat(N_SET_VEHICLE_EXPLODES_ON_HIGH_EXPLOSION_DAMAGE, "ib", [v, 0]);
      nat(N_SET_DISABLE_EXPLODE_FROM_BODY_DAMAGE_ON_COLLISION, "ib", [v, 1]);
      nat(N_SET_DISABLE_VEHICLE_EXPLOSIONS_DAMAGE, "ib", [v, 1]);
      nat(N_SET_VEHICLE_OCCUPANTS_TAKE_EXPLOSIVE_DAMAGE, "ib", [v, 0]);
      nat(N_SET_VEHICLE_NO_EXPLOSION_DAMAGE_FROM_DRIVER, "ib", [v, 1]);
      nat(N_SET_VEHICLE_ENGINE_CAN_DEGRADE, "ib", [v, 0]);
      nat(N_SET_VEHICLE_CAN_ENGINE_MISSFIRE, "ib", [v, 0]);
      nat(N_SET_VEHICLE_CAN_LEAK_OIL, "ib", [v, 0]);
      nat(N_SET_VEHICLE_CAN_LEAK_PETROL, "ib", [v, 0]);
      nat(N_SET_DISABLE_VEHICLE_PETROL_TANK_DAMAGE, "ib", [v, 1]);
      nat(N_SET_VEHICLE_DAMAGE_SCALE, "if", [v, 0.0]);
      nat(N_SET_VEHICLE_ENGINE_HEALTH, "if", [v, 1000.0]);
      nat(N_SET_VEHICLE_PETROL_TANK_HEALTH, "if", [v, 1000.0]);
      nat(N_SET_VEHICLE_BODY_HEALTH, "if", [v, 1000.0]);
      nat(N_SET_ENTITY_HEALTH, "ii", [v, 1000]);
      nat(N_SET_VEHICLE_DIRT_LEVEL, "if", [v, 0.0]);
      nat(N_DISABLE_VEHICLE_EXPLOSION_BREAK_OFF_PARTS, "", []);
      nat(N_SET_VEHICLE_FIXED, "i", [v]);
      nat(N_SET_VEHICLE_DEFORMATION_FIXED, "i", [v]);
      nat(N_SET_VEHICLE_ENGINE_ON, "ibbb", [v, 1, 1, 0]);
      if (currentPed) {
        nat(N_SET_PED_CAN_FLY_THROUGH_WINDSCREEN, "ib", [currentPed, 0]);
        nat(N_SET_PED_CAN_BE_KNOCKED_OFF_VEHICLE, "ii", [currentPed, 1]);
      }
    } else {
      nat(N_SET_ENTITY_INVINCIBLE, "ib", [v, 0]);
      nat(N_SET_ENTITY_PROOFS, "ibbbbbbbb", [v, 0, 0, 0, 0, 0, 0, 0, 0]);
      nat(N_SET_ENTITY_CAN_BE_DAMAGED, "ib", [v, 1]);
      nat(N_SET_VEHICLE_CAN_BE_VISIBLY_DAMAGED, "ib", [v, 1]);
      nat(N_SET_VEHICLE_STRONG, "ib", [v, 0]);
      nat(N_SET_VEHICLE_CAN_BREAK, "ib", [v, 1]);
      nat(N_SET_VEHICLE_TYRES_CAN_BURST, "ib", [v, 1]);
      nat(N_SET_VEHICLE_WHEELS_CAN_BREAK, "ib", [v, 1]);
      nat(N_SET_VEHICLE_CAN_DEFORM_WHEELS, "ib", [v, 1]);
      nat(N_SET_VEHICLE_HAS_UNBREAKABLE_LIGHTS, "ib", [v, 0]);
      nat(N_SET_VEHICLE_EXPLODES_ON_HIGH_EXPLOSION_DAMAGE, "ib", [v, 1]);
      nat(N_SET_DISABLE_EXPLODE_FROM_BODY_DAMAGE_ON_COLLISION, "ib", [v, 0]);
      nat(N_SET_DISABLE_VEHICLE_EXPLOSIONS_DAMAGE, "ib", [v, 0]);
      nat(N_SET_VEHICLE_OCCUPANTS_TAKE_EXPLOSIVE_DAMAGE, "ib", [v, 1]);
      nat(N_SET_VEHICLE_NO_EXPLOSION_DAMAGE_FROM_DRIVER, "ib", [v, 0]);
      nat(N_SET_VEHICLE_ENGINE_CAN_DEGRADE, "ib", [v, 1]);
      nat(N_SET_VEHICLE_DAMAGE_SCALE, "if", [v, 1.0]);
      if (currentPed) {
        nat(N_SET_PED_CAN_FLY_THROUGH_WINDSCREEN, "ib", [currentPed, 1]);
        nat(N_SET_PED_CAN_BE_KNOCKED_OFF_VEHICLE, "ii", [currentPed, 0]);
      }
    }
  }

  function applyAlgerianVehicleStyling(veh, styleId) {
    if (!veh || !styleId) return;
    try {
      switch (styleId) {
        case 1: // Police Algérienne (DGSN / Sûreté Nationale)
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 255, 255, 255]); // Blanc pur
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 0, 42, 110]); // Bleu police nationale
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "POLICE17"]);
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 0]);
          nat(N_SET_VEHICLE_WINDOW_TINT, "ii", [veh, 0]);
          nat(N_SET_VEHICLE_EXTRA, "iii", [veh, 1, 0]); // Enable lightbar
          nat(N_SET_VEHICLE_EXTRA, "iii", [veh, 2, 0]); // Enable bullbar
          break;
        case 2: // Gendarmerie Nationale 4x4 (Granger / Land Cruiser)
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 18, 55, 28]); // Vert gendarmerie
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 245, 245, 245]); // Blanc
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "GEND 16"]);
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 0]);
          nat(N_SET_VEHICLE_WINDOW_TINT, "ii", [veh, 3]); // Light smoke
          nat(N_SET_VEHICLE_EXTRA, "iii", [veh, 1, 0]);
          break;
        case 3: // Gendarmerie Mesa 4x4
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 18, 55, 28]);
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 245, 245, 245]);
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "GN-0016"]);
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 0]);
          nat(N_SET_VEHICLE_WINDOW_TINT, "ii", [veh, 3]);
          nat(N_SET_VEHICLE_EXTRA, "iii", [veh, 1, 0]);
          break;
        case 4: // B.R.I. Algérie Tactical
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 12, 12, 14]); // Midnight tactical black
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 10, 10, 10]);
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "BRI 16"]);
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 1]); // Black plate
          nat(N_SET_VEHICLE_WINDOW_TINT, "ii", [veh, 1]); // Pure black limo
          nat(N_SET_VEHICLE_MOD_KIT, "ii", [veh, 0]);
          nat(N_TOGGLE_VEHICLE_MOD, "iib", [veh, 18, 1]); // Turbo
          break;
        case 5: // Blindé B.R.I. Riot Van
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 15, 15, 18]); // Armor anthracite
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 10, 10, 10]);
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "BRI TACT"]);
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 1]);
          nat(N_SET_VEHICLE_WINDOW_TINT, "ii", [veh, 1]);
          break;
        case 6: // Protection Civile Algérie (14)
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 185, 15, 20]); // Rouge Protection Civile
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 255, 255, 255]); // Blanc
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "PC 14 DZ"]);
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 0]);
          nat(N_SET_VEHICLE_EXTRA, "iii", [veh, 1, 0]);
          break;
        case 7: // Renault Symbol DZ (Le Roi d'Oran)
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 248, 248, 250]); // Blanc Glacier Renault
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 240, 240, 242]);
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "12331 15"]); // Wilaya 31 Oran
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 0]);
          nat(N_SET_VEHICLE_WINDOW_TINT, "ii", [veh, 3]);
          break;
        case 8: // Dacia Sandero Stepway / Logan DZ
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 20, 50, 110]); // Bleu Cosmos Métallisé
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 30, 30, 35]); // Trim anthracite
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "45616 16"]); // Wilaya 16 Alger
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 0]);
          nat(N_SET_VEHICLE_WINDOW_TINT, "ii", [veh, 3]);
          break;
        case 9: // Renault Clio 4 RS DZ (Sport Hatch)
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 255, 210, 0]); // Jaune Sirius Renault Sport
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 10, 10, 10]); // Toit & rétros Noir Brillant
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "00716 18"]); // Wilaya 16 Alger
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 0]);
          nat(N_SET_VEHICLE_WINDOW_TINT, "ii", [veh, 2]); // Dark smoke
          nat(N_SET_VEHICLE_MOD_KIT, "ii", [veh, 0]);
          nat(N_TOGGLE_VEHICLE_MOD, "iib", [veh, 18, 1]); // Turbo
          nat(N_TOGGLE_VEHICLE_MOD, "iib", [veh, 22, 1]); // Xenon
          break;
        case 10: // Peugeot 208 DZ (Lion d'Alger)
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 160, 165, 172]); // Gris Aluminium Métallisé
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 15, 15, 15]); // Noir Perla Nera
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "09916 17"]); // Wilaya 16 Alger
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 0]);
          nat(N_SET_VEHICLE_WINDOW_TINT, "ii", [veh, 2]);
          break;
        case 11: // Toyota Hilux DZ (Guerrier du Sahara 4x4)
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 195, 175, 140]); // Desert Sand Beige
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 25, 25, 25]); // Matte black trim
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "08830 12"]); // Wilaya 30 Ouargla (Sahara)
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 0]);
          nat(N_SET_VEHICLE_EXTRA, "iii", [veh, 1, 0]); // Roll bar
          nat(N_SET_VEHICLE_EXTRA, "iii", [veh, 2, 0]); // Fog lights
          break;
        case 12: // Camion Hamoud Boualem (Livraison DZ)
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 160, 14, 30]); // Hamoud Rouge
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 245, 240, 225]); // Crème historique
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "HAMOUD16"]);
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 0]);
          break;
        case 13: // Taxi Algérois (Taxi Service DZ)
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 255, 185, 0]); // Jaune Taxi Alger
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 250, 250, 250]); // Blanc
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "TAXI 16"]);
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 0]);
          nat(N_SET_VEHICLE_EXTRA, "iii", [veh, 1, 0]); // Taxi sign
          break;
        case 14: // Bus Interurbain DZ (Trans-Algérie Express)
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 0, 105, 48]); // Vert National DZ
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 255, 255, 255]); // Blanc pur
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "01116 15"]); // Wilaya 16 Alger
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 0]);
          break;
        case 15: // Mercedes G-Wagon DZ (Escorte VIP)
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 5, 5, 6]); // Obsidian Black
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 5, 5, 6]);
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "PR 01 DZ"]); // Présidence VIP
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 1]); // Black plate
          nat(N_SET_VEHICLE_WINDOW_TINT, "ii", [veh, 1]); // Limo black
          nat(N_SET_VEHICLE_MOD_KIT, "ii", [veh, 0]);
          nat(N_TOGGLE_VEHICLE_MOD, "iib", [veh, 18, 1]); // Turbo
          break;
        case 16: // Scooter DZ (Style 103 / Booster)
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 0, 140, 225]); // Bleu méditerranéen
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 250, 250, 250]);
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "DZ 16 M"]);
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 0]);
          break;
        case 17: // Dune Buggy Sahara DZ (Grand Erg Occidental)
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, 215, 100, 20]); // Ocre du Sahara
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, 185, 160, 120]);
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, "SAHARA30"]); // Wilaya 30 Ouargla
          nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT_INDEX, "ii", [veh, 0]);
          break;
      }
      nat(N_SET_VEHICLE_DIRT_LEVEL, "if", [veh, 0.0]);
      tlog("[trainer] applied algerian style #" + styleId + " to veh=" + veh);
    } catch (e) {
      console.error("[trainer] error applying algerian vehicle styling:", e);
      tlog("[trainer err styling] " + (e.message || e));
    }
  }

  function syncWardrobeState(ped) {
    if (!T32 || !ped) return;
    for (let c = 0; c <= 11; c++) {
      try {
        const maxDraw = nat(N_GET_NUMBER_OF_PED_DRAWABLE_VARIATIONS, "ii", [ped, c]).i;
        const curDraw = nat(N_GET_PED_DRAWABLE_VARIATION, "ii", [ped, c]).i;
        let curTex = 0, maxTex = 0;
        if (curDraw >= 0) {
          curTex = nat(N_GET_PED_TEXTURE_VARIATION, "ii", [ped, c]).i;
          maxTex = nat(N_GET_NUMBER_OF_PED_TEXTURE_VARIATIONS, "iii", [ped, c, curDraw]).i;
        }
        const base = 410 + c * 4;
        T32[base + 0] = curDraw;
        T32[base + 1] = maxDraw;
        T32[base + 2] = curTex;
        T32[base + 3] = maxTex;
      } catch (e) {}
    }
    const propSlots = [0, 1, 2, 6, 7];
    for (let i = 0; i < propSlots.length; i++) {
      const p = propSlots[i];
      try {
        const maxProp = nat(N_GET_NUMBER_OF_PED_PROP_DRAWABLE_VARIATIONS, "ii", [ped, p]).i;
        const curProp = nat(N_GET_PED_PROP_INDEX, "ii", [ped, p]).i;
        let curTex = 0, maxTex = 0;
        if (curProp >= 0) {
          curTex = nat(N_GET_PED_PROP_TEXTURE_INDEX, "ii", [ped, p]).i;
          maxTex = nat(N_GET_NUMBER_OF_PED_PROP_TEXTURE_VARIATIONS, "iii", [ped, p, curProp]).i;
        }
        const base = 460 + i * 4;
        T32[base + 0] = curProp;
        T32[base + 1] = maxProp;
        T32[base + 2] = curTex;
        T32[base + 3] = maxTex;
      } catch (e) {}
    }
    Atomics.add(T32, 400, 1);
  }

  function executeCommand(cmdId, argInt, floats, str, player, ped, veh) {
    switch (cmdId) {
      case 1: // HEAL
        nat(N_SET_ENTITY_HEALTH, "iii", [ped, 200, 0]);
        nat(N_SET_PED_ARMOUR, "ii", [ped, 100]);
        if (veh) {
          nat(N_SET_VEHICLE_FIXED, "i", [veh]);
          nat(N_SET_VEHICLE_DEFORMATION_FIXED, "i", [veh]);
          nat(N_SET_VEHICLE_ENGINE_HEALTH, "if", [veh, 1000.0]);
          nat(N_SET_VEHICLE_PETROL_TANK_HEALTH, "if", [veh, 1000.0]);
          nat(N_SET_VEHICLE_BODY_HEALTH, "if", [veh, 1000.0]);
          nat(N_SET_ENTITY_HEALTH, "ii", [veh, 1000]);
          nat(N_SET_VEHICLE_DIRT_LEVEL, "if", [veh, 0.0]);
          nat(N_SET_VEHICLE_ENGINE_ON, "ibbb", [veh, 1, 1, 0]);
        }
        postEngineToast("Heal & Armour Restored");
        break;
      case 2: // WEAPONS
        giveWeapons(ped);
        postEngineToast("All Weapons Equipped");
        break;
      case 3: { // MONEY
        const stats = ["SP0_TOTAL_CASH", "SP1_TOTAL_CASH", "SP2_TOTAL_CASH"];
        for (let i = 0; i < stats.length; i++) {
          nat(N_STAT_SET_INT, "iib", [joaat(stats[i]), 999999999, 1]);
        }
        postEngineToast("Max Cash Added ($999,999,999)");
        break;
      }
      case 4: // CLEAR_WANTED
        nat(N_CLEAR_PLAYER_WANTED_LEVEL, "i", [player]);
        postEngineToast("Wanted Level Cleared");
        break;
      case 5: { // WANTED_UP
        const cur = nat(N_GET_PLAYER_WANTED_LEVEL, "i", [player]).i;
        nat(N_SET_MAX_WANTED_LEVEL, "i", [5]);
        nat(N_SET_PLAYER_WANTED_LEVEL, "iib", [player, Math.min(5, cur + 1), 0]);
        nat(N_SET_PLAYER_WANTED_LEVEL_NOW, "ib", [player, 0]);
        postEngineToast("Wanted Level +1");
        break;
      }
      case 6: // WANTED_MAX
        nat(N_SET_MAX_WANTED_LEVEL, "i", [5]);
        nat(N_SET_PLAYER_WANTED_LEVEL, "iib", [player, 5, 0]);
        nat(N_SET_PLAYER_WANTED_LEVEL_NOW, "ib", [player, 0]);
        postEngineToast("5 Stars Active");
        break;
      case 7: // REPAIR
        if (veh) {
          nat(N_SET_VEHICLE_FIXED, "i", [veh]);
          nat(N_SET_VEHICLE_DEFORMATION_FIXED, "i", [veh]);
          nat(N_SET_VEHICLE_ENGINE_HEALTH, "if", [veh, 1000.0]);
          nat(N_SET_VEHICLE_PETROL_TANK_HEALTH, "if", [veh, 1000.0]);
          nat(N_SET_VEHICLE_BODY_HEALTH, "if", [veh, 1000.0]);
          nat(N_SET_ENTITY_HEALTH, "ii", [veh, 1000]);
          nat(N_SET_VEHICLE_DIRT_LEVEL, "if", [veh, 0.0]);
          nat(N_SET_VEHICLE_ENGINE_ON, "ibbb", [veh, 1, 1, 0]);
          postEngineToast("Vehicle Repaired & Restored");
        } else {
          postEngineToast("Not in a vehicle");
        }
        break;
      case 8: // FLIP
        if (veh) {
          nat(N_SET_VEHICLE_ON_GROUND_PROPERLY, "if", [veh, 5.0]);
          postEngineToast("Vehicle Flipped Upright");
        } else {
          postEngineToast("Not in a vehicle");
        }
        break;
      case 9: // BOOST
        if (veh) {
          nat(N_SET_VEHICLE_FORWARD_SPEED, "if", [veh, 45.0]);
          postEngineToast("Speed Boost +45 m/s");
        } else {
          postEngineToast("Not in a vehicle");
        }
        break;
      case 10: // TUNE
        if (veh) {
          nat(N_SET_VEHICLE_MOD_KIT, "ii", [veh, 0]);
          for (let t = 0; t < 49; t++) {
            const count = nat(N_GET_NUM_VEHICLE_MODS, "ii", [veh, t]).i;
            if (count > 0) nat(N_SET_VEHICLE_MOD, "iiib", [veh, t, count - 1, 0]);
          }
          nat(N_TOGGLE_VEHICLE_MOD, "iib", [veh, 18, 1]);
          nat(N_TOGGLE_VEHICLE_MOD, "iib", [veh, 22, 1]);
          nat(N_SET_VEHICLE_FIXED, "i", [veh]);
          postEngineToast("Vehicle Max Tuned");
        } else {
          postEngineToast("Not in a vehicle");
        }
        break;
      case 11: // PAINT
        if (veh) {
          const c1 = Math.floor(Math.random() * 160);
          const c2 = Math.floor(Math.random() * 160);
          nat(N_SET_VEHICLE_COLOURS, "iii", [veh, c1, c2]);
          postEngineToast("Random Paint Applied");
        } else {
          postEngineToast("Not in a vehicle");
        }
        break;
      case 12: { // TELEPORT_WAYPOINT
        const blip = nat(N_GET_FIRST_BLIP_INFO_ID, "i", [8]).i;
        if (blip && nat(N_DOES_BLIP_EXIST, "i", [blip]).i) {
          const c = nat(N_GET_BLIP_INFO_ID_COORD, "i", [blip]).v;
          tpX = c[0];
          tpY = c[1];
          tpTargetZ = 0;
          teleportFrames = 1;
          nat(N_SET_ENTITY_COORDS, "ivbbbb", [veh || ped, tpX, tpY, 700.0, 0, 0, 0, 1]);
          postEngineToast("Teleporting to Waypoint");
        } else {
          postEngineToast("No Waypoint Set on Map");
        }
        break;
      }
      case 13: { // TELEPORT_COORDS
        tpX = floats[0];
        tpY = floats[1];
        tpTargetZ = floats[2] || 0;
        nat(N_SET_ENTITY_COORDS, "ivbbbb", [veh || ped, tpX, tpY, tpTargetZ || 700.0, 0, 0, 0, 1]);
        if (!tpTargetZ) teleportFrames = 1;
        postEngineToast("Teleporting to " + (str || "location"));
        break;
      }
      case 14: // TIME
        nat(N_SET_CLOCK_TIME, "iii", [argInt, 0, 0]);
        postEngineToast("World Time: " + (str || (argInt + ":00")));
        break;
      case 15: // WEATHER
        nat(N_SET_WEATHER_TYPE_NOW_PERSIST, "s", [str || "CLEAR"]);
        postEngineToast("Weather: " + (str || "CLEAR"));
        break;
      case 16: // SPAWN_VEHICLE
      case 17: { // SPAWN_SKIN
        const targetModel = str;
        const modelHash = joaat(targetModel);
        nat(N_REQUEST_MODEL, "i", [modelHash]);
        pendingModel = modelHash;
        pendingKind = (cmdId === 16 ? "spawn_vehicle" : "spawn_skin");
        pendingStyle = (cmdId === 16 ? (argInt | 0) : 0);
        pendingFrames = 0;
        pendingLabel = targetModel;
        break;
      }
      case 18: { // CUSTOMIZE_COMPONENT
        const compId = (argInt >> 16) & 0xffff;
        const action = argInt & 0xffff;
        if (action === 8) { // Set exact drawable index
          const maxDraw = nat(N_GET_NUMBER_OF_PED_DRAWABLE_VARIATIONS, "ii", [ped, compId]).i;
          const targetDraw = Math.max(0, Math.min(Math.round(floats[0]), maxDraw > 0 ? maxDraw - 1 : 0));
          nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, compId, targetDraw, 0, 0]);
          postEngineToast((str || ("Comp " + compId)) + ": #" + targetDraw + "/" + (maxDraw - 1));
        } else if (action === 15) { // Set exact texture index
          const curDraw = nat(N_GET_PED_DRAWABLE_VARIATION, "ii", [ped, compId]).i;
          const maxTex = nat(N_GET_NUMBER_OF_PED_TEXTURE_VARIATIONS, "iii", [ped, compId, curDraw]).i;
          const targetTex = Math.max(0, Math.min(Math.round(floats[0]), maxTex > 0 ? maxTex - 1 : 0));
          nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, compId, curDraw, targetTex, 0]);
          postEngineToast((str || ("Comp " + compId)) + " Tex: #" + targetTex + "/" + (maxTex - 1));
        } else
        if (action === 6) { // Randomize all clothes
          nat(N_SET_PED_RANDOM_COMPONENT_VARIATION, "ib", [ped, 0]);
          postEngineToast("Outfit Randomized");
        } else if (action === 7) { // Reset default clothes
          nat(N_SET_PED_DEFAULT_COMPONENT_VARIATION, "i", [ped]);
          nat(N_CLEAR_ALL_PED_PROPS, "i", [ped]);
          postEngineToast("Clothes Reset to Default");
        } else if (action === 4) { // Bare torso / Remove shirt
          nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, 11, 15, 0, 0]);
          nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, 8, 15, 0, 0]);
          nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, 3, 15, 0, 0]);
          postEngineToast("Shirt Removed (Bare Torso)");
        } else if (action === 9) { // Put shirt on
          nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, 11, 0, 0, 0]);
          nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, 8, 0, 0, 0]);
          nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, 3, 0, 0, 0]);
          postEngineToast("Shirt Put On");
        } else if (action === 5) { // Boxers / Underwear
          nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, 4, 0, 0, 0]);
          postEngineToast("Underwear / Boxers On");
        } else if (action === 10) { // Barefoot / Default Shoes
          nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, 6, 0, 0, 0]);
          postEngineToast("Barefoot / Shoes Default");
        } else if (action === 11) { // Remove mask / beard
          nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, 1, 0, 0, 0]);
          postEngineToast("Mask / Beard Cleared");
        } else if (action === 12) { // Remove armor
          nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, 9, 0, 0, 0]);
          postEngineToast("Body Armor Cleared");
        } else if (action === 13) { // Remove bag
          nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, 5, 0, 0, 0]);
          postEngineToast("Bag Cleared");
        } else if (action === 14) { // Remove accessories
          nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, 7, 0, 0, 0]);
          postEngineToast("Accessories Cleared");
        } else {
          const maxDraw = nat(N_GET_NUMBER_OF_PED_DRAWABLE_VARIATIONS, "ii", [ped, compId]).i;
          const curDraw = nat(N_GET_PED_DRAWABLE_VARIATION, "ii", [ped, compId]).i;
          const curTex = nat(N_GET_PED_TEXTURE_VARIATION, "ii", [ped, compId]).i;

          if (action === 1) { // Next drawable
            const nextDraw = maxDraw > 0 ? (curDraw + 1) % maxDraw : 0;
            nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, compId, nextDraw, 0, 0]);
            postEngineToast((str || "Component " + compId) + ": #" + nextDraw + "/" + (maxDraw - 1));
          } else if (action === 2) { // Prev drawable
            const prevDraw = maxDraw > 0 ? (curDraw - 1 + maxDraw) % maxDraw : 0;
            nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, compId, prevDraw, 0, 0]);
            postEngineToast((str || "Component " + compId) + ": #" + prevDraw + "/" + (maxDraw - 1));
          } else if (action === 3) { // Next texture
            const maxTex = nat(N_GET_NUMBER_OF_PED_TEXTURE_VARIATIONS, "iii", [ped, compId, curDraw]).i;
            const nextTex = maxTex > 0 ? (curTex + 1) % maxTex : 0;
            nat(N_SET_PED_COMPONENT_VARIATION, "iiiii", [ped, compId, curDraw, nextTex, 0]);
            postEngineToast((str || "Component " + compId) + " Tex: #" + nextTex + "/" + (maxTex - 1));
          }
        }
        syncWardrobeState(ped);
        break;
      }
      case 19: { // CUSTOMIZE_PROP
        const propId = (argInt >> 16) & 0xffff;
        const action = argInt & 0xffff;
        if (action === 8) { // Set exact prop index
          const maxProp = nat(N_GET_NUMBER_OF_PED_PROP_DRAWABLE_VARIATIONS, "ii", [ped, propId]).i;
          const targetProp = Math.round(floats[0]);
          if (targetProp < 0) {
            nat(N_CLEAR_PED_PROP, "ii", [ped, propId]);
            postEngineToast((str || ("Prop " + propId)) + ": None");
          } else {
            const clamped = Math.max(0, Math.min(targetProp, maxProp > 0 ? maxProp - 1 : 0));
            nat(N_SET_PED_PROP_INDEX, "iiiib", [ped, propId, clamped, 0, 1]);
            postEngineToast((str || ("Prop " + propId)) + ": #" + clamped + "/" + (maxProp - 1));
          }
        } else if (action === 15) { // Set exact prop texture
          const curProp = nat(N_GET_PED_PROP_INDEX, "ii", [ped, propId]).i;
          if (curProp >= 0) {
            const maxTex = nat(N_GET_NUMBER_OF_PED_PROP_TEXTURE_VARIATIONS, "iii", [ped, propId, curProp]).i;
            const targetTex = Math.max(0, Math.min(Math.round(floats[0]), maxTex > 0 ? maxTex - 1 : 0));
            nat(N_SET_PED_PROP_INDEX, "iiiib", [ped, propId, curProp, targetTex, 1]);
            postEngineToast((str || ("Prop " + propId)) + " Tex: #" + targetTex + "/" + (maxTex - 1));
          }
        } else
        if (action === 5) { // Clear all props
          nat(N_CLEAR_ALL_PED_PROPS, "i", [ped]);
          postEngineToast("All Props Cleared");
        } else if (action === 6) { // Randomize props
          nat(N_SET_PED_RANDOM_PROPS, "i", [ped]);
          postEngineToast("Props Randomized");
        } else if (action === 4) { // Clear specific prop
          nat(N_CLEAR_PED_PROP, "ii", [ped, propId]);
          postEngineToast((str || "Prop " + propId) + ": Cleared");
        } else {
          const maxProp = nat(N_GET_NUMBER_OF_PED_PROP_DRAWABLE_VARIATIONS, "ii", [ped, propId]).i;
          const curProp = nat(N_GET_PED_PROP_INDEX, "ii", [ped, propId]).i;
          const curTex = (curProp >= 0) ? nat(N_GET_PED_PROP_TEXTURE_INDEX, "ii", [ped, propId]).i : 0;

          if (action === 1) { // Next prop
            let nextProp = curProp + 1;
            if (nextProp >= maxProp) nextProp = -1;
            if (nextProp === -1) {
              nat(N_CLEAR_PED_PROP, "ii", [ped, propId]);
              postEngineToast((str || "Prop " + propId) + ": None");
            } else {
              nat(N_SET_PED_PROP_INDEX, "iiiib", [ped, propId, nextProp, 0, 1]);
              postEngineToast((str || "Prop " + propId) + ": #" + nextProp + "/" + (maxProp - 1));
            }
          } else if (action === 2) { // Prev prop
            let prevProp = curProp - 1;
            if (prevProp < -1) prevProp = maxProp - 1;
            if (prevProp === -1) {
              nat(N_CLEAR_PED_PROP, "ii", [ped, propId]);
              postEngineToast((str || "Prop " + propId) + ": None");
            } else {
              nat(N_SET_PED_PROP_INDEX, "iiiib", [ped, propId, prevProp, 0, 1]);
              postEngineToast((str || "Prop " + propId) + ": #" + prevProp + "/" + (maxProp - 1));
            }
          } else if (action === 3) { // Next texture
            if (curProp >= 0) {
              const maxTex = nat(N_GET_NUMBER_OF_PED_PROP_TEXTURE_VARIATIONS, "iii", [ped, propId, curProp]).i;
              const nextTex = maxTex > 0 ? (curTex + 1) % maxTex : 0;
              nat(N_SET_PED_PROP_INDEX, "iiiib", [ped, propId, curProp, nextTex, 1]);
              postEngineToast((str || "Prop " + propId) + " Tex: #" + nextTex + "/" + (maxTex - 1));
            } else {
              postEngineToast("No prop equipped");
            }
          }
        }
        syncWardrobeState(ped);
        break;
      }
      case 20: // ARMOUR
        nat(N_SET_PED_ARMOUR, "ii", [ped, 100]);
        postEngineToast("Full Body Armour (100%)");
        break;
      case 21: // PARACHUTE
        nat(N_GIVE_WEAPON_TO_PED, "iiibb", [ped, joaat("GADGET_PARACHUTE"), 1, 0, 1]);
        postEngineToast("Parachute Equipped");
        break;
      case 22: // CLEAN_PED
        nat(N_CLEAR_PED_BLOOD_DAMAGE_BY_ZONE, "ii", [ped, 0]);
        nat(N_CLEAR_PED_WETNESS, "i", [ped]);
        nat(N_CLEAR_PED_ENV_DIRT, "i", [ped]);
        postEngineToast("Player Cleaned (Blood & Dirt Removed)");
        break;
      case 23: { // CLEAR_AREA
        const c = nat(N_GET_ENTITY_COORDS, "ib", [ped, 1]).v;
        nat(N_CLEAR_AREA, "vfibbbbb", [c[0], c[1], c[2], 120.0, 1, 0, 0, 0]);
        postEngineToast("Area Cleared (Traffic & Peds)");
        break;
      }
      case 24: // RAGDOLL
        nat(N_SET_PED_TO_RAGDOLL, "iiiii", [ped, 4000, 4000, 0, 1, 1]);
        postEngineToast("Ragdoll Activated");
        break;
      case 25: // SUICIDE
        nat(N_SET_ENTITY_HEALTH, "iii", [ped, 0, 0]);
        postEngineToast("Wasted");
        break;
      case 26: // REMOVE_WEAPONS
        nat(N_REMOVE_ALL_PED_WEAPONS, "i", [ped]);
        postEngineToast("All Weapons Removed");
        break;
      case 27: // VEH_JUMP
        if (veh) {
          nat(N_SET_ENTITY_VELOCITY, "iv", [veh, 0.0, 0.0, 14.0]);
          postEngineToast("Bunny Hop Jump!");
        } else {
          postEngineToast("Not in a vehicle");
        }
        break;
      case 28: // VEH_STOP
        if (veh) {
          nat(N_SET_ENTITY_VELOCITY, "iv", [veh, 0.0, 0.0, 0.0]);
          nat(N_SET_VEHICLE_FORWARD_SPEED, "if", [veh, 0.0]);
          postEngineToast("Emergency Brake: Stopped");
        } else {
          postEngineToast("Not in a vehicle");
        }
        break;
      case 29: // VEH_CLEAN
        if (veh) {
          nat(N_SET_VEHICLE_DIRT_LEVEL, "if", [veh, 0.0]);
          nat(N_SET_VEHICLE_DEFORMATION_FIXED, "i", [veh]);
          postEngineToast("Vehicle Cleaned & Washed");
        } else {
          postEngineToast("Not in a vehicle");
        }
        break;
      case 30: // VEH_DOORS
        if (veh) {
          if (argInt === 1) {
            for (let d = 0; d < 6; d++) nat(N_SET_VEHICLE_DOOR_OPEN, "iibb", [veh, d, 0, 0]);
            postEngineToast("Vehicle Doors Opened");
          } else {
            nat(N_SET_VEHICLE_DOORS_SHUT, "ib", [veh, 0]);
            postEngineToast("Vehicle Doors Closed");
          }
        } else {
          postEngineToast("Not in a vehicle");
        }
        break;
      case 31: // VEH_EXPLODE
        if (veh) {
          nat(N_EXPLODE_VEHICLE, "ibb", [veh, 1, 0]);
          postEngineToast("Vehicle Exploded");
        } else {
          postEngineToast("Not in a vehicle");
        }
        break;
      // ---- Menu redesign commands (32+) ----
      case 32: { // WANTED_SET: argInt = stars 0..5
        const n = Math.max(0, Math.min(5, argInt | 0));
        nat(N_SET_MAX_WANTED_LEVEL, "i", [5]);
        if (n === 0) {
          nat(N_CLEAR_PLAYER_WANTED_LEVEL, "i", [player]);
        } else {
          nat(N_SET_PLAYER_WANTED_LEVEL, "iib", [player, n, 0]);
          nat(N_SET_PLAYER_WANTED_LEVEL_NOW, "ib", [player, 0]);
        }
        postEngineToast("Wanted level: " + n + (n === 1 ? " star" : " stars"));
        break;
      }
      case 33: { // GIVE_WEAPON: str = WEAPON_xxx
        const ok = giveWeaponIfValid(ped, str, 500, true);
        postEngineToast(ok ? ("Weapon: " + str.replace("WEAPON_", "")) : ("Weapon not available: " + str.replace("WEAPON_", "")));
        break;
      }
      case 34: { // GIVE_WEAPON_SET: argInt = category index, -1 = refill all ammo
        if (argInt < 0) {
          let n = 0;
          for (const set of WEAPON_SETS) for (const w of set) {
            const h = joaat(w);
            if (nat(N_IS_WEAPON_VALID, "i", [h]).i && nat(N_HAS_PED_GOT_WEAPON, "ii", [ped, h]).i) { nat(N_SET_PED_AMMO, "iii", [ped, h, 9999]); n++; }
          }
          postEngineToast("Ammo refilled on " + n + " weapons");
        } else {
          const set = WEAPON_SETS[argInt] || [];
          let n = 0;
          for (const w of set) if (giveWeaponIfValid(ped, w, 500, false)) n++;
          postEngineToast("Gave " + n + " weapons");
        }
        break;
      }
      case 35: { // TELEPORT_FORWARD: argInt metres (negative = backwards)
        const ent = veh || ped;
        const o = nat(N_GET_OFFSET_FROM_ENTITY_IN_WORLD_COORDS, "iv", [ent, 0.0, argInt, 0.0]).v;
        nat(N_SET_ENTITY_COORDS, "ivbbbb", [ent, o[0], o[1], o[2] + 0.4, 0, 0, 0, 1]);
        postEngineToast("Teleported " + argInt + " m");
        break;
      }
      case 36: { // TELEPORT_UP: argInt metres; floats[0] = 1 -> add a parachute (skydive)
        const ent = veh || ped;
        const c = nat(N_GET_ENTITY_COORDS, "ib", [ent, 1]).v;
        nat(N_SET_ENTITY_COORDS, "ivbbbb", [ent, c[0], c[1], c[2] + argInt, 0, 0, 0, 1]);
        if (floats[0] === 1) nat(N_GIVE_WEAPON_TO_PED, "iiibb", [ped, joaat("GADGET_PARACHUTE"), 1, 0, 1]);
        postEngineToast(floats[0] === 1 ? "Skydive! Parachute equipped" : ("Moved " + (argInt >= 0 ? "up " : "down ") + Math.abs(argInt) + " m"));
        break;
      }
      case 37: // VEH_BOOST_N: argInt = forward speed m/s
        if (veh) { nat(N_SET_VEHICLE_FORWARD_SPEED, "if", [veh, argInt]); postEngineToast("Boost " + argInt + " m/s"); }
        else postEngineToast("Not in a vehicle");
        break;
      case 38: // VEH_COLOR: floats = r,g,b
        if (veh) {
          const r = floats[0] | 0, g = floats[1] | 0, b = floats[2] | 0;
          nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, r, g, b]);
          nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, r, g, b]);
          postEngineToast("Paint: " + (str || (r + "," + g + "," + b)));
        } else postEngineToast("Not in a vehicle");
        break;
      case 39: // VEH_NEON: argInt 1 on / 0 off, floats = r,g,b
        if (veh) {
          if (argInt) nat(N_SET_VEHICLE_NEON_COLOUR, "iiii", [veh, floats[0] | 0, floats[1] | 0, floats[2] | 0]);
          for (let i = 0; i < 4; i++) nat(N_SET_VEHICLE_NEON_ENABLED, "iib", [veh, i, argInt ? 1 : 0]);
          postEngineToast(argInt ? ("Neon: " + (str || "on")) : "Neon off");
        } else postEngineToast("Not in a vehicle");
        break;
      case 40: // VEH_TYRES: argInt 1 burst / 0 fix
        if (veh) {
          for (let i = 0; i < 8; i++) {
            if (argInt) nat(N_SET_VEHICLE_TYRE_BURST, "iibf", [veh, i, 1, 1000.0]);
            else nat(N_SET_VEHICLE_TYRE_FIXED, "ii", [veh, i]);
          }
          postEngineToast(argInt ? "Tyres burst" : "Tyres fixed");
        } else postEngineToast("Not in a vehicle");
        break;
      case 41: // VEH_ROOF: argInt 1 lower / 0 raise
        if (veh) {
          if (argInt) nat(N_LOWER_CONVERTIBLE_ROOF, "ib", [veh, 0]); else nat(N_RAISE_CONVERTIBLE_ROOF, "ib", [veh, 0]);
          postEngineToast(argInt ? "Roof lowering" : "Roof raising");
        } else postEngineToast("Not in a vehicle");
        break;
      case 42: // VEH_LOCK: argInt 2 lock / 1 unlock
        if (veh) { nat(N_SET_VEHICLE_DOORS_LOCKED, "ii", [veh, argInt]); postEngineToast(argInt === 2 ? "Doors locked" : "Doors unlocked"); }
        else postEngineToast("Not in a vehicle");
        break;
      case 43: { // AIRSTRIKE: ring of explosions 25..45 m around the player
        const c = nat(N_GET_ENTITY_COORDS, "ib", [veh || ped, 1]).v;
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2, r = 25 + (i % 3) * 10;
          nat(N_ADD_EXPLOSION, "vifbbfb", [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r, c[2], 0, 1.0, 1, 0, 0.6, 0]);
        }
        postEngineToast("Airstrike!");
        break;
      }
      case 44: { // SPAWN_PED: str = model, argInt: 1 bodyguard, 2 hostile, 0 neutral
        const mh = joaat(str);
        nat(N_REQUEST_MODEL, "i", [mh]);
        if (!pendingModel) {
          pendingModel = mh; pendingKind = "spawn_ped"; pendingStyle = argInt | 0; pendingFrames = 0; pendingLabel = str;
        } else postEngineToast("Busy loading another model");
        break;
      }
      case 45: { // LAUNCH_UP: argInt = vertical speed
        const ent = veh || ped;
        nat(N_SET_ENTITY_VELOCITY, "iv", [ent, 0.0, 0.0, argInt]);
        postEngineToast("Launch!");
        break;
      }
      case 46: { // HIJACK_NEAREST: put the player into the closest vehicle
        const c = nat(N_GET_ENTITY_COORDS, "ib", [ped, 1]).v;
        const v = nat(N_GET_CLOSEST_VEHICLE, "vfii", [c[0], c[1], c[2], 60.0, 0, 70]).i;
        if (v) { nat(N_SET_PED_INTO_VEHICLE, "iii", [ped, v, -1]); postEngineToast("Entered nearest vehicle"); }
        else postEngineToast("No vehicle within 60 m");
        break;
      }
      case 47: // GAME_SPEED: floats[0] = time scale
        nat(N_SET_TIME_SCALE, "f", [floats[0]]);
        postEngineToast("Game speed x" + (Math.round(floats[0] * 100) / 100));
        break;
      case 48: // PLATE: str
        if (veh) { nat(N_SET_VEHICLE_NUMBER_PLATE_TEXT, "is", [veh, str || "GTA V"]); postEngineToast("Plate: " + (str || "GTA V")); }
        else postEngineToast("Not in a vehicle");
        break;
      case 49: // WINDOW_TINT: argInt 0..6
        if (veh) { nat(N_SET_VEHICLE_WINDOW_TINT, "ii", [veh, argInt]); postEngineToast("Window tint " + argInt); }
        else postEngineToast("Not in a vehicle");
        break;
      case 51: // SAVE_NOW: Story Mode save on request (the Cmd+S / Ctrl+S / F9 shortcut and the Settings button); queued until the game allows it
        if (!storyMode()) { postEngineToast("Saving is for Story Mode"); break; }
        storyWantSave(true, 240000, "shortcut");
        if (storySave(true)) { saveWantUntil = 0; postEngineToast("Saving..."); }
        else postEngineToast("Save queued: " + storyLastWhy + ". It saves as soon as that ends.");
        break;
      case 50: // VEH_ENGINE: argInt 1 on / 0 off
        if (veh) { nat(N_SET_VEHICLE_ENGINE_ON, "ibbb", [veh, argInt ? 1 : 0, 1, 0]); postEngineToast(argInt ? "Engine on" : "Engine off"); }
        else postEngineToast("Not in a vehicle");
        break;
      case 52: // PROP_COURSE: 0 remove, 2 back to the start (timer reset), 3 back to the last checkpoint. The course itself arrives through the bulk channel.
        courseCommand(argInt, ped, veh);
        break;
    }
  }


  // ---- Prop courses (mods/<id>/course.json, format 2) ----------------------------------------------------------------------------------------------------------
  // The mod's page script sends the whole course as JSON through the bulk channel (GTAV.sendData in homepage.html, SAB bytes 8192..):
  // { kind: "course", vehicle: ["model", "fallback"], start: [x, y, z, heading], models: { key: ["model", "fallback", ...] },
  //   cps: [[x, y, z, heading, radius], ...],                  checkpoint 0 is the start pad, reaching the last one finishes the course
  //   pieces: [{ s, k: "road", m, a: [x, y, z], h, p, r, l, w },   strip whose top surface starts at a (centre line): heading h, pitch p (nose up), roll r (right edge down),
  //            { s, k: "block", m, c: [x, y, z], h, p, r },       length l, width w, tiled with model m at its real size / one model centred on c
  //            { s, k: "deco", m, c: [x, y, z], h, p, r }] }      decoration standing on c (bottom centre of its box), the model's own facing turned to h
  // A model key whose models are all missing in this game is dropped with its pieces; "sizes": { model: [x, y, z] } is the fallback when the game cannot measure one.
  // Pieces of stage s lie between checkpoint s and s + 1. Only stages cur-1 .. cur+2 exist at a time, so a course can be far bigger than the object pool.
  // Falling below the current stages, or command 52 mode 3 (R in the mod), puts the car back on the last checkpoint.
  const N_GET_MODEL_DIMENSIONS = 49166, N_SET_ENTITY_COORDS_NO_OFFSET = 46208, N_DELETE_OBJECT = 54098;
  const N_IS_ENTITY_IN_WATER = 46098, N_SET_ENTITY_LOD_DIST = 46256, N_DRAW_MARKER = 46537, N_SET_GAMEPLAY_CAM_RELATIVE_HEADING = 45136;
  const BULK_STATE = 2040, BULK_LEN = 2041, BULK_BYTE = 8192;   // page -> trainer: state 1 chunk, 2 last chunk, trainer sets 0 when read
  const CHUD = 2030;   // trainer -> page: state (0 none, 1 building, 2 running, 3 finished), checkpoint, last checkpoint, falls, elapsed ms, props alive, props total
  const COURSE_WINDOW_BACK = 1, COURSE_WINDOW_AHEAD = 2, COURSE_SPAWN_PER_TICK = 6, COURSE_DELETE_PER_TICK = 12;
  let bulkParts = [], course = null;

  function bulkTick() {
    const st = Atomics.load(T32, BULK_STATE);
    if (st !== 1 && st !== 2) return;
    const len = Math.max(0, Math.min(T32[BULK_LEN] | 0, TU8.length - BULK_BYTE));
    bulkParts.push(TU8.slice(BULK_BYTE, BULK_BYTE + len));
    Atomics.store(T32, BULK_STATE, 0);
    if (st !== 2) return;
    let total = 0, o = 0;
    for (const b of bulkParts) total += b.length;
    const all = new Uint8Array(total);
    for (const b of bulkParts) { all.set(b, o); o += b.length; }
    bulkParts = [];
    let data;
    try { data = JSON.parse(dec.decode(all)); } catch (e) { tlog("[trainer course] bad data (" + total + " bytes): " + e.message); postEngineToast("Course data could not be read"); return; }
    tlog("[trainer course] received " + total + " bytes, kind " + (data && data.kind));
    if (data && data.kind === "course") courseLoad(data);
  }

  const firstModel = (names) => { for (const n of [].concat(names || [])) { const h = joaat(String(n)); if (nat(N_IS_MODEL_IN_CDIMAGE, "i", [h]).i !== 0) return { h, name: String(n) }; } return null; };
  const v3 = (a, b, k) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
  const rad = Math.PI / 180;

  function courseHud(state) {
    const c = course;
    T32[CHUD] = state; T32[CHUD + 1] = c ? c.cur : 0; T32[CHUD + 2] = c ? c.cps.length - 1 : 0; T32[CHUD + 3] = c ? c.falls : 0;
    T32[CHUD + 4] = c && c.t0 ? ((c.tEnd || Date.now()) - c.t0) | 0 : 0; T32[CHUD + 5] = c ? c.alive : 0; T32[CHUD + 6] = c ? c.tiles.length : 0;
  }

  function courseDeleteTile(t) {
    const o = t.o; t.o = 0;
    if (!o) return;
    try {
      nat(N_FREEZE_ENTITY_POSITION, "ib", [o, 0]);
      nat(N_DELETE_OBJECT, "P", [o]);
      if (nat(N_DOES_ENTITY_EXIST, "i", [o]).i) { nat(N_SET_ENTITY_COORDS, "ivbbbb", [o, 0, 0, -900.0, 0, 0, 0, 1]); nat(N_SET_ENTITY_AS_NO_LONGER_NEEDED, "i", [o]); }
    } catch (e) {}
    course.alive--;
  }

  function courseClear() {
    if (course) {
      for (const t of course.tiles) courseDeleteTile(t);
      for (const h of Object.keys(course.mdl)) nat(N_SET_MODEL_AS_NO_LONGER_NEEDED, "i", [h | 0]);
      if (course.held) nat(N_FREEZE_ENTITY_POSITION, "ib", [course.held, 0]);
    }
    course = null; bulkParts = [];
    courseHud(0);
  }

  function courseLoad(data) {
    courseClear();
    const keys = {}, mdl = {}, missing = [];
    for (const [key, names] of Object.entries(data.models || {})) {
      const m = firstModel(names);
      if (!m) { missing.push(key); continue; }
      keys[key] = m.h; mdl[m.h] = { name: m.name, sP: 1, sR: 1, calP: false, calR: false, failed: 0 };
      nat(N_REQUEST_MODEL, "i", [m.h]);
    }
    const cps = (data.cps || []).map((c) => [+c[0], +c[1], +c[2], +c[3] || 0, +c[4] || 10]);
    if (cps.length < 2) { postEngineToast("Course has no checkpoints"); return; }
    const veh = firstModel(data.vehicle);
    course = { data, keys, mdl, missing, cps, phase: "models", frames: 0, tiles: [], stages: [], built: [], alive: 0, cur: 0, falls: 0, t0: 0, tEnd: 0,
      vehicle: veh ? veh.h : 0, held: 0, holdCp: -1, lastVeh: 0, guard: 0, fallZ: [] };
    tlog("[trainer course] loading: " + Object.keys(keys).length + " models, " + (data.pieces || []).length + " pieces, " + cps.length + " checkpoints");
    postEngineToast("Building course...");
    courseHud(1);
  }

  // Turns the pieces into tiles once every model is loaded and measured.
  function courseExpand() {
    const c = course, nStages = c.cps.length - 1;
    for (let s = 0; s < nStages; s++) { c.stages.push([]); c.fallZ.push(Math.min(c.cps[s][2], c.cps[s + 1][2])); }
    for (const pc of c.data.pieces || []) {
      const mh = c.keys[pc.m], md = c.mdl[mh];
      if (!md) continue;
      const s = Math.max(0, Math.min(nStages - 1, pc.s | 0));
      const h = (+pc.h || 0) * rad, p = (+pc.p || 0) * rad, r = (+pc.r || 0) * rad;
      const f = [-Math.sin(h) * Math.cos(p), Math.cos(h) * Math.cos(p), Math.sin(p)];
      const r0 = [Math.cos(h), Math.sin(h), 0];
      const u0 = [r0[1] * f[2] - r0[2] * f[1], r0[2] * f[0] - r0[0] * f[2], r0[0] * f[1] - r0[1] * f[0]];
      const right = [r0[0] * Math.cos(r) - u0[0] * Math.sin(r), r0[1] * Math.cos(r) - u0[1] * Math.sin(r), r0[2] * Math.cos(r) - u0[2] * Math.sin(r)];
      const base = { s, mh, yaw: (+pc.h || 0) + (md.longY ? 0 : 90), pp: +pc.p || 0, pr: +pc.r || 0, f, right, o: 0 };
      if (pc.k === "deco") {
        c.tiles.push(Object.assign({}, base, { at: [+pc.c[0], +pc.c[1], +pc.c[2]], top: false, bottom: true, raw: true, yaw: +pc.h || 0 }));
      } else if (pc.k === "block") {
        c.tiles.push(Object.assign({}, base, { at: [+pc.c[0], +pc.c[1], +pc.c[2]], top: false }));
        c.fallZ[s] = Math.min(c.fallZ[s], +pc.c[2]);
      } else {
        const l = Math.max(0.5, +pc.l || md.L), w = Math.max(0.5, +pc.w || md.W);
        const n = Math.max(1, Math.ceil(l / md.L - 0.02)), m = Math.max(1, Math.ceil(w / md.W - 0.02));
        for (let i = 0; i < n; i++) {
          const u = n === 1 ? l / 2 : md.L / 2 + i * (l - md.L) / (n - 1);
          for (let j = 0; j < m; j++) {
            const v = m === 1 ? 0 : -w / 2 + md.W / 2 + j * (w - md.W) / (m - 1);
            const at = v3(v3(pc.a, f, u), right, v);
            c.tiles.push(Object.assign({}, base, { at, top: true }));
          }
        }
        c.fallZ[s] = Math.min(c.fallZ[s], +pc.a[2], +pc.a[2] + Math.sin(p) * l);
      }
    }
    for (let i = 0; i < c.tiles.length; i++) c.stages[c.tiles[i].s].push(i);
    for (let s = 0; s < nStages; s++) c.built.push(0);
    tlog("[trainer course] " + c.tiles.length + " tiles in " + nStages + " stages");
  }

  function courseMeasureAxes(o, md) {
    const O = nat(N_GET_ENTITY_COORDS, "ib", [o, 0]).v;
    const at = (x, y) => { const w = nat(N_GET_OFFSET_FROM_ENTITY_IN_WORLD_COORDS, "ifff", [o, x, y, 0]).v; return [(w[0] - O[0]) / 10, (w[1] - O[1]) / 10, (w[2] - O[2]) / 10]; };
    return md.longY ? { along: at(0, 10), across: at(10, 0) } : { along: at(10, 0), across: at(0, -10) };
  }
  function courseRotate(o, t, md) {
    const a = t.pp * md.sP, b = t.pr * md.sR, y = t.raw || md.longY;
    nat(N_SET_ENTITY_ROTATION, "ivib", [o, y ? a : b, y ? b : a, t.yaw, 2, 1]);
  }
  // The engine's sign for pitch and roll is measured on the first tilted tile of each model rather than assumed.
  function courseCalibrate(o, t, md, which) {
    const err = () => { const m = courseMeasureAxes(o, md); let e = 0; for (let k = 0; k < 3; k++) e += Math.abs(m.along[k] - t.f[k]) + Math.abs(m.across[k] - t.right[k]); return e; };
    const e1 = err();
    if (e1 > 0.08) {
      if (which === "P") md.sP = -md.sP; else md.sR = -md.sR;
      courseRotate(o, t, md);
      const e2 = err();
      if (e2 >= e1) { if (which === "P") md.sP = -md.sP; else md.sR = -md.sR; courseRotate(o, t, md); }
      tlog("[trainer course] " + md.name + " " + which + " sign " + (which === "P" ? md.sP : md.sR) + " (error " + e1.toFixed(2) + " / " + e2.toFixed(2) + ")");
    }
    if (which === "P") md.calP = true; else md.calR = true;
  }

  function courseSpawnTile(t) {
    const md = course.mdl[t.mh];
    const o = nat(N_CREATE_OBJECT_NO_OFFSET, "ivbbb", [t.mh, t.at[0], t.at[1], t.at[2], 0, 0, 1]).i;
    if (!o) return false;
    courseRotate(o, t, md);
    if (t.top && t.pp && !md.calP) courseCalibrate(o, t, md, "P");
    if (t.top && t.pr && !md.calR) courseCalibrate(o, t, md, "R");
    // Put the top centre (roads), bottom centre (decorations) or centre (blocks) of the model's box exactly on the target point, whatever the model's pivot is.
    const O = nat(N_GET_ENTITY_COORDS, "ib", [o, 0]).v;
    const M = nat(N_GET_OFFSET_FROM_ENTITY_IN_WORLD_COORDS, "ifff", [o, md.cx, md.cy, t.top ? md.zTop : t.bottom ? md.zBot : md.cz]).v;
    nat(N_SET_ENTITY_COORDS_NO_OFFSET, "ivbbb", [o, O[0] + t.at[0] - M[0], O[1] + t.at[1] - M[1], O[2] + t.at[2] - M[2], 0, 0, 0]);
    nat(N_FREEZE_ENTITY_POSITION, "ib", [o, 1]);
    nat(N_SET_ENTITY_LOD_DIST, "ii", [o, 1500]);
    t.o = o; course.alive++;
    return true;
  }

  const courseWanted = (s) => s >= course.cur - COURSE_WINDOW_BACK && s <= course.cur + COURSE_WINDOW_AHEAD;
  const courseStageReady = (s) => s < 0 || s >= course.stages.length || course.built[s] >= course.stages[s].length;

  function courseStream() {
    const c = course;
    let budget = COURSE_DELETE_PER_TICK;
    for (let s = 0; s < c.stages.length && budget > 0; s++) {
      if (courseWanted(s) || !c.built[s]) continue;
      for (const i of c.stages[s]) { if (c.tiles[i].o) { courseDeleteTile(c.tiles[i]); if (--budget <= 0) break; } }
      if (budget > 0) c.built[s] = 0;
    }
    budget = COURSE_SPAWN_PER_TICK;
    for (const s of [c.cur, c.cur + 1, c.cur + 2, c.cur - 1]) {
      if (s < 0 || s >= c.stages.length || courseStageReady(s)) continue;
      const list = c.stages[s];
      while (budget > 0 && c.built[s] < list.length) {
        const t = c.tiles[list[c.built[s]]];
        if (!t.o && !courseSpawnTile(t)) { const md = c.mdl[t.mh]; if (!md.failed++) tlog("[trainer course] create failed: " + md.name); }
        c.built[s]++; budget--;
      }
      if (budget <= 0) break;
    }
  }

  // Freeze the player's car (or the player) on checkpoint i until the stages around it exist, then let go there.
  function courseHold(i, ped, veh) {
    const c = course, cp = c.cps[i];
    if (!veh && c.lastVeh && nat(N_DOES_ENTITY_EXIST, "i", [c.lastVeh]).i) { nat(N_SET_PED_INTO_VEHICLE, "iii", [ped, c.lastVeh, -1]); veh = c.lastVeh; }
    const ent = veh || ped;
    if (c.held && c.held !== ent) nat(N_FREEZE_ENTITY_POSITION, "ib", [c.held, 0]);
    nat(N_SET_ENTITY_COORDS, "ivbbbb", [ent, cp[0], cp[1], cp[2] + 1.0, 0, 0, 0, 1]);
    nat(N_SET_ENTITY_HEADING, "if", [ent, cp[3]]);
    nat(N_SET_ENTITY_VELOCITY, "iv", [ent, 0.0, 0.0, 0.0]);
    nat(N_FREEZE_ENTITY_POSITION, "ib", [ent, 1]);
    if (veh) { nat(N_SET_VEHICLE_FIXED, "i", [veh]); nat(N_SET_VEHICLE_DEFORMATION_FIXED, "i", [veh]); }
    nat(N_SET_ENTITY_HEALTH, "iii", [ped, 200, 0]);
    nat(N_SET_GAMEPLAY_CAM_RELATIVE_HEADING, "f", [0.0]);
    c.held = ent; c.holdCp = i;
  }

  function courseRelease() {
    const c = course, cp = c.cps[c.holdCp];
    nat(N_FREEZE_ENTITY_POSITION, "ib", [c.held, 0]);
    nat(N_SET_ENTITY_COORDS, "ivbbbb", [c.held, cp[0], cp[1], cp[2] + 1.0, 0, 0, 0, 1]);
    nat(N_SET_ENTITY_HEADING, "if", [c.held, cp[3]]);
    nat(N_SET_ENTITY_VELOCITY, "iv", [c.held, 0.0, 0.0, 0.0]);
    c.held = 0; c.holdCp = -1; c.guard = Date.now() + 1500;
  }

  function courseRespawn(ped, veh, toStart) {
    const c = course;
    if (!c || c.phase !== "run") { postEngineToast("No course built yet"); return; }
    if (toStart) { c.cur = 0; c.falls = 0; c.t0 = 0; c.tEnd = 0; postEngineToast("Back to the start"); }
    courseHold(c.cur, ped, veh);
  }

  function courseCommand(mode, ped, veh) {
    if (mode === 2 || mode === 3) { courseRespawn(ped, veh, mode === 2); return; }
    const had = !!course;
    courseClear();
    if (had) postEngineToast("Course removed");
  }

  const mmss = (ms) => { const s = Math.floor(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };

  function courseTick(ped, veh) {
    bulkTick();
    const c = course;
    if (!c) return;
    if (veh) c.lastVeh = veh;
    if (c.phase === "models") {
      let waiting = 0;
      for (const h of Object.keys(c.mdl)) if (!nat(N_HAS_MODEL_LOADED, "i", [h | 0]).i) waiting++;
      if (waiting && ++c.frames < 900) return;
      const report = [], sizes = c.data.sizes || {};
      for (const [key, h] of Object.entries(c.keys)) {
        const md = c.mdl[h];
        if (!nat(N_HAS_MODEL_LOADED, "i", [h]).i) { report.push(key + "=" + md.name + " NOT LOADED"); delete c.keys[key]; continue; }
        if (md.L) { report.push(key + "=" + md.name); continue; }
        const d = nat(N_GET_MODEL_DIMENSIONS, "iVV", [h]).vo, mn = d[0], mx = d[1];
        let sx = mx[0] - mn[0], sy = mx[1] - mn[1], sz = mx[2] - mn[2], how = "measured";
        if (!(sx > 0.05 && sy > 0.05 && sz > 0.05 && sx < 300 && sy < 300)) {
          const g = sizes[md.name] || [2.5, 12.2, 2.6];
          [sx, sy, sz] = g; mn[0] = -sx / 2; mn[1] = -sy / 2; mn[2] = 0; how = sizes[md.name] ? "table" : "GUESSED";
        }
        md.longY = sy >= sx; md.L = Math.max(sx, sy); md.W = Math.min(sx, sy);
        md.cx = mn[0] + sx / 2; md.cy = mn[1] + sy / 2; md.cz = mn[2] + sz / 2; md.zTop = mn[2] + sz; md.zBot = mn[2];
        report.push(key + "=" + md.name + " " + sx.toFixed(2) + "x" + sy.toFixed(2) + "x" + sz.toFixed(2) + " " + how);
      }
      tlog("[trainer course] models: " + report.join(", ") + (c.missing.length ? " | missing: " + c.missing.join(", ") : ""));
      if (!Object.keys(c.keys).length) { postEngineToast("Course: none of its models exist in this game"); courseClear(); return; }
      courseExpand();
      c.phase = "build";
      courseHold(0, ped, veh);
      return;
    }
    courseStream();
    if (c.phase === "build") {
      courseHud(1);
      if (!courseStageReady(0) || !courseStageReady(1)) return;
      courseRelease();
      c.phase = "run";
      postEngineToast("Course ready: " + (c.cps.length - 1) + " checkpoints. R = back to the last checkpoint");
      tlog("[trainer course] ready, " + c.alive + " props alive of " + c.tiles.length);
      if (c.vehicle && !pendingModel) {
        nat(N_REQUEST_MODEL, "i", [c.vehicle]);
        pendingModel = c.vehicle; pendingKind = "spawn_vehicle"; pendingStyle = 0; pendingFrames = 0; pendingLabel = "course car";
        restoreHeading = c.cps[0][3];
      }
      return;
    }
    if (c.held) {   // a respawn waits for its stages
      if (courseStageReady(c.holdCp) && courseStageReady(c.holdCp + 1)) courseRelease();
      courseHud(c.tEnd ? 3 : 2);
      return;
    }
    const ent = veh || ped;
    const pos = nat(N_GET_ENTITY_COORDS, "ib", [ent, 1]).v;
    const last = c.cps.length - 1;
    if (!c.tEnd) {
      const nx = c.cps[c.cur + 1];
      if (!c.t0 && c.cur === 0 && Math.hypot(pos[0] - c.cps[0][0], pos[1] - c.cps[0][1]) > 6) c.t0 = Date.now();
      if (Math.hypot(pos[0] - nx[0], pos[1] - nx[1], (pos[2] - nx[2]) * 0.5) < nx[4]) {
        c.cur++;
        if (!c.t0) c.t0 = Date.now();
        if (c.cur >= last) {
          c.tEnd = Date.now();
          postEngineToast("FINISHED in " + mmss(c.tEnd - c.t0) + " with " + c.falls + " falls!");
          tlog("[trainer course] finished in " + mmss(c.tEnd - c.t0) + ", falls " + c.falls);
        } else {
          postEngineToast("Checkpoint " + c.cur + " / " + last);
          tlog("[trainer course] checkpoint " + c.cur + " at " + mmss(Date.now() - c.t0) + ", falls " + c.falls);
        }
      }
      if (c.cur < last) {
        const m = c.cps[c.cur + 1], big = c.cur + 1 === last;
        nat(N_DRAW_MARKER, "ivvvviiiibbibzzb", [1, m[0], m[1], m[2] - 1.5, 0, 0, 0, 0, 0, 0, m[4] * 2, m[4] * 2, 5.0,
          big ? 60 : 255, big ? 255 : 200, big ? 120 : 0, 90, 0, 0, 2, 0, 0]);
        nat(N_DRAW_MARKER, "ivvvviiiibbibzzb", [0, m[0], m[1], m[2] + 7.0, 0, 0, 0, 0, 0, 0, 3.0, 3.0, 3.0, 255, 200, 0, 200, 1, 1, 2, 0, 0]);
      }
    }
    // Fell off: anything 30 m under both ends of the current stage (and the next one) goes back to the last checkpoint.
    const s = Math.min(c.cur, c.stages.length - 1);
    const floor = Math.min(c.fallZ[s], c.fallZ[Math.min(s + 1, c.stages.length - 1)]) - 30;
    if (Date.now() > c.guard && (pos[2] < floor || nat(N_IS_ENTITY_IN_WATER, "i", [ent]).i)) {
      if (!c.tEnd) c.falls++;
      courseHold(c.cur, ped, veh);
    }
    courseHud(c.tEnd ? 3 : 2);
  }

  // ---- Story Mode autosave -------------------------------------------------------------------------------------------------------------------------------------
  // GTA V only autosaves at fixed story moments (mission passed, character switch, ...). A player who roams for an hour and leaves comes back at the last of those, which
  // in this port is often the Prologue. DO_AUTO_SAVE writes the game's own autosave slot, the same file the story script writes (userdata_wasm.cpp then stores it
  // in IndexedDB and, through io_worker.js, in work/userdata). It is only requested when the game is in free roam: no mission (GET_MISSION_FLAG), no cutscene,
  // no character switch, no wanted level, no pause menu, not dead or arrested, screen visible, and control is on. Saving mid-mission would store a state the mission
  // script cannot resume. Every attempt and every skip reason is logged ([trainer story]).
  const AUTOSAVE_FIRST_MS = 60000, AUTOSAVE_EVERY_MS = 120000, AUTOSAVE_RETRY_MS = 15000, SAVE_WANT_RETRY_MS = 2000;
  // A save somebody asked for (the shortcut, or a mission that just ended) is retried every 2 s until the game allows it (up to a few minutes) instead of being dropped.
  let missionEndAt = 0, stuckSince = 0, stuckTries = 0, stuckDiagAt = 0, ctrlLogged = false;
  let saveWantUntil = 0, saveWantManual = false, saveAnnounce = false, lastMissionFlag = 0, storyLastWhy = "", saveWantWhy = "";
  let storyT0 = 0, storyLastSaveMs = 0, storyNextTryMs = 0, storyPendingCheckMs = 0, storySkipLogged = "", storySaves = 0;
  function storyBlocker(player, ped, wanted) {
    if (nat(N_GET_IS_AUTO_SAVE_OFF, "").i) return "autosave is switched off in the game settings";
    if (nat(N_IS_AUTO_SAVE_IN_PROGRESS, "").i) return "a save is already in progress";
    if (nat(N_GET_MISSION_FLAG, "").i) return "a mission is running";
    if (nat(N_IS_CUTSCENE_ACTIVE, "").i) return "a cutscene is playing";
    if (nat(N_IS_PLAYER_SWITCH_IN_PROGRESS, "").i) return "a character switch is in progress";
    if (nat(N_IS_PAUSE_MENU_ACTIVE, "").i) return "the pause menu is open";
    if (nat(N_IS_SCREEN_FADED_OUT, "").i) return "the screen is faded out";
    if (wanted > 0) return "you are wanted";
    if (nat(N_IS_PLAYER_BEING_ARRESTED, "ib", [player, 1]).i) return "you are being arrested";
    if (nat(N_IS_PED_DEAD_OR_DYING, "ii", [ped, 1]).i) return "you are dead";
    if (!nat(N_IS_PLAYER_CONTROL_ON, "i", [player]).i) return "player control is off";
    return "";
  }
  function storySave(manual) {
    if (!storyMode() || !T32) { if (manual) postEngineToast("Saving is for Story Mode"); return; }
    let player, ped, wanted;
    try {
      player = nat(N_GET_PLAYER_INDEX, "").i; ped = nat(N_PLAYER_PED_ID, "").i;
      wanted = nat(N_GET_PLAYER_WANTED_LEVEL, "i", [player]).i;
    } catch (e) { return; }
    const why = storyBlocker(player, ped, wanted);
    if (why) {
      storyLastWhy = why;
      if (storySkipLogged !== why) { storySkipLogged = why; tlog("[trainer story] autosave skipped: " + why); }
      return false;
    }
    storySkipLogged = "";
    // The game answers the first save of a session with an "autosave slot already contains ... overwrite?" alert and the script thread stops (heartbeat T32[1] frozen) until it is
    // answered. T32[57] counts save requests so the page knows one was just made and can press Yes if the heartbeat stops (homepage.html, "save prompt").
    nat(N_DO_AUTO_SAVE, "");
    Atomics.add(T32, 57, 1);
    storyLastSaveMs = performance.now();
    storyPendingCheckMs = storyLastSaveMs + 6000;
    storySaves++;
    tlog("[trainer story] autosave requested (" + (manual ? "manual" : "timer") + ", #" + storySaves + ")");
    storyLastWhy = "";
    return true;
  }
  function storyWantSave(manual, ms, note) {
    saveWantUntil = performance.now() + ms; saveWantManual = saveWantManual || manual; saveAnnounce = true; storyNextTryMs = 0;
    tlog("[trainer story] save wanted (" + note + ")");
  }

  // ---- Story position memory ------------------------------------------------------------------------------------------------------------------------------------
  // The game puts a loaded Story save back at the character's safehouse, wherever the save was made (you die, wake up at the police station, save, reload: home). So: while the
  // player is in free roam the trainer reports the position every 5 s to the dev server (/storypos); the server pairs the last report with each Story save file that arrives
  // (work/story-position.json). After a load, once the player is in free roam for 5 s with the same character, and the stored position belongs to the newest save on disk
  // (/storypos says valid), the player is moved there. A mission starting first cancels the restore. Never in a mission: the story script owns the position then.
  let spTpAt = 0, spVeh = 0, spStage = 0, spData = null, spFreeSince = 0, spLastPost = 0, spLastErr = "", spLoggedStage = -1;
  function storyIsFree(player, ped) {
    return !nat(N_GET_MISSION_FLAG, "").i && !nat(N_IS_CUTSCENE_ACTIVE, "").i && !nat(N_IS_PLAYER_SWITCH_IN_PROGRESS, "").i && !nat(N_IS_SCREEN_FADED_OUT, "").i &&
      !!nat(N_IS_PLAYER_CONTROL_ON, "i", [player]).i && !nat(N_IS_PED_DEAD_OR_DYING, "ii", [ped, 1]).i && !nat(N_IS_PAUSE_MENU_ACTIVE, "").i;
  }
  function storyPositionTick(now) {
    const player = nat(N_GET_PLAYER_INDEX, "").i, ped = nat(N_PLAYER_PED_ID, "").i;
    if (!ped || player < 0) return;
    const free = storyIsFree(player, ped);
    if (spLoggedStage !== spStage) { spLoggedStage = spStage; tlog("[trainer story] position memory stage " + spStage + (free ? " (free roam)" : " (not free roam)")); }
    if (spStage === 0) {
      spStage = 2; spData = null;
      try {      // synchronous: promise callbacks never run in this thread once the game is going (the first version waited for a fetch .then for ever)
        const x = new XMLHttpRequest(); x.open("GET", "/storypos", false); x.send();
        if (x.status === 200) spData = JSON.parse(x.responseText);
      } catch (e) { tlog("[trainer story] saved position request failed: " + (e && e.message || e)); }
      tlog("[trainer story] saved position: " + (spData && spData.valid ? "valid (" + Math.round(spData.x) + "," + Math.round(spData.y) + "," + Math.round(spData.z) + ")" : "none for the newest save"));
      return;
    }
    if (spStage === 1) return;
    if (spStage === 2) {
      if (nat(N_GET_MISSION_FLAG, "").i) { spStage = 9; tlog("[trainer story] position restore skipped: a mission is running"); return; }
      if (!spData || !spData.valid) { spStage = 9; return; }
      if (!free) { spFreeSince = 0; return; }
      if (!spFreeSince) spFreeSince = now;
      if (now - spFreeSince < 5000) return;
      spStage = 9;
      const model = nat(N_GET_ENTITY_MODEL, "i", [ped]).i | 0;
      const c = nat(N_GET_ENTITY_COORDS, "ib", [ped, 1]).v;
      const dist = Math.hypot(c[0] - spData.x, c[1] - spData.y, (c[2] - spData.z) * 0.5);
      if ((spData.m | 0) !== model) { tlog("[trainer story] position restore skipped: another character (saved " + spData.m + ", now " + model + ")"); return; }
      if (dist < 30) { tlog("[trainer story] position restore not needed (" + Math.round(dist) + " m away)"); return; }
      tpX = spData.x; tpY = spData.y; tpTargetZ = 0;
      nat(N_SET_ENTITY_COORDS, "ivbbbb", [ped, spData.x, spData.y, spData.z + 1.0, 0, 0, 0, 1]);
      if (isFinite(spData.h)) nat(N_SET_ENTITY_HEADING, "if", [ped, spData.h]);
      teleportFrames = 1;
      tlog("[trainer story] position restored to " + Math.round(spData.x) + "," + Math.round(spData.y) + "," + Math.round(spData.z) + " (was " + Math.round(dist) + " m away)");
      // the rest of the moment: cheats that were on, health and armour, time of day, and the vehicle you were in
      if (spData.tg) Atomics.or(T32, 2, spData.tg | 0);
      if (spData.tb) Atomics.or(T32, TB, spData.tb | 0);
      if (spData.hp > 0) nat(N_SET_ENTITY_HEALTH, "iii", [ped, spData.hp | 0, 0]);
      if (spData.ar > 0) nat(N_SET_PED_ARMOUR, "ii", [ped, spData.ar | 0]);
      if (spData.hr >= 0 && spData.hr < 24) nat(N_SET_CLOCK_TIME, "iii", [spData.hr | 0, spData.mn | 0, 0]);
      spTpAt = now; spVeh = spData.vm | 0;
      tlog("[trainer story] restored cheats A=0x" + ((spData.tg | 0) >>> 0).toString(16) + " B=0x" + ((spData.tb | 0) >>> 0).toString(16) + ", health " + spData.hp + ", armour " + spData.ar + ", time " + spData.hr + ":" + spData.mn + ", vehicle " + spVeh);
      postEngineToast("Back where you saved");
      return;
    }
    if (spStage === 9 && spVeh && !pendingModel && (!teleportFrames || now - spTpAt > 4000)) {      // once the ground under the player has settled: bring the vehicle back
      const hash = spVeh; spVeh = 0;
      if (!nat(N_IS_PED_IN_ANY_VEHICLE, "ib", [ped, 0]).i && nat(N_IS_MODEL_A_VEHICLE, "i", [hash]).i) {
        nat(N_REQUEST_MODEL, "i", [hash]);
        pendingModel = hash; pendingKind = "spawn_vehicle"; pendingStyle = 0; pendingFrames = 0; pendingLabel = "Your vehicle";
        restoreHeading = isFinite(spData && spData.h) ? spData.h : null;
        tlog("[trainer story] bringing your vehicle back (model " + hash + ")");
      }
    }
    if (spStage === 9 && free && now - spLastPost >= 5000) {      // report where the player stands (only after the restore is over, so the safehouse spawn never overwrites it)
      spLastPost = now;
      const c = nat(N_GET_ENTITY_COORDS, "ib", [ped, 1]).v;
      if (!c || !isFinite(c[0]) || (Math.abs(c[0]) < 1 && Math.abs(c[1]) < 1)) return;
      // what a loaded Story save does not bring back: where you stood, the vehicle you were in, the cheats that were on, health and armour, the time of day
      const inV = nat(N_IS_PED_IN_ANY_VEHICLE, "ib", [ped, 0]).i !== 0, v = inV ? nat(N_GET_VEHICLE_PED_IS_IN, "ib", [ped, 0]).i : 0;
      fetch("/storypos", { method: "POST", body: JSON.stringify({ m: nat(N_GET_ENTITY_MODEL, "i", [ped]).i | 0, x: c[0], y: c[1], z: c[2], h: nat(N_GET_ENTITY_HEADING, "i", [ped]).f,
        tg: Atomics.load(T32, 2) | 0, tb: Atomics.load(T32, TB) & ~(1 << 17), hp: nat(N_GET_ENTITY_HEALTH, "i", [ped]).i, ar: nat(N_GET_PED_ARMOUR, "i", [ped]).i,
        hr: nat(N_GET_CLOCK_HOURS, "").i, mn: nat(N_GET_CLOCK_MINUTES, "").i, vm: v ? (nat(N_GET_ENTITY_MODEL, "i", [v]).i | 0) : 0 }) }).catch(() => {});
    }
  }
  // ---- Vanilla Unicorn plays Drake ------------------------------------------------------------------------------------------------------------------------------
  // The club's three static emitters (stage, main room, back room) are the only users of HIDDEN_RADIO_STRIP_CLUB in game.dat151. Every music station already plays
  // the Drake songs (work/drake), so near the club the emitters are retuned to one of them, a different station each visit. Set on arrival and again once inside,
  // in case the interior streaming in resets them; never every tick, since retuning restarts the stream.
  const N_SET_EMITTER_RADIO_STATION = 44467;
  const CLUB_EMITTERS = ["LOS_SANTOS_VANILLA_UNICORN_01_STAGE", "LOS_SANTOS_VANILLA_UNICORN_02_MAIN_ROOM", "LOS_SANTOS_VANILLA_UNICORN_03_BACK_ROOM"];
  const DRAKE_STATIONS = ["RADIO_03_HIPHOP_NEW", "RADIO_02_POP", "RADIO_04_PUNK", "RADIO_06_COUNTRY", "RADIO_07_DANCE_01", "RADIO_08_MEXICAN", "RADIO_09_HIPHOP_OLD",
    "RADIO_01_CLASS_ROCK", "RADIO_12_REGGAE", "RADIO_13_JAZZ", "RADIO_14_DANCE_02", "RADIO_15_MOTOWN", "RADIO_16_SILVERLAKE", "RADIO_17_FUNK", "RADIO_18_90S_ROCK"];
  const CLUB_X = 116.0, CLUB_Y = -1290.0;
  let clubStage = 0, clubVisits = 0;   // 0 away, 1 tuned on arrival, 2 tuned again inside
  function stripClubTick(ped) {
    const c = nat(N_GET_ENTITY_COORDS, "ib", [ped, 1]).v;
    if (!c || !isFinite(c[0]) || (Math.abs(c[0]) < 1 && Math.abs(c[1]) < 1)) return;
    const d = Math.hypot(c[0] - CLUB_X, c[1] - CLUB_Y);
    if (d > 220) { clubStage = 0; return; }
    if ((clubStage === 0 && d < 150) || (clubStage === 1 && d < 30)) {
      if (clubStage === 0) clubVisits++;
      const st = DRAKE_STATIONS[(clubVisits - 1) % DRAKE_STATIONS.length];
      for (const em of CLUB_EMITTERS) nat(N_SET_EMITTER_RADIO_STATION, "ss", [em, st]);
      tlog("[trainer club] Vanilla Unicorn emitters -> " + st + (clubStage ? " (inside)" : ""));
      clubStage++;
    }
  }
  function storyAutosaveTick(isPlaying) {
    if (!isPlaying || !storyMode()) return;
    const now = performance.now();
    if (!storyT0) { storyT0 = now; storyNextTryMs = now + AUTOSAVE_FIRST_MS; tlog("[trainer story] Story Mode autosave timer started"); return; }
    try { storyPositionTick(now); } catch (e) { const em = String(e && e.message || e); if (em !== spLastErr) { spLastErr = em; tlog("[trainer story] position error: " + em + " (stage " + spStage + ")"); } }
    try {      // a mission that just ended: the game's own autosave after it can take minutes or never come, so ask for one
      const mf = nat(N_GET_MISSION_FLAG, "").i;
      if (lastMissionFlag && !mf) { missionEndAt = now; tlog("[trainer story] mission ended"); }
      if (missionEndAt && now - missionEndAt > 12000) { missionEndAt = 0; storyWantSave(false, 240000, "12 s after the mission ended"); }
      lastMissionFlag = mf;
    } catch (e) {}
    try {      // The game's own autosave after a mission pass is serviced by the script "autosave_controller". If it never completes the game stays "save in progress" for ever (seen after
      // every mission pass: the save is never written and the progress is lost on exit). Log the facts, then service the request ourselves.
      if (!ctrlLogged) { ctrlLogged = true; tlog("[trainer story] autosave_controller script: exists=" + nat(N_DOES_SCRIPT_EXIST, "s", ["autosave_controller"]).i + " threads=" + nat(N_SCRIPT_THREADS_BY_HASH, "i", [joaat("autosave_controller")]).i); }
      const busyNow = nat(N_IS_AUTO_SAVE_IN_PROGRESS, "").i, codeReq = nat(N_HAS_CODE_REQUESTED_AUTOSAVE, "").i;
      if (busyNow || codeReq) {
        if (!stuckSince) stuckSince = now;
        if (now - stuckDiagAt > 15000 && now - stuckSince > 10000) { stuckDiagAt = now; tlog("[trainer story] save pending for " + Math.round((now - stuckSince) / 1000) + " s: inProgress=" + busyNow + " codeRequested=" + codeReq + " savingMessage=" + nat(N_GET_IS_DISPLAYING_SAVE_MESSAGE, "").i + " manualStatus=" + nat(49067, "").i + " controllerThreads=" + nat(N_SCRIPT_THREADS_BY_HASH, "i", [joaat("autosave_controller")]).i); }
        if (now - stuckSince > 25000 && stuckTries < 4 && now - storyLastSaveMs > 20000) {
          stuckTries++; storyLastSaveMs = now;
          nat(N_CLEAR_CODE_REQUESTED_AUTOSAVE, "");
          Atomics.add(T32, 57, 1);
          nat(N_DO_AUTO_SAVE, "");
          storyPendingCheckMs = now + 6000; saveAnnounce = true;
          tlog("[trainer story] save stuck: cleared the request and asked the game to save again (try " + stuckTries + ")");
        }
      } else if (stuckSince) { tlog("[trainer story] the pending save finished after " + Math.round((now - stuckSince) / 1000) + " s"); stuckSince = 0; stuckTries = 0; }
    } catch (e) {}
    if (storyPendingCheckMs && now >= storyPendingCheckMs) {      // report whether the game says the save went through
      storyPendingCheckMs = 0;
      try {
        const busy = nat(N_IS_AUTO_SAVE_IN_PROGRESS, "").i;
        const ok = nat(N_DID_SAVE_COMPLETE_SUCCESSFULLY, "").i;
        tlog("[trainer story] autosave result: inProgress=" + busy + " completeSuccessfully=" + ok);
        if (busy) storyPendingCheckMs = now + 4000;
        else if (saveAnnounce) { saveAnnounce = false; postEngineToast(ok ? "Game saved" : "The game reported a problem while saving"); }
      } catch (e) {}
    }
    if (saveWantUntil && now > saveWantUntil) {
      saveWantUntil = 0;
      if (saveAnnounce) { saveAnnounce = false; postEngineToast("Could not save: " + storyLastWhy); }
      saveWantManual = false;
    }
    if (now < storyNextTryMs) return;
    const okSave = storySave(false);
    if (okSave) { storyNextTryMs = now + AUTOSAVE_EVERY_MS; if (saveWantUntil) { saveWantUntil = 0; saveWantManual = false; } }
    else storyNextTryMs = now + (saveWantUntil ? SAVE_WANT_RETRY_MS : AUTOSAVE_RETRY_MS);
  }
  let storyNoteLogged = false;
  function persistTick(ped, veh, desired) {
    if (T32 && !modeKnown()) {      // the page has not announced the mode yet: never restore a sandbox session into a Story game by accident
      if (!restoreT0) restoreT0 = performance.now();
      if (performance.now() - restoreT0 < 20000) return;
    }
    if (storyMode()) {
      restoreStage = 9;
      if (!storyNoteLogged) { storyNoteLogged = true; tlog("[trainer story] Story Mode: sandbox session restore and stored cheats are off"); }
      return;
    }
    if (restoreStage < 0) {      // /state has not answered: ask again every 5 s (a failed first fetch used to leave the session unrestored for good)
      if (performance.now() - stateFetchT0 > 5000 && stateFetchTries < 12) fetchSessionState();
      return;
    }
    playingTicks++;
    if (restoreStage < 9 && course && restoreStage < 2) { restoreStage = 9; tlog("[trainer persist] restore skipped: a prop course is being built"); return; }
    if (restoreStage < 9) {
      // Start ~7 s of wall time after the first tick (the world is shown ~6 s in); tick counts are useless here, ticks run at ~10 Hz while loading.
      const nowMs = performance.now();
      if (!restoreT0) restoreT0 = nowMs;
      if (nowMs - restoreT0 < 7000) return;
      const rd = restoreData;
      if (restoreStage === 0) {
        if (rd.toggles) Atomics.or(T32, 2, rd.toggles | 0);
        if (rd.togglesB) Atomics.or(T32, TB, rd.togglesB | 0);
        if (rd.skinHash && rd.skin && !pendingModel) {
          nat(N_REQUEST_MODEL, "i", [rd.skinHash]);
          pendingModel = rd.skinHash; pendingKind = "spawn_skin"; pendingStyle = 0; pendingFrames = 0; pendingLabel = rd.skin;
        }
        restoreStage = 1;
      } else if (restoreStage === 1) {
        if (!pendingModel) {
          tpX = rd.x; tpY = rd.y; tpTargetZ = 0;
          nat(N_SET_ENTITY_COORDS, "ivbbbb", [veh || nat(N_PLAYER_PED_ID, "").i, rd.x, rd.y, rd.z + 1.0, 0, 0, 0, 1]);
          teleportFrames = 1; restoreStage = 2; tpT0 = performance.now();
        }
      } else if (restoreStage === 2) {
        if ((!teleportFrames && performance.now() - tpT0 > 1000) || performance.now() - tpT0 > 5000) {     // ground settled, or 5 s passed
          if (rd.veh && rd.veh.hash && !veh && !pendingModel) {
            nat(N_REQUEST_MODEL, "i", [rd.veh.hash]);
            pendingModel = rd.veh.hash; pendingKind = "spawn_vehicle"; pendingStyle = rd.veh.style | 0; pendingFrames = 0; pendingLabel = rd.veh.name || "Vehicle";
            restoreHeading = isFinite(rd.heading) ? rd.heading : null;
            restoreStage = 3;
          } else restoreStage = 9;
        }
      } else if (restoreStage === 3) {
        if (!pendingModel) restoreStage = 9;
      }
      if (restoreStage === 9) {
        playingTicks = 0;
        postEngineToast("Session restored");
        tlog("[trainer persist] restored x=" + rd.x + " y=" + rd.y + " veh=" + (rd.veh ? rd.veh.name : "none"));
      }
      return;
    }
    if (playingTicks % 90 !== 0 || teleportFrames || pendingModel || course) return;     // never store a spot in the sky above a course
    if (nat(N_GET_ENTITY_HEALTH, "i", [ped]).i <= 0) return;
    const ent = veh || ped;
    const c = nat(N_GET_ENTITY_COORDS, "ib", [ent, 1]).v;
    if (!c || !isFinite(c[0]) || !isFinite(c[2]) || c[2] < -50 || (Math.abs(c[0]) < 1 && Math.abs(c[1]) < 1)) return;
    const st = { v: 1, t: Date.now(), x: c[0], y: c[1], z: c[2], heading: nat(N_GET_ENTITY_HEADING, "i", [ent]).f,
      skin: savedSkin, skinHash: savedSkinHash, toggles: desired, togglesB: Atomics.load(T32, TB) & ~(1 << 17),
      veh: (veh && veh === spawnedVeh && spawnedInfo) ? spawnedInfo : null };
    fetch("/state", { method: "POST", body: JSON.stringify(st) }).catch(()=>{});
  }

  let tickCount = 0, tickGapMs = 20, passiveTicks = 0, lastTickLogMs = 0;
  // Story Mode with nothing switched on in the menu: the story scripts run the game and the trainer only keeps the heartbeat, the menu's live values and the autosave
  // timer going, about 4 times a second with a handful of natives (the full tick runs ~50 times a second with 15+ natives, each one a stack allocation and a table call
  // made inside the script thread's Wait). Any toggle, queued command, pending spawn or teleport switches back to the full tick within 250 ms.
  function storyPassiveTick() {
    passiveTicks++;
    let player = -1, ped = 0, playing = 0;
    try {
      player = nat(N_GET_PLAYER_INDEX, "").i;
      ped = nat(N_PLAYER_PED_ID, "").i;
      if (player >= 0) cachedPlayer = player;
      playing = (player >= 0 && ped) ? nat(N_IS_PLAYER_PLAYING, "i", [player]).i : 0;
    } catch (e) { return; }
    Atomics.add(T32, 1, 1);
    if (ped && passiveTicks % 4 === 0) {
      try {
        const inVeh = nat(N_IS_PED_IN_ANY_VEHICLE, "ib", [ped, 0]).i !== 0;
        const veh = inVeh ? nat(N_GET_VEHICLE_PED_IS_IN, "ib", [ped, 0]).i : 0;
        const wanted = nat(N_GET_PLAYER_WANTED_LEVEL, "i", [player]).i;
        Atomics.store(T32, 4, 1 | (inVeh ? 2 : 0) | ((wanted & 0xff) << 8));
        const ent = veh || ped;
        const pc = nat(N_GET_ENTITY_COORDS, "ib", [ent, 1]).v;
        TF32[32] = pc[0]; TF32[33] = pc[1]; TF32[34] = pc[2];
        TF32[35] = nat(N_GET_ENTITY_HEADING, "i", [ent]).f;
        TF32[36] = nat(N_GET_ENTITY_SPEED, "i", [ent]).f;
        T32[37] = nat(N_GET_ENTITY_HEALTH, "i", [ped]).i;
        T32[38] = nat(N_GET_PED_ARMOUR, "i", [ped]).i;
        T32[39] = nat(N_GET_CLOCK_HOURS, "").i;
        T32[40] = nat(N_GET_CLOCK_MINUTES, "").i;
      } catch (e) {}
      try { stripClubTick(ped); } catch (e) {}
    }
    try { storyAutosaveTick(playing); } catch (e) { if (++persistErrs <= 5) tlog("[trainer story] error: " + (e && e.message || e)); }
  }
  function trainerTick() {
    tickCount++;
    if (!getTrainerBuffer()) {
      if (tickCount <= 5 || tickCount % 500 === 0) {
        tlog("[trainer error] getTrainerBuffer=false on tick " + tickCount);
      }
      return;
    }

    // Pause menu up: the engine is already struggling to produce frames, so do the full cheat tick only every 10th call
    // (one cheap native in between). Everything catches up as soon as the menu closes.
    try {
      if (nat(N_IS_PAUSE_MENU_ACTIVE, "").i && tickCount % (tickGapMs > 20 ? 2 : 10) !== 0) return;
    } catch (e) {}

    if (storyMode() && !pendingModel && !teleportFrames && Atomics.load(T32, 2) === 0 && Atomics.load(T32, TB) === 0 && appliedMask === 0 && appliedMaskB === 0 &&
        Atomics.load(T32, 64) === Atomics.load(T32, 65)) {
      tickGapMs = 250;
      storyPassiveTick();
      return;
    }
    tickGapMs = 20;

    let player = -1, ped = 0, pedExists = 0, isPlaying = 0;
    try {
      player = nat(N_GET_PLAYER_INDEX, "").i;
      ped = nat(N_PLAYER_PED_ID, "").i;
      pedExists = ped ? nat(N_DOES_ENTITY_EXIST, "i", [ped]).i : 0;
      isPlaying = (player >= 0) ? nat(N_IS_PLAYER_PLAYING, "i", [player]).i : 0;
    } catch (e) {
      if (tickCount <= 10 || tickCount % 300 === 0) {
        tlog("[trainer nat exception] tick=" + tickCount + " err=" + (e.message || e));
      }
      return;
    }

    if (tickCount <= 10 || performance.now() - lastTickLogMs > 60000) {
      lastTickLogMs = performance.now();
      const qHead = Atomics.load(T32, 64);
      const qTail = Atomics.load(T32, 65);
      const desired = Atomics.load(T32, 2);
      tlog("[trainer tick #" + tickCount + "] player=" + player + " ped=" + ped + " exist=" + pedExists + " playing=" + isPlaying + " q=" + qHead + "/" + qTail + " des=" + desired);
    }

    if (player >= 0) cachedPlayer = player;
    if (!ped || !pedExists) return;

    let inVeh = nat(N_IS_PED_IN_ANY_VEHICLE, "ib", [ped, 0]).i !== 0;
    let veh = inVeh ? nat(N_GET_VEHICLE_PED_IS_IN, "ib", [ped, 0]).i : 0;
    if (!veh) {
      const usingVeh = nat(N_GET_VEHICLE_PED_IS_USING, "i", [ped]).i;
      if (usingVeh) {
        veh = usingVeh;
        inVeh = true;
      }
    }

    // 1. Heartbeat & State Flags
    Atomics.add(T32, 1, 1);
    if (tickCount % 30 === 0) syncWardrobeState(ped);
    const wanted = nat(N_GET_PLAYER_WANTED_LEVEL, "i", [player]).i;
    const stateFlags = 1 | (inVeh ? 2 : 0) | ((wanted & 0xff) << 8);
    Atomics.store(T32, 4, stateFlags);

    // 2. Continuous & Toggle Cheats
    const desired = Atomics.load(T32, 2);
    const changed = desired ^ appliedMask;
    if (changed) {
      tlog("[trainer toggles] desired=0x" + desired.toString(16) + " changed=0x" + changed.toString(16));
    }

    // God mode (bit 0)
    if (desired & (1 << 0)) {
      nat(N_SET_PLAYER_INVINCIBLE, "ib", [player, 1]);
      nat(N_SET_ENTITY_INVINCIBLE, "ib", [ped, 1]);
      const hp = nat(N_GET_ENTITY_HEALTH, "i", [ped]).i;
      if (hp > 0 && hp < 180) {
        nat(N_SET_ENTITY_HEALTH, "iii", [ped, 200, 0]);
        nat(N_SET_PED_ARMOUR, "ii", [ped, 100]);
      }
    } else if (changed & (1 << 0)) {
      nat(N_SET_PLAYER_INVINCIBLE, "ib", [player, 0]);
      nat(N_SET_ENTITY_INVINCIBLE, "ib", [ped, 0]);
    }

    // Never wanted (bit 1)
    if (desired & (1 << 1)) {
      nat(N_SET_MAX_WANTED_LEVEL, "i", [0]);
      nat(N_CLEAR_PLAYER_WANTED_LEVEL, "i", [player]);
    } else if (changed & (1 << 1)) {
      nat(N_SET_MAX_WANTED_LEVEL, "i", [5]);
    }

    // Infinite ammo (bit 2)
    if (desired & (1 << 2)) {
      nat(N_SET_PED_INFINITE_AMMO_CLIP, "ib", [ped, 1]);
    } else if (changed & (1 << 2)) {
      nat(N_SET_PED_INFINITE_AMMO_CLIP, "ib", [ped, 0]);
    }

    // Super jump (bit 3)
    if (desired & (1 << 3)) nat(N_SET_SUPER_JUMP_THIS_FRAME, "i", [player]);

    // Fast run (bit 4)
    if (desired & (1 << 4)) {
      nat(N_SET_RUN_SPRINT_MULTIPLIER_FOR_PLAYER, "if", [player, 1.49]);
    } else if (changed & (1 << 4)) {
      nat(N_SET_RUN_SPRINT_MULTIPLIER_FOR_PLAYER, "if", [player, 1.0]);
    }

    // No ragdoll (bit 5)
    if (desired & (1 << 5)) {
      nat(N_SET_PED_CAN_RAGDOLL, "ib", [ped, 0]);
    } else if (changed & (1 << 5)) {
      nat(N_SET_PED_CAN_RAGDOLL, "ib", [ped, 1]);
    }

    // Explosive ammo (bit 6)
    if (desired & (1 << 6)) nat(N_SET_EXPLOSIVE_AMMO_THIS_FRAME, "i", [player]);

    // Fire ammo (bit 7)
    if (desired & (1 << 7)) nat(N_SET_FIRE_AMMO_THIS_FRAME, "i", [player]);

    // Explosive melee (bit 8)
    if (desired & (1 << 8)) nat(N_SET_EXPLOSIVE_MELEE_THIS_FRAME, "i", [player]);

    // Slow motion (bit 9)
    if (desired & (1 << 9)) {
      nat(N_SET_TIME_SCALE, "f", [0.4]);
    } else if (changed & (1 << 9)) {
      nat(N_SET_TIME_SCALE, "f", [1.0]);
    }

    // Invisibility (bit 10)
    if (desired & (1 << 10)) {
      nat(N_SET_ENTITY_VISIBLE, "ibb", [ped, 0, 0]);
    } else if (changed & (1 << 10)) {
      nat(N_SET_ENTITY_VISIBLE, "ibb", [ped, 1, 0]);
    }

    // Unlimited stamina (bit 11)
    if (desired & (1 << 11)) nat(N_RESTORE_PLAYER_STAMINA, "if", [player, 1.0]);

    // Indestructible vehicle (bit 12)
    if (desired & (1 << 12)) {
      if (veh) {
        if (veh !== lastGodVeh || (changed & (1 << 12))) {
          if (lastGodVeh && lastGodVeh !== veh) applyVehicleGod(lastGodVeh, false, ped);
          applyVehicleGod(veh, true, ped);
          lastGodVeh = veh;
        }

        // Active frame-by-frame protection
        nat(N_SET_ENTITY_INVINCIBLE, "ib", [veh, 1]);
        nat(N_SET_VEHICLE_CAN_BE_VISIBLY_DAMAGED, "ib", [veh, 0]);
        nat(N_SET_VEHICLE_DAMAGE_SCALE, "if", [veh, 0.0]);
        nat(N_SET_VEHICLE_ENGINE_HEALTH, "if", [veh, 1000.0]);
        nat(N_SET_VEHICLE_PETROL_TANK_HEALTH, "if", [veh, 1000.0]);
        nat(N_SET_VEHICLE_BODY_HEALTH, "if", [veh, 1000.0]);
        nat(N_SET_ENTITY_HEALTH, "ii", [veh, 1000]);
        nat(N_SET_VEHICLE_DIRT_LEVEL, "if", [veh, 0.0]);
        nat(N_SET_VEHICLE_DEFORMATION_FIXED, "i", [veh]);
        // Dents can persist even when health never drops: re-apply the full protection set every ~90 ticks
        // (flags are cleared by some engine events) and fully repair every 6 ticks.
        if (tickCount % 90 === 0) applyVehicleGod(veh, true, ped);
        else if (tickCount % 6 === 0) nat(N_SET_VEHICLE_FIXED, "i", [veh]);
        nat(N_SET_PED_CAN_FLY_THROUGH_WINDSCREEN, "ib", [ped, 0]);
        nat(N_SET_PED_CAN_BE_KNOCKED_OFF_VEHICLE, "ii", [ped, 1]);

        // Auto-heal any damage from extreme impact/train collisions
        const bHp = nat(N_GET_VEHICLE_BODY_HEALTH, "i", [veh]).f;
        const eHp = nat(N_GET_ENTITY_HEALTH, "i", [veh]).i;
        if (bHp < 995.0 || eHp < 1000) {
          nat(N_SET_VEHICLE_FIXED, "i", [veh]);
          nat(N_SET_VEHICLE_DEFORMATION_FIXED, "i", [veh]);
          nat(N_SET_VEHICLE_ENGINE_ON, "ibbb", [veh, 1, 1, 0]);
        }
      } else if (lastGodVeh) {
        applyVehicleGod(lastGodVeh, false, ped);
        lastGodVeh = 0;
      }
    } else if (changed & (1 << 12)) {
      if (veh) applyVehicleGod(veh, false, ped);
      if (lastGodVeh && lastGodVeh !== veh) applyVehicleGod(lastGodVeh, false, ped);
      lastGodVeh = 0;
    }

    // Freeze time (bit 13)
    if (desired & (1 << 13)) {
      nat(N_PAUSE_CLOCK, "b", [1]);
    } else if (changed & (1 << 13)) {
      nat(N_PAUSE_CLOCK, "b", [0]);
    }

    // No traffic / peds (bit 14)
    if (desired & (1 << 14)) {
      nat(N_SET_VEHICLE_DENSITY_MULTIPLIER_THIS_FRAME, "f", [0.0]);
      nat(N_SET_PED_DENSITY_MULTIPLIER_THIS_FRAME, "f", [0.0]);
      nat(N_SET_RANDOM_VEHICLE_DENSITY_MULTIPLIER_THIS_FRAME, "f", [0.0]);
      nat(N_SET_PARKED_VEHICLE_DENSITY_MULTIPLIER_THIS_FRAME, "f", [0.0]);
    }

    // Riot mode (bit 15)
    if (desired & (1 << 15)) {
      nat(N_SET_RIOT_MODE_ENABLED, "b", [1]);
    } else if (changed & (1 << 15)) {
      nat(N_SET_RIOT_MODE_ENABLED, "b", [0]);
    }

    // Moon gravity (bit 16)
    if (desired & (1 << 16)) {
      nat(N_SET_GRAVITY_LEVEL, "i", [2]);
    } else if (changed & (1 << 16)) {
      nat(N_SET_GRAVITY_LEVEL, "i", [0]);
    }

    // Night vision (bit 17)
    if (desired & (1 << 17)) {
      nat(N_SET_NIGHTVISION, "b", [1]);
    } else if (changed & (1 << 17)) {
      nat(N_SET_NIGHTVISION, "b", [0]);
    }

    // Thermal vision (bit 18)
    if (desired & (1 << 18)) {
      nat(N_SET_SEETHROUGH, "b", [1]);
    } else if (changed & (1 << 18)) {
      nat(N_SET_SEETHROUGH, "b", [0]);
    }

    // Fast swim (bit 19)
    if (desired & (1 << 19)) {
      nat(N_SET_SWIM_MULTIPLIER_FOR_PLAYER, "if", [player, 1.49]);
    } else if (changed & (1 << 19)) {
      nat(N_SET_SWIM_MULTIPLIER_FOR_PLAYER, "if", [player, 1.0]);
    }

    // Drift mode / low grip (bit 20)
    if (veh) {
      if (desired & (1 << 20)) {
        nat(N_SET_VEHICLE_REDUCE_GRIP, "ib", [veh, 1]);
      } else if (changed & (1 << 20)) {
        nat(N_SET_VEHICLE_REDUCE_GRIP, "ib", [veh, 0]);
      }
    }

    // Bulletproof tyres (bit 21)
    if (veh) {
      if (desired & (1 << 21)) {
        nat(N_SET_VEHICLE_TYRES_CAN_BURST, "ib", [veh, 0]);
      } else if (changed & (1 << 21)) {
        nat(N_SET_VEHICLE_TYRES_CAN_BURST, "ib", [veh, 1]);
      }
    }

    // ---- Second toggle word (menu redesign): desired bits at T32[44], applied bits at T32[45] ----
    const desiredB = Atomics.load(T32, TB);
    const changedB = desiredB ^ appliedMaskB;
    const slow = (tickCount % 30 === 0);
    if (changedB) {
      tlog("[trainer toggles B] desired=0x" + desiredB.toString(16) + " changed=0x" + changedB.toString(16));
    }
    const onB = (bit) => (desiredB & (1 << bit)) !== 0;
    const chB = (bit) => (changedB & (1 << bit)) !== 0;
    if (onB(0) || chB(0)) { if (onB(0) ? (slow || chB(0)) : true) nat(N_SET_POLICE_IGNORE_PLAYER, "ib", [player, onB(0) ? 1 : 0]); }
    if (onB(1) || chB(1)) { if (onB(1) ? (slow || chB(1)) : true) nat(N_SET_EVERYONE_IGNORE_PLAYER, "ib", [player, onB(1) ? 1 : 0]); }
    if (onB(2) ? (slow || chB(2)) : chB(2)) {
      nat(N_SET_PLAYER_WEAPON_DAMAGE_MODIFIER, "if", [player, onB(2) ? 10.0 : 1.0]);
      nat(N_SET_PLAYER_MELEE_WEAPON_DAMAGE_MODIFIER, "if", [player, onB(2) ? 10.0 : 1.0]);
    }
    if (onB(3) ? (slow || chB(3)) : chB(3)) {
      nat(N_SET_PLAYER_HEALTH_RECHARGE_MULTIPLIER, "if", [player, onB(3) ? 12.0 : 1.0]);
      nat(N_SET_PLAYER_HEALTH_RECHARGE_MAX_PERCENT, "if", [player, onB(3) ? 1.0 : 0.5]);
    }
    if (onB(4) ? (slow || chB(4)) : chB(4)) {
      const f = onB(4) ? 1 : 0;      // bullet, fire, explosion, collision, melee, steam, p7, drown
      nat(N_SET_ENTITY_PROOFS, "ibbbbbbbb", [ped, 0, f, f, 0, 0, f, 0, f]);
    }
    if (onB(5) ? (slow || chB(5)) : chB(5)) {
      nat(N_SET_PLAYER_NOISE_MULTIPLIER, "if", [player, onB(5) ? 0.0 : 1.0]);
      nat(N_SET_PLAYER_SNEAKING_NOISE_MULTIPLIER, "if", [player, onB(5) ? 0.0 : 1.0]);
    }
    if (onB(6)) {
      nat(N_SET_PED_CAN_BE_KNOCKED_OFF_VEHICLE, "ii", [ped, 1]);
      nat(N_SET_PED_CAN_FLY_THROUGH_WINDSCREEN, "ib", [ped, 0]);
    } else if (chB(6) && !(desired & (1 << 12))) {
      nat(N_SET_PED_CAN_BE_KNOCKED_OFF_VEHICLE, "ii", [ped, 0]);
      nat(N_SET_PED_CAN_FLY_THROUGH_WINDSCREEN, "ib", [ped, 1]);
    }
    if (veh) {
      if (onB(7)) {
        if (slow || chB(7) || veh !== lastPowerVeh) {
          nat(N_SET_VEHICLE_CHEAT_POWER_INCREASE, "if", [veh, 6.0]);
          nat(N_MODIFY_VEHICLE_TOP_SPEED, "if", [veh, 60.0]);
          lastPowerVeh = veh;
        }
      } else if (chB(7)) {
        nat(N_SET_VEHICLE_CHEAT_POWER_INCREASE, "if", [veh, 1.0]);
        nat(N_MODIFY_VEHICLE_TOP_SPEED, "if", [veh, 0.0]);
        lastPowerVeh = 0;
      }
      if (onB(8) && tickCount % 2 === 0) {
        rainbowHue = (rainbowHue + 7) % 360;
        const rgb = hsvToRgb(rainbowHue, 1, 1);
        nat(N_SET_VEHICLE_CUSTOM_PRIMARY_COLOUR, "iiii", [veh, rgb[0], rgb[1], rgb[2]]);
        nat(N_SET_VEHICLE_CUSTOM_SECONDARY_COLOUR, "iiii", [veh, rgb[2], rgb[0], rgb[1]]);
      }
      if (onB(9)) {
        nat(N_SET_ENTITY_VISIBLE, "ibb", [veh, 0, 0]);
        lastInvisVeh = veh;
      } else if (chB(9)) {
        nat(N_SET_ENTITY_VISIBLE, "ibb", [veh, 1, 0]);
        lastInvisVeh = 0;
      }
      if (onB(12)) {
        nat(N_SET_VEHICLE_GRAVITY, "ib", [veh, 0]);
        lastAntiGravVeh = veh;
      } else if (chB(12)) {
        nat(N_SET_VEHICLE_GRAVITY, "ib", [veh, 1]);
        lastAntiGravVeh = 0;
      }
      if (onB(13)) {
        if (slow || chB(13)) nat(N_SET_VEHICLE_SIREN, "ib", [veh, 1]);
      } else if (chB(13)) {
        nat(N_SET_VEHICLE_SIREN, "ib", [veh, 0]);
      }
      // At high speed the world collision ahead of the car can still be streaming; the engine then freezes the car dead until it has loaded.
      // Ask it to keep loading collision around this vehicle.
      if (tickCount % 3 === 0) nat(N_SET_ENTITY_LOAD_COLLISION_FLAG, "ibi", [veh, 1, 1]);
      // Crash-through (turbo engine): at 200+ km/h an indestructible car that clips traffic or a prop stops dead in one tick (logged: 80 m/s -> 0
      // with gas held, brake released, collision loaded). While Turbo is on and the gas is held, carry most of that speed through, at most once per
      // 1.2 s so a real wall just bounces the car instead of pinning it.
      {
        const spd = nat(N_GET_ENTITY_SPEED, "i", [veh]).f;
        if (onB(7) && diagPrevSpeed > 30 && spd < diagPrevSpeed * 0.35 && performance.now() - lastCrashThroughMs > 1200 &&
            nat(N_IS_CONTROL_PRESSED, "ii", [0, 71]).i && !nat(N_IS_CONTROL_PRESSED, "ii", [0, 72]).i) {
          lastCrashThroughMs = performance.now();
          nat(N_SET_VEHICLE_FORWARD_SPEED, "if", [veh, diagPrevSpeed * 0.85]);
          if (diagLogged++ < 40) tlog("[trainer stop diag] crash-through: speed " + diagPrevSpeed.toFixed(1) + " -> " + spd.toFixed(1) + ", restored to " + (diagPrevSpeed * 0.85).toFixed(1));
          diagPrevSpeed = diagPrevSpeed * 0.85;
        } else {
          diagPrevSpeed = spd;
        }
      }
      // Super brakes (bit 18): while the brake (S / control 72) is held and the car rolls forward, bleed its forward speed exponentially.
      // Strong but never an instant stop; Space stays a normal handbrake for drifting.
      if (onB(18)) {
        const bnow = performance.now();
        const dt = Math.min(0.1, Math.max(0.005, (bnow - lastBrakeMs) / 1000));
        lastBrakeMs = bnow;
        // Only real, enabled key presses count (the "disabled control" read could report a stuck press and stop the car on its own), the
        // gas must be released, and the brake has to be seen on two ticks in a row before it takes hold.
        const braking = !!nat(N_IS_CONTROL_PRESSED, "ii", [0, 72]).i && !nat(N_IS_CONTROL_PRESSED, "ii", [0, 71]).i;
        brakeHeldTicks = braking ? brakeHeldTicks + 1 : 0;
        if (brakeHeldTicks >= 2) {
          const sv = nat(N_GET_ENTITY_SPEED_VECTOR, "ib", [veh, 1]).v;      // relative to the car: y = forward
          if (sv && sv[1] > 1.0) nat(N_SET_VEHICLE_FORWARD_SPEED, "if", [veh, sv[1] * Math.exp(-3.0 * dt)]);
        }
      }
    }
    // Leaving a vehicle with a per-vehicle effect still active restores the old one
    if (lastInvisVeh && lastInvisVeh !== veh) { nat(N_SET_ENTITY_VISIBLE, "ibb", [lastInvisVeh, 1, 0]); lastInvisVeh = 0; }
    if (lastAntiGravVeh && lastAntiGravVeh !== veh) { nat(N_SET_VEHICLE_GRAVITY, "ib", [lastAntiGravVeh, 1]); lastAntiGravVeh = 0; }
    if (lastPowerVeh && lastPowerVeh !== veh && !onB(7)) lastPowerVeh = 0;
    if (onB(10)) {
      nat(N_SET_GRAVITY_LEVEL, "i", [3]);
    } else if (chB(10)) {
      nat(N_SET_GRAVITY_LEVEL, "i", [(desired & (1 << 16)) ? 2 : 0]);
    }
    if (onB(11) ? (slow || chB(11)) : chB(11)) nat(N_SET_ARTIFICIAL_LIGHTS_STATE, "b", [onB(11) ? 1 : 0]);
    if (onB(14) ? (slow || chB(14)) : chB(14)) nat(N_SET_ALL_RANDOM_PEDS_FLEE, "ib", [player, onB(14) ? 1 : 0]);
    if (onB(15) ? (slow || chB(15)) : chB(15)) nat(N_SET_PLAYER_CAN_BE_HASSLED_BY_GANGS, "ib", [player, onB(15) ? 0 : 1]);
    if (onB(16) ? (slow || chB(16)) : chB(16)) nat(N_SET_CREATE_RANDOM_COPS, "b", [onB(16) ? 0 : 1]);
    if (onB(17)) {
      nat(N_DISPLAY_HUD, "b", [0]);
      nat(N_DISPLAY_RADAR, "b", [0]);
    } else if (chB(17)) {
      nat(N_DISPLAY_HUD, "b", [1]);
      nat(N_DISPLAY_RADAR, "b", [1]);
    }
    appliedMaskB = desiredB;
    Atomics.store(T32, TB_APPLIED, appliedMaskB);

    // ---- Live status for the menu header (floats/ints in the SAB words 32..40) ----
    if (tickCount % 3 === 0) {
      try {
        const ent = veh || ped;
        const pc = nat(N_GET_ENTITY_COORDS, "ib", [ent, 1]).v;
        TF32[32] = pc[0]; TF32[33] = pc[1]; TF32[34] = pc[2];
        TF32[35] = nat(N_GET_ENTITY_HEADING, "i", [ent]).f;
        TF32[36] = nat(N_GET_ENTITY_SPEED, "i", [ent]).f;
        T32[37] = nat(N_GET_ENTITY_HEALTH, "i", [ped]).i;
        T32[38] = nat(N_GET_PED_ARMOUR, "i", [ped]).i;
        T32[39] = nat(N_GET_CLOCK_HOURS, "").i;
        T32[40] = nat(N_GET_CLOCK_MINUTES, "").i;
      } catch (e) {}
    }
    if (inVeh && veh) {
      // The speedometer reads word 36 (speed, m/s) and word 41 (forward speed relative to the vehicle, signed: negative = reversing): refresh both every tick (~50 Hz) while driving.
      try {
        TF32[36] = nat(N_GET_ENTITY_SPEED, "i", [veh]).f;
        TF32[41] = nat(N_GET_ENTITY_SPEED_VECTOR, "ib", [veh, 1]).v[1];
      } catch (e) {}
    }

    appliedMask = desired;
    Atomics.store(T32, 3, appliedMask);

    // 3. Process Ring Buffer Command Queue
    let head = Atomics.load(T32, 64);
    const tail = Atomics.load(T32, 65);
    while (head !== tail) {
      const slotWord = 80 + head * 16;
      try {
        const cmdId = Atomics.load(T32, slotWord);
        if (cmdId > 0) {
          const argInt = T32[slotWord + 1];
          const argF0 = TF32[slotWord + 2];
          const argF1 = TF32[slotWord + 3];
          const argF2 = TF32[slotWord + 4];

          const slotByte = slotWord * 4;
          let end = slotByte + 20;
          while (end < slotByte + 64 && TU8[end] !== 0) end++;
          let str = "";
          if (end > slotByte + 20) {
            const len = end - (slotByte + 20);
            const copy = new Uint8Array(len);
            for (let i = 0; i < len; i++) copy[i] = TU8[slotByte + 20 + i];
            str = dec.decode(copy);
          }

          tlog("[trainer dispatching] cmd=" + cmdId + " argInt=" + argInt + " str=" + str + " ped=" + ped + " veh=" + veh);
          try {
            executeCommand(cmdId, argInt, [argF0, argF1, argF2], str, player, ped, veh);
            tlog("[trainer SUCCESS] cmd=" + cmdId + " executed!");
          } catch (e) {
            console.error("[trainer] command error:", e);
            tlog("[trainer cmd ERROR] cmd=" + cmdId + " error=" + (e.message || e));
          }
          Atomics.store(T32, slotWord, 0);
        }
      } catch (errSlot) {
        tlog("[trainer slot error] " + (errSlot.message || errSlot));
      } finally {
        head = (head + 1) % 16;
        Atomics.store(T32, 64, head);
      }
    }

    try { courseTick(ped, veh); } catch (e) { tlog("[trainer course ERROR] " + (e.message || e) + " " + String(e.stack || "").split("\n")[1]); courseClear(); }

    // 4. Model Loading Poll (vehicles & skins)
    if (pendingModel) {
      if (nat(N_HAS_MODEL_LOADED, "i", [pendingModel]).i !== 0) {
        if (pendingKind === "spawn_vehicle") {
          const oldVeh = veh;
          // Capture player position BEFORE touching any old vehicle!
          const c = nat(N_GET_ENTITY_COORDS, "ib", [ped, 1]).v;
          let heading = nat(N_GET_ENTITY_HEADING, "i", [ped]).f;
          if (restoreHeading !== null) { heading = restoreHeading; restoreHeading = null; }
          const v = nat(N_CREATE_VEHICLE, "ivfbbb", [pendingModel, c[0], c[1], c[2] + 0.8, heading, 0, 1, 0]).i;
          if (v) {
            nat(N_SET_PED_INTO_VEHICLE, "iii", [ped, v, -1]);
            spawnedVeh = v; spawnedInfo = { hash: pendingModel, name: pendingLabel, style: pendingStyle };
            nat(N_SET_VEHICLE_ON_GROUND_PROPERLY, "if", [v, 5.0]);
            nat(N_SET_VEHICLE_ENGINE_ON, "ibbb", [v, 1, 1, 0]);
            if (oldVeh && oldVeh !== v) {
              nat(N_SET_ENTITY_COORDS, "ivbbbb", [oldVeh, 0, 0, -500.0, 0, 0, 0, 1]);
              nat(N_SET_ENTITY_AS_NO_LONGER_NEEDED, "i", [oldVeh]);
            }
            if (pendingStyle > 0) {
              applyAlgerianVehicleStyling(v, pendingStyle);
            }
            if (desired & (1 << 12)) {
              applyVehicleGod(v, true, ped);
              lastGodVeh = v;
            }
            if (desired & (1 << 21)) nat(N_SET_VEHICLE_TYRES_CAN_BURST, "ib", [v, 0]);
            if (desired & (1 << 20)) nat(N_SET_VEHICLE_REDUCE_GRIP, "ib", [v, 1]);
            postEngineToast((pendingLabel || "Vehicle") + " Spawned & Ready");
          } else {
            postEngineToast("Failed to spawn " + (pendingLabel || "vehicle"));
          }
        } else if (pendingKind === "spawn_ped") {
          const o = nat(N_GET_OFFSET_FROM_ENTITY_IN_WORLD_COORDS, "iv", [ped, 0.0, 2.5, 0.0]).v;
          const hd = nat(N_GET_ENTITY_HEADING, "i", [ped]).f;
          const np = nat(N_CREATE_PED, "iivfbb", [26, pendingModel, o[0], o[1], o[2], hd, 0, 1]).i;
          if (np) {
            if (pendingStyle === 1) {          // bodyguard: joins the player's group, armed
              nat(N_SET_PED_RELATIONSHIP_GROUP_HASH, "ii", [np, joaat("PLAYER")]);
              nat(N_SET_PED_AS_GROUP_MEMBER, "ii", [np, nat(N_GET_PLAYER_GROUP, "i", [player]).i]);
              nat(N_SET_PED_NEVER_LEAVES_GROUP, "ib", [np, 1]);
              nat(N_SET_PED_ACCURACY, "ii", [np, 70]);
              giveWeaponIfValid(np, "WEAPON_CARBINERIFLE", 9999, true) || giveWeaponIfValid(np, "WEAPON_ASSAULTRIFLE", 9999, true);
            } else if (pendingStyle === 2) {   // hostile: armed, left to its own relationship group
              giveWeaponIfValid(np, "WEAPON_PISTOL", 500, true);
            }
            postEngineToast((pendingStyle === 1 ? "Bodyguard: " : "Spawned: ") + pendingLabel);
          } else {
            postEngineToast("Failed to spawn " + pendingLabel);
          }
        } else {
          nat(N_SET_PLAYER_MODEL, "ii", [player, pendingModel]);
          const np = nat(N_PLAYER_PED_ID, "").i;
          nat(N_SET_PED_DEFAULT_COMPONENT_VARIATION, "i", [np]);
          if (!pendingLabel.toLowerCase().startsWith("a_c_")) {
            giveWeapons(np);
          }
          appliedMask = 0; appliedMaskB = 0; // force refresh toggles on new ped
          syncWardrobeState(np);
          savedSkin = pendingLabel; savedSkinHash = pendingModel;
          postEngineToast("Skin: " + (pendingLabel || "Changed"));
        }
        nat(N_SET_MODEL_AS_NO_LONGER_NEEDED, "i", [pendingModel]);
        pendingModel = 0;
        pendingStyle = 0;
      } else if (++pendingFrames > 600) {
        console.warn("[trainer] model load timed out:", pendingModel);
        postEngineToast("Model load timed out");
        pendingModel = 0;
        pendingStyle = 0;
      }
    }

    // 6. Session persistence (restore once after boot, then autosave)
    try { persistTick(ped, veh, desired); } catch (e) {
      if (++persistErrs <= 5) tlog("[trainer persist] error at stage " + restoreStage + ": " + (e && e.message || e));
    }

    // 6b. Story Mode autosave (free roam only)
    if (tickCount % 50 === 0) { try { stripClubTick(ped); } catch (e) {} }
    if (tickCount % 15 === 0) { try { storyAutosaveTick(isPlaying); } catch (e) { if (++persistErrs <= 5) tlog("[trainer story] error: " + (e && e.message || e)); } }

    // 5. Ground Z Settling for Teleports
    if (teleportFrames && ++teleportFrames < 240) {
      const ref = { v: 0 };
      if (nat(N_GET_GROUND_Z_FOR_3D_COORD, "vRbb", [tpX, tpY, 700.0, 0, 0], ref).i !== 0 && ref.v > 0) {
        nat(N_SET_ENTITY_COORDS, "ivbbbb", [veh || ped, tpX, tpY, ref.v + 1.0, 0, 0, 0, 1]);
        teleportFrames = 0;
      }
    } else if (teleportFrames >= 240) {
      teleportFrames = 0;
    }
  }

  // Hook slot 14044 (rage::scrThread::Wait, (i64) -> void)
  try {
    const origWait = tableGet(14044);
    let waitCalls = 0;
    let lastTick = 0, lastWaitT = 0, gapLogged = 0, lastTickMs = 0;

    function hookedWait(info) {
      if (++waitCalls === 1) {
        const sabOk = !!(typeof self !== "undefined" && self.__trainerSab);
        const modOk = !!(typeof Module !== "undefined" && Module.trainerSab);
        console.log("[trainer] hookedWait LIVE on slot 14044!");
        tlog("[trainer] hookedWait LIVE on slot 14044! sab=" + sabOk + " mod=" + modOk);
        getTrainerBuffer();
      }

      // Pause-menu stall fix: audController::UpdateEntityRef makes the audio update thread poll (1 ms sleeps, up to 1 s) until the audio engine
      // thread advances its frame slot; the main thread waits for that thread in audNorthAudioEngine::FinishUpdate, which costs ~145 ms per frame
      // while the pause menu is up. The engine itself stops waiting once that poll has timed out once (byte 12114816 = 1, set only after the
      // 1 s timeout), so set that same byte. audEngine::PartialInit clears it at start-up: set it again every few thousand Waits.
      // Not in Story Mode: this skips the engine's own wait for the audio thread, and Story missions (conversations, scripted audio) hang with the picture frozen and the sound still
      // playing (Repossession, twice). Sandbox keeps the fix; Story keeps the pause-menu lag it had before.
      if (waitCalls % 2000 === 1000 && !storyMode()) {
        try { updateViews(); if (U8[12114816] !== 1) { U8[12114816] = 1; tlog("[trainer] audio entity-ref wait disabled (pause-menu stall fix)"); } } catch (e) {}
      }

      const now = performance.now();
      // Super jump has to be re-armed in every game frame (a tick only runs every >= 20 ms, which skipped frames at 60 fps and made jumps
      // fail), so it is re-applied from here at most every 8 ms.
      if (cachedPlayer >= 0 && T32 && (Atomics.load(T32, 2) & 8) && now - lastSuperJumpMs >= 8) {
        lastSuperJumpMs = now;
        try { nat(N_SET_SUPER_JUMP_THIS_FRAME, "i", [cachedPlayer]); } catch (e) {}
      }
      // Aim crosshair with hit / kill animations, drawn with DRAW_RECT (draw calls last one frame, so this runs every >= 8 ms). Normal state: a thin
      // white four-arm crosshair with a gap that kicks open on each shot. Hit: white X ticks that expand and fade. Kill: bigger red X ticks and a red crosshair.
      if (cachedPlayer >= 0 && now - lastAimDrawMs >= 8 && !storyMode()) {
        lastAimDrawMs = now;
        try {
          const aim = !!(nat(N_IS_CONTROL_PRESSED, "ii", [0, 25]).i || nat(N_IS_PLAYER_FREE_AIMING, "i", [cachedPlayer]).i);
          const shoot = !!nat(N_IS_CONTROL_PRESSED, "ii", [0, 24]).i;
          if (shoot && !aimPrevShoot) aimShotT = now;
          aimPrevShoot = shoot;
          const watching = aimHitEnt && now < aimHitWatch;
          if (aim || shoot || watching || now - aimHitT < 250 || now - aimKillT < 650) {
            if (aim || shoot) {
              const ref = { v: 0 };
              const o = nat(N_GET_ENTITY_PLAYER_IS_FREE_AIMING_AT, "iR", [cachedPlayer], ref);
              if (o.i && o.ci) { aimLastEnt = o.ci; aimLastEntT = now; }
            }
            if (nat(N_HAS_PLAYER_DAMAGED_AT_LEAST_ONE_PED, "i", [cachedPlayer]).i) {
              aimHitT = now;
              nat(N_CLEAR_PLAYER_HAS_DAMAGED_AT_LEAST_ONE_PED, "i", [cachedPlayer]);
              aimHitEnt = (now - aimLastEntT < 500) ? aimLastEnt : 0;
              aimHitWatch = now + 2500;
            }
            if (aimHitEnt && now < aimHitWatch && nat(N_IS_PED_DEAD_OR_DYING, "ii", [aimHitEnt, 1]).i) { aimKillT = now; aimHitEnt = 0; }
            const rect = (dx, dy, w, h, r, g, b, a) => nat(N_DRAW_RECT, "ffffiiii", [0.5 + dx / 1920, 0.5 + dy / 1080, w / 1920, h / 1080, r, g, b, a | 0]);
            const tHit = (now - aimHitT) / 250, tKill = (now - aimKillT) / 650;
            const killing = tKill >= 0 && tKill < 1;
            if (aim || shoot || killing) {
              const kick = Math.max(0, 1 - (now - aimShotT) / 130);
              const gap = 5 + kick * 5, len = 11, th = 2;
              const cr = killing ? 255 : 255, cg = killing ? 60 : 255, cb = killing ? 60 : 255;
              const arms = [[-(gap + len / 2), 0, len, th], [gap + len / 2, 0, len, th], [0, -(gap + len / 2), th, len], [0, gap + len / 2, th, len]];
              for (const [dx, dy, w, h] of arms) rect(dx, dy, w + 2, h + 2, 0, 0, 0, 230);
              for (const [dx, dy, w, h] of arms) rect(dx, dy, w, h, cr, cg, cb, 255);
            }
            if (tKill >= 0 && tKill < 1) {
              const d0 = 14 + 22 * tKill, al = 255 * (1 - tKill);
              for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (let k = 0; k < 6; k++) { const d = d0 + k * 5; rect(sx * d, sy * d, 4, 4, 255, 40, 40, al); }
            } else if (tHit >= 0 && tHit < 1) {
              const d0 = 10 + 9 * tHit, al = 255 * (1 - tHit);
              for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (let k = 0; k < 3; k++) { const d = d0 + k * 4; rect(sx * d, sy * d, 3, 3, 255, 255, 255, al); }
            }
          }
        } catch (e) {}
      }
      if (lastWaitT && now - lastWaitT > 80 && ++gapLogged <= 40) {
        tlog("[pause diag] script Wait gap " + (now - lastWaitT).toFixed(0) + " ms (last tick took " + lastTickMs.toFixed(1) + " ms)");
      }
      lastWaitT = now;
      if (now - lastTick >= tickGapMs) {
        lastTick = now;
        const tk0 = performance.now();
        try {
          trainerTick();
        } catch (e) {
          console.error("[trainer] wait tick error:", e);
          tlog("[trainer wait tick error] " + (e.message || e));
        }        lastTickMs = performance.now() - tk0;

      }

      if (origWait) return origWait(info);
    }

    const wasmWaitWrapper = new Uint8Array([
      0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
      0x01, 0x05, 0x01, 0x60, 0x01, 0x7e, 0x00,
      0x02, 0x0d, 0x01, 0x03, 0x65, 0x6e, 0x76, 0x05, 0x6a, 0x73, 0x5f, 0x66, 0x6e, 0x00, 0x00,
      0x03, 0x02, 0x01, 0x00,
      0x07, 0x08, 0x01, 0x04, 0x68, 0x6f, 0x6f, 0x6b, 0x00, 0x01,
      0x0a, 0x08, 0x01, 0x06, 0x00, 0x20, 0x00, 0x10, 0x00, 0x0b
    ]);
    const modWait = new WebAssembly.Module(wasmWaitWrapper);
    const instWait = new WebAssembly.Instance(modWait, { env: { js_fn: hookedWait } });
    tableSet(14044, instWait.exports.hook);
    console.log("[trainer] installed native scrThread::Wait hook on table slot 14044");
    tlog("[trainer] installed hook on slot 14044");
  } catch (err) {
    console.error("[trainer] hook slot 14044 error:", err);
    tlog("[trainer] hook slot 14044 error: " + err.message);
  }
}
