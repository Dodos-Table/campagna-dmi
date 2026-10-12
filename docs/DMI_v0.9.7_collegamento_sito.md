# Dungeon Monster Isekai v0.9.7 — collegamento al sito

## Funzionamento

La scheda continua a usare lo stesso origin locale e la stessa chiave di salvataggio delle versioni precedenti:

- origin: `http://127.0.0.1:32177`
- localStorage: `dmi-monster-sheet-pwa-v1`

Dopo il caricamento iniziale e dopo ogni salvataggio, l'app invia al server locale uno snapshot della **scheda attiva**. Lo snapshot rimane soltanto nella memoria del processo e non viene caricato su servizi remoti.

## Dati per il collegamento

Aprire l'app e premere **Collegamento sito**. La pagina locale mostra:

- endpoint: `http://127.0.0.1:32177/export`
- token Bearer personale del computer;
- stato e orario dell'ultima sincronizzazione;
- un collegamento per aprire il JSON di prova.

Il token viene generato casualmente e resta stabile sul computer. Non è inserito nel codice pubblico del sito.

## Richiesta dal sito

```js
const res = await fetch('http://127.0.0.1:32177/export', {
  headers: {
    Authorization: `Bearer ${tokenDMI}`
  }
});

if (!res.ok) {
  throw new Error(`DMI bridge: ${res.status}`);
}

const data = await res.json();
```

Alias disponibile: `http://127.0.0.1:32177/api/sheet`.

## Struttura principale del JSON

```json
{
  "schemaVersion": 1,
  "appVersion": "0.9.7",
  "storageVersion": 12,
  "syncedAt": "2026-08-02T10:40:00.000Z",
  "activeId": "...",
  "profileCount": 1,
  "profiles": [
    {
      "id": "...",
      "monsterName": "...",
      "playerName": "...",
      "currentForm": "..."
    }
  ],
  "character": {
    "id": "...",
    "identity": {},
    "stats": {},
    "resources": {},
    "evolutionHistory": [],
    "skills": [],
    "statuses": [],
    "actions": {},
    "target": {},
    "abilities": {},
    "equipment": {},
    "journal": {},
    "timeline": [],
    "log": []
  }
}
```

`character` contiene la scheda attiva completa nel formato nativo dell'app. `profiles` è soltanto un indice sintetico dei personaggi presenti.

## CORS e rete locale

- Sono accettate richieste provenienti da origini web `http` o `https` soltanto con token valido.
- La preflight `OPTIONS` supporta `Authorization` e `Access-Control-Request-Private-Network`.
- Edge/Chrome può chiedere all'utente il permesso per accedere alla rete locale.
- Sito e app devono essere aperti sullo **stesso dispositivo**.
- L'app deve restare aperta: lo snapshot è conservato solo in memoria.

## Limiti intenzionali

- Collegamento in sola lettura: il sito non può modificare la scheda.
- Nessun backend remoto e nessuna sincronizzazione cloud.
- L'endpoint restituisce la scheda attiva, non l'intero localStorage.

## Struttura attuale della risposta

La "Struttura principale del JSON" descritta sopra non è più quella restituita da `/export`. Ora l'endpoint restituisce le voci di localStorage dell'app, come stringhe:

```json
{
  "dmi-monster-sheet-pwa-v1": "<JSON serializzato>",
  "dmi-theme": "..."
}
```

Il valore di `dmi-monster-sheet-pwa-v1`, dopo il parse:

```json
{
  "version": 20,
  "activeId": "...",
  "profiles": [
    {
      "id": "...",
      "inField": true,
      "identity": {
        "monsterName": "...",
        "playerName": "...",
        "level": 16,
        "exp": 51,
        "evolutionTree": "taratect",
        "evolutionLine": "web-control",
        "evolutionStart": "...",
        "currentEvolution": "...",
        "nextEvolution": "...",
        "species": "...",
        "family": "...",
        "evolutionTier": "Lesser"
      },
      "stats": { "MP": { "base": 40, "evolution": 0, "equip": 0, "skill": 0, "other": 0 } },
      "resources": {},
      "evolutionHistory": [],
      "skills": [{ "id": "...", "catalogKey": "...", "name": "...", "grade": "...", "mp": 0 }],
      "statuses": [],
      "actions": {},
      "target": {},
      "abilities": {},
      "equipment": {},
      "journal": {},
      "timeline": [],
      "log": [{ "id": "...", "at": "2026-10-12T20:08:09.003Z", "round": 1, "message": "..." }],
      "portrait": "data:image/...",
      "levelProgression": {},
      "directModifiers": {},
      "resourcePointInvestments": {}
    }
  ]
}
```

- `profiles` contiene le schede **complete** di tutti i personaggi; quella attiva è la voce con `id === activeId`.
- I campi anagrafici restano in `identity`; alcune schede ne hanno meno di altre (`evolutionTier` può mancare o essere in minuscolo).
- `stats` ha una voce per sigla (HP, MP, ATK, DEF, AGL, INTMEN), scomposta per provenienza.
- `portrait` è un data URI e può pesare centinaia di KB: la risposta intera supera facilmente gli 800 KB.
- Non ci sono più `schemaVersion`, `appVersion`, `storageVersion`, `syncedAt` e `profileCount`.

Il sito normalizza la risposta in `fetchSchedaDmi` (`app/lib/dmiBridge.ts`): parse della stringa e profilo attivo esposto come `character`, così il resto del sito continua a leggere `dati.character`.
