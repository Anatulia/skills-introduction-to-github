#!/usr/bin/env bash
#
# sync.sh — salva il lavoro in corso (commit + push) sul branch attuale.
#
# Uso:
#   ./scripts/sync.sh ["messaggio del commit"]
#
# Se non passi un messaggio, ne viene generato uno con data/ora.
# Pensato per essere lanciato prima di chiudere o prima che il Mac vada in sleep,
# così non perdi mai lavoro non pushato.

set -euo pipefail

# Vai alla radice del repository, qualunque sia la cartella di partenza.
cd "$(git rev-parse --show-toplevel)"

branch="$(git rev-parse --abbrev-ref HEAD)"

if [ "$branch" = "HEAD" ]; then
  echo "❌ Sei in stato 'detached HEAD' (nessun branch). Fai prima 'git checkout <branch>'."
  exit 1
fi

# Ci sono modifiche da committare?
if [ -n "$(git status --porcelain)" ]; then
  msg="${1:-wip: sync automatico $(date '+%Y-%m-%d %H:%M:%S')}"
  git add -A
  git commit -m "$msg"
  echo "📝 Commit creato: $msg"
else
  # Working tree pulito: ci sono commit locali non ancora pushati?
  if upstream="$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null)"; then
    unpushed="$(git rev-list --count "$upstream"..HEAD)"
    if [ "$unpushed" -eq 0 ]; then
      echo "✅ Niente da fare: nessuna modifica e nulla da pushare sul branch '$branch'."
      exit 0
    fi
    echo "ℹ️  Working tree pulito ma ci sono $unpushed commit da pushare."
  fi
  # (Se non c'è ancora un upstream, proseguo per crearlo con il push.)
fi

# Push con un retry semplice in caso di problemi di rete temporanei.
for attempt in 1 2 3; do
  if git push -u origin "$branch"; then
    echo "🚀 Push completato sul branch '$branch'."
    exit 0
  fi
  echo "⚠️  Push fallito (tentativo $attempt). Riprovo tra ${attempt}s..."
  sleep "$attempt"
done

echo "❌ Push fallito dopo più tentativi. Controlla la connessione e riprova."
exit 1
