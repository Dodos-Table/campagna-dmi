import { useEffect, useMemo, useRef, useState } from "react";
import { URL_CAMPO, pubblicaEvento } from "~/lib/attivitaHosting";
import { eventoDaScheda, firma, normalizzaCampo, statoCampo } from "~/lib/campo";
import type { DmiBridge } from "~/lib/useDmiBridge";
import useFeedAttivita from "~/lib/useFeedAttivita";
import type { EventoCampo, SchedaCampo } from "~/types/campo";

export interface Campo {
    /** Le schede in campo di tutti, nell'ordine in cui sono comparse sulla bacheca. */
    schede: SchedaCampo[];
    erroreInvio: string | null;
}

/**
 * Campo condiviso: legge dalla bacheca le schede di tutti e ci pubblica quelle
 * di questo computer, ma solo quando la bacheca ne mostra uno stato diverso da
 * quello attuale (entrata, uscita, nome, immagine o valori difensivi cambiati).
 */
export default function useCampo(bridge: DmiBridge): Campo {
    const { dati } = bridge;

    const feed = useFeedAttivita(URL_CAMPO, bridge.stato === "connesso", normalizzaCampo);
    const stato = useMemo(() => statoCampo(feed.eventi), [feed.eventi]);

    const [erroreInvio, setErroreInvio] = useState<string | null>(null);

    // Il bridge è riletto ogni pochi secondi: senza guardia un giro ripartirebbe
    // mentre il precedente è ancora in volo, pubblicando due volte.
    const invioInCorso = useRef(false);
    // Ultima firma spedita per scheda: la bacheca la restituisce con un attimo di
    // ritardo, e nel frattempo non va rispedita.
    const inviate = useRef(new Map<string, string>());

    // Legato al montaggio come in `usePubblicaLog`: `dati` cambia a ogni poll.
    const abbandono = useRef<AbortController | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        abbandono.current = controller;
        return () => controller.abort();
    }, []);

    useEffect(() => {
        // Prima va letto lo storico: senza, ogni apertura ripubblicherebbe tutto.
        if (!dati || feed.stato !== "connesso" || invioInCorso.current) return;

        const daInviare: EventoCampo[] = [];
        for (const scheda of dati.profiles) {
            const evento = eventoDaScheda(scheda);
            if (!evento) continue;

            const attuale = firma(evento);
            const sullaBacheca = stato.get(evento.schedaId);
            // Una scheda mai entrata in campo non va annunciata: porterebbe solo peso.
            const aggiornata = sullaBacheca ? firma(sullaBacheca) === attuale : !evento.inField;

            if (!aggiornata && inviate.current.get(evento.schedaId) !== attuale) daInviare.push(evento);
        }
        if (daInviare.length === 0) return;

        const signal = abbandono.current?.signal;
        if (signal?.aborted) return;

        invioInCorso.current = true;

        const invia = async () => {
            try {
                for (const evento of daInviare) {
                    if (signal?.aborted) return;
                    await pubblicaEvento(URL_CAMPO, evento, signal);
                    inviate.current.set(evento.schedaId, firma(evento));
                }
                setErroreInvio(null);
            } catch (e: unknown) {
                if (signal?.aborted) return;
                // Quello che non è partito resta diverso dalla bacheca: si ritenta al prossimo poll.
                setErroreInvio(e instanceof Error ? e.message : "Errore sconosciuto durante l'invio.");
            } finally {
                invioInCorso.current = false;
            }
        };

        void invia();
    }, [dati, stato, feed.stato]);

    // shortcut: chi chiude app o pagina senza togliere `inField` resta in campo fino al
    // suo prossimo messaggio; se diventa un problema serve un heartbeat con scadenza.
    const schede = useMemo(() => [...stato.values()].filter((s) => s.inField), [stato]);

    return { schede, erroreInvio };
}
