# GTA V browser snapshot: engine and asset investigation

Inspected 2026-10-06. Snapshot build `8b0b5899ed`, manifest `1791169379-5814`.

The strongest evidence identifies **PC-format GTA V assets and a GTA V-derived
RAGE C++ engine compiled to WebAssembly, with a D3D11-to-WebGPU port layer**.
The dataset has an old content set and a development-style layout. Its 20.94 GB
size does not identify Xbox 360/PS3 provenance. Ultimate ancestry of individual
models/textures remains unverified; converted console-derived assets are possible.

No defensible numbered RAGE version, exact retail GTA V build, port-author
identity, or AI model attribution was established. These are separate questions
from identifying the asset formats and engine lineage.

| Evidence | What it establishes |
|---|---|
| All 1,528 top-level RPF files: bytes `37 46 50 52`, little-endian magic `0x52504637`, encryption field `0x0FFFFFF9` | A consistent PC-style RPF7 layout; the encryption flag is AES. It is not the native big-endian console archive layout. |
| `x64/data/startup.ymt`, offset `0x88`: `platform:/data/cdimages/scaleform_platform_pc.rpf` | Explicit PC frontend/platform resource selection. |
| `common/shaders/win32_40` and `win32_nvstereo` | Windows shader variants, including NVIDIA stereo variants. |
| `win32_40/adaptiveDof.fxc`: first DXBC at `0x14A`, first SHDR token `0x10040`; six DXBC containers | DirectX bytecode; the sampled vertex program is Shader Model 4.0. |
| Shader compiler string at `adaptiveDof.fxc:0x3FD`: `Microsoft (R) HLSL Shader Compiler 9.29.952.3111` | Exact embedded shader-toolchain identifier. It is not a RAGE version or the Wasm compiler version. |
| Sample loose YTD/YDD files: RSC7 with little-endian resource versions 13/165 | Additional resource-format evidence consistent with the PC-format dataset. These are resource schema versions. |
| `game.wasm`: 41,244 `rage::` function-name matches, 478 PC/D3D11/DXGI matches | Substantial RAGE code lineage and PC graphics integration, beyond merely displaying GTA-labelled assets. |
| Wasm imports plus 2,217 browser-port name matches | Emscripten/pthread/WASI and custom HTTP, userdata, input/GPU integration. |

