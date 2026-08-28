import { useEffect, useRef, useState } from "react";
import { scaricaEventi } from "~/lib/attivitaHosting";
import type { EventoAttivita, StatoFeed } from "~/types/attivita";

/** Attesa dopo una caduta, raddoppiata a ogni tentativo fallito. */
const BACKOFF_INIZIALE_MS = 3_000;
const BACKOFF_MASSIMO_MS = 30_000;

function attendi(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((risolvi) => {
        const timer = setTimeout(risolvi, ms);
        signal.addEventListener("abort", () => {
            clearTimeout(timer);
            risolvi();
        }, { once: true });
    });
}

export interface FeedAttivita {
    eventi: EventoAttivita[];
    stato: StatoFeed;
    errore: string | null;
}

/**
 * Feed condiviso in tempo reale, senza WebSocket: il server tiene aperta ogni
 * richiesta `?since=N` finché non ha qualcosa da dire (~25s di attesa massima),
 * quindi il ciclo qui sotto è una catena di richieste lunghe, non un polling.
 *
 * `attivo` a `false` non apre nulla: la pagina mostra il feed solo a scheda
 * collegata, e tenere una connessione perennemente aperta su contenuto che
 * nessuno sta guardando è solo traffico sprecato.
 */
export default function useFeedAttivita(attivo: boolean): FeedAttivita {
    const [eventi, setEventi] = useState<EventoAttivita[]>([]);
    const [stato, setStato] = useState<StatoFeed>("avvio");
    const [errore, setErrore] = useState<string | null>(null);
    // Sopravvive ai riavvii del ciclo: alla ripresa si riparte da qui invece di
    // riscaricare tutto lo storico a ogni ritorno sulla scheda.
    const cursore = useRef<number | null>(null);
    // Ogni cambio di visibilità rilancia l'effect: nascosta lo ferma, tornata in
    // primo piano lo riavvia. È anche il modo per riprendere dopo la pausa.
    const [ripresa, setRipresa] = useState(0);

    useEffect(() => {
        const alCambioVisibilita = () => setRipresa((n) => n + 1);

        document.addEventListener("visibilitychange", alCambioVisibilita);
        return () => document.removeEventListener("visibilitychange", alCambioVisibilita);
    }, []);

    useEffect(() => {
        if (!attivo) return;

        // A scheda nascosta non ha senso tenere aperta una connessione che si
        // riapre ogni 25s: alla riapertura si riparte da `lastId` e si recupera tutto.
        if (typeof document !== "undefined" && document.hidden) return;

        const controller = new AbortController();
        const { signal } = controller;

        /** Unisce i nuovi eventi scartando gli id già in lista (una ripresa può ripeterli). */
        const aggiungi = (nuovi: EventoAttivita[]) => {
            if (nuovi.length === 0) return;

            setEventi((precedenti) => {
                const visti = new Set(precedenti.map((e) => e.id));
                const inediti = nuovi.filter((e) => !visti.has(e.id));
                return inediti.length === 0 ? precedenti : [...precedenti, ...inediti];
            });
        };

        /** Primo avvio: cursore e storico. Le richieste sono immediate, non long-poll. */
        const avvia = async () => {
            // Senza `since` la risposta è immediata e porta solo il cursore.
            const iniziale = await scaricaEventi(null, signal);
            if (signal.aborted) return;

            // Con archivio vuoto un `?since=0` resterebbe appeso 25s ritardando il
            // primo render: lo storico si chiede solo se c'è qualcosa da chiedere.
            if (iniziale.lastId <= 0) {
                cursore.current = iniziale.lastId;
                return;
            }

            const storico = await scaricaEventi(0, signal);
            if (signal.aborted) return;

            aggiungi(storico.eventi);
            cursore.current = Math.max(iniziale.lastId, storico.lastId);
        };

        /** Un giro di long-poll: resta appeso fino al prossimo evento o a ~25s. */
        const attendiNovita = async (da: number) => {
            const risposta = await scaricaEventi(da, signal);
            if (signal.aborted) return;

            aggiungi(risposta.eventi);
            cursore.current = Math.max(da, risposta.lastId);
        };

        /** Segnala la caduta, aspetta, e restituisce l'attesa del prossimo tentativo. */
        const inciampa = async (e: unknown, attesa: number) => {
            setStato("disconnesso");
            setErrore(e instanceof Error ? e.message : "Errore sconosciuto dalla bacheca.");

            await attendi(attesa, signal);
            return Math.min(attesa * 2, BACKOFF_MASSIMO_MS);
        };

        const ciclo = async () => {
            let attesa = BACKOFF_INIZIALE_MS;

            while (!signal.aborted) {
                try {
                    const da = cursore.current;
                    if (da === null) await avvia();
                    else await attendiNovita(da);

                    if (signal.aborted) return;

                    setStato("connesso");
                    setErrore(null);
                    attesa = BACKOFF_INIZIALE_MS;
                } catch (e: unknown) {
                    if (signal.aborted) return;
                    attesa = await inciampa(e, attesa);
                }
            }
        };

        void ciclo();

        return () => controller.abort();
    }, [attivo, ripresa]);

    return { eventi, stato, errore };
}
