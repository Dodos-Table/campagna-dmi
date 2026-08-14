/** `passo` = evoluzione già ottenuta, `prossimo` = quella dichiarata come successiva. */
export type TipoNodo = "passo" | "prossimo";

/** Bonus di un'evoluzione già formattato per la vista, es. `{ sigla: "ATK", valore: "+5" }`. */
export interface BonusEvoluzione {
    sigla: string;
    valore: string;
}

// `type` e non `interface`: ReactFlow v12 vincola i dati dei nodi a `Record<string, unknown>`,
// e solo gli alias di tipo ricevono l'index signature implicita che soddisfa quel vincolo.
export type NodoEvoluzioneData = {
    id: string;
    nome: string;
    tipo: TipoNodo;
    /** Path pubblico dell'icona, es. "/img/evoluzioni/lesser-wolf.png". Se assente si usa il placeholder. */
    icon?: string;
    /** Forma attuale del personaggio: evidenziata nel grafo. */
    attuale?: boolean;
    /** Come è stata ottenuta l'evoluzione, es. "Impronta Lesser". */
    sorgente?: string;
    bonus?: BonusEvoluzione[];
    /** Data del passo, già formattata per la vista. */
    quando?: string;
    descrizione?: string;
};

export interface ArcoEvoluzione {
    da: string;
    a: string;
}

/** Percorso evolutivo di un personaggio, pronto per il layout orizzontale. */
export interface AlberoEvolutivo {
    id: string;
    titolo: string;
    sottotitolo?: string;
    nodi: NodoEvoluzioneData[];
    archi: ArcoEvoluzione[];
}
