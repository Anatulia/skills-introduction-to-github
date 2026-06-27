# 📥 _inbox — staging per l'ingest

Metti qui i file che vuoi aggiungere al second brain: PDF, trascrizioni,
immagini, screenshot, note, articoli salvati, ecc.

## Cosa succede al prossimo "ingest"
L'agente (seguendo `../CLAUDE.md`):
1. legge i file presenti in `_inbox/`,
2. li archivia in `../sources/` come fonti **immutabili** (nome kebab-case),
3. crea/aggiorna le pagine in `../wiki/` con `[[wikilink]]` e citazioni,
4. aggiorna `../index.md` e `../log.md`,
5. sposta il file processato in `_inbox/_done/` (così sai cosa è già entrato).

## Convenzioni
- **Un file = una fonte.** Nomi descrittivi.
- Va bene qualsiasi formato leggibile (testo, PDF, immagini). I video NO: serve
  la **trascrizione** (testo), non il file video.
- ⚠️ **Niente segreti/credenziali** qui (è dentro un repository git).
- File molto grandi (video, audio): meglio tenerli fuori dal repo — qui solo il
  testo/estratto.
