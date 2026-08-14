import { Handle, Position, type NodeProps } from "@xyflow/react";
import IconaEvoluzione from "~/components/evoluzioni/IconaEvoluzione";
import type { EvoFlowNode } from "~/lib/evoluzioniLayout";

/** Nodo custom del percorso evolutivo, registrato in `AlberoEvoluzioni` come tipo "evoluzione". */
export default function NodoEvoluzione(prop: Readonly<NodeProps<EvoFlowNode>>) {
    const dati = prop.data;

    return (
        <div
            className={`evo-node evo-node--${dati.tipo}${dati.attuale ? " evo-node--attuale" : ""}`}
            title={dati.descrizione}
        >
            {dati.hasTarget && (
                <Handle type="target" position={Position.Left} isConnectable={false} />
            )}

            {dati.attuale && (
                <span className="evo-node__badge" title="Forma attuale">
                    attuale
                </span>
            )}

            <div className="evo-node__testa">
                <IconaEvoluzione src={dati.icon} nome={dati.nome} />
                <span className="evo-node__nome">{dati.nome}</span>
            </div>

            {dati.sorgente && <span className="evo-node__sorgente">{dati.sorgente}</span>}

            {dati.bonus && dati.bonus.length > 0 && (
                <ul className="evo-node__bonus">
                    {dati.bonus.map((b) => (
                        <li key={b.sigla}>
                            {b.sigla} <strong>{b.valore}</strong>
                        </li>
                    ))}
                </ul>
            )}

            {dati.quando && <span className="evo-node__quando">{dati.quando}</span>}

            {dati.tipo === "prossimo" && (
                <span className="evo-node__etichetta">prossima evoluzione</span>
            )}

            {dati.hasSource && (
                <Handle type="source" position={Position.Right} isConnectable={false} />
            )}
        </div>
    );
}
