#!/bin/zsh
BASE="${0:A:h}"
cd "$BASE" || exit 1
for candidate in /opt/homebrew/bin/python3 /usr/local/bin/python3 "$(command -v python3)" /usr/bin/python3; do
  if [[ -x "$candidate" ]] && "$candidate" -c 'import sys; sys.exit(0 if sys.version_info >= (3,11) else 1)' 2>/dev/null; then
    exec "$candidate" "$BASE/launch_mac.py" "$@"
  fi
done
mkdir -p "$BASE/work"
print 'Python 3.11 or newer is required. Install it from https://www.python.org/downloads/macos/ and launch again. See README.md.' > "$BASE/work/launcher-error.txt"
cat "$BASE/work/launcher-error.txt"
/usr/bin/open -a TextEdit "$BASE/work/launcher-error.txt"
exit 1
