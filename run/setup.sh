#!/usr/bin/env bash
set -euo pipefail

REQUIRED_NODE_VERSION="22.14.0"
NODE_DIR="$(dirname "$0")/node"

version_ge() {
  [ "$(printf '%s\n' "$2" "$1" | sort -V | head -n1)" = "$2" ]
}

needs_node() {
  if command -v node >/dev/null 2>&1; then
    local current
    current="$(node -v | sed 's/^v//')"
    if version_ge "$current" "$REQUIRED_NODE_VERSION"; then
      return 1
    fi
  fi
  return 0
}

if needs_node; then
  echo "Installing Node.js $REQUIRED_NODE_VERSION locally..."
  mkdir -p "$NODE_DIR"
  curl -Ls "https://nodejs.org/dist/v$REQUIRED_NODE_VERSION/node-v$REQUIRED_NODE_VERSION-linux-x64.tar.xz" |
    tar -xJ --strip-components=1 -C "$NODE_DIR"
  export PATH="$NODE_DIR/bin:$PATH"
else
  echo "Using system Node $(node -v)"
fi

corepack enable
corepack prepare pnpm@9 --activate

pnpm install
pnpm prepack

pnpm dev
