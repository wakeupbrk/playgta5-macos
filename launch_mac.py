"""One-click GTAV launcher. Starts a local-only server independently of Terminal."""
import fcntl, json, socket, subprocess, sys, time
from pathlib import Path
from urllib.request import urlopen
from prepare_mac import prepare
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

def start():
    with (WORK / "launch.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        if not healthy():
            prepare(glass_fix="--no-glass-fix" not in sys.argv)
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
        subprocess.run(["/usr/bin/open", "-a", "Google Chrome", ADDRESS], check=True)
    print("GTAV ready at " + ADDRESS)

if __name__ == "__main__":
    try:
        if "--install-shortcut" in sys.argv:
            target = Path.home() / "Desktop/GTAV.app"
            if target.exists() or target.is_symlink():
                if target.resolve() != (BASE / "GTAV.app").resolve():
                    raise RuntimeError("A different Desktop GTAV.app already exists; it was preserved.")
            else: target.symlink_to(BASE / "GTAV.app", target_is_directory=True)
            print("Desktop GTAV shortcut ready.")
        elif "--stop" in sys.argv:
            import os, signal
            if healthy():
                with urlopen(ADDRESS + "__gtav_health", timeout=2) as response: state = json.load(response)
                if state.get("project") != str(BASE): raise RuntimeError("Server identity changed; nothing stopped.")
                os.kill(int(state["pid"]), signal.SIGTERM)
                print("GTAV local server stopped.")
            else: print("No matching GTAV server; nothing stopped.")
        else: start()
    except Exception as error:
        (WORK / "launcher-error.txt").write_text(str(error) + "\n")
        print(error, file=sys.stderr)
        if "--server-only" not in sys.argv:
            subprocess.run(["/usr/bin/open", "-a", "TextEdit", str(WORK / "launcher-error.txt")])
        sys.exit(1)
