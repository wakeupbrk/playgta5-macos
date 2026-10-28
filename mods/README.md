# GTAV mods

Drop a folder into this `mods/` folder, open the game, choose **Mods** on the title screen, switch the mod on. Changes are
remembered in `work/mods-state.json`. Folders starting with `_` or `.` are ignored (see `_template/`).

```
mods/<id>/
  mod.json        manifest (required)
  main.js         optional script, runs in the game page when the mod is enabled
  overrides/      optional: files served instead of the game's own web files, same relative path
```

## mod.json

```json
{
  "name": "My mod",
  "version": "1.0.0",
  "author": "you",
  "description": "One line shown in the Mods screen.",
  "entry": "main.js",
  "modes": ["story", "sandbox"]
}
```

`modes` is optional (default: both). A mod is only started in the modes it lists.

## Script API (`window.GTAV`, api version 1)

```js
GTAV.registerMod('my-mod', {                // id = the folder name
  onWorld()   { },                          // the world is up and the player can move
  onDisable() { },                          // the mod was switched off in the Mods screen
  menu: [                                   // buttons shown in the cheat menu, section "Mods" (Cmd+X)
    { label: 'Do thing', desc: 'what it does', run() { GTAV.toast('done'); } },
  ],
});
GTAV.mode            // 'story' | 'sandbox' | 'env_test' | null (not chosen yet)
GTAV.onMode(fn)      // fn(mode) when the mode is chosen
GTAV.toast(text)     // message over the game
GTAV.log(text)       // line in work/game-diagnostics.log (prefix [page mod])
GTAV.command(name, argInt, [x, y, z], text)   // run a trainer command by name, e.g. 'WANTED_MAX' (see GTAV.commands)
GTAV.saveNow()       // Story Mode: ask the game to autosave right now
GTAV.sendData(text)  // Promise<bool>: hand a large string (JSON) to the trainer, e.g. a whole prop course (see mods/parkour)
GTAV.trainerWords(start, count)   // read trainer status words, e.g. the course HUD at 2030..2036
```

Script mods run in the page, so they can drive the trainer commands the cheat menu uses; they cannot call game natives
directly. New natives need a new trainer command in `src_trainer.js`.

## Overrides (experimental)

A file at `mods/<id>/overrides/<path>` is served instead of `<path>` of the local mirror while the mod is on, for example
`overrides/b/8b0b5899ed/title/logo.png`. It only covers loose web files. Game data inside the `.rpf` archives is read
by byte range with sizes fixed by the manifest, so replacing archive contents needs a same-size file and is not supported yet.

## Safety

* Enabling or disabling a mod never edits game files; it only changes `work/mods-state.json`.
* Savegames are separate: they are mirrored to `work/userdata/` with the last 5 versions in `work/userdata-history/`.
* To turn every mod off: delete `work/mods-state.json`.
