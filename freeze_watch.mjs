// Freeze watcher: attaches to the game's Chrome (started by launch_mac.py with --remote-debugging-port=9222) and, when the game freezes (no render stats for 30 s while the
// sound still runs and the tab is visible), pauses every engine thread once and writes where each one is stuck to work/freeze-captures/<time>.txt, then lets them go again.
// Wasm frames carry function names from the engine's name section, so the file names the engine call each thread is blocked in.
// `touch work/freeze-capture.now` takes a capture on demand (to test the watcher on a healthy game). Quiet otherwise: no debugger domain is enabled until a capture.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const WORK = path.join(ROOT, 'work');
const LOG = path.join(WORK, 'game-diagnostics.log');
const OUT = path.join(WORK, 'freeze-captures');
const NOW_FLAG = path.join(WORK, 'freeze-capture.now');
const PORT = 9222;
const SERVER_PORT = process.env.GTAV_PORT || '8000';
const say = (m) => { try { fs.appendFileSync(path.join(WORK, 'freeze-watch.log'), new Date().toISOString() + ' ' + m + '\n'); } catch (e) {} };

let ws = null, nextId = 1, pageSession = '';
const pending = new Map(), sessions = new Map();		// sessionId -> { type, url, title }
const listeners = [];

function send(method, params = {}, sessionId) {
	return new Promise((resolve) => {
		const id = nextId++;
		const t = setTimeout(() => { pending.delete(id); resolve({ error: { message: 'timeout' } }); }, 8000);
		pending.set(id, (r) => { clearTimeout(t); resolve(r); });
		ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
	});
}

async function connect() {
	for (;;) {
		try {
			const v = await (await fetch('http://127.0.0.1:' + PORT + '/json/version')).json();
			ws = new WebSocket(v.webSocketDebuggerUrl);
			await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('ws error')); });
			break;
		} catch (e) { await new Promise((r) => setTimeout(r, 3000)); }
	}
	ws.onmessage = (ev) => {
		const m = JSON.parse(ev.data);
		if (m.id && pending.has(m.id)) { const f = pending.get(m.id); pending.delete(m.id); f(m); return; }
		if (m.method === 'Target.attachedToTarget') {
			const { sessionId, targetInfo } = m.params;
			sessions.set(sessionId, { type: targetInfo.type, url: targetInfo.url, title: targetInfo.title });
			// children of this target (nested workers: the engine's threads are started by the loader worker) are attached too
			send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true }, sessionId);
		} else if (m.method === 'Target.detachedFromTarget') sessions.delete(m.params.sessionId);
		for (const l of listeners) l(m);
	};
	ws.onclose = () => { say('connection closed'); process.exit(0); };
	say('connected');
}

async function attachPage() {
	for (;;) {
		const r = await send('Target.getTargets');
		const page = (r.result && r.result.targetInfos || []).find((t) => t.type === 'page' && new RegExp('localhost:' + SERVER_PORT + '/').test(t.url));
		if (page) {
			const a = await send('Target.attachToTarget', { targetId: page.targetId, flatten: true });
			if (a.result) { pageSession = a.result.sessionId; sessions.set(pageSession, { type: 'page', url: page.url, title: page.title }); await send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true }, pageSession); say('attached to the game page, ' + (sessions.size) + ' targets'); return; }
		}
		await new Promise((r) => setTimeout(r, 3000));
	}
}

async function capture(reason) {
	fs.mkdirSync(OUT, { recursive: true });
	const stamp = new Date().toISOString().replace(/[:.]/g, '-');
	const file = path.join(OUT, stamp + '.txt');
	const workers = [...sessions.entries()].filter(([, s]) => s.type === 'worker');
	say('capture: ' + reason + ', ' + workers.length + ' worker threads');
	const lines = ['capture ' + stamp + ' (' + reason + '), ' + workers.length + ' worker threads', ''];
	const paused = new Map();
	const onEvent = (m) => { if (m.method === 'Debugger.paused' && m.sessionId) paused.set(m.sessionId, m.params.callFrames); };
	listeners.push(onEvent);
	await Promise.all(workers.map(async ([sid]) => { await send('Debugger.enable', {}, sid); }));
	await Promise.all(workers.map(([sid]) => send('Debugger.pause', {}, sid)));
	const t0 = Date.now();
	while (Date.now() - t0 < 6000 && paused.size < workers.length) await new Promise((r) => setTimeout(r, 200));
	for (const [sid, s] of workers) {
		const frames = paused.get(sid);
		lines.push('--- ' + (s.title || s.url).slice(0, 90) + ' [' + sid.slice(0, 6) + ']' + (frames ? '' : '   NOT PAUSED (did not answer in 6 s: busy in native code or blocked outside JavaScript)'));
		for (const f of (frames || []).slice(0, 18)) lines.push('    ' + (f.functionName || '(anonymous)') + '  ' + (f.url || '').split('/').pop() + ':' + f.location.lineNumber + ':' + f.location.columnNumber);
	}
	await Promise.all(workers.map(([sid]) => send('Debugger.resume', {}, sid)));
	await Promise.all(workers.map(([sid]) => send('Debugger.disable', {}, sid)));
	listeners.splice(listeners.indexOf(onEvent), 1);
	fs.writeFileSync(file, lines.join('\n') + '\n');
	say('capture written: ' + file + ' (' + paused.size + '/' + workers.length + ' paused)');
	try { await fetch('http://localhost:' + SERVER_PORT + '/log', { method: 'POST', body: '[page] FREEZE CAPTURE written: ' + file + ' (' + paused.size + '/' + workers.length + ' threads paused)' }); } catch (e) {}
}

// ---- freeze detection from the diagnostics log ----------------------------------------------------------------------------------------------------------------------
let pos = 0;
try { pos = fs.statSync(LOG).size; } catch (e) {}
let lastFps = Date.now(), lastAlive = Date.now(), visible = true, armed = true, inWorld = false;
function pollLog() {
	try {
		const st = fs.statSync(LOG);
		if (st.size < pos) pos = 0;		// rotated
		if (st.size > pos) {
			const fd = fs.openSync(LOG, 'r'), len = Math.min(st.size - pos, 1 << 20), buf = Buffer.alloc(len);
			fs.readSync(fd, buf, 0, len, pos); fs.closeSync(fd); pos += len;
			const text = buf.toString('utf8');
			if (/wgpu\] fps:/.test(text)) { lastFps = Date.now(); armed = true; }
			if (/\[page audio\]|\[io\] net/.test(text)) lastAlive = Date.now();
			if (/visibility: hidden/.test(text)) visible = false;
			if (/visibility: visible/.test(text)) { visible = true; lastFps = Date.now(); }
			if (/\[page env\]/.test(text)) inWorld = false;
			if (/world shown/.test(text)) { inWorld = true; lastFps = Date.now(); }
		}
	} catch (e) {}
}

await connect();
await attachPage();
setInterval(async () => {
	pollLog();
	if (fs.existsSync(NOW_FLAG)) { try { fs.unlinkSync(NOW_FLAG); } catch (e) {} await capture('on request'); return; }
	const now = Date.now();
	if (armed && inWorld && visible && now - lastFps > 30000 && now - lastAlive < 15000) { armed = false; await capture('no render stats for ' + Math.round((now - lastFps) / 1000) + ' s while the engine log is alive'); }
}, 3000);
say('watching');
