import { useEffect, useRef, useState } from "react";
import { pubblicaEvento } from "~/lib/attivitaHosting";
import { nomePersonaggio, vociLog } from "~/lib/logDmi";
import type { DmiBridge } from "~/lib/useDmiBridge";

/** Una chiave per personaggio: schede diverse hanno log indipendenti. */
function chiaveArchivio(idPersonaggio: string): string {
    return `dmi-attivita-pubblicati:${idPersonaggio}`;
}

/**
 * Voci di log già trattate: `idVoceLog -> idEventoSullaBacheca`.
 * Il valore `0` marca le voci della baseline, presenti prima del primo
 * collegamento e quindi mai spedite.
 */
type Archivio = Record<string, number>;

function leggiArchivio(idPersonaggio: string): Archivio | null {
    try {
        const grezzo = localStorage.getItem(chiaveArchivio(idPersonaggio));
        if (grezzo === null) return null;

        const letto: unknown = JSON.parse(grezzo);
        return typeof letto === "object" && letto !== null ? (letto as Archivio) : null;
    } catch {
        // localStorage negato o contenuto corrotto: si riparte da una baseline nuova.
        return null;
    }
}

function salvaArchivio(idPersonaggio: string, archivio: Archivio): void {
    try {
        localStorage.setItem(chiaveArchivio(idPersonaggio), JSON.stringify(archivio));
    } catch {
        // Senza persistenza la deduplica vale solo per questa sessione.
    }
}

export interface PubblicazioneLog {
    /** Id sulla bacheca degli eventi partiti da questo browser. */
    idPropri: Set<number>;
    erroreInvio: string | null;
}

/**
 * Pubblica sulla bacheca le voci di `character.log` comparse dopo il collegamento.
 *
 * Alla prima apertura con una scheda mai vista il log esistente viene solo
 * registrato, non spedito: altrimenti l'intero storico del personaggio finirebbe
 * di colpo nel feed di tutti.
 */
export default function usePubblicaLog(bridge: DmiBridge): PubblicazioneLog {
    const { dati } = bridge;

    const [idPropri, setIdPropri] = useState<Set<number>>(new Set());
    const [erroreInvio, setErroreInvio] = useState<string | null>(null);

    // Il bridge viene riletto ogni pochi secondi: senza guardia un secondo giro
    // partirebbe mentre il primo è ancora in volo, spedendo due volte lo stesso evento.
    const invioInCorso = useRef(false);

    // Legato al montaggio, non ai dati: `dati` è un oggetto nuovo a ogni poll e
    // una cleanup per-dato taglierebbe gli invii lunghi ogni pochi secondi.
    const abbandono = useRef<AbortController | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        abbandono.current = controller;
        return () => controller.abort();
    }, []);

    useEffect(() => {
        if (!dati) return;

        const idPersonaggio = dati.character.id;
        if (!idPersonaggio) return;

        const voci = vociLog(dati);
        if (voci.length === 0) return;

        const archivio = leggiArchivio(idPersonaggio);

        if (archivio === null) {
            // Baseline: tutto quello che c'è ora conta come già visto.
            const iniziale: Archivio = {};
            for (const voce of voci) iniziale[voce.id] = 0;
            salvaArchivio(idPersonaggio, iniziale);
            return;
        }

        const daInviare = voci.filter((voce) => !(voce.id in archivio));
        if (daInviare.length === 0 || invioInCorso.current) return;

        const signal = abbandono.current?.signal;
        if (signal?.aborted) return;

        invioInCorso.current = true;
        const personaggio = nomePersonaggio(dati);

        const invia = async () => {
            try {
                // Sequenziale: la bacheca assegna gli id in ordine di arrivo,
                // e il feed deve rispettare l'ordine del log.
                for (const voce of daInviare) {
                    if (signal?.aborted) return;

                    const idEvento = await pubblicaEvento({
                        timestamp: voce.timestamp ?? new Date().toISOString(),
                        messaggio: voce.testo,
                        personaggio,
                    }, signal);

                    // Salvato subito dopo la conferma: se l'invio si interrompe a
                    // metà, quello che è già partito non riparte al giro successivo.
                    archivio[voce.id] = idEvento;
                    salvaArchivio(idPersonaggio, archivio);
                    setIdPropri((precedenti) => new Set(precedenti).add(idEvento));
                }

                setErroreInvio(null);
            } catch (e: unknown) {
                if (signal?.aborted) return;
                // Le voci non ancora spedite restano fuori dall'archivio: si ritenta al prossimo poll.
                setErroreInvio(e instanceof Error ? e.message : "Errore sconosciuto durante l'invio.");
            } finally {
                invioInCorso.current = false;
            }
        };

        void invia();
    }, [dati]);

    return { idPropri, erroreInvio };
}
