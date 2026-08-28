import { Link, data } from "react-router";
import type { Route } from "./+types/npc";
import NpcRitratto from "~/components/npc/NpcRitratto";
import { getNpc } from "~/data/npc-loader";
import "~/assets/css/npc.css";

export function meta({ params }: Route.MetaArgs) {
    const npc = getNpc(params.id);
    let text = npc ? `NPC ${npc.nome}` : "NPC non trovato"

    return [
    { title: `${text} - DMI` },
    { name: "description", content: "Sito per la campagna di DnD Dungeon Monster Isekai" },
  ];
}

export function clientLoader({ params }: Route.ClientLoaderArgs) {
    const npc = getNpc(params.id);
    if (!npc) throw data("NPC non trovato", { status: 404 });
    return npc;
}

/** Scheda comune a tutti gli NPC. */
export default function NpcPage({ loaderData }: Route.ComponentProps) {
    return (
        <article className="npc-scheda">
            <header className="npc-scheda__testata">
                <NpcRitratto
                    src={loaderData.ritratto}
                    nome={loaderData.nome}
                    dimensione="scheda"
                />
                <div>
                    <h1 className="title text-isekai">{loaderData.nome}</h1>
                    {loaderData.epiteto && (
                        <p className="npc-scheda__epiteto">{loaderData.epiteto}</p>
                    )}
                    <p className="npc-scheda__gruppo">{loaderData.gruppo}</p>
                </div>
            </header>

            <p className="npc-scheda__descrizione">{loaderData.descrizione}</p>

            <div className="text-center mt-6">
                <Link className="link" to="/npc">
                    Torna agli NPC
                </Link>
            </div>
        </article>
    );
}
