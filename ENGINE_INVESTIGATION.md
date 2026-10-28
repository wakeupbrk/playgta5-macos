# Engine, build, and provenance evidence

Scope: static parsing of `mirror/playgta5.com/b/8b0b5899ed/game.wasm` and inspection of its JavaScript glue only. No code execution, decompilation, or asset-wide scan was performed.

## Direct evidence

- `game.wasm` is a valid WebAssembly v1 module: 63,201,802 bytes, SHA-256 `11ca8d2c04c5e843d18ff4aea4899d72c86973c6b031df334e67c446b2ae83e0`. Its 12 parsed sections include 48,192,941 bytes of code, 7,828,019 bytes of data, and a single 6,823,623-byte `name` custom section beginning at file offset `56,378,174`.
- The name section retains native C++ symbol names, for example function index 108 `rage::CheckpointSystemMemory(char const*, int)`, indices 109–135 `rage::sysIpc*`, and indices 143–180 `rage::fiDeviceLocal::*`. These are direct RAGE-namespaced symbols, not merely text references. The matching symbols and indices are in `snapshot/engine-evidence.json`.
- The data section contains RAGE/GTA material, including `GTA5Env`, `gta5_liberty`, `Rage Resource Memory`, `RAGE Audio`, `ragenet`, and Rockstar service/game strings. Selected exact byte offsets: `GTA5Env` 48,551,574; `Rage Resource Memory` 48,554,592; `MatchmakingFlags::MMF_RockstarCreatedOnly` 48,602,853; `platform:/movies/rockstar_logos` 49,061,199.
- The data section retains full Windows development-source paths. Examples: offset 49,553,058 is `E:\P1\GTA5\SRC\DEV_NG\GAME\VS_PROJECT\RAGEMISC\_UNITY\../../../../rage/suite/src/snet/party.cpp`; offset 49,612,540 is `E:\P1\GTA5\SRC\DEV_NG\RAGE\BASE\SRC\VCPROJ\RAGEGRAPHICS\_UNITY\../../../grcore/effect_d3d11.cpp`; offset 49,612,636 similarly names `buffer_d3d11.cpp`; and 49,612,732 names `device_d3d11.cpp`. These establish retained development-path/source-file lineage, not the author of the browser port.
- The module imports 86 functions. Its imports include `env.emscripten_get_now`, Emscripten pthread/mailbox functions, an imported shared memory, WASI preview1 file/time functions, and site-specific `wasm_httpfs_*`, `wasm_userdata_*`, and `wgpu_start_worker` functions. `game.js` supplies them and has `ENVIRONMENT_IS_PTHREAD`, `WebAssembly.Memory`, and `PThread` glue on line 1 (the file is minified to one line); `loader.js:1-2,45,100-101` explicitly calls it the Emscripten module, fetches `game.wasm`, and configures its pthread launch.
- The Wasm has 22 exports, mostly Emscripten/pthread runtime exports plus `__main_argc_argv`; it exposes no product/version identifier in its export names. A full name-map pass finds 41,244 `rage::` symbols, 8 GTA/GTAV product-named symbols, 478 PC/D3D11/DXGI-named symbols, and 2,217 browser-port symbols (`wasm_*`, `emscripten*`, `httpfs`, or `wgpu`).
- PC/DX11 provenance is direct: the name map contains `wasm_null_d3d::*` and `ID3D11*` symbols, while the data section has PC settings, DXGI, `win32_40_lq`, a Social Club `/games/gtav/pc/` URL, and the full D3D11 source paths above. Console-family strings also remain (`orbis`, `durango`, `PROSPERO`, `IS_PS3_VERSION`), but these are retained compatibility/conditional strings; they do not show that this WebAssembly build uses a console backend.

## Interpretation

This is a WebAssembly/Emscripten port that retains a large set of C++ RAGE symbols and GTA V/Rockstar data strings, then supplies browser-specific storage, HTTP paging, input, audio, pthread, and WebGPU integration. The preserved RAGE symbols are strong evidence of RAGE/GTA code lineage in this build.

The browser glue and custom imports show substantial port-layer work, but static artifacts do not establish who wrote it. The presence of `Rockstar`, `RAGE`, source-path fragments, or any employee/developer strings would establish neither the website operator nor the port author.

## Version and AI/authorship limits

- No reliable retail GTA V build number, RAGE version number, compiler version, or linker version was found. The data section does contain the literal `Build timestamp is: 09:29:05 Oct  5 2026` at offset 52,584,752, followed by `version: 1.10` and later `version: 100`; its nearby context is generic game/debug strings, with no component name or signed metadata. It is evidence that those literals were embedded in this build, but it cannot reliably identify the GTA executable build or prove the browser-port compilation time. Generic strings such as `Build: %s` and `Version: %d` are format strings, not version values.
- The Wasm has only the `name` custom section; it has no `producers`, DWARF/debug, or source-map custom section carrying a compiler/build identity.
- Explicit token searches for `Claude`, `Anthropic`, `OpenAI`, `ChatGPT`, `Codex`, and `Copilot` produced zero Wasm hits. `Cursor` occurs 103 times, exclusively as ordinary game/UI/position identifiers such as `CursorPos` and `Pause Menu Cursor`, so it is not AI-tool evidence. No prompt, generation metadata, author identity, copyright notice, signing certificate, or provenance manifest was found. AI use and individual/team authorship remain **undetermined**, not inferable from coding style or browser-port design.

## Reproducible evidence

`snapshot/engine-evidence.json` contains the complete parsed section map, 86 imports, 22 exports, selected printable-string offsets, full name-map category counts with bounded samples, full data-section category counts with bounded samples, and the explicit AI-token results. It was generated by `engine_static_evidence.py` using only the Python standard library.
