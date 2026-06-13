#!/usr/bin/env bash
# Runs a command with the local Node 22 toolchain (required by Vite 7).
set -euo pipefail

NODE_BIN="$HOME/.local/node-v22.16.0-linux-x64/bin"

if [[ ! -x "$NODE_BIN/node" ]]; then
  echo "Node 22 not found. Run: npm run setup:node"
  exit 1
fi

export PATH="$NODE_BIN:$PATH"
exec "$@"
