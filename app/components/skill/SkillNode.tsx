import { Handle, Position, type NodeProps } from "@xyflow/react";
import SkillIcon from "~/components/skill/SkillIcon";
import type { SkillFlowNode } from "~/lib/skillLayout";

/** Nodo custom dell'albero evolutivo, registrato in `SkillTree` come tipo "skill". */
export default function SkillNode(prop: Readonly<NodeProps<SkillFlowNode>>) {
    const dati = prop.data;

    return (
        <div
            className={`skill-node skill-node--${dati.tipo} skill-node--${dati.linea}${
                dati.boss ? " skill-node--boss" : ""
            }`}
            title={dati.descrizione}
        >
            {dati.hasTarget && (
                <Handle type="target" position={Position.Left} isConnectable={false} />
            )}

            <SkillIcon src={dati.icon} nome={dati.nome} />
            <span className="skill-node__nome">{dati.nome}</span>

            {dati.boss && (
                <span className="skill-node__corona" title="Boss" aria-label="Boss">
                    ♛
                </span>
            )}

            {dati.hasSource && (
                <Handle type="source" position={Position.Right} isConnectable={false} />
            )}
        </div>
    );
}
