// Tipi della pagina Campo: le schede in battaglia condivise sulla bacheca.

import type { DmiTarget } from "~/types/dmi";

/**
 * Payload che finisce nel campo `data` di publish.php: lo stato di una scheda in campo.
 * I valori difensivi sono quelli che l'avversario copierà nel proprio `target`.
 */
export interface EventoCampo extends DmiTarget {
    tipo: "campo";
    schedaId: string;
    inField: boolean;
    nome: string;
    /** Data URI dell'immagine, stringa vuota se la scheda non ne ha. */
    portrait: string;
}

/** Evento campo letto dal feed: id dell'envelope più il payload. */
export interface SchedaCampo extends EventoCampo {
    id: number;
}
