#!/usr/bin/env bash
# Rebuilds skills/compose-screen/SKILL.md from src/compose-screen.head.md + reference/*.md.
# Rules are inlined so the agent gets them when the skill loads, with no extra file reads or permission prompts.
# Usage: scripts/build-skill.sh [output-file]   (default: skills/compose-screen/SKILL.md)
set -euo pipefail
cd "$(dirname "$0")/.."
out=${1:-skills/compose-screen/SKILL.md}
head=src/compose-screen.head.md
refs=(ui-ux-rules components tokens)

[ -f "$head" ] || { echo "missing $head" >&2; exit 1; }
head -1 "$head" | grep -qx -- '---' || { echo "$head must start with frontmatter (---)" >&2; exit 1; }

tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT
{
  cat "$head"
  for f in "${refs[@]}"; do
    src="reference/$f.md"
    [ -f "$src" ] || { echo "missing $src" >&2; exit 1; }
    printf '\n\n---\n\n'
    # Prefix the first H1 (wherever it is) with "REFERENCE: " so the head's names match. Fail if there is none.
    awk -v src="$src" '
      !done && /^# / { sub(/^# /, "# REFERENCE: "); done = 1 }
      { print }
      END { if (!done) { print "no H1 in " src > "/dev/stderr"; exit 1 } }
    ' "$src"
  done
} > "$tmp"
mkdir -p "$(dirname "$out")"
cat "$tmp" > "$out"
rm -f "$tmp"
trap - EXIT
echo "built $out ($(wc -l < "$out") lines)"
