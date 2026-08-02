import { useCallback, useEffect, useState } from "react";
import { DMI_TOKEN_STORAGE_KEY, fetchSchedaDmi } from "~/lib/dmiBridge";
import type { DmiBridgeStato, DmiExport } from "~/types/dmi";

function leggiTokenSalvato(): string {
    try {
        return localStorage.getItem(DMI_TOKEN_STORAGE_KEY) ?? "";
    } catch {
        // localStorage può essere negato (modalità privata, cookie bloccati): si riparte senza token.
        return "";
    }
}

export interface DmiBridge {
    dati: DmiExport | null;
    stato: DmiBridgeStato;
    errore: string | null;
    token: string;
    /** Stringa vuota per scollegare: rimuove anche il token salvato. */
    setToken: (token: string) => void;
    ricarica: () => void;
}

/** Collegamento in sola lettura alla scheda attiva dell'app DMI. */
export default function useDmiBridge(): DmiBridge {
    const [token, setTokenState] = useState(leggiTokenSalvato);
    const [dati, setDati] = useState<DmiExport | null>(null);
    const [stato, setStato] = useState<DmiBridgeStato>("inattivo");
    const [errore, setErrore] = useState<string | null>(null);
    // Incrementato da `ricarica`: rilancia l'effect anche se il token non cambia.
    const [nonce, setNonce] = useState(0);

    useEffect(() => {
        if (!token) {
            setDati(null);
            setStato("inattivo");
            setErrore(null);
            return;
        }

        const controller = new AbortController();

        setStato("caricamento");
        setErrore(null);

        fetchSchedaDmi(token, controller.signal)
            .then((scheda) => {
                setDati(scheda);
                setStato("connesso");
            })
            .catch((e: unknown) => {
                // Abort allo unmount o al cambio token: la richiesta non interessa più.
                if (controller.signal.aborted) return;
                setDati(null);
                setErrore(e instanceof Error ? e.message : "Errore sconosciuto dal bridge DMI.");
                setStato("errore");
            });

        return () => controller.abort();
    }, [token, nonce]);

    const setToken = useCallback((nuovo: string) => {
        const pulito = nuovo.trim();
        try {
            if (pulito) {
                localStorage.setItem(DMI_TOKEN_STORAGE_KEY, pulito);
            } else {
                localStorage.removeItem(DMI_TOKEN_STORAGE_KEY);
            }
        } catch {
            // Senza persistenza il collegamento vale solo per questa sessione.
        }
        setTokenState(pulito);
    }, []);

    const ricarica = useCallback(() => setNonce((n) => n + 1), []);

    return { dati, stato, errore, token, setToken, ricarica };
}
