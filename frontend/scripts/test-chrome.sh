#!/bin/sh
# Launches the system Chrome without the sandbox so `ng test` works in containers and as root.
exec "${CHROME_BIN_REAL:-google-chrome}" --no-sandbox --disable-gpu --headless=new "$@"
