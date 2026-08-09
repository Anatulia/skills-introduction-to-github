# Materiali bonus — Area VIP Workshop Company Brain

Scaricati da `workshop.aibuildersclub.it/area-vip/risorse-vip` (accesso VIP,
25 lug 2026), oltre alle 5 lezioni video/PDF principali del corso.

## Cos'è

- **`framework-orbit.pdf`** — "Il Framework O.R.B.I.T.": il metodo di Michele
  Cotti in 5 fasi (ordine fisso) per costruire automazioni/agenti che non si
  rompono nel tempo — un protocollo da incollare in Claude prima di ogni
  progetto di automazione. Le prime due fasi vietano di costruire subito
  ("vietato costruire al buio").
- **`skill-impronta.pdf` / `skill-impronta.zip`** — Skill Claude Code
  **"Impronta"** (`SKILL.md` dentro lo zip, pronta da installare): intervista
  l'utente e produce 5 file di contesto aziendale (identità, offerta, clienti,
  tono, come lavori) da dare in pasto a un'AI.
- **`skill-mappa-del-tesoro.pdf` / `skill-mappa-del-tesoro.zip`** — Skill
  **"Mappa del Tesoro"**: mappa tutte le attività automatizzabili
  dell'azienda area per area e individua le 3 priorità da cui partire.
- **`skill-primo-ingranaggio.pdf` / `skill-primo-ingranaggio.md`** — Skill
  **"Il Primo Ingranaggio"** (qui solo il file `.md`, non zippata): prende una
  priorità dalla Mappa del Tesoro e la trasforma nel progetto concreto della
  prima skill/automazione da costruire (non la costruisce, ne disegna solo il
  progetto).
- **`prompt-la-bussola.pdf`** — **"La Bussola"**: non una skill ma un prompt
  di pianificazione strategica (testo riportato anche nel PDF) che trasforma
  un obiettivo in un piano d'azione a mini-obiettivi, con task concreti divisi
  tra "lo fa l'AI" e "lo fai tu".
- **`workbook-serata1-diagnosi.html` / `workbook-serata2-metodo.html`** —
  pagine web dei workbook operativi delle serate 1 e 2. **Attenzione**: sono
  template vuoti da compilare online, gated da un form con email/nome (dati
  personali) — non contengono contenuto di per sé, servono solo se si vuole
  effettivamente compilarli in prima persona sul sito.

## Nota tecnica
Le skill "Impronta" e "Mappa del Tesoro" sono vere Claude Code Skill
(formato `SKILL.md` con frontmatter `name`/`description`, stesso formato
usato da questo stesso assistente) — installabili direttamente in
`~/.claude/skills/`. "Il Primo Ingranaggio" è equivalente ma distribuita come
singolo file `.md` invece che zip (ripulito qui dagli escape backslash che
Google Docs aggiunge in export, es. `\---` → `---`).
