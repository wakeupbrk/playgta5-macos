#!/usr/bin/env python3
"""Build and synchronize all trainer components across root and mirror/playgta5.com."""
import filecmp
import json
import os
import re
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
MIRROR = os.path.join(ROOT, "mirror", "playgta5.com")
BUILD_ID = "8b0b5899ed"
VERSION = "20261016_trainer_v16"

print(f"=== GTA V Sandbox Trainer Builder & Synchronizer [{VERSION}] ===")

# 1. Load cheat-catalog.json to build SKINS with Categories and Subcategories
with open(os.path.join(ROOT, "cheat-catalog.json")) as f:
    catalog = json.load(f)

skins_list = []
# Protagonists
skins_list.append({"label": "Franklin Clinton", "model": "player_one", "cat": "Protagonists", "sub": "Main Story", "icon": "⭐"})
skins_list.append({"label": "Michael De Santa", "model": "player_zero", "cat": "Protagonists", "sub": "Main Story", "icon": "⭐"})
skins_list.append({"label": "Trevor Philips", "model": "player_two", "cat": "Protagonists", "sub": "Main Story", "icon": "⭐"})
skins_list.append({"label": "GTA Online Male", "model": "mp_m_freemode_01", "cat": "Protagonists", "sub": "GTA Online", "icon": "👤"})
skins_list.append({"label": "GTA Online Female", "model": "mp_f_freemode_01", "cat": "Protagonists", "sub": "GTA Online", "icon": "👩"})

animal_meta = {
    "a_c_boar": ("Wild Boar", "Wild Land", "🐗"),
    "a_c_cat_01": ("Cat", "Dogs & Pets", "🐱"),
    "a_c_chickenhawk": ("Chickenhawk", "Birds", "🦅"),
    "a_c_chimp": ("Chimpanzee", "Primates", "🐒"),
    "a_c_chop": ("Chop (Rottweiler)", "Dogs & Pets", "🐕"),
    "a_c_cormorant": ("Cormorant", "Birds", "🦆"),
    "a_c_cow": ("Cow", "Wild Land", "🐄"),
    "a_c_coyote": ("Coyote", "Wild Land", "🐺"),
    "a_c_crow": ("Crow", "Birds", "🐦"),
    "a_c_deer": ("Deer", "Wild Land", "🦌"),
    "a_c_dolphin": ("Dolphin", "Marine Life", "🐬"),
    "a_c_fish": ("Fish", "Marine Life", "🐟"),
    "a_c_hen": ("Hen / Chicken", "Birds", "🐔"),
    "a_c_humpback": ("Humpback Whale", "Marine Life", "🐋"),
    "a_c_husky": ("Husky Dog", "Dogs & Pets", "🐕"),
    "a_c_killerwhale": ("Killer Whale (Orca)", "Marine Life", "🐋"),
    "a_c_mtlion": ("Mountain Lion (Cougar)", "Wild Land", "🦁"),
    "a_c_pig": ("Pig", "Wild Land", "🐖"),
    "a_c_pigeon": ("Pigeon", "Birds", "🐦"),
    "a_c_poodle": ("Poodle Dog", "Dogs & Pets", "🐩"),
    "a_c_pug": ("Pug Dog", "Dogs & Pets", "🐕"),
    "a_c_rabbit_01": ("Rabbit", "Wild Land", "🐇"),
    "a_c_rat": ("Rat", "Wild Land", "🐀"),
    "a_c_retriever": ("Golden Retriever", "Dogs & Pets", "🐕"),
    "a_c_rhesus": ("Rhesus Monkey", "Primates", "🐒"),
    "a_c_rottweiler": ("Rottweiler Dog", "Dogs & Pets", "🐕"),
    "a_c_seagull": ("Seagull", "Birds", "🕊️"),
    "a_c_sharkhammer": ("Hammerhead Shark", "Marine Life", "🦈"),
    "a_c_shepherd": ("Shepherd Dog", "Dogs & Pets", "🐕"),
    "a_c_stingray": ("Stingray", "Marine Life", "🐡"),
    "a_c_sharktiger": ("Tiger Shark", "Marine Life", "🦈"),
    "a_c_westy": ("Westie Terrier", "Dogs & Pets", "🐕")
}

