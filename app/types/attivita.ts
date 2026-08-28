// Tipi della pagina Attività: il log della scheda DMI pubblicato su un feed condiviso.

/**
 * Voce di `character.log` normalizzata.
 * Il doc del bridge non descrive il contenuto del log: i nomi dei campi
 * vengono cercati fra più grafie in `~/lib/logDmi`.
 */
export interface VoceLog {
    id: string;
    testo: string;
    /** Data ISO, `null` se la voce non ne porta una leggibile. */
    timestamp: string | null;
}

/** Payload che finisce nel campo `data` di publish.php. */
export interface EventoPubblicato {
    /** Data ISO dell'evento nel log del personaggio, non dell'invio. */
    timestamp: string;
    messaggio: string;
    personaggio: string;
}

/** Envelope restituito da events.php: `data` è il body della POST così com'è arrivato. */
export interface EnvelopeEvento {
    id: number;
    /** Epoch in millisecondi, assegnato dal server all'arrivo. */
    ts: number;
    data: unknown;
}

/** Evento del feed: id dell'envelope più il payload decodificato. */
export interface EventoAttivita extends EventoPubblicato {
    id: number;
}

/** `disconnesso` = il long-poll è caduto e sta ritentando con backoff. */
export type StatoFeed = "avvio" | "connesso" | "disconnesso";
