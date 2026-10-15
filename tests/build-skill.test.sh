#!/usr/bin/env bash
# Fails if skills/compose-screen/SKILL.md is not what scripts/build-skill.sh builds from the sources.
# Run: bash tests/build-skill.test.sh
set -euo pipefail
cd "$(dirname "$0")/.."
tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT
bash scripts/build-skill.sh "$tmp" > /dev/null
if diff -q "$tmp" skills/compose-screen/SKILL.md > /dev/null; then
  grep -c '^# REFERENCE: ' "$tmp" | grep -qx 3 || { echo "FAIL: expected 3 '# REFERENCE:' headings"; exit 1; }
  echo "build-skill: SKILL.md matches its sources"
else
  echo "FAIL: skills/compose-screen/SKILL.md is stale. Run: bash scripts/build-skill.sh"
  diff "$tmp" skills/compose-screen/SKILL.md | head -20
  exit 1
fi