def classify(cat_title, model, label):
    m = model.lower()
    if cat_title == "Animals":
        meta = animal_meta.get(m)
        if meta:
            return "Animals", meta[1], meta[0], meta[2]
        return "Animals", "Wild Land", label, "🐾"
    elif cat_title == "Cops and service":
        if any(k in m for k in ["cop", "sheriff", "swat", "fbi", "hwaycop", "ranger", "securo", "security", "prisguard"]):
            return "Services", "Police & SWAT", label, "👮"
        elif any(k in m for k in ["marine", "army", "armour", "blackops"]):
            return "Services", "Military & Security", label, "🎖️"
        elif any(k in m for k in ["paramedic", "fire", "doctor", "autopsy"]):
            return "Services", "Medical & Fire", label, "🚑"
        else:
            return "Services", "City Services", label, "👷"
    elif cat_title == "Gangs":
        if "fam" in m:
            return "Gangs", "The Families", label, "🟢"
        elif "balla" in m:
            return "Gangs", "The Ballas", label, "🟣"
        elif any(k in m for k in ["vagos", "azteca"]):
            return "Gangs", "Vagos & Aztecas", label, "🟡"
        elif "lost" in m or "motox" in m:
            return "Gangs", "The Lost MC", label, "🏍️"
        else:
            return "Gangs", "Mob & Cartels", label, "🕶️"
    elif cat_title == "Story cast":
        if any(k in m for k in ["amanda", "tracy", "jimmy", "patricia"]):
            return "Story", "De Santa Family", label, "🏡"
        elif any(k in m for k in ["lamar", "lester", "brad", "ron", "wade", "chef", "stretch"]):
            return "Story", "Key Associates", label, "🤝"
        elif any(k in m for k in ["steve", "dave", "andreas", "devin", "cheng", "weazel", "fbi"]):
            return "Story", "Villains & FIB", label, "🕵️"
        elif any(k in m for k in ["barry", "beverly", "maryann", "omega", "tonya", "cletus", "dom", "nigel", "marnie"]):
            return "Story", "Strangers & Freaks", label, "🎪"
        else:
            return "Story", "Story Characters", label, "🎬"
    elif cat_title == "Unique":
        if any(k in m for k in ["space", "imporage"]):
            return "Special", "Sci-Fi & Heroes", label, "🛸"
        elif any(k in m for k in ["clown", "mime", "zombie", "jesus"]):
            return "Special", "Performers & Clowns", label, "🤡"
        elif any(k in m for k in ["filmnoir", "party", "movpre", "magenta"]):
            return "Special", "Vinewood Icons", label, "⭐"
        else:
            return "Special", "Unique Citizens", label, "🎭"
    else: # Men, Women
        if any(k in m for k in ["beach", "fitness", "surfer", "yoga", "swim"]):
            return "Civilians", "Beach & Fitness", label, "🏖️"
        elif any(k in m for k in ["bevhills", "business", "richman", "downtown", "golfer"]):
            return "Civilians", "Business & Wealthy", label, "💼"
        elif any(k in m for k in ["skater", "hipster", "tramp", "rurmeth", "polynesian"]):
            return "Civilians", "Subcultures & Youth", label, "🛹"
        elif any(k in m for k in ["farmer", "rurprep", "salton", "hillbilly", "cletus"]):
            return "Civilians", "Rural & Country", label, "🚜"
        else:
            return "Civilians", "Urban Citizens", label, "🚶"

for c in catalog.get("skins", []):
    title = c.get("title")
    if title == "Protagonists":
        continue
    for e in c.get("entries", []):
        cat, sub, lbl, icon = classify(title, e["model"], e["label"])
        skins_list.append({
            "label": lbl,
            "model": e["model"].lower(),
            "cat": cat,
            "sub": sub,
            "icon": icon
        })

skins_json = json.dumps(skins_list, separators=(',', ':'))
print(f"Loaded {len(skins_list)} skins with categories and subcategories.")

