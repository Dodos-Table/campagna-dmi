export type SkillNodeKind = "radice" | "ramo" | "foglia";

export type SkillLinea = "acido" | "supporto" | "metallo" | "reale" | "neutro";

// `type` e non `interface`: ReactFlow v12 vincola i dati dei nodi a `Record<string, unknown>`,
// e solo gli alias di tipo ricevono l'index signature implicita che soddisfa quel vincolo.
export type SkillNodeData = {
    id: string;
    nome: string;
    tipo: SkillNodeKind;
    /** Se assente viene ereditata dal nodo padre: determina il colore di nodo e arco. */
    linea?: SkillLinea;
    /** Path pubblico dell'icona, es. "/img/skill/slime/acid-slime.png". Se assente si usa il placeholder. */
    icon?: string;
    /** Evoluzione finale di una linea: nel riferimento è marcata con la corona. */
    boss?: boolean;
    descrizione?: string;
};

export interface SkillArco {
    da: string;
    a: string;
}

export interface Creatura {
    /** Slug usato nell'URL: /skill/<id> */
    id: string;
    numero: number;
    nome: string;
    sottotitolo?: string;
    nodi: SkillNodeData[];
    archi: SkillArco[];
}

export interface SkillData {
    creature: Creatura[];
}