The RPF interpretation is based on the actual implementations in
[CodeWalker](https://github.com/dexyfex/CodeWalker/blob/master/CodeWalker.Core/GameFiles/RpfFile.cs)
and the contrasting console header reader in
[LibertyV](https://github.com/koolkdev/libertyv/blob/master/LibertyV/Rage/RPF/V7/Structs.cs).
CodeWalker reads the four header fields as little-endian 32-bit values; LibertyV's
console reader expects ASCII RPF7, swaps numeric endianness and decodes console
platform bits. The local data matches the former. Headers alone cannot establish
where an individual asset was originally authored or whether someone converted it.

The JavaScript renderer supplies D3D11 state/resource semantics through WebGPU;
the runtime uses browser workers, shared memory, AudioWorklet, local userdata and
range-based asset reads. The page disables network-game and Social Club paths by
default. This is strongly consistent with a source-level GTA V/RAGE port. Static
inspection does not prove how the original engine source was obtained or that
every retail subsystem is functional.

The Wasm is 63,201,802 bytes: code 48,192,941 bytes, data 7,828,019 bytes and a
6,823,623-byte `name` section. It imports 86 entries and exports 22. There are
no producers, DWARF or source-map custom sections identifying a compiler version.
The full section/import/export map and selected symbols are in
`snapshot/engine-evidence.json`; `ENGINE_INVESTIGATION.md` records the engine pass.

An exact preserved source path begins at Wasm offset 49,553,058:

```text
E:\P1\GTA5\SRC\DEV_NG\GAME\VS_PROJECT\RAGEMISC\_UNITY\../../../../rage/suite/src/snet/party.cpp
```

Other preserved paths identify `effect_d3d11.cpp`, `buffer_d3d11.cpp` and
`device_d3d11.cpp`. `DEV_NG` establishes the retained development-branch label;
it does not identify a commit or website operator. Original Rockstar source paths,
credits and employee names cannot be attributed to the person who made this port.

At offset `0x3226130` (52,584,752), the Wasm embeds:

```text
Build timestamp is: 09:29:05 Oct  5 2026
```

This is a compile-style timestamp consistent with a recent build. Its timezone
and producing subsystem are unverified. Nearby unlabelled strings contain
`version: 1.10` and `version: 100`; adjacency in a linked data segment does not
establish that they describe the GTA or RAGE engine. They must not be treated as
an identified retail release.

`common/data/version.txt` explicitly labels its display-version value as `108`.
The same file distinguishes install/save/replay versions. It does not establish
a retail executable build such as b2699. Likewise, RPF7 is an archive format,
RSC7 is a resource format, `settings.xml` version 9 is a settings schema, and the
legal `version_num.xml` values concern legal documents. None establishes RAGE 7,
RAGE 9 or another engine marketing/version number.

The actual DLC tree contains these named packs:
`mpBeach`, `mpBusiness`, `mpBusiness2`, `mpChristmas`, `mpHipster`,
`mpIndependence`, `mpLTS`, `mpPilot`, `mpValentines`, `spUpgrade`, `verityRadio`.
For historical context, Rockstar documents the
[Last Team Standing update in October 2014](https://www.rockstargames.com/newswire/article/75o94113194377/the-last-team-standing-event-weekend-in-gta-online).
This is an early content set rather than a modern all-DLC installation; it cannot
date the compiled engine, because old assets can be used by newer code.
The snapshot also includes 669 files / 41,988,588 bytes under `common/non_final`:
development tunes, tools/configuration material and other non-final assets.
That layout is consistent with a development/exported asset tree. It does not
prove a particular leak, release or repository provenance.

The data manifest totals 20,944,285,552 bytes. Its path-classified portions are:

| Portion | Files | Bytes |
|---|---:|---:|
| Shared | 3,851 | 6,610,602,035 |
| GTA V level | 1,687 | 8,843,043,940 |
| env_test | 276 | 5,490,639,577 |

The GTA V level plus shared portion is about 15.45 GB; this is not a complete
modern retail installation. 20.30 GB of the manifest is RPF archives. No standalone
Bink/MP4 movie filenames occur in the manifest, although videos may exist inside
encrypted archives. Different content coverage, packaging and asset preparation
make retail install-size comparisons insufficient to identify a platform.
I did not decrypt all archives or establish texture-resolution/content parity.

The title's GTA VI choice selects `env_test` inside the same engine and data tree.
There is no second GTA VI engine binary. The level has 32 Florida-named archive
paths and multiple Everglades placements. Its preserved `images.meta.orig` has
239 lines; the active file has 1,424 lines. The 1,185 added lines mount additional
region containers, with a comment explaining previously unmounted Florida,
Everglades and other areas. This is a useful record of changes made to connect the
test level. Florida/Everglades naming is consistent with the site's claimed map,
but **authenticity, developmental date and completeness are not proven** by names.

There is no identified port author in the inspected page/runtime. Public
[Verisign RDAP](https://rdap.verisign.com/com/v1/domain/playgta5.com) records domain
registration at `2026-10-03T21:24:43Z` and a registrar entity; the retrieved record
does not disclose a registrant identity. Nameservers are Cloudflare. Those facts
identify infrastructure/timing, not the developer.

No explicit `Claude`, `Anthropic`, `OpenAI`, `ChatGPT`, `Codex` or `Copilot` token
was found in the Wasm. Ordinary cursor/UI identifiers are not Cursor AI evidence.
The original game credits contain names including the word Claude; those do not
identify AI usage. A public
[Reddit discussion](https://www.reddit.com/r/pcmasterrace/comments/1wyqec2/grand_theft_auto_v_has_been_ported_to_the_browser/)
contains an unattributed Claude claim, while its original poster disclaims any
affiliation. This is not creator testimony or a verified development record.
AI model/use therefore remains **unknown**; coding style cannot resolve it.

The public-file scan made 281 requests and added only `favicon.ico` and `robots.txt`.
It logged 158 timeouts, 32 HTTP 522, 5 HTTP 502, 83 HTTP 404 and 3 HTTP 200.
The successful extra root page was the existing homepage fallback. Availability
errors cannot prove absence of unlisted files. Private files and unknown names
without listings remain outside the verified snapshot.

The portable ZIP has both asset sets, local range/batch serving, a bundled Windows
x64 Python runtime and `Launch-Local.cmd`. Asset SHA-256 values were checked while
packing. Local HTTP/isolation/range/plain+gzip batch tests passed. Actual browser
gameplay has not been validated, so successful static packaging does not establish
complete engine/gameplay compatibility.

Reproduce the focused evidence with:

```bat
runtime\python.exe inspect_assets.py
runtime\python.exe engine_static_evidence.py
runtime\python.exe verify_snapshot.py
```

The unresolved questions are an exact compiled GTA/RAGE build, underlying source
commit/provenance, map authenticity, asset transformation history and creator/AI
attribution. Resolving them would require a reference build/source comparison or
credible creator provenance; the inspected artifacts alone do not supply it.