# 1b. Load cheat-catalog.json to build VEHICLES with Categories and Subcategories
RIDE_CAT_META = {
    "Supercars": ("Supercars", "🏎️", "Adder, Cheetah, Entity XF, Infernus, Vacca, Voltic, Zentorno, T20"),
    "Fast cars": ("Sports & Tuners", "🏁", "Elegy RH8, Banshee, Sultan, Buffalo, Carbonizzare, Jester"),
    "Classics": ("Sports Classics", "📻", "Tornado, Stinger, Z-Type, Roosevelt, JB 700, Monroe"),
    "Muscle": ("Muscle Cars", "💪", "Dominator, Gauntlet, Sabre Turbo, Buccaneer, Ruiner, Vigero"),
    "SUVs": ("SUVs & 4x4s", "🚙", "Dubsta, Baller, Cavalcade, Patriot, Granger, Rocoto"),
    "Sedans": ("Sedans & Saloons", "🚗", "Schafter, Tailgater, Emperor, Super Diamond, Stretch Limo"),
    "Coupes": ("Coupes & Cabrio", "🚘", "Exemplar, Cognoscenti, Felon, F620, Sentinel, Oracle"),
    "Compacts": ("Compacts & Hatch", "🚙", "Blista, Dilettante, Panto, Prairie, Issi, Rhapsody"),
    "Motorcycles": ("Motorcycles & Bikes", "🏍️", "Bati 801, Sanchez, Akuma, Hakuchou, Hexer, PCJ-600"),
    "Off-road": ("Off-Road & Dunes", "🧗", "Dune Buggy, Sandking, Bodhi, Insurgent, Monster, Rebel"),
    "Emergency": ("Emergency & Police", "🚨", "Police Cruiser, Interceptor, FIB Buffalo, Ambulance, Firetruck"),
    "Military": ("Military & Armed", "🎖️", "Rhino Tank, Crusader, Barracks, Barracks Semi"),
    "Service": ("Service & Transit", "🚌", "City Bus, Taxi, Dashound, Airport Bus, Trashmaster"),
    "Airplanes": ("Planes & Jets", "✈️", "Lazer Jet, Luxor, Cargo Plane, Shamal, Mallard, Titan"),
    "Helicopters": ("Helicopters", "🚁", "Buzzard Attack Chopper, Annihilator, Maverick, Cargobob, Frogger"),
    "Boats": ("Boats & Marine", "🚤", "Jetmax, Seashark, Marquis, Speeder, Dinghy, Submersible"),
    "Vans": ("Vans & Commercial", "🚐", "Speedo, Burrito, Surfer, Gang Burrito, Youga, Boxville"),
    "Cycles": ("Bicycles", "🚲", "BMX, Cruiser, Endurex, Fixter, Scorcher, Whippet"),
    "Trucks": ("Heavy Trucks", "🚛", "Hauler, Phantom, Packer, Pounder, Mule, Benson, Biff"),
    "Industrial": ("Industrial & Mining", "🏗️", "Dozer, Dump Truck, Cutter, Tipper, Rubble, Mixer"),
    "Utility": ("Utility & Maintenance", "🚜", "Golf Caddy, Tractor, Forklift, Lawn Mower, Towtruck, Sadler"),
    "Trains": ("Trains & Rail", "🚆", "Freight Train, Container Car, Tanker, Cable Car"),
    "Trailers": ("Trailers", "🚚", "Tanker, Boat Trailer, Freight Trailer, Army Trailer"),
    "Special": ("Special & Unique", "⭐", "Blimp, Space Docker, Duke O'Death, Kraken Sub")
}

rides_list = []
seen_models = set()

for cat in catalog.get("rides", []):
    raw_title = cat.get("title")
    meta = RIDE_CAT_META.get(raw_title, (raw_title, "🚗", raw_title))
    cat_id = raw_title
    cat_title = meta[0]
    cat_icon = meta[1]
    for e in cat.get("entries", []):
        m = e["model"].lower()
        if m in seen_models: continue
        seen_models.add(m)
        rides_list.append({
            "label": e["label"],
            "model": m,
            "cat": cat_id,
            "catTitle": cat_title,
            "icon": cat_icon
        })

# Extra player favorites
extras = [
    ("Pegassi Zentorno", "zentorno", "Supercars"),
    ("Progen T20", "t20", "Supercars"),
    ("Grotti Turismo R", "turismor", "Supercars"),
    ("Pegassi Osiris", "osiris", "Supercars"),
    ("Karin Kuruma", "kuruma2", "Fast cars"),
    ("HVY Insurgent", "insurgent", "Off-road"),
    ("Cheval Marshall", "monster", "Off-road"),
    ("Shitzu Hakuchou", "hakuchou", "Motorcycles"),
    ("Pegassi Bati 801", "bati", "Motorcycles"),
    ("Western Mallard", "stunt", "Airplanes"),
    ("Police Bike", "policeb", "Emergency"),
    ("Dinka Enduro", "enduro", "Motorcycles"),
    ("JoBuilt Lazer Jet", "lazer", "Airplanes"),
    ("Progen GP1", "gp1", "Supercars")
]

