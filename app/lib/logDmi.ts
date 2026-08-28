import type { VoceLog } from "~/types/attivita";
import type { DmiExport } from "~/types/dmi";

/**
 * `character.log` è dichiarato `unknown[]` dal doc del bridge: la forma delle
 * voci non è documentata. Come per `gradoDaIdentity` in `~/lib/gradoSkill`,
 * accettiamo più grafie invece di scommettere su una sola.
 */
const CHIAVI_ID = ["id", "uid", "_id", "eventId"] as const;
const CHIAVI_TESTO = ["message", "text", "msg", "testo", "descrizione", "description"] as const;
const CHIAVI_DATA = ["ts", "timestamp", "createdAt", "at", "date"] as const;

function primoTesto(voce: Record<string, unknown>, chiavi: readonly string[]): string | null {
    for (const chiave of chiavi) {
        const valore = voce[chiave];
        if (typeof valore === "string" && valore.trim() !== "") return valore;
    }
    return null;
}

function idVoce(voce: Record<string, unknown>): string | null {
    for (const chiave of CHIAVI_ID) {
        const valore = voce[chiave];
        if (typeof valore === "string" && valore.trim() !== "") return valore;
        if (typeof valore === "number" && Number.isFinite(valore)) return String(valore);
    }
    return null;
}

/** Accetta sia una data ISO sia un epoch (ms o s), come fanno gli export osservati. */
function isoVoce(voce: Record<string, unknown>): string | null {
    for (const chiave of CHIAVI_DATA) {
        const valore = voce[chiave];

        if (typeof valore === "number" && Number.isFinite(valore)) {
            // Sotto i 10^12 è quasi certamente in secondi: nessuna data in ms cade nel 1970.
            const data = new Date(valore < 1e12 ? valore * 1000 : valore);
            if (!Number.isNaN(data.getTime())) return data.toISOString();
            continue;
        }

        if (typeof valore === "string" && valore.trim() !== "") {
            const data = new Date(valore);
            if (!Number.isNaN(data.getTime())) return data.toISOString();
        }
    }
    return null;
}

/**
 * Le voci di `character.log` in ordine d'array, normalizzate.
 * Le voci senza id vengono scartate: senza una chiave stabile non sapremmo
 * distinguere un evento nuovo da uno già pubblicato.
 */
export function vociLog(dati: DmiExport | null): VoceLog[] {
    const log = dati?.character?.log;
    if (!Array.isArray(log)) return [];

    const voci: VoceLog[] = [];

    for (const grezza of log) {
        if (typeof grezza !== "object" || grezza === null) continue;

        const voce = grezza as Record<string, unknown>;
        const id = idVoce(voce);
        if (!id) continue;

        voci.push({
            id,
            // Senza un campo testuale riconosciuto meglio l'oggetto grezzo che una riga vuota.
            testo: primoTesto(voce, CHIAVI_TESTO) ?? JSON.stringify(voce),
            timestamp: isoVoce(voce),
        });
    }

    return voci;
}

/** Il nome vive in `character.identity`, che può essere incompleta: fallback sull'indice profili. */
export function nomePersonaggio(dati: DmiExport): string {
    const identity = dati.character.identity;
    if (typeof identity.monsterName === "string" && identity.monsterName) return identity.monsterName;

    const attivo = dati.profiles.find((p) => p.id === dati.activeId);
    return attivo?.monsterName ?? "Scheda senza nome";
}
