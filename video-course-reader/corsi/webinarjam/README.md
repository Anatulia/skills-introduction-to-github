# Guadagna con gli Shorts — Liveclass WebinarJam sulla Media Company AI (Metodo Replica Canali)

## Cos'è
Replay WebinarJam di una liveclass di formazione gratuita de **La Mucca Rossa**
(academy di formazione su YouTube/business online), dal titolo **"Liveclass
Rivelatoria: GUADAGNA con gli SHORTS"**, registrata il **23 giugno** (contesto
2026, si parla ripetutamente di "duemila e ventisei" e di un lancio pubblico
al 30 giugno). Durata **~2h14m**, video 1080p verticale/desktop condiviso
(screencast). Relatori: **Pietro** (host principale), **Duilio** (esegue la
demo dal vivo su Claude Code), **Mirko** (entra nella seconda parte per la
vendita) e **Elia** (studente, testimonianza in diretta). Verifica comunque
leggendo i file se servono dettagli puntuali.

## Di cosa parla
La liveclass mostra come costruire una "media company AI" per canali YouTube
Shorts, cioè un sistema di agenti AI orchestrato da **Claude Code** che
sostituisce le 5 figure professionali di una media company tradizionale
(sceneggiatore, speaker, montatore, sound designer, grafico). Il cuore della
sessione è il **"Metodo Replica Canali"**: si parte da un canale Shorts di
riferimento già di successo (nell'esempio, *Zack D. Films*), lo si fa
analizzare in profondità da un agente AI (nicchia, pubblico, stile di
scrittura, hook, stile visivo, competitor) e da lì si genera un canale nuovo
(nome, descrizione, tag, logo, banner) e infine un video completo, passo per
passo, davanti al pubblico in diretta. Nella seconda parte (dopo circa 1h15m)
la liveclass diventa una presentazione di vendita per il corso a pagamento
"Guadagna con gli Shorts".

## A cosa serve / che problema risolve
È il replay di un webinar di vendita, ma la prima metà contiene una
dimostrazione tecnica reale e dettagliata di un flusso di produzione video
automatizzato (stack di strumenti, prompt, step operativi) utile come
riferimento pratico per costruire/adattare una pipeline simile con Claude
Code + tool AI di terze parti. Vale la pena conservarlo per:
- lo stack di strumenti mostrato e il modo in cui vengono orchestrati insieme;
- la sequenza esatta degli step della skill "replica canali" (analisi →
  branding → produzione video), utile come canovaccio/checklist;
- capire le tecniche di scrittura/hook/retention per Shorts spiegate durante
  la demo.
La seconda metà (vendita) è utile solo per ricordare condizioni/prezzi
dell'offerta vista quel giorno (ormai scaduta) e come riferimento di stile di
sales webinar, non per contenuti tecnici.

## Contenuti principali

**Stack di strumenti mostrato (orchestrato da Claude Code):**
- Script: ChatGPT / Claude
- Analisi canale/nicchia/competitor: **NexLev**
- Voce, SFX, musica: **ElevenLabs** (modello `eleven_multilingual_v2`)
- Immagini: **Kie.ai** (modello `gpt_image_2`, 2K, 9:16)
- Clip animate: **Kling 3.0** (via Kie.ai, audio off — audio aggiunto dopo in montaggio)
- Montaggio: **ffmpeg** / Capcut
- Orchestrazione di tutti gli step: **Claude Code**, guidato da una "skill"
  custom in due parti (setup canale + produzione video)

**Step 1 — Setup di un nuovo canale (Metodo Replica Canali), a partire da un canale di riferimento (Zack D. Films):**
- Analisi canale e decodifica nicchia (dati canale, Short più popolari,
  trascrizioni, canali simili, pubblico target, intento, stato emotivo,
  stile di scrittura, struttura dell'hook, ritmo/lunghezza script, angle di
  crescita, competitor)
- Generazione di 10 proposte di nome canale (scelto: "Tutto Torna")
- Descrizione canale + 18 tag SEO generati in automatico
- Analisi dello stile visivo guardando davvero 2 Short del canale di
  riferimento (stile 3D CGI semi-realistico, palette colori, font
  sottotitoli, musica/SFX)
- Generazione di logo profilo (1:1) e banner canale (16:9/2560x1440, zona
  sicura 1546x423) coerenti con lo stile analizzato
- Export finale in un file `CONFIGURAZIONE-CANALE.md` con tutto il profilo
  del canale (usato poi come input per la skill di produzione video)

**Step 2 — Produzione di un singolo video Short (pipeline a ~15 step), a partire dal file di configurazione:**
- Generazione di 25 idee video in linea con la nicchia
- Verifica dei fatti (fact-check) prima di scrivere lo script
- Scheda dell'argomento (categoria, target, hook, durata stimata, guida emotiva)
- Scrittura dello script con conteggio parole/durata target (es. ~94 parole = ~37s)
- Conferma stile visivo per il video specifico
- Scelta metodo produzione: immagine-poi-animata (A, consigliato per coerenza
  stile) vs testo-diretto-a-video (B, più veloce ma meno controllo)
- Storyboard scena per scena: prompt immagine + SFX per ogni scena
- Configurazione tecnica (motore immagini, motore clip, risoluzione, voce)
- Generazione in batch di immagini, SFX e musica; poi animazione delle scene
  in clip video con Kling 3.0
- Montaggio finale con sottotitoli sincronizzati parola per parola

**Principi/consigli ripetuti più volte durante la demo:**
- Gli effetti sonori (SFX) sotto ogni azione sono premiati dal "nuovo
  YouTube" e vengono sistematicamente sottovalutati dai creator
- Verificare sempre i fatti raccontati nello script (il "nuovo YouTube"
  penalizza contenuti falsi/AI-slop)
- Un angle/taglio narrativo preciso funziona meglio di contenuti generici
- Le impostazioni tecniche (lunghezza script, risoluzione, ecc.) vengono
  fissate una sola volta nel file di configurazione del canale e poi
  riutilizzate per ogni nuovo video, senza doverle ridefinire ogni volta

**Seconda parte (da ~1h15m in poi) — pitch di vendita del corso "Guadagna con gli Shorts":**
- Due pacchetti riservati agli studenti presenti quella sera: **START**
  (797€, invece di 997€ pubblico) e **VIP** (1297€, esclusivo, non messo in
  vendita al pubblico) — contenuti: Metodo Replica Canali, Metodo YouTube Le
  Basi 2026, Metodo Shorts Automation 2026, catalogo 100 nicchie, community
  24/7, masterclass mensili, automazioni già pronte, YouTube Business
  Accelerator Kit, garanzia 14 giorni, canale YouTube già pronto (primi 50),
  fiscalità online, consulenza di setup 1:1; il VIP aggiunge 5 consulenze
  personalizzate + analisi mensile del canale per 6 mesi da Pietro e Mirko
- Urgenza: solo 50 posti, lancio pubblico (senza questi prezzi/bonus)
  annunciato per il 30 giugno
- Testimonianza in diretta di Elia, studente che è passato da operatore
  manuale a "imprenditore media company"

## Stato
Completo (trascrizione integrale + screenshot sincronizzati, dall'inizio
02:00:00 alla fine 02:14:09). Nella parte finale (dopo le 02:04:52) lo
speaker ripete più volte solo "guarda guarda guarda" sopra le slide di
prezzo: probabilmente un artefatto della trascrizione automatica su un tratto
di silenzio/rumore di fondo a fine diretta, non un limite di copertura del
contenuto.
