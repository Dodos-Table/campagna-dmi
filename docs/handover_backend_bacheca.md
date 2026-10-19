# Handover — backend PHP delle bacheche `dodos-table.it/dmi-hosting/` e `dodos-table.it/dmi-campo/`

Destinatario: una sessione di Claude Code che lavora sul codice PHP ospitato su `dodos-table.it`.
Obiettivo: implementare (o adeguare) la logica di **invio** (`publish.php`) e **ricezione** (`events.php`) di due bacheche con lo **stesso contratto**:

| Bacheca | URL base | Usata da | Contenuto |
|---|---|---|---|
| Attività | `https://dodos-table.it/dmi-hosting/` | pagina **Attività** | voci di log, piccole |
| Campo | `https://dodos-table.it/dmi-campo/` | nuova pagina **Campo** | stato delle schede in battaglia, fino a ~1 MB l'una |

`dmi-campo/` va creata. Conviene un solo codice PHP condiviso (es. un `lib.php` incluso da entrambe le cartelle) con archivio e configurazione separati per bacheca: le due **non** devono vedere gli eventi l'una dell'altra.

Il client è già scritto e non va cambiato: il backend deve rispettare il contratto qui sotto **alla lettera**. Se trovi un PHP esistente, leggilo prima e adeguane il comportamento invece di riscriverlo da zero.

---

## 1. Contesto

- Sito: SPA React servita da GitHub Pages su `https://dmi.dodos-table.it` (in sviluppo `http://localhost:5173`).
- Bacheche: `https://dodos-table.it/dmi-hosting/` e `https://dodos-table.it/dmi-campo/`, ognuna con due soli file pubblici, nessuna sessione, nessuna autenticazione.
- Ogni giocatore e il GM hanno l'app DMI in locale. Il sito legge la scheda dal bridge locale (`127.0.0.1:32177`) e usa la bacheca solo per **condividere** eventi fra computer diversi.
- Ogni bacheca è un **log append-only di eventi** con id crescente. Il server non interpreta il contenuto: lo conserva e lo restituisce.
  - **`dmi-hosting/`**: voci di log dei personaggi (piccole, testo).
  - **`dmi-campo/`**: stato di una scheda in battaglia (può pesare **600 KB+** per l'immagine in data URI).

Codice client di riferimento (repo `campagna-dmi`):
- `app/lib/attivitaHosting.ts`: chiamate HTTP (`scaricaEventi`, `pubblicaEvento`, `apriEnvelope`) e i due URL (`URL_HOSTING`, `URL_CAMPO`).
- `app/lib/useFeedAttivita.ts`: ciclo di long-poll.
- `app/lib/useCampo.ts`, `app/lib/campo.ts`: cosa pubblica e legge la pagina Campo.

---

## 2. Contratto HTTP (obbligatorio, identico per le due bacheche)

Gli esempi usano `dmi-hosting/`; per il campo cambia solo la base (`dmi-campo/events.php`, `dmi-campo/publish.php`).

### 2.1 `POST publish.php` — invio

Richiesta del client:
```
POST https://dodos-table.it/dmi-hosting/publish.php
Content-Type: application/json

<body JSON arbitrario>
```

Il server deve:
1. Leggere il body grezzo (`file_get_contents('php://input')`).
2. Assegnare un `id` intero **strettamente crescente**, unico anche con POST concorrenti (lock esclusivo, vedi §4).
3. Salvare l'envelope `{ id, ts, data }`:
   - `ts` = epoch del server **in millisecondi** (`(int) round(microtime(true) * 1000)`);
   - `data` = il body **così com'è** (stringa), oppure il JSON decodificato. Il client accetta entrambi.
4. Svegliare i long-poll in attesa (§2.2).
5. Rispondere `200` con:
```json
{ "ok": true, "id": 123 }
```

Il client considera riuscito l'invio **solo** se `ok === true` e `id` è un numero. Qualsiasi altro corpo o status ≠ 2xx = errore, mostrato all'utente e ritentato. In caso di rifiuto rispondi con status 4xx/5xx e `{ "ok": false, "error": "..." }`.

### 2.2 `GET events.php` — ricezione

Due modalità, distinte dalla presenza di `since`:

**a) Senza `since`: solo il cursore, risposta immediata**
```
GET events.php
→ 200 { "lastId": 123, "events": [] }
```
`lastId` = id più alto archiviato, `0` se l'archivio è vuoto.

