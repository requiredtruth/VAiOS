#!/usr/bin/env sh
set -eu
port="${PORT:-8080}"
echo "VAiOS: http://localhost:${port}"
exec python3 -m http.server "$port" --bind localhost
