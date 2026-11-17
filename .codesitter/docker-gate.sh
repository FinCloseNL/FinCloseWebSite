#!/usr/bin/env bash
# The gate: checks the static site in a Linux container (host = Docker + git only) and writes the marker hook 70 reads.
set -euo pipefail
cd "$(dirname "$0")/.."
REPO="$(pwd)"

TOOLCHAIN="$REPO"
while [ "$TOOLCHAIN" != / ] && [ ! -f "$TOOLCHAIN/.toolchain/gate-marker.sh" ]; do TOOLCHAIN="$(dirname "$TOOLCHAIN")"; done
[ -f "$TOOLCHAIN/.toolchain/gate-marker.sh" ] || { echo "no .toolchain above $REPO: run CodeSitter/install.ps1 -OwnerTrees <owner tree>" >&2; exit 2; }
# shellcheck source=/dev/null
source "$TOOLCHAIN/.toolchain/gate-marker.sh"
gate_marker_begin

MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd):/site:ro" -w /site node:22-alpine node scripts/check-site.mjs
bash "$TOOLCHAIN/.toolchain/check-layout.sh" "$REPO"

gate_marker_write full
echo "gate: green"
