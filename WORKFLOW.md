# Workflow Mac ⇄ Remoto

Guida rapida per lavorare sullo **stesso progetto** sia dal **Mac** sia da **Claude Code remoto** (web) senza perdere lavoro.

## Il principio

Due cose sono separate, e **solo una si sincronizza**:

| Cosa | Si sincronizza Mac ⇄ remoto? |
|------|------------------------------|
| La conversazione/chat di Claude Code | ❌ No — vive sul singolo dispositivo |
| Il lavoro sul codice (file, commit) | ✅ Sì — tramite **git + GitHub** |

> La chat non si sposta da un dispositivo all'altro: non serve. Ciò che conta è il **codice**, e quello viaggia su GitHub attraverso i **branch**.

## Regola d'oro

**Un branch = un filo di lavoro.** Committi e pushi da una parte, fai pull dall'altra.

⚠️ L'unica cosa che puoi perdere è il lavoro **non pushato**. Quindi: commit + push spesso, soprattutto prima che il Mac vada in *sleep* o prima di chiudere una sessione remota.

## Riprendere un lavoro

### Per RIPRENDERE (inizio sessione, su Mac o remoto)
```bash
git fetch origin
git checkout <nome-branch>
git pull origin <nome-branch>
```

### Per SALVARE (fine sessione, su Mac o remoto)
```bash
git add -A
git commit -m "wip: dove sono arrivato"
git push -u origin <nome-branch>
```

Oppure usa lo script pronto:
```bash
./scripts/sync.sh "messaggio del commit"
```

## Le 3 regole anti-perdita

1. **Committa e pusha spesso** — ciò che non è pushato è l'unica cosa a rischio.
2. **Stesso nome di branch** per lo stesso lavoro, su entrambi i dispositivi.
3. **`git pull` prima di iniziare** — parti sempre dall'ultimo stato.

## Autosync su Mac (ogni 6 minuti + alla chiusura)

### Periodico ogni 6 minuti
Installazione una tantum (usa launchd, nativo di macOS):
```bash
./scripts/install-mac-autosync.sh
```
Da quel momento il lavoro viene committato e pushato da solo ogni 6 minuti
(e una volta anche al login). Per disattivarlo:
```bash
./scripts/install-mac-autosync.sh uninstall
```

### Push finale quando chiudi la sessione del terminale
Aggiungi questa riga al tuo `~/.zshrc` (sostituisci il percorso del repo):
```bash
trap '"$HOME/percorso/skills-introduction-to-github/scripts/sync.sh" "sync chiusura sessione" >/dev/null 2>&1' EXIT
```
Così, ogni volta che chiudi quella finestra/tab del terminale, parte un
ultimo `sync.sh` che salva tutto.

> **Auth in background:** perché il push automatico funzioni senza chiedere
> password, fai almeno un push manuale (HTTPS → il token resta nel keychain),
> oppure usa una chiave SSH senza passphrase / caricata nel keychain.

## Branch di lavoro attuali

| Branch | Contenuto |
|--------|-----------|
| `main` | Corso completato |
| `claude/webinar-transcription-course-app-x03f32` | Pipeline video → documento (PR #3) |
| `claude/content-analysis-summary-ltk090` | Analisi/summary contenuti |

Per riprendere uno di questi sul Mac, dalla cartella del repo:
```bash
git fetch origin
git checkout claude/webinar-transcription-course-app-x03f32
```
