import type { DmiBridgeRisposta, DmiExport, DmiStorage } from "~/types/dmi";

export const DMI_ENDPOINT = "http://127.0.0.1:32177/export";

/** Chiave nostra: `dmi-monster-sheet-pwa-v1` appartiene all'app DMI, non va toccata. */
export const DMI_TOKEN_STORAGE_KEY = "dmi-bridge-token";

/** Chiave di localStorage dell'app DMI sotto cui il bridge espone le schede. */
const CHIAVE_SCHEDE = "dmi-monster-sheet-pwa-v1";

/**
 * Il bridge restituisce le schede come stringa JSON, con la scheda attiva
 * indicata solo da `activeId`: qui le si dà una forma sola per tutto il sito.
 */
function normalizza(risposta: DmiBridgeRisposta): DmiExport {
    let storage: DmiStorage;
    try {
        storage = JSON.parse(risposta[CHIAVE_SCHEDE]) as DmiStorage;
    } catch {
        throw new Error("Dati dell'app DMI non leggibili.");
    }

    const character = storage?.profiles?.find((p) => p.id === storage.activeId);
    if (!character) {
        throw new Error("La scheda attiva non è presente nei dati dell'app DMI.");
    }

    return { ...storage, character };
}

/**
 * Legge le schede dal bridge locale, con quella attiva in `character`.
 * Il token è personale del computer e va copiato da "Collegamento sito" nell'app.
 */
export async function fetchSchedaDmi (token: string, signal?: AbortSignal): Promise<DmiExport> {
    let res: Response;

    try {
        res = await fetch(DMI_ENDPOINT, {
            headers: { Authorization: `Bearer ${token}` },
            // Lo snapshot cambia a ogni salvataggio nell'app: mai servire una copia dalla cache.
            cache: "no-store",
            signal,
        });
    } catch (errore) {
        // L'abort va lasciato propagare: lo gestisce il chiamante allo unmount.
        if (errore instanceof DOMException && errore.name === "AbortError") throw errore;
        // Rete o CORS: tipicamente l'app DMI è chiusa. Non arriva mai come `res.ok === false`.
        throw new Error("Impossibile raggiungere l'app DMI: assicurati che sia aperta sullo stesso dispositivo.");
    }

    if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
            throw new Error("Token non valido: ricontrolla il codice in Collegamento sito.");
        }
        throw new Error(`DMI bridge: ${res.status}`);
    }

    return normalizza((await res.json()) as DmiBridgeRisposta);
}
