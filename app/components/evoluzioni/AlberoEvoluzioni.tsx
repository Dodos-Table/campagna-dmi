import { useMemo } from "react";
import { ReactFlow, type NodeTypes } from "@xyflow/react";
import NodoEvoluzione from "~/components/evoluzioni/NodoEvoluzione";
import { layoutPercorso } from "~/lib/evoluzioniLayout";
import type { AlberoEvolutivo } from "~/types/evoluzioni";
import "~/assets/css/evoluzioni.css";

// Fuori dal componente: un oggetto nuovo ad ogni render farebbe rimontare tutti i nodi.
const nodeTypes: NodeTypes = { evoluzione: NodoEvoluzione };

interface AlberoEvoluzioniProp {
    albero: AlberoEvolutivo;
}

/**
 * Percorso evolutivo orizzontale. Il canvas è largo quanto il grafo calcolato da dagre
 * e si naviga con lo scroll della pagina: pan e zoom di ReactFlow sono disattivati.
 */
export default function AlberoEvoluzioni(prop: Readonly<AlberoEvoluzioniProp>) {
    const grafo = useMemo(() => layoutPercorso(prop.albero), [prop.albero]);

    return (
        <div className="evo-scroll">
            <div className="evo-canvas" style={{ width: grafo.width, height: grafo.height }}>
                <ReactFlow
                    nodes={grafo.nodes}
                    edges={grafo.edges}
                    nodeTypes={nodeTypes}
                    defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                    minZoom={1}
                    maxZoom={1}
                    fitView={false}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    nodesFocusable={false}
                    edgesFocusable={false}
                    elementsSelectable={false}
                    panOnDrag={false}
                    panOnScroll={false}
                    zoomOnScroll={false}
                    zoomOnPinch={false}
                    zoomOnDoubleClick={false}
                    /* Lascia passare la rotella alla pagina invece di intercettarla per lo zoom. */
                    preventScrolling={false}
                    proOptions={{ hideAttribution: false }}
                />
            </div>
        </div>
    );
}
