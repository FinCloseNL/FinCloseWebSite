#!/usr/bin/env bash
# The gate: checks the static site in a Linux container (host = Docker + git only) and writes the marker hook 70 reads.
set -euo pipefail
cd "$(dirname "$0")/.."

# shellcheck source=/dev/null
source ../.toolchain/gate-marker.sh
gate_marker_begin

MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd):/site:ro" -w /site node:22-alpine node scripts/check-site.mjs

gate_marker_write full
echo "gate: green"
