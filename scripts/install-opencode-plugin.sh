#!/usr/bin/env bash

set -euo pipefail

MODE="global"
TARGET_DIR=""
SKIP_BUILD="false"

print_help() {
  cat <<'EOF'
Usage:
  bash scripts/install-opencode-plugin.sh [--global] [--project <dir>] [--skip-build]

Options:
  --global         Install a global OpenCode loader under ~/.config/opencode/plugins/
  --project <dir>  Install a project-local loader under <dir>/.opencode/plugins/
  --skip-build     Skip npm run build
  --help           Show this help message
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --global)
      MODE="global"
      shift
      ;;
    --project)
      MODE="project"
      TARGET_DIR="${2:-}"
      if [[ -z "$TARGET_DIR" ]]; then
        printf 'Missing value for --project\n' >&2
        exit 1
      fi
      shift 2
      ;;
    --skip-build)
      SKIP_BUILD="true"
      shift
      ;;
    --help|-h)
      print_help
      exit 0
      ;;
    *)
      printf 'Unknown option: %s\n' "$1" >&2
      print_help >&2
      exit 1
      ;;
  esac
done

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
PACKAGE_ROOT=$(cd -- "$SCRIPT_DIR/.." && pwd)
DIST_ENTRY="$PACKAGE_ROOT/dist/index.js"

if [[ "$SKIP_BUILD" != "true" ]]; then
  printf 'Building package...\n'
  npm run build --prefix "$PACKAGE_ROOT"
fi

if [[ ! -f "$DIST_ENTRY" ]]; then
  printf 'Missing build output: %s\n' "$DIST_ENTRY" >&2
  exit 1
fi

if [[ "$MODE" == "global" ]]; then
  PLUGIN_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/opencode/plugins"
else
  PROJECT_ROOT=$(cd -- "$TARGET_DIR" && pwd)
  PLUGIN_DIR="$PROJECT_ROOT/.opencode/plugins"
fi

mkdir -p "$PLUGIN_DIR"

LOADER_PATH="$PLUGIN_DIR/opencode-claude-compat.js"

cat <<EOF > "$LOADER_PATH"
import ClaudeCompatPlugin from "${DIST_ENTRY}"

export default ClaudeCompatPlugin
EOF

printf 'Installed loader: %s\n' "$LOADER_PATH"

if [[ "$MODE" == "global" ]]; then
  printf 'OpenCode will load this plugin automatically from your global plugins directory.\n'
else
  printf 'OpenCode will load this plugin automatically for the target project.\n'
fi