**b) Con `since=N`: long-poll**
```
GET events.php?since=N
→ 200 { "lastId": 130, "events": [ { "id": 124, "ts": 1760400000000, "data": "..." }, ... ] }
```
- Se esistono eventi con `id > N`, rispondi **subito** con tutti quelli, in ordine di id crescente.
- Altrimenti tieni aperta la richiesta finché ne arriva uno, fino a **~25 s**. Allo scadere rispondi `{ "lastId": <attuale>, "events": [] }`.
- `lastId` va sempre incluso e deve essere ≥ dell'id più alto in `events`.
- Il client non ha un timeout suo: non superare i ~25-30 s, o rischi i timeout di proxy e hosting.

Come lo usa il client (`useFeedAttivita.ts`):
1. `GET events.php` → cursore.
2. Se `lastId > 0`: `GET events.php?since=0` → **tutto lo storico**, che deve tornare subito.
3. Poi ciclo continuo `GET events.php?since=<lastId>`.
4. Su errore di rete o status ≠ 2xx: backoff da 3 s a 30 s e riprova. A scheda del browser nascosta il ciclo si ferma e poi riparte dal cursore.

Il client deduplica per `id`: rimandare un evento già inviato è innocuo, saltarne uno no.

### 2.3 CORS (obbligatorio)

Il sito è su un altro origin, e `Content-Type: application/json` provoca una **preflight**. Su tutti e quattro i file (`events.php` e `publish.php` di entrambe le bacheche):
```
Access-Control-Allow-Origin: https://dmi.dodos-table.it   (in sviluppo anche http://localhost:5173)
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
Access-Control-Max-Age: 86400
```
- `OPTIONS` risponde `204` senza corpo.
- Gli header CORS vanno anche sulle risposte di errore, altrimenti il browser nasconde lo status.
- Il client usa `cache: "no-store"`: metti anche `Cache-Control: no-store` su `events.php`.
- Se rifletti l'`Origin`, fallo solo da una whitelist.

---

## 3. Payload che transitano (il server non li deve interpretare, ma conviene validarli)

### Attività (`dmi-hosting/`)
```json
{ "timestamp": "2026-10-12T20:08:09.003Z", "messaggio": "…", "personaggio": "main Taratect" }
```

### Campo (`dmi-campo/`): uno per scheda, ripubblicato solo quando cambia qualcosa
```json
{
  "tipo": "campo",
  "schedaId": "7ba3a176-898f-4d3c-8d72-470a5b50abf0",
  "inField": true,
  "nome": "main Taratect",
  "playerName": "Mario",
  "portrait": "data:image/jpeg;base64,/9j/4AAQ…",
  "elusion": 31,
  "def": 7,
  "men": 13
}
```
- Il client tiene **solo l'ultimo** evento (id più alto) per ogni `schedaId`. Con `inField: false` la scheda sparisce dal campo.
- Le schede del GM si riconoscono solo da `playerName` uguale a `GM` (senza distinzione di maiuscole). Il server non deve farci niente, ma deve conservare il campo.

---

## 4. Requisiti di implementazione

1. **Dimensione del body**: su `dmi-campo/` un evento arriva a ~0,6-1 MB, e in futuro anche di più. Verifica e alza `post_max_size`, `memory_limit` e gli eventuali limiti del web server (`LimitRequestBody`, `client_max_body_size`). Imposta un tetto esplicito per bacheca (es. **2 MB** per `dmi-campo/`, molto meno per `dmi-hosting/`) e oltre rispondi `413` con `{ "ok": false }`.
2. **Concorrenza**: assegnazione dell'id e scrittura sotto **lock esclusivo** (`flock(LOCK_EX)` su un file di lock), oppure SQLite con `INTEGER PRIMARY KEY AUTOINCREMENT` in una transazione. Due POST simultanee non devono mai ricevere lo stesso id né sovrascriversi.
3. **Long-poll senza bruciare CPU**: ciclo con `usleep(250000)` (circa 4 controlli al secondo) che confronta solo l'ultimo id, ad esempio da un piccolo file `last_id` letto con `LOCK_SH` o da `filemtime` + `clearstatcache()`. Rileggi l'archivio intero solo quando l'id cambia. Chiama `session_write_close()` se c'è una sessione e `ignore_user_abort(false)`, ed esci se `connection_aborted()`.
4. **`set_time_limit`**: almeno 35 s su `events.php`, altrimenti il long-poll viene ucciso a metà.
5. **Archivio leggero da leggere**: se usi file, non salvare tutto in un unico JSON da riscrivere a ogni POST (con le immagini diventa di decine di MB). Meglio:
   - un file per evento (`events/000123.json`) più `last_id`;
   - oppure SQLite (`id`, `ts`, `data` TEXT).
