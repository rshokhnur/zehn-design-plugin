#!/usr/bin/env bash
# Rebuilds skills/compose-screen/SKILL.md from src/compose-screen.head.md + reference/*.md.
# Rules are inlined so the agent gets them when the skill loads, with no extra file reads or permission prompts.
set -euo pipefail
cd "$(dirname "$0")/.."
out=skills/compose-screen/SKILL.md
{
  cat src/compose-screen.head.md
  for f in ui-ux-rules components tokens; do
    printf '\n\n---\n\n'
    sed -e '1s/^# /# REFERENCE: /' "reference/$f.md"
  done
} > "$out"
echo "built $out ($(wc -l < "$out") lines)"
