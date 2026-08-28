import { useCallback, useEffect, useRef, useState } from "react";
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

export interface OpzioniDmiBridge {
    /**
     * Rilegge il bridge a intervalli, per accorgersi di quello che cambia nella
     * scheda mentre la pagina è aperta. Assente = una lettura sola, come prima.
     */
    pollMs?: number;
}

/** Collegamento in sola lettura alla scheda attiva dell'app DMI. */
export default function useDmiBridge(opzioni?: OpzioniDmiBridge): DmiBridge {
    const pollMs = opzioni?.pollMs;
    const [token, setTokenState] = useState(leggiTokenSalvato);
    const [dati, setDati] = useState<DmiExport | null>(null);
    const [stato, setStato] = useState<DmiBridgeStato>("inattivo");
    const [errore, setErrore] = useState<string | null>(null);
    // Incrementato da `ricarica`: rilancia l'effect anche se il token non cambia.
    const [nonce, setNonce] = useState(0);
    // Ultimo token per cui un tentativo è già arrivato a un esito, riuscito o meno.
    const tokenTentato = useRef<string | null>(null);

    useEffect(() => {
        if (!token) {
            setDati(null);
            setStato("inattivo");
            setErrore(null);
            tokenTentato.current = null;
            return;
        }

        const controller = new AbortController();

        // Solo il primo tentativo per questo token mostra l'attesa. Con `pollMs`
        // l'effect rigira di continuo: se ogni giro ripartisse da "caricamento",
        // ad app DMI chiusa la pagina lampeggerebbe fra attesa ed errore a ogni
        // intervallo. I giri successivi aggiornano lo schermo solo con un esito.
        if (tokenTentato.current !== token) {
            setStato("caricamento");
            setErrore(null);
        }

        fetchSchedaDmi(token, controller.signal)
            .then((scheda) => {
                tokenTentato.current = token;
                setDati(scheda);
                setErrore(null);
                setStato("connesso");
            })
            .catch((e: unknown) => {
                // Abort allo unmount o al cambio token: la richiesta non interessa più.
                if (controller.signal.aborted) return;
                tokenTentato.current = token;
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

    useEffect(() => {
        // Il polling segue la connessione, non il solo token: ad app DMI chiusa
        // continuerebbe a bussare a un indirizzo che non risponde, per sempre.
        // Dallo stato di errore si riparte con `ricarica` (il pulsante Riprova).
        if (!pollMs || stato !== "connesso") return;

        const timer = setInterval(ricarica, pollMs);
        return () => clearInterval(timer);
    }, [pollMs, stato, ricarica]);

    return { dati, stato, errore, token, setToken, ricarica };
}
