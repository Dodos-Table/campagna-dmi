import { useMemo } from "react";
import { ReactFlow, type NodeTypes } from "@xyflow/react";
import SkillNode from "~/components/skill/SkillNode";
import { layoutCreatura } from "~/lib/skillLayout";
import type { Creatura } from "~/types/skill";
import "~/assets/css/skillTree.css";

// Fuori dal componente: un oggetto nuovo ad ogni render farebbe rimontare tutti i nodi.
const nodeTypes: NodeTypes = { skill: SkillNode };

interface SkillTreeProp {
    creatura: Creatura;
}

/**
 * Albero evolutivo orizzontale. Il canvas è largo quanto il grafo calcolato da dagre
 * e si naviga con lo scroll della pagina: pan e zoom di ReactFlow sono disattivati.
 */
export default function SkillTree(prop: Readonly<SkillTreeProp>) {
    const grafo = useMemo(() => layoutCreatura(prop.creatura), [prop.creatura]);

    return (
        <div className="skill-scroll">
            <div className="skill-canvas" style={{ width: grafo.width, height: grafo.height }}>
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
