import type { EventoAttivita, EventoPubblicato } from "~/types/attivita";
import type { EventoCampo } from "~/types/campo";

/**
 * Hosting PHP che fa da bacheca condivisa fra i giocatori.
 * Ogni bacheca espone solo `events.php` e `publish.php`, senza stato di sessione:
 * le funzioni qui sotto prendono la base, così Attività e Campo restano separati.
 */
export const URL_HOSTING = "https://dodos-table.it/dmi-hosting/";

/** Bacheca del campo di battaglia: stesso contratto, solo eventi `tipo: "campo"`. */
export const URL_CAMPO = "https://dodos-table.it/dmi-campo/";

/** Mostrato al posto di un `data` vuoto: senza testo la riga sembrerebbe rotta. */
const MESSAGGIO_VUOTO = "(vuoto)";

/** Autore di ripiego per gli eventi che non portano un payload nostro (test da curl, voci vecchie). */
const AUTORE_IGNOTO = "?";

export interface RispostaEventi<T> {
    lastId: number;
    eventi: T[];
}

function testoNonVuoto(valore: unknown): string | null {
    return typeof valore === "string" && valore.trim() !== "" ? valore : null;
}

/** Accetta sia una data ISO sia un epoch (ms o s): il payload arriva da fonti diverse. */
function isoDaValore(valore: unknown): string | null {
    if (typeof valore === "number") {
        // Sotto i 10^12 è quasi certamente in secondi: nessuna data in ms cade nel 1970.
        const ms = valore < 1e12 ? valore * 1000 : valore;
        const data = new Date(ms);
        return Number.isNaN(data.getTime()) ? null : data.toISOString();
    }

    if (typeof valore !== "string" || valore.trim() === "") return null;

    const data = new Date(valore);
    return Number.isNaN(data.getTime()) ? null : data.toISOString();
}

/**
 * Id e payload decodificato di un envelope `{ id, ts, data }`.
 * `data` è il body grezzo della POST: se è JSON torna parsato, altrimenti resta la stringa.
 * `null` se manca l'id, senza il quale l'evento non è deduplicabile.
 */
export function apriEnvelope(grezzo: unknown): { id: number; ts: unknown; payload: unknown } | null {
    if (typeof grezzo !== "object" || grezzo === null) return null;

    const envelope = grezzo as Record<string, unknown>;

    const id = typeof envelope.id === "number" ? envelope.id : Number(envelope.id);
    if (!Number.isFinite(id)) return null;

    let payload: unknown = envelope.data;
    if (typeof payload === "string") {
        try {
            payload = JSON.parse(payload);
        } catch {
            // Non era JSON: resta la stringa, la interpreta il chiamante.
        }
    }

    return { id, ts: envelope.ts, payload };
}

/**
 * Da envelope `{ id, ts, data }` a evento mostrabile.
 *
 * `data` è il body grezzo della POST: normalmente il JSON che pubblichiamo noi,
 * ma può essere testo libero (prove da curl) o vuoto. In quei casi il contenuto
 * viene mostrato lo stesso, attribuito a un autore ignoto, invece di sparire.
 * `null` solo se manca l'id, senza il quale l'evento non è deduplicabile.
 */
export function normalizzaEvento(grezzo: unknown): EventoAttivita | null {
    const envelope = apriEnvelope(grezzo);
    if (!envelope) return null;

    const { id, payload } = envelope;

    // Ora di arrivo sul server: fa da ripiego se il payload non porta la sua.
    const tsServer = isoDaValore(envelope.ts) ?? new Date().toISOString();

    if (typeof payload === "object" && payload !== null) {
        const campi = payload as Record<string, unknown>;
        const messaggio = testoNonVuoto(campi.messaggio);

        if (messaggio) {
            return {
                id,
                messaggio,
                personaggio: testoNonVuoto(campi.personaggio) ?? AUTORE_IGNOTO,
                timestamp: isoDaValore(campi.timestamp) ?? tsServer,
            };
        }
    }

    return {
        id,
        messaggio: testoNonVuoto(payload) ?? MESSAGGIO_VUOTO,
        personaggio: AUTORE_IGNOTO,
        timestamp: tsServer,
    };
}

/**
 * Legge il feed condiviso.
 *
 * `since === null` chiede solo il cursore: torna subito, con `eventi` vuoto.
 * Con un `since` numerico il server tiene aperta la connessione finché non
 * arriva un evento più recente, e la chiude a ~25s se non succede nulla:
 * è il long-poll su cui si regge il tempo reale, quindi niente timeout nostro.
 */
export async function scaricaEventi<T>(
    base: string,
    since: number | null,
    normalizza: (grezzo: unknown) => T | null,
    signal?: AbortSignal,
): Promise<RispostaEventi<T>> {
    const url = since === null ? `${base}events.php` : `${base}events.php?since=${since}`;

    let res: Response;
    try {
        res = await fetch(url, { cache: "no-store", signal });
    } catch (errore) {
        if (errore instanceof DOMException && errore.name === "AbortError") throw errore;
        throw new Error("Bacheca non raggiungibile: controlla la connessione.");
    }

    if (!res.ok) throw new Error(`Bacheca: ${res.status}`);

    const corpo = (await res.json()) as { lastId?: unknown; events?: unknown };

    const lastId = typeof corpo.lastId === "number" ? corpo.lastId : 0;
    const grezzi = Array.isArray(corpo.events) ? corpo.events : [];

    const eventi: T[] = [];
    for (const grezzo of grezzi) {
        const evento = normalizza(grezzo);
        if (evento) eventi.push(evento);
    }

    return { lastId, eventi };
}

/** Pubblica un evento sulla bacheca e restituisce l'id che il server gli assegna. */
export async function pubblicaEvento(base: string, evento: EventoPubblicato | EventoCampo, signal?: AbortSignal): Promise<number> {
    let res: Response;
    try {
        res = await fetch(`${base}publish.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(evento),
            signal,
        });
    } catch (errore) {
        if (errore instanceof DOMException && errore.name === "AbortError") throw errore;
        throw new Error("Invio non riuscito: bacheca non raggiungibile.");
    }

    if (!res.ok) throw new Error(`Invio non riuscito: ${res.status}`);

    const corpo = (await res.json()) as { ok?: unknown; id?: unknown };

    // L'HTTP 200 da solo non basta: è il corpo a dire se l'evento è stato archiviato.
    if (corpo.ok !== true || typeof corpo.id !== "number") {
        throw new Error("La bacheca ha rifiutato l'evento.");
    }

    return corpo.id;
}
