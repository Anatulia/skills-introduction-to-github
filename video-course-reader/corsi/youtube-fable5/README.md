# Claude Fable 5 (Opus 4.5): il metodo dei "4 unknowns" per usarlo bene prima che torni a pagamento

## Cos'è
(fonte: video YouTube dal titolo "Claude Fable 5: Guida COMPLETA")

Video-corso/tutorial di circa 27 minuti (dura fino al timestamp 00:27:23) tenuto da **Riccardo Belli Contarini** (ingegnere informatico, gestisce l'azienda **Martes AI**, che aiuta le imprese a scalare con l'AI). Nel video "Fable" è il nome con cui l'autore indica l'ultimo modello Claude (Opus/Sonnet più recente, uscito in un periodo di incertezza sulla disponibilità gratuita via subscription vs. Pay Per Use API) — è il termine usato per tutto il video e ripreso anche nel nome della skill locale `fable5KnowUnknowBC`.

## Di cosa parla
Il video spiega come sfruttare al meglio "Fable 5" (l'ultimo modello Claude) prima che l'accesso incluso nell'abbonamento Anthropic venga sostituito da un utilizzo Pay Per Use molto costoso. L'autore denuncia l'errore comune "80-20": costruire l'80% di un progetto con il modello potente finché è gratis, per poi finire il restante 20% (di solito la parte più difficile) con un modello più debole, ottenendo codice incoerente e costi finali comunque alti. Presenta come alternativa il metodo dei **"4 unknowns"** tratto dalla guida "Field Guide to Fable" di **Tariq**, ingegnere Anthropic che lavora su Claude Code: known-knowns, known-unknowns, unknown-knowns e unknown-unknowns. Mostra poi un caso d'uso reale: il redesign completo del sito di Martes AI, eseguito applicando il metodo passo passo (blind spot pass su worktree Git → intervista mirata → proposta di direzioni di design in HTML → esecuzione con Opus).

## A cosa serve / che problema risolve
Serve a ricordare una metodologia pratica e riutilizzabile per usare un modello AI molto potente (ma costoso/a tempo limitato) in modo da: (1) non sprecare la finestra di accesso gratuito facendo lavoro superficiale, (2) far emergere prima di iniziare tutti i rischi nascosti in un progetto complesso (blind spot pass), (3) colmare i vuoti di comunicazione tra ciò che si ha in mente e ciò che si scrive nel prompt (known-unknowns tramite intervista guidata), invece di scrivere un prompt "perfetto" a mano o affidarsi solo a strumenti di pianificazione come "play mode"/"super powers" che pianificano solo in base a quanto già dichiarato. È il contenuto sorgente della skill locale `fable5KnowUnknowBC` (in `~/.claude/skills/`), quindi utile in futuro sia come promemoria concettuale sia come riferimento su come è nato quel workflow.

## Contenuti principali

**Contesto/premessa**
- Timeline del rilascio di "Fable 5": uscita il 9 giugno, sospensione il 12 giugno, ripubblicazione l'1 luglio, fine abbonamento incluso il 7 luglio, proroga di 5 giorni, poi passaggio a Usage Credits (10$/milione token input, 50$/milione token output — il prezzo più alto mai pubblicato da Anthropic).
- L'errore "80-20": finire un progetto con un modello più debole proprio nella parte più difficile, con risultato di dover comunque pagare a caro prezzo l'API per "aggiustare" il lavoro.
- Cambio di paradigma citato da Tariq (ingegnere Anthropic): con un modello così intelligente il collo di bottiglia non è più il modello ma la capacità dell'utente di chiarire i propri "unknowns" (i buchi tra ciò che si ha in testa e ciò che si scrive nel prompt).

**Il metodo dei 4 unknowns (da "Field Guide to Fable" di Tariq)**
- **Known-known**: cose che so e ho scritto nel prompt.
- **Known-unknown**: cose che so di non aver deciso/comunicato (es. "non so come voglio la hero section, non lo dico a Claude").
- **Unknown-known**: cose così ovvie per me che non le scrivo, ma Claude non le può dedurre.
- **Unknown-unknown**: cose che nemmeno io so che esistono/sono rilevanti (es. un'automazione nascosta che rischia di essere eliminata da una modifica).

**Le "tre mosse" applicate in pratica (per gli unknown-unknowns e known-unknowns)**
1. **Blind spot pass**: prima di toccare codice, chiedere a Claude di leggere l'intera codebase e riportare tutti i vincoli nascosti/rischi di rottura (prompt tipo: "leggi la codebase e tirami fuori i vincoli nascosti / dimmi tutto ciò che rischio di rompere o che sto dando per scontato").
2. **Farsi intervistare**: invece di scrivere il prompt perfetto, far fare a Claude una domanda alla volta ("intervistami una domanda alla volta su cosa voglio dal nuovo sito, dando priorità alle domande la cui risposta cambia l'architettura o il design") — esplicitamente diverso da "play mode"/"super powers", che pianificano solo sulla base di quanto già dichiarato.
3. **Direzioni di design multiple prima del codice**: chiedere un file HTML con 3-4 direzioni di design completamente diverse (dati finti ma realistici) da valutare visivamente prima di autorizzare modifiche al codice reale.
- Consiglio operativo aggiuntivo: fare una cross-review del piano con un altro modello, oppure eseguire il piano approvato con un modello più economico (Opus) una volta che Fable ha già scovato gli unknowns — Fable "pensa" da senior, Opus esegue da junior.

**Caso d'uso dimostrato: redesign del sito di Martes AI**
- Setup: `/model opus` poi passaggio a Fable, `/effort max` per il blind spot pass, lavoro su un **Git worktree** separato (per non toccare il sito in produzione), monitoraggio consumo con `/usage`.
- Blind spot pass eseguito con 5 agenti di esplorazione in parallelo: ha trovato un token GitHub reale committato per errore, file esistenti solo su disco e non in git, un gitignore che non copriva dati sensibili (partita IVA clienti) — problemi risolti subito prima di procedere.
- Intervista guidata su architettura reale del sito (Astro, non SPA React, con due pipeline di deploy attive), struttura dei "tre binari" di business (AI adoption, prodotti, Engineering as a Service), navbar, lingua, nuove pagine (es. "Company Brain").
- Proposta di 4 direzioni di design (HTML con dati finti) — scelta la direzione "Vetrina", poi esecuzione con Opus.
- Uso della skill "front-end design" per la parte UI/slide.
- Risultato: sito quasi perfetto al primo colpo, con solo piccoli ritocchi finali (interattività, animazioni).

**Messaggio conclusivo**
- Diffidare di chi dice di aver creato siti/app complesse "con un solo prompt": il modello è potente ma il collo di bottiglia resta la persona che lo guida: bisogna sapere dare le indicazioni giuste.

## Stato
Corso completo (trascrizione e screenshot coprono l'intero video, dall'inizio 00:00:00 alla fine 00:27:23, 59 keyframe totali). Fonte YouTube: come da limite noto della pipeline, i frame sono stati scaricati a risoluzione **360p** (640x360 px), quindi l'OCR sul testo a schermo è poco affidabile (molte scritte OCR risultano illeggibili/corrotte nel file, es. "I quattro 170/1107725"); per i dettagli visivi (schermate del terminale, del sito, delle slide) conviene guardare i frame originali in `frames/` più che fidarsi dell'OCR. La trascrizione audio invece è completa e leggibile.
