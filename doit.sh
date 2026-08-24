#!/usr/bin/env sh
set -eu
node --version
node --check src/core.mjs
node --check src/storage.mjs
node --check src/desktop.mjs
node --check src/builder.mjs
node --test
echo "VAiOS verification complete"
