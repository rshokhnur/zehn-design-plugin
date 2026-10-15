#!/usr/bin/env bash
# Put (or refresh) a copy of the zehn plugin inside an app repo, so everyone who clones it gets zehn
# without access to the plugin's GitHub repo.
#   bash vendor.sh <zehn-design-plugin.zip or plugin folder> [app repo, default: current folder]
# Copies the plugin to <app>/.claude/plugins/zehn-design/ (replacing an older copy) and registers it in
# <app>/.claude/settings.json as the "zehn" marketplace with a repo-relative path. Then commit both.
set -euo pipefail

main() {
  local src="${1:-}" app="${2:-.}"
  if [ -z "$src" ]; then echo "usage: bash vendor.sh <zehn-design-plugin.zip or folder> [app repo]" >&2; exit 1; fi
  app="$(cd "$app" && git rev-parse --show-toplevel 2>/dev/null || pwd)"
  tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT

  if [ -f "$src" ]; then
    unzip -q "$src" -d "$tmp/unzipped"
    src="$(dirname "$(find "$tmp/unzipped" -path '*/.claude-plugin/plugin.json' | head -n 1)")/.."
  fi
  src="$(cd "$src" && pwd)"
  [ -f "$src/.claude-plugin/marketplace.json" ] || { echo "no zehn plugin in $src" >&2; exit 1; }

  # Stage first: the script may be running from the copy it replaces.
  mkdir -p "$tmp/stage"
  (cd "$src" && tar --exclude=.git --exclude=node_modules -cf - .) | (cd "$tmp/stage" && tar -xf -)
  local dest="$app/.claude/plugins/zehn-design"
  rm -rf "$dest"; mkdir -p "$(dirname "$dest")"; mv "$tmp/stage" "$dest"

  node - "$app/.claude/settings.json" <<'EOF'
const fs = require('fs'), f = process.argv[2];
let s = {};
try { s = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { if (fs.existsSync(f)) { console.error(`${f} isn't valid JSON; fix it and run again`); process.exit(1); } }
s.extraKnownMarketplaces = { ...(s.extraKnownMarketplaces || {}), zehn: { source: { source: 'directory', path: './.claude/plugins/zehn-design' } } };
s.enabledPlugins = { ...(s.enabledPlugins || {}), 'zehn-design@zehn': true };
fs.writeFileSync(f, JSON.stringify(s, null, 2) + '\n');
EOF

  local v; v="$(node -p "require('$dest/.claude-plugin/plugin.json').version")"
  echo "zehn-design $v is in .claude/plugins/zehn-design and registered in .claude/settings.json."
  echo "Commit both: git add .claude/plugins/zehn-design .claude/settings.json && git commit -m \"zehn-design $v\""
  echo "Open sessions: run /reload-plugins (new sessions pick it up on their own)."
}

main "$@"
exit
