<div align="center">

# GTA V for macOS

**Run the browser port of GTA V locally on a Mac, with a Story / Sandbox / Mods launch menu, persistent Story saves, a full cheat menu and a mod loader.**

[![Stars](https://img.shields.io/github/stars/wakeupbrk/playgta5-macos?style=flat-square&color=f5b301)](https://github.com/wakeupbrk/playgta5-macos/stargazers)
[![License](https://img.shields.io/github/license/wakeupbrk/playgta5-macos?style=flat-square)](LICENSE)
![Platform](https://img.shields.io/badge/platform-macOS-black?style=flat-square&logo=apple)
![Browser](https://img.shields.io/badge/browser-Chrome%20(WebGPU)-4285F4?style=flat-square&logo=googlechrome&logoColor=white)
[![Telegram](https://img.shields.io/badge/chat-Telegram-26A5E4?style=flat-square&logo=telegram&logoColor=white)](https://t.me/wakeupbrkgc)

<img src="media/Screenshot 2026-10-07 172103.png" alt="GTA V running in Chrome on macOS" width="85%">

</div>

---

## Features

| | |
|---|---|
| **Launch menu** | Pick **Story Mode** (`Enter`), **Sandbox Mode** (`Space`) or **Mods** (`M`) on the title screen while the engine loads behind it. |
| **Story saves that persist** | Story autosaves are mirrored from the browser to `work/userdata/` (last 5 versions kept in `work/userdata-history/`), so clearing Chrome data does not wipe your progress. The menu shows your latest save and offers a new game. |
| **Sandbox Mode** | Free roam on the GTA V map (or the experimental GTA VI test map) with every weapon. |
| **Cheat menu** | Open it with `Cmd+X`. Vehicles (catalogue in `cheat-catalog.json`), paint, neon, plates, window tint, repair and handling, wanted level, weather, time of day, game speed, visual effects, loadout, ammo and damage, abilities, chaos, and more. |
| **Mod loader** | Drop a folder in `mods/`, switch it on in the **Mods** screen. Script mods get a small `window.GTAV` API. See [mods/README.md](mods/README.md). |
| **Mac launcher** | `GTAV.app` / `Launch-Mac.command` start a local server bound to `127.0.0.1:8000` and open Chrome. Your original files are backed up first and can be restored. |
| **Open source chain** | The page code you play is built from readable sources (`src_trainer.js`, `src_cheats.js`) by `build_and_sync.py`. |

## Quick start

1. **Clone** this repo (or download the ZIP) into a permanent folder, such as your Games folder.

   ```bash
   git clone https://github.com/wakeupbrk/playgta5-macos.git
   ```

2. **Add the game files.** Paste your `mirror` folder (about 19.7 GB) next to `GTAV.app`, so that `mirror/playgta5.com/index.html` exists. Both `mirror` and `.mirror` are accepted. The files are **not** included in this repo.
3. **Launch.** Double-click `GTAV.app` or `Launch-Mac.command`. The first launch installs this repo's page files (launch menu, trainer, cheats, loader) into your `mirror` folder, saving the originals under `work/backups/mac-setup/` first. Chrome then opens at `http://localhost:8000/`, or on another free port if 8000 is busy (the port used is shown in the terminal and saved in `work/server-port`). Optionally run `Install-Desktop.command` once for a Desktop shortcut.
4. **Play.** Choose Story, Sandbox or Mods. Click the game to capture the mouse.

### Controls

| Key | Action |
|---|---|
| `W` `A` `S` `D` | Move |
| `F` | Enter / exit vehicle |
| `Esc` | Release the mouse |
| `Cmd+X` | Cheat menu |
| `=` | Toggle FPS counter |

### Requirements

- macOS on Apple Silicon or Intel
- Google Chrome with **WebGPU** and 64-bit WebAssembly
- Python 3.11 or newer (standard library only)
- Tested on an Apple Silicon M1 Pro with 32 GB RAM. The HD profile targets 1920x1080 at 30 FPS; other hardware has not been playtested, and shader loading can cause pauses.

## Mods

```
mods/my-mod/
  mod.json     name, version, author, description, entry, modes
  main.js      optional script, runs in the game page when enabled
  overrides/   optional loose web files served instead of the game's own
```

```js
GTAV.registerMod('my-mod', {
  onWorld() { GTAV.toast('Hello from my mod'); },
  menu: [{ label: 'Max wanted', run() { GTAV.command('WANTED_MAX', 0, [0, 0, 0], ''); } }],
});
```

Enabling or disabling a mod never edits game files. Copy `mods/_template` to start. Full API in [mods/README.md](mods/README.md).

## Building from source

Edit the sources, then regenerate the files the page loads:

| Source | Output |
|---|---|
| `src_trainer.js` | `game.js` |
| `src_cheats.js` | `cheats.js` |
| `homepage.html` | mirror `index.html` |

```bash
python3 build_and_sync.py   # bump VERSION at the top first so Chrome drops its cache
```

Restart `serve_local.py` after server-side changes. Close any running game tab first: a second engine hurts FPS.

## Project layout

```
GTAV.app/ Launch-Mac.command Stop-Local.command   Mac launchers
prepare_mac.py launch_mac.py serve_local.py        setup, launcher, local server (isolation headers, byte ranges, batch I/O, saves, mods)
loader.js io_worker.js wgpu_worker.js              engine loader and workers
src_trainer.js src_cheats.js build_and_sync.py     trainer / cheat sources and the build step
cheat-catalog.json                                 vehicle and skin catalogue
mods/                                              mod loader content and template
INVESTIGATION.md ENGINE_INVESTIGATION.md           notes on the engine and assets
```

## Troubleshooting

- **macOS blocks the app:** use Finder's **Open** action and follow the approval prompt.
- **Launcher reports missing assets:** check the `mirror/playgta5.com/index.html` layout from step 2.
- **Port 8000 is busy:** nothing to do; the launcher picks another free port automatically. `Stop-Local.command` stops the GTAV server.
- **Game stutters at first:** shaders compile as you go; it settles.
- **Undo the setup:** close game tabs, stop the server, then `python3 prepare_mac.py --restore` (puts the original mirror files back; saves are kept).
- **Skip the install step:** launch with `--skip-setup` from Terminal if you manage the mirror yourself.
- **Vehicle crash:** an optional glass workaround skips damaged-vehicle glass rendering (allocator crash). Pass `--no-glass-fix` to keep the original engine.

## Roadmap

- [ ] More story missions verified and fixed
- [ ] Mod browser and more example mods
- [ ] Playtesting on more Macs (please open an issue with your results)

## Credits

- Based on [shadany7824/playgta5](https://github.com/shadany7824/playgta5); the original README is kept in [README-UPSTREAM.md](README-UPSTREAM.md). This project is independent of the original author.
- Shoutout to Sebas Furbastian for scraping the code: Telegram [@SebasKitten](https://t.me/SebasKitten), X [@Sebas_Kitten](https://x.com/Sebas_Kitten).
- Community: [t.me/wakeupbrkgc](https://t.me/wakeupbrkgc)

## Disclaimer

No copyrighted file is included in this repo, and the `mirror` folder is not hosted here. Grand Theft Auto is a trademark of Rockstar Games / Take-Two Interactive; this project is unofficial and not affiliated with them. If Rockstar Games or an affiliated party believes this repo infringes, open an issue or contact the owner and it will be taken down. Please do not ask for the mirror folder.

Code in this repo is released under the [MIT License](LICENSE).
