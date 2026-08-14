import { Graph, layout } from "@dagrejs/dagre";
import { Position, type Edge, type Node } from "@xyflow/react";
import type { AlberoEvolutivo, NodoEvoluzioneData, TipoNodo } from "~/types/evoluzioni";

/** Larghezza del riquadro per tipo di nodo. Deve combaciare con `evoluzioni.css`. */
export const LARGHEZZE: Record<TipoNodo, number> = {
    passo: 250,
    prossimo: 210,
};

/**
 * Misure tipografiche stimate a partire da `evoluzioni.css`: ReactFlow vuole l'altezza
 * del nodo prima di renderizzarlo, quindi va calcolata dal contenuto invece che misurata.
 * Le stime sono volutamente generose: meglio un po' d'aria che testo tagliato.
 */
const RIGA_NOME = 23; // 1.2rem con line-height 1.2
const RIGA_SORGENTE = 16; // 0.8rem
const RIGA_BONUS = 24; // chip + spaziatura verticale
const ALTEZZA_ICONA = 36;
const ALTEZZA_DATA = 17;
const ALTEZZA_ETICHETTA = 15;
const ALTEZZA_BADGE = 18;
const SPAZIO = 6; // `gap` fra i blocchi del nodo
const BORDI = 24; // padding verticale + bordo + margine di sicurezza

/** Caratteri che stanno su una riga, per blocco. Larghezza utile ≈ larghezza nodo − padding. */
function righe(testo: string, perRiga: number, massimo: number): number {
    return Math.min(Math.max(1, Math.ceil(testo.length / perRiga)), massimo);
}

/** L'icona affianca il nome, quindi la testa del nodo è alta quanto il più alto dei due. */
function altezzaTesta(nome: string): number {
    return Math.max(ALTEZZA_ICONA, righe(nome, 20, 3) * RIGA_NOME);
}

/** I chip dei bonus vanno a capo: la larghezza di ognuno dipende da sigla e valore. */
function altezzaBonus(nodo: NodoEvoluzioneData): number {
    if (!nodo.bonus || nodo.bonus.length === 0) return 0;
    const larghezza = nodo.bonus.reduce(
        (somma, b) => somma + 22 + 6.4 * (b.sigla.length + b.valore.length + 1),
        0,
    );
    return SPAZIO + Math.ceil(larghezza / 200) * RIGA_BONUS;
}

function altezzaNodo(nodo: NodoEvoluzioneData): number {
    let altezza = BORDI + altezzaTesta(nodo.nome);

    if (nodo.attuale) altezza += ALTEZZA_BADGE + SPAZIO;
    if (nodo.sorgente) altezza += SPAZIO + righe(nodo.sorgente, 36, 3) * RIGA_SORGENTE;
    altezza += altezzaBonus(nodo);
    if (nodo.quando) altezza += SPAZIO + ALTEZZA_DATA;
    if (nodo.tipo === "prossimo") altezza += SPAZIO + ALTEZZA_ETICHETTA;

    return altezza;
}

/**
 * I riquadri di un percorso sono tutti uguali: l'altezza è quella del nodo più esigente,
 * così le schede restano allineate invece di ballare in verticale.
 */
export function misureUniformi(albero: AlberoEvolutivo): Record<TipoNodo, number> {
    const altezzaPer = (tipo: TipoNodo) =>
        albero.nodi.filter((n) => n.tipo === tipo).map(altezzaNodo);

    return {
        passo: Math.max(0, ...altezzaPer("passo")),
        prossimo: Math.max(0, ...altezzaPer("prossimo")),
    };
}

export type EvoFlowNodeData = NodoEvoluzioneData & {
    hasTarget: boolean;
    hasSource: boolean;
};

export type EvoFlowNode = Node<EvoFlowNodeData, "evoluzione">;

/** `Edge` di ReactFlow non dichiara `pathOptions`: è una proprietà dei soli archi smoothstep. */
export type EvoFlowEdge = Edge & { pathOptions?: { borderRadius?: number; offset?: number } };

export interface PercorsoLayout {
    nodes: EvoFlowNode[];
    edges: EvoFlowEdge[];
    width: number;
    height: number;
}

/** Calcola posizioni e dimensioni del percorso con dagre, da sinistra verso destra. */
export function layoutPercorso(albero: AlberoEvolutivo): PercorsoLayout {
    const notiValidi = new Set(albero.nodi.map((n) => n.id));
    const archi = albero.archi.filter((a) => notiValidi.has(a.da) && notiValidi.has(a.a));

    const conPadre = new Set(archi.map((a) => a.a));
    const conFigli = new Set(archi.map((a) => a.da));
    const perId = new Map(albero.nodi.map((n) => [n.id, n]));
    const altezze = misureUniformi(albero);
    const misura = (tipo: TipoNodo) => ({ width: LARGHEZZE[tipo], height: altezze[tipo] });

    const g = new Graph();
    g.setGraph({ rankdir: "LR", nodesep: 26, ranksep: 90, marginx: 48, marginy: 48 });
    g.setDefaultEdgeLabel(() => ({}));

    for (const nodo of albero.nodi) {
        // Oggetto nuovo per nodo: dagre scrive x/y dentro l'etichetta che riceve, quindi
        // riusarne uno solo farebbe collassare tutti i nodi sulla stessa posizione.
        g.setNode(nodo.id, misura(nodo.tipo));
    }
    for (const arco of archi) {
        g.setEdge(arco.da, arco.a);
    }

    layout(g);

    const dimensioni = g.graph();
    const larghezza = Math.ceil(dimensioni.width ?? 0);
    const altezza = Math.ceil(dimensioni.height ?? 0);

    const nodes: EvoFlowNode[] = albero.nodi.map((nodo) => {
        const { width, height } = misura(nodo.tipo);
        const posizionato = g.node(nodo.id);
        // dagre restituisce il centro del nodo, ReactFlow vuole l'angolo in alto a sinistra.
        const x = (posizionato?.x ?? 0) - width / 2;
        const y = (posizionato?.y ?? 0) - height / 2;

        return {
            id: nodo.id,
            type: "evoluzione",
            position: { x, y },
            width,
            height,
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
            draggable: false,
            selectable: false,
            connectable: false,
            data: {
                ...nodo,
                hasTarget: conPadre.has(nodo.id),
                hasSource: conFigli.has(nodo.id),
            },
        };
    });

    const edges: EvoFlowEdge[] = archi.map((arco) => {
        const futuro = perId.get(arco.a)?.tipo === "prossimo";
        return {
            id: `${arco.da}--${arco.a}`,
            source: arco.da,
            target: arco.a,
            type: "smoothstep",
            pathOptions: { borderRadius: 2 },
            animated: false,
            focusable: false,
            selectable: false,
            className: futuro ? "evo-edge evo-edge--futuro" : "evo-edge",
        };
    });

    return {
        nodes,
        edges,
        width: larghezza,
        height: altezza,
    };
}
