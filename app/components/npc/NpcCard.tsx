import { Link } from "react-router";
import NpcRitratto from "~/components/npc/NpcRitratto";
import type { Npc } from "~/types/npc";
import "~/assets/css/npc.css";

interface NpcCardProp {
    npc: Npc;
}

/** Riquadro dell'indice: porta alla scheda completa dell'NPC. */
export default function NpcCard(prop: Readonly<NpcCardProp>) {
    return (
        <Link className="npc-card" to={`/npc/${prop.npc.id}`}>
            <NpcRitratto
                src={prop.npc.ritratto}
                nome={prop.npc.nome}
                dimensione="card"
            />
            <div className="npc-card__testo">
                <span className="npc-card__nome">{prop.npc.nome}</span>
                {prop.npc.epiteto && (
                    <span className="npc-card__epiteto">{prop.npc.epiteto}</span>
                )}
            </div>
        </Link>
    );
}
