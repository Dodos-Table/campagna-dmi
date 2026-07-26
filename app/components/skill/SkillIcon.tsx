import { useState } from "react";

interface SkillIconProp {
    src?: string;
    nome: string;
}

/**
 * Icona di un nodo dell'albero evolutivo.
 * Se `src` manca o l'immagine non carica, mostra un segnaposto con l'iniziale del nome.
 */
export default function SkillIcon(prop: Readonly<SkillIconProp>) {
    const [rotta, setRotta] = useState(false);

    if (!prop.src || rotta) {
        return (
            <span className="skill-icon skill-icon--fallback" aria-hidden="true">
                {prop.nome.charAt(0).toUpperCase()}
            </span>
        );
    }

    return (
        <img
            className="skill-icon"
            src={prop.src}
            alt=""
            aria-hidden="true"
            draggable={false}
            onError={() => setRotta(true)}
        />
    );
}