for label, model, cat_id in extras:
    m = model.lower()
    if m not in seen_models:
        seen_models.add(m)
        meta = RIDE_CAT_META.get(cat_id, (cat_id, "🚗", cat_id))
        rides_list.append({
            "label": label,
            "model": m,
            "cat": cat_id,
            "catTitle": meta[0],
            "icon": meta[1]
        })

categories_list = []
for cat_id, (title, icon, desc) in RIDE_CAT_META.items():
    count = sum(1 for r in rides_list if r["cat"] == cat_id)
    if count > 0:
        categories_list.append({
            "id": cat_id,
            "title": title,
            "icon": icon,
            "desc": desc,
            "count": count
        })

rides_json = json.dumps(rides_list, separators=(',', ':'))
categories_json = json.dumps(categories_list, separators=(',', ':'))
print(f"Loaded {len(rides_list)} vehicles across {len(categories_list)} categories.")

# 2. GENERATE cheats.js from src_cheats.js
print("Generating cheats.js...")
with open("src_cheats.js", "r") as f:
    cheats_src = f.read()

cheats_final = cheats_src.replace("__SKINS_JSON_PLACEHOLDER__", skins_json)
cheats_final = cheats_final.replace("__RIDES_JSON_PLACEHOLDER__", rides_json)
cheats_final = cheats_final.replace("__VEHICLE_CATEGORIES_JSON_PLACEHOLDER__", categories_json)
with open("cheats.js", "w") as f:
    f.write(cheats_final.strip() + "\n")
print("  [+] Wrote cheats.js (size: %d bytes)" % len(cheats_final))

# 3. UPDATE game.js from src_trainer.js
print("Updating game.js...")
with open("src_trainer.js", "r") as f:
    trainer_src = f.read()

with open("game.js", "r") as f:
    game_js_content = f.read()

idx_hook = game_js_content.find("// --- GTA V Web Trainer Hook ---")
if idx_hook != -1:
    game_js_content = game_js_content[:idx_hook].rstrip() + "\n\n" + trainer_src.strip() + "\n"
else:
    game_js_content = game_js_content.rstrip() + "\n\n" + trainer_src.strip() + "\n"

with open("game.js", "w") as f:
    f.write(game_js_content)
print("  [+] Wrote game.js (size: %d bytes)" % len(game_js_content))

# 4. UPDATE loader.js version
with open("loader.js", "r") as f:
    loader_js = f.read()
loader_js = re.sub(r"game\.js\?v=[^\s'\"]+", f"game.js?v={VERSION}", loader_js)
with open("loader.js", "w") as f:
    f.write(loader_js)
print("  [+] Updated loader.js version")

# 5. UPDATE homepage.html version
with open("homepage.html", "r") as f:
    hp = f.read()
hp = re.sub(r"/cheats\.js\?v=[^\s'\"]+", f"/cheats.js?v={VERSION}", hp)
hp = re.sub(r"/loader\.js\?v=[^\s'\"]+", f"/loader.js?v={VERSION}", hp)
with open("homepage.html", "w") as f:
    f.write(hp)
print("  [+] Updated homepage.html versions")

# 6. SYNC TO mirror/playgta5.com/
print("Syncing files to mirror/playgta5.com/...")
sync_pairs = [
    ("homepage.html", os.path.join(MIRROR, "index.html")),
    ("cheats.js", os.path.join(MIRROR, "cheats.js")),
    ("loader.js", os.path.join(MIRROR, "b", BUILD_ID, "loader.js")),
    ("game.js", os.path.join(MIRROR, "b", BUILD_ID, "game.js")),
]

for src, dst in sync_pairs:
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copy2(src, dst)
    same = filecmp.cmp(src, dst)
    print(f"  [✓] {src} -> {dst} (identical: {same})")

# 7. SYNTAX VERIFICATION
print("Verifying JavaScript syntax with node -c...")
for js_file in ["cheats.js", "loader.js", "game.js"]:
    res = subprocess.run(["node", "-c", js_file], capture_output=True, text=True)
    if res.returncode != 0:
        print(f"  [!] SYNTAX ERROR in {js_file}:\n{res.stderr}")
        sys.exit(1)
    else:
        print(f"  [✓] {js_file} syntax clean")

if os.path.abspath(__file__) != os.path.abspath("build_and_sync.py"):
    shutil.copy2(__file__, "build_and_sync.py")
    print("  [+] Synchronized build_and_sync.py")

print("\nAll files built, synchronized, and verified successfully!")
