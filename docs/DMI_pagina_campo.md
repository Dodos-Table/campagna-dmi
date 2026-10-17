# Pagina Campo — cosa è stato fatto

Riepilogo del lavoro per la pagina `/campo` (campo di battaglia) e delle modifiche collegate. Le modifiche sono nel working tree del branch `dev`, non ancora committate.

## Obiettivo

Una pagina che giocatori e GM tengono aperta durante lo scontro:

- mostra le schede con `inField: true` di tutti quelli collegati, ognuna con immagine e nome;
- **zona GM in alto** (schede con `playerName` uguale a `GM`, senza distinzione di maiuscole), **zona giocatori in basso**;
- ognuno interagisce solo con le proprie schede: ne sceglie una e clicca un **avversario della zona opposta** (il giocatore clicca il GM e viceversa);
- il click scrive i valori difensivi dell'avversario nella propria scheda dell'app DMI;
- come per Evoluzioni e Attività, la pagina si usa solo con il DmiBridge collegato (token).

## Come funziona

### Flusso dei dati

```
App DMI (PC giocatore)                 dodos-table.it/dmi-campo/              App DMI (PC GM)
  └─ bridge 127.0.0.1:32177              (bacheca condivisa)                    └─ bridge
       │ /export ogni 2,5s                    ▲          │ long-poll                 │
       ▼                                      │          ▼                           ▼
  sito /campo ── publish.php (se cambia) ─────┘    events.php ─────────────► sito /campo
       │
       └─ click su avversario ─► POST 127.0.0.1:32177/api/sheets/{id}  {"target":{elusion,def,men}}
```

1. **Lettura delle proprie schede**: `useDmiBridge({ pollMs: 2500 })` rilegge `/export`. Tutte le schede in `dati.profiles` sono "proprie" di questo computer.
2. **Invio**: per ogni scheda propria il sito prepara un messaggio
   `{ tipo: "campo", schedaId, inField, nome, playerName, portrait, elusion, def, men }`
   e lo pubblica su `dmi-campo/publish.php` **solo se la bacheca mostra uno stato diverso** da quello attuale:
   - entrata in campo, uscita (`inField: false`), oppure cambio di nome, immagine o valori;
   - una scheda mai entrata in campo non viene annunciata;
   - si pubblica solo dopo aver letto lo storico della bacheca, e le firme appena spedite restano in memoria finché la bacheca non le restituisce, così niente doppioni.
3. **Ricezione**: long-poll su `dmi-campo/events.php`, con lo stesso ciclo di Attività. Di ogni `schedaId` vale l'ultimo messaggio (id più alto); si mostrano quelli con `inField: true`.
4. **Bersaglio**: click su un avversario → `POST http://127.0.0.1:32177/api/sheets/{idPropria}` con body `{"target":{"elusion":…,"def":…,"men":…}}` e header `Authorization: Bearer <token>`. L'esito compare fra le due zone.

La bacheca del campo (`dmi-campo/`) è separata da quella di Attività (`dmi-hosting/`): stesso contratto HTTP, archivi distinti.

### Valori difensivi (elusion / def / men)

La scheda non contiene i propri valori difensivi: `target` contiene quelli del **bersaglio**. Per questo le formule dell'app DMI (`js/model/stats.js`, `js/rules.js`, servite dal bridge) sono state portate in `app/lib/statsDmi.ts`:

