#!/usr/bin/env bash
set -euo pipefail

if [ -f .env ]; then
  set -o allexport
  # shellcheck disable=SC1091
  source .env
  set +o allexport
fi

REQUIRED_NODE_VERSION="22.14.0"
NODE_DIR="$(dirname "$0")/node"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [[ -f "$ROOT_DIR/.env" ]]; then
  echo "Loading environment variables from $ROOT_DIR/.env"
  set -a
  # shellcheck disable=SC1090
  source "$ROOT_DIR/.env"
  set +a
fi

required_vars=(MONGODB_URI OPENSEARCH_URL REDIS_URL ENDPOINT ADMIN_ENDPOINT)
missing=()
for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    missing+=("$var")
  fi
done
if (( ${#missing[@]} )); then
  echo "Missing required environment variables: ${missing[*]}" >&2
  exit 1
fi

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

REQUIRED_VARS=(MONGODB_URI OPENSEARCH_URL REDIS_URL ENDPOINT ADMIN_ENDPOINT)

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var:-}" ]; then
    echo "Environment variable $var is not set or empty" >&2
    exit 1
  fi
done

pnpm dev
