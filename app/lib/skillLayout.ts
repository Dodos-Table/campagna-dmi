import { Graph, layout } from "@dagrejs/dagre";
import { Position, type Edge, type Node } from "@xyflow/react";
import type { Creatura, SkillLinea, SkillNodeData, SkillNodeKind } from "~/types/skill";

/** Dimensioni del riquadro per tipo di nodo. Devono combaciare con `skillTree.css`. */
export const MISURE: Record<SkillNodeKind, { width: number; height: number }> = {
    radice: { width: 220, height: 130 },
    ramo: { width: 200, height: 104 },
    foglia: { width: 180, height: 60 },
};

export type SkillFlowNodeData = SkillNodeData & {
    /** Linea effettiva, dopo l'eredità dal nodo padre. */
    linea: SkillLinea;
    hasTarget: boolean;
    hasSource: boolean;
};

export type SkillFlowNode = Node<SkillFlowNodeData, "skill">;

/** `Edge` di ReactFlow non dichiara `pathOptions`: è una proprietà dei soli archi smoothstep. */
export type SkillFlowEdge = Edge & { pathOptions?: { borderRadius?: number; offset?: number } };

export interface SkillLayout {
    nodes: SkillFlowNode[];
    edges: SkillFlowEdge[];
    width: number;
    height: number;
}

/**
 * Propaga la linea evolutiva dalla radice verso le foglie: un nodo che non la dichiara
 * eredita quella del padre, così ogni ramo colora automaticamente la propria discendenza.
 */
function ereditaLinee(creatura: Creatura): Map<string, SkillLinea> {
    const figli = new Map<string, string[]>();
    const conPadre = new Set<string>();
    for (const arco of creatura.archi) {
        const elenco = figli.get(arco.da) ?? [];
        elenco.push(arco.a);
        figli.set(arco.da, elenco);
        conPadre.add(arco.a);
    }

    const perId = new Map(creatura.nodi.map((n) => [n.id, n]));
    const linee = new Map<string, SkillLinea>();

    const coda: string[] = creatura.nodi.filter((n) => !conPadre.has(n.id)).map((n) => n.id);
    const visti = new Set<string>(coda);

    while (coda.length > 0) {
        const id = coda.shift() as string;
        const nodo = perId.get(id);
        if (!nodo) continue;

        const padre = creatura.archi.find((a) => a.a === id)?.da;
        linee.set(id, nodo.linea ?? (padre ? linee.get(padre) : undefined) ?? "neutro");

        for (const figlio of figli.get(id) ?? []) {
            if (visti.has(figlio)) continue;
            visti.add(figlio);
            coda.push(figlio);
        }
    }

    // Nodi orfani non raggiunti dalla visita (dati incompleti): fallback neutro.
    for (const nodo of creatura.nodi) {
        if (!linee.has(nodo.id)) linee.set(nodo.id, nodo.linea ?? "neutro");
    }

    return linee;
}

/** Calcola posizioni e dimensioni dell'albero con dagre, da sinistra verso destra. */
export function layoutCreatura(creatura: Creatura): SkillLayout {
    const linee = ereditaLinee(creatura);
    const noteValide = new Set(creatura.nodi.map((n) => n.id));
    const archi = creatura.archi.filter((a) => noteValide.has(a.da) && noteValide.has(a.a));

    const conPadre = new Set(archi.map((a) => a.a));
    const conFigli = new Set(archi.map((a) => a.da));

    const g = new Graph();
    g.setGraph({ rankdir: "LR", nodesep: 26, ranksep: 90, marginx: 48, marginy: 48 });
    g.setDefaultEdgeLabel(() => ({}));

    for (const nodo of creatura.nodi) {
        // Copia per nodo: dagre scrive x/y dentro l'etichetta che riceve, quindi passare
        // direttamente l'oggetto di MISURE farebbe collassare tutti i nodi dello stesso
        // tipo sulla stessa posizione.
        g.setNode(nodo.id, { ...MISURE[nodo.tipo] });
    }
    for (const arco of archi) {
        g.setEdge(arco.da, arco.a);
    }

    layout(g);

    const dimensioni = g.graph();
    const larghezza = Math.ceil(dimensioni.width ?? 0);
    const altezza = Math.ceil(dimensioni.height ?? 0);

    const nodes: SkillFlowNode[] = creatura.nodi.map((nodo) => {
        const misura = MISURE[nodo.tipo];
        const posizionato = g.node(nodo.id);
        // dagre restituisce il centro del nodo, ReactFlow vuole l'angolo in alto a sinistra.
        const x = (posizionato?.x ?? 0) - misura.width / 2;
        // Specchio verticale: con rankdir "LR" dagre traspone gli assi e restituisce i fratelli
        // in ordine inverso rispetto a come sono stati inseriti. Ribaltando la y attorno
        // all'altezza del grafo l'albero torna nell'ordine di dichiarazione del JSON.
        const y = altezza - (posizionato?.y ?? 0) - misura.height / 2;

        return {
            id: nodo.id,
            type: "skill",
            position: { x, y },
            width: misura.width,
            height: misura.height,
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
            draggable: false,
            selectable: false,
            connectable: false,
            data: {
                ...nodo,
                linea: linee.get(nodo.id) ?? "neutro",
                hasTarget: conPadre.has(nodo.id),
                hasSource: conFigli.has(nodo.id),
            },
        };
    });

    const edges: SkillFlowEdge[] = archi.map((arco) => {
        const linea = linee.get(arco.a) ?? "neutro";
        return {
            id: `${arco.da}--${arco.a}`,
            source: arco.da,
            target: arco.a,
            type: "smoothstep",
            pathOptions: { borderRadius: 2 },
            animated: false,
            focusable: false,
            selectable: false,
            className: `skill-edge skill-edge--${linea}`,
        };
    });

    return {
        nodes,
        edges,
        width: larghezza,
        height: altezza,
    };
}