- **totale stat** = `stats[X].base` + bonus di `evolutionHistory` + `equipment.manualBonuses` + bonus degli oggetti indossati (`location === "asset"`) + `stats[X].skill` + `stats[X].other`. Per DEF si aggiunge la difesa degli oggetti: migliore armatura, migliore scudo, migliore difesa magica e somma delle altre;
- **modificatori** = penalità di addestramento armature + `statuses[].mods` + postura (`defensive` +10, `total` +20 all'elusione) + `directModifiers.elusion`;
- **elusion** = 30 + floor((AGL + mod.agl) / 5) + mod.elusion;
- **def** = DEF + mod.def;
- **men** = INTMEN + mod.intmen.

Nota: i campi `stats[X].evolution` ed `stats[X].equip` **non** si leggono, perché l'app li ricalcola da `evolutionHistory` ed `equipment`. Esempio reale: "main Taratect" ha AGL base 4 + 5 da evoluzione = 9 → elusion 31, come mostra l'app.

## File

### Nuovi

| File | Contenuto |
|---|---|
| `app/routes/campo/index.tsx` | Pagina: gate del token (come Attività), zona GM, esito, zona giocatori, `IntegrazioneApp`. |
| `app/components/campo/ZonaCampo.tsx` | Una zona con le carte. Le carte proprie e quelle avversarie sono `<button>` (con `aria-pressed` sulle proprie), le altre non sono cliccabili. |
| `app/lib/useCampo.ts` | Hook: feed `dmi-campo/` + invio su differenza, con guardia per gli invii in corso come `usePubblicaLog`. |
| `app/lib/campo.ts` | `isGm`, `normalizzaCampo` (dal feed), `eventoDaScheda` (dalla scheda locale), `firma`, `statoCampo`. |
| `app/lib/statsDmi.ts` | Formule dei valori difensivi portate dall'app (`valoriDifesa`, `numero`). |
| `app/types/campo.ts` | `EventoCampo` (messaggio) e `SchedaCampo` (+ id evento). |
| `app/assets/css/campo.css` | Zone e carte, con gli stati propria / selezionata / avversaria. |
| `docs/handover_backend_bacheca.md` | Handover per il backend PHP delle due bacheche (vedi sotto). |

### Modificati

| File | Modifica |
|---|---|
| `app/routes.ts` | Rotta `campo` nel simple-layout. |
| `app/routes/index.tsx` | Pulsante **Campo** in home. |
| `app/lib/dmiBridge.ts` | Nuovi `DMI_SHEETS_ENDPOINT` e `impostaTarget(token, id, target)`. La gestione degli errori di `fetchSchedaDmi` è stata estratta in `richiestaBridge` e la usano entrambe. |
| `app/lib/attivitaHosting.ts` | Nuovo `URL_CAMPO`. `scaricaEventi(base, since, normalizza, signal)` e `pubblicaEvento(base, evento, signal)` ricevono la bacheca e il normalizzatore. Il parse dell'envelope è stato estratto in `apriEnvelope`, condiviso da Attività e Campo. Rimossi `URL_EVENTI` e `URL_PUBBLICA`. |
| `app/lib/useFeedAttivita.ts` | Generico: `useFeedAttivita(base, attivo, normalizza)`. |
| `app/lib/usePubblicaLog.ts`, `app/routes/attivita/index.tsx` | Passano `URL_HOSTING` e `normalizzaEvento`: Attività si comporta come prima. |
| `app/types/dmi.ts` | Nuovo `DmiTarget { elusion, def, men }`; `DmiCharacter.target` ora è tipato. |

## Decisioni prese con l'utente

- Lo scambio fra computer passa dalla bacheca su dodos-table.it, perché il bridge è locale. Prima era la stessa bacheca di Attività; poi è passato all'endpoint dedicato `https://dodos-table.it/dmi-campo/`.
- È il **sito** a pubblicare le schede in campo, non l'app DMI.
- L'immagine si pubblica **originale** (data URI da centinaia di KB), senza ridimensionarla.
- I valori difensivi sono calcolati nel sito con le formule dell'app, invece di farli esporre al bridge.
- Il GM usa lo stesso programma: anche lui seleziona le sue schede e bersaglia i giocatori.
- Ricezione con il long-poll già esistente invece di un polling ogni 2-3 s: le novità arrivano subito.

## Handover backend

`docs/handover_backend_bacheca.md` descrive, per una sessione di Claude Code sul PHP di dodos-table.it:

- il contratto HTTP che il client si aspetta: `publish.php` → `{ok, id}`; `events.php` con cursore, long-poll di ~25 s e `since=0` immediato; envelope `{id, ts, data}`;
- il CORS per `https://dmi.dodos-table.it` e `http://localhost:5173`, preflight compresa;
- i requisiti: limite del body (2 MB sul campo), lock sugli id, long-poll leggero, archivio a file per evento o SQLite, validazione dei messaggi campo;
- la compattazione su `dmi-campo/`: per ogni scheda si tiene solo l'ultimo messaggio;
- i comandi `curl` di verifica (concorrenza e isolamento fra le due bacheche compresi).

## Verifiche fatte

- `npm run typecheck` e `npm run build`: ok.
- Self-check con assert eseguiti con Node sull'export reale del bridge, da una cartella temporanea (non sono nel repo, perché il progetto non ha un test runner e i dati sono personali):
  - `valoriDifesa`: "main Taratect" → `{ elusion: 31, def: 7, men: 13 }`; la postura `total` porta l'elusione a 51; gli status sommano a `def`;
  - firma stabile dopo il giro sulla bacheca (body JSON → stringa → normalizzazione): niente ripubblicazioni a ciclo;
  - un portrait non `data:image/` viene scartato in modo identico in locale e dal feed;
  - l'ultimo messaggio per `schedaId` vince; gli eventi non campo vengono scartati.

**Non verificato**: la pagina nel browser, la `POST /api/sheets/{id}` (non chiamata per non toccare il `target` della scheda reale) e il funzionamento con il backend `dmi-campo/`, che va ancora creato.

## Limiti noti e rischi

- **`dmi-campo/` non esiste ancora**: finché manca, la pagina mostra l'errore di invio e non vede le schede altrui. Attività non ne risente.
- **Schede fantasma**: se qualcuno chiude app o pagina senza togliere `inField`, la scheda resta in campo fino al suo prossimo messaggio. È segnato da un commento `shortcut:` in `useCampo.ts`; la soluzione sarebbe un heartbeat con scadenza.
- **Formule duplicate**: `statsDmi.ts` è una copia delle regole dell'app (commento `shortcut:`). Se l'app cambia le formule va riallineato a mano.
- **Peso**: con le immagini originali ogni cambio di scheda pesa centinaia di KB. Senza compattazione lato server, lo storico scaricato al primo accesso cresce a ogni modifica, e il feed tiene in memoria tutti gli eventi ricevuti finché la pagina è aperta.
- **Bacheca pubblica**: nessuna autenticazione, chiunque conosca l'URL può pubblicare lo stato di una scheda. Il client accetta solo immagini `data:image/` e numeri validi.
- I nomi dei file `events.php` / `publish.php` su `dmi-campo/` sono presunti uguali a quelli di `dmi-hosting/`.
