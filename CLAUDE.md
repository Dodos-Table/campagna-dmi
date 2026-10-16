# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Progetto

**DMI** è il sito di una campagna custom di Dungeons & Dragons ("Dungeon Monster Isekai"). Interagisce con **DMI scheda** ("dungeon monster isekai scheda"), un'app locale sul PC di ogni giocatore/GM che espone un bridge HTTP su `http://127.0.0.1:32177`. Codice, commenti, nomi e UI sono in **italiano**: mantieni la stessa lingua.

`docs/` contiene la documentazione di riferimento (contratto del bridge, pagina Campo, backend PHP delle bacheche, come estrarre skill/evoluzioni/abilità dall'app). Leggila prima di toccare l'integrazione con l'app o con le bacheche. Il `README.md` è quello generico del template React Router.

## Comandi

- `npm run dev` — dev server Vite con HMR (`http://localhost:5173`)
- `npm run typecheck` — `react-router typegen && tsc` (unico controllo automatico: non ci sono test né linter)
- `npm run build` — build SPA in `build/client`
- Node 24 (vedi `engines`)

Deploy: push su `master` → GitHub Actions ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) esegue typecheck + build e pubblica `build/client` su GitHub Pages (dominio custom `dmi.dodos-table.it`), copiando `index.html` in `404.html` come fallback SPA. Lo sviluppo avviene su `dev`.

## Architettura

- **React Router 8 in modalità SPA** (`ssr: false`), Vite, Tailwind 4, alias `~/` → `app/`. Le rotte sono dichiarate a mano in [app/routes.ts](app/routes.ts) (non file-based); i tipi `./+types/*` sono generati in `.react-router/` da `react-router typegen`. `basename` in `react-router.config.ts` e `base` in `vite.config.ts` devono coincidere.
- Niente backend proprio. Due fonti di dati esterne:
  1. **Bridge locale dell'app DMI** (`127.0.0.1:32177`): [app/lib/dmiBridge.ts](app/lib/dmiBridge.ts) legge `/export` con token Bearer (salvato in localStorage `dmi-bridge-token`) e normalizza la risposta (le schede arrivano come stringa JSON sotto la chiave `dmi-monster-sheet-pwa-v1`, la scheda attiva è ricavata da `activeId` e messa in `character`). `impostaTarget` scrive su `/api/sheets/{id}`. L'hook [useDmiBridge](app/lib/useDmiBridge.ts) (opzionale `pollMs`) è il punto d'ingresso usato dalle pagine; `FormTokenDmi` + `IntegrazioneApp` gestiscono il collegamento lato UI. Tipi dello snapshot in [app/types/dmi.ts](app/types/dmi.ts).
  2. **Bacheche PHP condivise** su `dodos-table.it`: `dmi-hosting/` (pagina Attività) e `dmi-campo/` (pagina Campo), stesso contratto `events.php` (long-poll `?since=N`) / `publish.php` (envelope `{id, ts, data}`). Client in [app/lib/attivitaHosting.ts](app/lib/attivitaHosting.ts), ciclo di long-poll con backoff in [useFeedAttivita](app/lib/useFeedAttivita.ts). Il contratto lato server è in [docs/handover_backend_bacheca.md](docs/handover_backend_bacheca.md) e il client non va cambiato in modo da romperlo.
- **Attività**: [usePubblicaLog](app/lib/usePubblicaLog.ts) pubblica sulla bacheca le nuove voci di log della scheda, tenendo in localStorage (per personaggio) quali voci sono già state spedite; le voci presenti al primo collegamento fanno da baseline e non vengono pubblicate.
- **Campo**: [useCampo](app/lib/useCampo.ts) pubblica lo stato delle proprie schede `inField` solo quando differisce da quello sulla bacheca; le schede GM si riconoscono dalla scritta `GM` nel nome (`isGm` in [campo.ts](app/lib/campo.ts)). I valori difensivi (elusion/def/men) sono calcolati in [statsDmi.ts](app/lib/statsDmi.ts) portando le formule dell'app DMI: vedi [docs/DMI_pagina_campo.md](docs/DMI_pagina_campo.md).
- **Evoluzioni / Skill**: dati statici in `app/data/evoluzioni.json` e `app/data/skills.json` (estratti dall'app DMI, vedi `docs/DMI_ottenere le *.md`), incrociati con la scheda letta dal bridge (`percorsoEvolutivo.ts`, `gradoSkill.ts`). L'albero evoluzioni usa `@xyflow/react` + `dagre`.
- **NPC**: un file `.ts` per NPC in `app/data/npc/`, classe che estende `Npc` ([app/types/npc.ts](app/types/npc.ts)) con export default. Raccolti automaticamente via `import.meta.glob` in [app/data/npc-loader.ts](app/data/npc-loader.ts): il nome file è l'id/URL, la cartella è il gruppo. Dettagli in [app/data/npc/README.md](app/data/npc/README.md) (che cita `npcs.ts`, ora `npc-loader.ts`). Le immagini vanno importate, non referenziate come path stringa.
- Stile: CSS per pagina in `app/assets/css/` importato dalla rotta/componente, oltre a Tailwind. SVG importabili come componenti con `?react` (vite-plugin-svgr).

## Convenzioni osservate

- Gli accessi a `localStorage` sono sempre in `try/catch` (può essere negato).
- Le fetch al bridge/bacheche usano `AbortController` e ignorano l'abort allo unmount; gli errori sono tradotti in messaggi italiani per l'utente.
- La chiave `dmi-monster-sheet-pwa-v1` appartiene all'app DMI: il sito la legge solo dalla risposta del bridge e non la usa mai nel proprio localStorage.
