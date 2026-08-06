import { useState } from "react";
import "~/assets/css/npc.css";

interface NpcRitrattoProp {
    src?: string;
    nome: string;
    /** "card" nella griglia dell'indice, "scheda" nella pagina del singolo NPC. */
    dimensione: "card" | "scheda";
}

/**
 * Ritratto di un NPC.
 * Se `src` manca o l'immagine non carica, mostra un segnaposto con l'iniziale del nome.
 */
export default function NpcRitratto(prop: Readonly<NpcRitrattoProp>) {
    const [rotta, setRotta] = useState(false);
    const classe = `npc-ritratto npc-ritratto--${prop.dimensione}`;

    if (!prop.src || rotta) {
        return (
            <span className={`${classe} npc-ritratto--fallback`} aria-hidden="true">
                {prop.nome.charAt(0).toUpperCase()}
            </span>
        );
    }

    // Nessun prefisso del base path: `src` arriva da un import di modulo, già riscritto da Vite.
    return (
        <img
            className={classe}
            src={prop.src}
            alt={`Ritratto di ${prop.nome}`}
            draggable={false}
            onError={() => setRotta(true)}
        />
    );
}
