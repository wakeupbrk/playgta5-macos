"""One-click GTAV launcher. Starts a local-only server independently of Terminal."""
import fcntl, json, os, signal, socket, subprocess, sys, time
from pathlib import Path
from urllib.request import urlopen
BASE = Path(__file__).resolve().parent
PREFERRED_PORT = 8000
WORK = BASE / "work"
WORK.mkdir(exist_ok=True)
PORT_FILE = WORK / "server-port"
PORT = PREFERRED_PORT
ADDRESS = "http://localhost:%d/" % PORT

def use_port(port):
    global PORT, ADDRESS
    PORT, ADDRESS = port, "http://localhost:%d/" % port

def health(port):
    try:
        with urlopen("http://localhost:%d/__gtav_health" % port, timeout=2) as response:
            return json.load(response)
    except (OSError, ValueError):
        return None

def healthy():
    state = health(PORT)
    return bool(state) and state.get("project") == str(BASE)

def port_free(port):
    with socket.socket() as probe:
        return probe.connect_ex(("127.0.0.1", port)) != 0

def free_port():
    """Port 8000 when it is free, otherwise any free port the system hands out."""
    if port_free(PREFERRED_PORT): return PREFERRED_PORT
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        return probe.getsockname()[1]

def running_port():
    """The port of an already running GTAV server of this project, if any (last used port first)."""
    saved = int(PORT_FILE.read_text()) if PORT_FILE.exists() and PORT_FILE.read_text().strip().isdigit() else None
    for port in dict.fromkeys([saved, PREFERRED_PORT]):
        state = port and health(port)
        if state and state.get("project") == str(BASE): return port
    return None

def stop():
    port = running_port()
    state = health(port) if port else None
    if not state:
        print("GTAV is already stopped.")
        return
    os.kill(int(state["pid"]), signal.SIGTERM)
    PORT_FILE.unlink(missing_ok=True)
    print("GTAV local server stopped.")


PROFILE = WORK / "chrome-profile"
NODE = next((p for p in ("/opt/homebrew/bin/node", "/usr/local/bin/node") if Path(p).exists()), None)

def debug_port_open():
    with socket.socket() as s:
        s.settimeout(0.5)
        return s.connect_ex(("127.0.0.1", 9222)) == 0

def open_game():
    """The game gets its own Chrome window and profile (work/chrome-profile): no extensions, tabs or Memory Saver of the everyday Chrome, no throttling when the window is not in
    front, and a debugging port (127.0.0.1 only) so freeze_watch.mjs can record where the engine threads are stuck if the game ever freezes. Saves are not in that profile: they come
    back from work/userdata at every start. GTAV_CHROME=default opens the address in the everyday Chrome instead."""
    if os.environ.get("GTAV_CHROME") == "default":
        subprocess.run(["/usr/bin/open", "-a", "Google Chrome", ADDRESS], check=True)
        return
    PROFILE.mkdir(exist_ok=True)
    if not debug_port_open():
        subprocess.run(["/usr/bin/open", "-n", "-a", "Google Chrome", "--args", "--user-data-dir=" + str(PROFILE), "--remote-debugging-port=9222",
            "--remote-allow-origins=*", "--no-first-run", "--no-default-browser-check", "--disable-background-timer-throttling", "--disable-renderer-backgrounding",
            "--disable-backgrounding-occluded-windows", ADDRESS], check=True)
    else:
        subprocess.run(["/usr/bin/open", "-a", "Google Chrome", ADDRESS], check=True)
    if NODE and subprocess.run(["/usr/bin/pgrep", "-f", "freeze_watch.mjs"], capture_output=True).returncode != 0:
        with (WORK / "freeze-watch.out").open("ab") as out:
            subprocess.Popen([NODE, str(BASE / "freeze_watch.mjs")], cwd=BASE, env={**os.environ, "GTAV_PORT": str(PORT)}, stdin=subprocess.DEVNULL, stdout=out, stderr=out, start_new_session=True)

def start():
    if "--install-shortcut" in sys.argv:
        target = Path.home() / "Desktop/GTAV.app"
        if target.exists() or target.is_symlink():
            if target.resolve() != (BASE / "GTAV.app").resolve():
                raise RuntimeError("A different Desktop GTAV.app already exists; it was preserved.")
        else: target.symlink_to(BASE / "GTAV.app", target_is_directory=True)
        print("Desktop GTAV shortcut ready.")
        return
    if "--stop" in sys.argv:
        stop()
        return
    if "--skip-setup" not in sys.argv:
        import prepare_mac
        prepare_mac.prepare("--no-glass-fix" not in sys.argv)
    with (WORK / "launch.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        running = running_port()
        if running: use_port(running)
        else:
            # Never terminate or open an unrelated service occupying a port: take a free one instead.
            use_port(free_port())
            if PORT != PREFERRED_PORT: print("Port %d is busy; using port %d instead." % (PREFERRED_PORT, PORT))
            with (WORK / "local-server.log").open("ab") as log:
                child = subprocess.Popen([sys.executable, str(BASE / "serve_local.py"), "--port", str(PORT)], cwd=BASE,
                    stdin=subprocess.DEVNULL, stdout=log, stderr=log, start_new_session=True)
                (WORK / "local-server.pid").write_text(str(child.pid) + "\n")
            for _ in range(100):
                if healthy(): break
                if child.poll() is not None:
                    raise RuntimeError("The local server stopped. See work/local-server.log.")
                time.sleep(0.1)
            else:
                raise RuntimeError("The local server did not become ready. See work/local-server.log.")
        PORT_FILE.write_text(str(PORT) + "\n")
    if "--server-only" not in sys.argv:
        open_game()
    print("GTAV ready at " + ADDRESS)

if __name__ == "__main__":
    try:
        start()
    except Exception as error:
        (WORK / "launcher-error.txt").write_text(str(error) + "\n")
        print(error, file=sys.stderr)
        if "--server-only" not in sys.argv:
            subprocess.run(["/usr/bin/open", "-a", "TextEdit", str(WORK / "launcher-error.txt")])
        sys.exit(1)
