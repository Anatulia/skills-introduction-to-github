# Stato e prossimi passi (riprendere domani)

Appunti per riprendere la configurazione **senza ricostruire nulla**.

## ✅ Già fatto

- Lavoro tutto salvato su GitHub (niente è andato perso).
- Creati e mergiati in `main` (PR #4):
  - `WORKFLOW.md` — guida continuità Mac ⇄ remoto
  - `scripts/sync.sh` — commit + push del lavoro in corso (salta i push inutili)
  - `scripts/install-mac-autosync.sh` — autosync ogni 6 min via launchd
- Sul Mac: repo clonato in `/Users/agp/Documents/skills-introduction-to-github`,
  script resi eseguibili, identità git configurata
  (Antonio Guarnieri / antoniotango.info@gmail.com).
- Esiste un commit di prova locale sul Mac: `test push dal Mac` (commit vuoto),
  ancora **da pushare**.

## 🔐 Sicurezza — DA FARE per primo

Un token classic è stato esposto in chat (`ghp_PPz...`): **revocarlo**.
- https://github.com/settings/tokens → trovare il token → **Delete**.

## ⏭️ Unico passo rimasto: autenticare il Mac

Manca solo far autenticare git sul Mac a GitHub. Una volta sola.

1. Creare un **nuovo** token classic:
   https://github.com/settings/tokens/new → Note `Mac autosync`, 90 days,
   scope **`repo`** → Generate → copiarlo.

2. Nel Terminale, dalla cartella del repo:
   ```bash
   git config --global credential.helper osxkeychain
   ./scripts/sync.sh "test push"
   ```
   - Username: `Anatulia`
   - Password: **incollare il token** con `⌘ + V` (non si vede nulla, è normale) → Invio

   Esito atteso: `🚀 Push completato`. Il token resta nel Portachiavi.

3. Attivare l'autosync:
   ```bash
   ./scripts/install-mac-autosync.sh
   ```

4. (Opzionale) Push finale alla chiusura del terminale: aggiungere a `~/.zshrc`
   ```bash
   trap '"$HOME/Documents/skills-introduction-to-github/scripts/sync.sh" "sync chiusura sessione" >/dev/null 2>&1' EXIT
   ```

## Nota

Da Claude Code remoto (web) tutto funziona già senza token: il Mac è solo
per avere la copia locale che si sincronizza da sola.
