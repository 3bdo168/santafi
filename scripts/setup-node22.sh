#!/usr/bin/env bash
# Downloads and installs Node 22 under ~/.local for local development.
set -euo pipefail

NODE_VERSION="v22.16.0"
NODE_DIR="$HOME/.local/node-${NODE_VERSION}-linux-x64"
ARCHIVE="$HOME/.local/node22.tar.xz"
URL="https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-linux-x64.tar.xz"

if [[ -x "$NODE_DIR/bin/node" ]]; then
  echo "Node 22 already installed at $NODE_DIR"
  "$NODE_DIR/bin/node" -v
  exit 0
fi

mkdir -p "$HOME/.local"
echo "Downloading Node ${NODE_VERSION}..."
curl -fsSL "$URL" -o "$ARCHIVE"
tar -xf "$ARCHIVE" -C "$HOME/.local"
rm -f "$ARCHIVE"
"$NODE_DIR/bin/node" -v
echo "Done. Run: npm run dev"
