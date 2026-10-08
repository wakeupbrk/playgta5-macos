# playgta5 Source Code — macOS
This code is grabbed from playgta5.com before it got took down. You can run this locally or make it public hehe.

macOS adaptation of [shadany7824/playgta5](https://github.com/shadany7824/playgta5). The original README is preserved in `README-UPSTREAM.md`. This adaptation is independent of the original author.

# Credits
Shoutout to Sebas Furbastian on Telegram for scrapping this code. Idk what is his GitHub but here's the Telegram and X.

Telegram: @SebasKitten

X: @Sebas_Kitten

# Disclaimer
I don't host the `.\mirror` folder since it has copyrighted content from Rockstar Games. Please find the files by yourself.

No copyrighted file is included in this repo. If Rockstar Games or any affiliated group think this repo has copyright infringement things, email me at shadany7824@gmail.com for me to took it down.

And don't email me for asking the mirror folder. I will not reply to the email.

# How to use
1. Download the ZIP or just `git clone` it. It should have all this file and folders.
<p align="center">
  <img src="media/Screenshot 2026-10-07 172103.png" alt="playgta5 SC">
</p>

2. Paste your `.mirror` folder next to `GTAV.app`. (It should have about 19.7 GB of file size.) Both `.mirror/playgta5.com/index.html` and `mirror/playgta5.com/index.html` are supported. Keep the extracted project folder in a permanent location, such as your Games folder.

3. Run `GTAV.app` or `Launch-Mac.command` and it will automatically open Google Chrome at `http://localhost:8000/`. Run `Install-Desktop.command` once if you want a one-button GTAV shortcut on your Desktop.

4. Voila!

# Requirement
Scripts require standard-library Python 3.11 or newer and Google Chrome for macOS. Install Python from https://www.python.org/downloads/macos/ and Chrome from https://www.google.com/chrome/ if needed. No Windows runtime is bundled.

The launcher finds Python automatically on Apple Silicon and Intel Macs. Actual gameplay requires Chrome with WebGPU and 64-bit WebAssembly support. The tested machine is an Apple Silicon M1 Pro with 32 GB of RAM; other hardware has not been playtested. The HD profile targets 1920×1080 and 30 FPS; performance depends on the Mac and loading shaders can cause pauses.

If macOS asks about an unsigned app, use Finder's Open action and follow macOS's approval prompt. If the launcher reports missing assets, check the folder layout in step 2. If port 8000 is busy, close the other server first. No assets are downloaded automatically.

# Mac setup
The first launch backs up the supported original index and engine under `work/backups/mac-setup/`, applies the local HD profile, and starts a server bound only to `127.0.0.1:8000`. Original mirror files remain recoverable. Unsupported index versions are left untouched and reported; an unfamiliar engine is left unchanged.

The optional vehicle-glass workaround is enabled for the exact supported engine hash. It skips damaged-vehicle glass rendering to avoid the observed allocator crash. It is a workaround, not a repair of the engine allocator. Add `--no-glass-fix` when launching from Terminal to keep the original engine on a fresh installation. Use `python3 prepare_mac.py --restore` to restore files changed by this setup after closing game tabs and stopping the server. Existing profiles and unrelated Desktop items are preserved.

Choose **Sandbox Mode → GTA V Map** for free roam, or Story Mode. Click the game for mouse control. WASD moves; F enters a car; Esc releases the mouse; = toggles the FPS counter. Keep one game tab open. Close game tabs and run `Stop-Local.command` to stop the server. Double-click GTAV to play again. Chrome savegames are preserved.

Source revision: `a3bad032c92cf929d3f4fa2fb236ff0476878b51`. This package contains the public client source and macOS setup code, without the separate mirror assets. Original Windows-only screenshots are retained from the source repository. Full real-world playtesting on other Macs remains unverified.

# Link
Telegram: https://t.me/playgta5regen
