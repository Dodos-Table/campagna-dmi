import NpcCard from "~/components/npc/NpcCard";
import { getGruppiNpc } from "~/data/npcs";
import "~/assets/css/npc.css";
import type { Route } from "../+types";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "NPCs - DMI" },
    { name: "description", content: "Sito per la campagna di DnD Dungeon Monster Isekai" },
  ];
}

export default function NpcIndex() {
    const gruppi = getGruppiNpc();

    return (
        <>
            <h1 className="title text-isekai text-center">NPC</h1>

            {gruppi.length === 0 && (
                <p className="text-center opacity-80">
                    Nessun NPC: aggiungi un file in <code>app/data/npc/</code>.
                </p>
            )}

            {gruppi.map((gruppo) => (
                <section className="npc-gruppo" key={gruppo.nome}>
                    <h2 className="npc-gruppo__titolo">{gruppo.nome}</h2>
                    <div className="npc-griglia">
                        {gruppo.npc.map((npc) => (
                            <NpcCard key={npc.id} npc={npc} />
                        ))}
                    </div>
                </section>
            ))}
        </>
    );
}
