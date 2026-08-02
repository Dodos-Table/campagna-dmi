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