6. **Compattazione su `dmi-campo/` (fortemente consigliata)**: ogni cambio di scheda aggiunge ~600 KB, e il client al primo accesso scarica **tutto lo storico** (`since=0`). Quando arriva un evento, elimina gli eventi precedenti con lo stesso `schedaId`. È compatibile col client, perché a lui serve solo l'ultimo per scheda:
   - non riusare mai gli id cancellati e non abbassare mai `lastId`;
   - su `dmi-hosting/` niente compattazione: lì ogni evento è una voce di log da conservare.
7. **Validazione minima** (la bacheca è pubblica, chiunque può fare POST):
   - body JSON valido, altrimenti `400`;
   - su `dmi-campo/` accetta solo `tipo === "campo"`, con `schedaId` stringa non vuota (max ~100 caratteri), `inField` booleano, `nome` e `playerName` stringhe (max ~100 caratteri), `elusion`/`def`/`men` numerici, `portrait` vuoto oppure che inizi con `data:image/`;
   - nessun HTML generato lato server: i dati tornano solo come JSON (`Content-Type: application/json; charset=utf-8`).
8. **Encoding**: `json_encode($x, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)`. I nomi contengono accenti e caratteri come `—`.

---

## 5. Fuori scopo ma da sapere

- **Nessuna autenticazione**: chiunque conosca l'URL può pubblicare o falsificare lo stato di una scheda. Accettato per ora. Se serve, si può aggiungere un segreto condiviso di campagna in header, ma richiede una modifica al client.
- **Schede "fantasma"**: se un giocatore chiude l'app senza togliere `inField`, la sua scheda resta in campo finché non arriva un nuovo evento. Un'eventuale scadenza lato server (es. ignorare gli eventi campo più vecchi di X ore) va concordata col client prima di introdurla: oggi il client non ripubblica le schede che non sono cambiate.
- Non cambiare nomi dei file, parametri o forma delle risposte: il sito in produzione dipende da questi.

---

## 6. Come verificare

Con `curl` (sostituisci l'URL base se lavori in locale). Preflight, cursore e long-poll vanno provati su entrambe le basi (`$B` e `$C`). La POST di prova Attività su `$C` deve essere rifiutata con `400`:
```bash
B=https://dodos-table.it/dmi-hosting
C=https://dodos-table.it/dmi-campo

# preflight
curl -i -X OPTIONS "$B/publish.php" -H "Origin: https://dmi.dodos-table.it" \
  -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: content-type"
# → 204 con gli header Access-Control-*

# cursore
curl -s "$B/events.php"                        # → {"lastId":N,"events":[]} immediato

# long-poll: in un terminale resta appeso…
curl -s "$B/events.php?since=$(curl -s $B/events.php | php -r 'echo json_decode(stream_get_contents(STDIN))->lastId;')"
# …e in un altro pubblica: il primo deve rispondere subito con l'evento
curl -s -X POST "$B/publish.php" -H "Content-Type: application/json" \
  -d '{"timestamp":"2026-10-14T10:00:00Z","messaggio":"prova","personaggio":"Test"}'
# → {"ok":true,"id":N+1}

# evento campo grande (~800 KB)
php -r 'echo json_encode(["tipo"=>"campo","schedaId"=>"test","inField"=>true,"nome"=>"Test","playerName"=>"GM","portrait"=>"data:image/jpeg;base64,".str_repeat("A",800000),"elusion"=>30,"def"=>1,"men"=>1]);' > big.json
curl -s -X POST "$C/publish.php" -H "Content-Type: application/json" --data-binary @big.json   # → ok:true

# isolamento: l'evento campo non deve comparire su dmi-hosting
curl -s "$B/events.php?since=0" | grep -c '"schedaId"'   # → 0

# compattazione: ripubblica "test" con inField:false, poi
curl -s "$C/events.php?since=0" | php -r '$r=json_decode(stream_get_contents(STDIN),true); foreach($r["events"] as $e){$d=is_string($e["data"])?json_decode($e["data"],true):$e["data"]; if(($d["schedaId"]??null)==="test") echo $e["id"],"\n";}'
# → un solo id (l'ultimo)
```
Test di concorrenza: lancia 20 POST in parallelo (`for i in $(seq 20); do curl … & done; wait`) e controlla che gli id siano 20 valori distinti e consecutivi.

End-to-end col sito:
- `https://dmi.dodos-table.it/attivita`: le voci compaiono in tempo reale su due browser.
- `https://dmi.dodos-table.it/campo` con due token diversi: la scheda con `inField` di ciascuno appare anche sull'altro browser entro pochi secondi, e sparisce quando `inField` torna `false`.
