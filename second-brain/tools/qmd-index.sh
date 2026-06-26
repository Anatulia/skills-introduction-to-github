#!/usr/bin/env bash
# Index the second-brain folder into qmd and build embeddings.
# Usage: ./second-brain/tools/qmd-index.sh
# Requires: qmd (npm i -g @tobilu/qmd) — see qmd-setup.md
set -euo pipefail

BRAIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COLLECTION="second-brain"

if ! command -v qmd >/dev/null 2>&1; then
  echo "qmd not found. Install with: npm install -g @tobilu/qmd" >&2
  echo "(or run via: npx @tobilu/qmd ...)" >&2
  exit 1
fi

echo "Indexing collection '$COLLECTION' from: $BRAIN_DIR"
qmd collection add "$BRAIN_DIR" --name "$COLLECTION"
echo "Building embeddings..."
qmd embed

echo
echo "Done. Try:"
echo "  qmd search \"drift detection\""
echo "  qmd vsearch \"how knowledge compounds\""
echo "  qmd query  \"what is the llm wiki pattern\""
