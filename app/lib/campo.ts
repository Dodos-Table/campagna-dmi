import { apriEnvelope } from "~/lib/attivitaHosting";
import { numero, valoriDifesa } from "~/lib/statsDmi";
import type { EventoCampo, SchedaCampo } from "~/types/campo";
import type { DmiCharacter } from "~/types/dmi";

/** Le schede del GM sono schede normali: le distingue solo la scritta nel nome. */
export function isGm(nome: string): boolean {
    return nome.includes("GM");
}

/**
 * Da campi grezzi a evento campo. La bacheca è pubblica, quindi ogni campo va
 * ricontrollato; la stessa pulizia vale per le schede locali, così le due firme
 * sono confrontabili (altrimenti una differenza di forma farebbe ripubblicare a ogni poll).
 */
function eventoCampo(campi: Record<string, unknown>): EventoCampo | null {
    if (campi.tipo !== "campo" || typeof campi.schedaId !== "string" || !campi.schedaId) return null;

    return {
        tipo: "campo",
        schedaId: campi.schedaId,
        inField: campi.inField === true,
        nome: typeof campi.nome === "string" && campi.nome ? campi.nome : "Scheda senza nome",
        // Solo immagini inline: un URL qualsiasi farebbe caricare risorse esterne a tutti.
        portrait: typeof campi.portrait === "string" && campi.portrait.startsWith("data:image/") ? campi.portrait : "",
        elusion: numero(campi.elusion),
        def: numero(campi.def),
        men: numero(campi.men),
    };
}

/** Normalizzatore del feed per la pagina Campo: tiene solo gli eventi campo. */
export function normalizzaCampo(grezzo: unknown): SchedaCampo | null {
    const envelope = apriEnvelope(grezzo);
    if (!envelope || typeof envelope.payload !== "object" || envelope.payload === null) return null;

    const evento = eventoCampo(envelope.payload as Record<string, unknown>);
    return evento && { ...evento, id: envelope.id };
}

/** Il messaggio che una scheda locale pubblicherebbe ora. */
export function eventoDaScheda(scheda: DmiCharacter): EventoCampo | null {
    return eventoCampo({
        tipo: "campo",
        schedaId: scheda.id,
        inField: scheda.inField,
        nome: scheda.identity?.monsterName,
        portrait: scheda.portrait,
        ...valoriDifesa(scheda),
    });
}

/** Quello che gli altri vedono di una scheda: se non cambia, non serve ripubblicarla. */
export function firma(evento: EventoCampo): string {
    return JSON.stringify([evento.inField, evento.nome, evento.portrait, evento.elusion, evento.def, evento.men]);
}

/** Di ogni scheda vale solo l'ultimo messaggio arrivato. */
export function statoCampo(eventi: SchedaCampo[]): Map<string, SchedaCampo> {
    const stato = new Map<string, SchedaCampo>();
    for (const evento of eventi) {
        const precedente = stato.get(evento.schedaId);
        if (!precedente || precedente.id < evento.id) stato.set(evento.schedaId, evento);
    }
    return stato;
}
