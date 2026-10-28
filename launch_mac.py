"""One-click GTAV launcher. Starts a local-only server independently of Terminal."""
import fcntl, json, os, socket, subprocess, sys, time
from pathlib import Path
from urllib.request import urlopen
BASE = Path(__file__).resolve().parent
ADDRESS = "http://localhost:8000/"
WORK = BASE / "work"
WORK.mkdir(exist_ok=True)

def healthy():
    try:
        with urlopen(ADDRESS + "__gtav_health", timeout=2) as response:
            return json.load(response).get("project") == str(BASE)
    except (OSError, ValueError):
        return False


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
            subprocess.Popen([NODE, str(BASE / "freeze_watch.mjs")], cwd=BASE, stdin=subprocess.DEVNULL, stdout=out, stderr=out, start_new_session=True)

def start():
    with (WORK / "launch.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        if not healthy():
            # Never terminate or open an unrelated service occupying the requested port.
            with socket.socket() as check:
                if check.connect_ex(("127.0.0.1", 8000)) == 0:
                    raise RuntimeError("Port 8000 is occupied by another server. Close that server and launch GTAV again.")
            with (WORK / "local-server.log").open("ab") as log:
                child = subprocess.Popen([sys.executable, str(BASE / "serve_local.py")], cwd=BASE,
                    stdin=subprocess.DEVNULL, stdout=log, stderr=log, start_new_session=True)
                (WORK / "local-server.pid").write_text(str(child.pid) + "\n")
            for _ in range(100):
                if healthy(): break
                if child.poll() is not None:
                    raise RuntimeError("The local server stopped. See work/local-server.log.")
                time.sleep(0.1)
            else:
                raise RuntimeError("The local server did not become ready. See work/local-server.log.")
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
