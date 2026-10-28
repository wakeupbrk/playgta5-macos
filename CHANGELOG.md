# Changelog

## v2.0.0

- Title-screen launch menu: Story Mode, Sandbox Mode, Mods.
- Story autosaves persist to `work/userdata/` (last 5 versions kept) and survive clearing Chrome data.
- Cheat menu (`Cmd+X`) with vehicles, paint, neon, wanted level, weather, time, game speed and more.
- Mod loader with a `window.GTAV` script API and a `mods/_template`.
- Larger local server: saves, mods, byte ranges, batch I/O.
- First launch now installs the page files into the mirror with backups; `prepare_mac.py --restore` undoes it.
- Readable sources (`src_trainer.js`, `src_cheats.js`) and the `build_and_sync.py` build step are included.
- New README.

## v1.0.0

- macOS adaptation of shadany7824/playgta5: Chrome launcher, reversible HD30 setup.
