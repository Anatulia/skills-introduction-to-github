#!/usr/bin/env bash
#
# install-mac-autosync.sh — installa su macOS un autosync del repo ogni 6 minuti.
#
# Cosa fa:
#   - crea un LaunchAgent launchd che esegue scripts/sync.sh ogni 360s (6 min)
#   - esegue un sync anche al login (RunAtLoad)
#   - scrive i log in ~/Library/Logs/repo-autosync.*.log
#
# Uso:
#   ./scripts/install-mac-autosync.sh           # installa e avvia
#   ./scripts/install-mac-autosync.sh uninstall # rimuove l'autosync
#
# Nota auth: il push in background usa le credenziali git già salvate.
#   - HTTPS: assicurati di aver fatto almeno un push manuale così il
#     credential helper (osxkeychain) memorizza il token.
#   - SSH: usa una chiave SENZA passphrase, oppure caricata nel keychain
#     (ssh-add --apple-use-keychain ~/.ssh/id_ed25519).

set -euo pipefail

LABEL="com.anatulia.repo-autosync"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
INTERVAL=360  # 6 minuti

if [ "${1:-}" = "uninstall" ]; then
  launchctl unload "$PLIST" 2>/dev/null || true
  rm -f "$PLIST"
  echo "🧹 Autosync rimosso."
  exit 0
fi

# Percorso assoluto del repo (radice git a partire da questo script).
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && git rev-parse --show-toplevel)"
SYNC="$REPO/scripts/sync.sh"

if [ ! -f "$SYNC" ]; then
  echo "❌ Non trovo $SYNC — esegui lo script dall'interno del repo."
  exit 1
fi
chmod +x "$SYNC"

mkdir -p "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"

cat > "$PLIST" <<PLISTEOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>$LABEL</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>$SYNC</string>
        <string>autosync (launchd)</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$REPO</string>
    <key>StartInterval</key>
    <integer>$INTERVAL</integer>
    <key>RunAtLoad</key>
    <true/>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
    <key>StandardOutPath</key>
    <string>$HOME/Library/Logs/repo-autosync.out.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/Library/Logs/repo-autosync.err.log</string>
</dict>
</plist>
PLISTEOF

launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"

echo "✅ Autosync installato: sync ogni $((INTERVAL/60)) minuti sul repo:"
echo "   $REPO"
echo "   Log: ~/Library/Logs/repo-autosync.out.log"
echo "   Per rimuoverlo: ./scripts/install-mac-autosync.sh uninstall"
