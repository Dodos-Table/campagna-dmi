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

    // I path in `skill-tree.json` sono assoluti (`/img/...`) ma il sito vive sotto un base path:
    // Vite non può riscrivere una stringa costruita a runtime, quindi lo prefissiamo qui.
    const src = prop.src.startsWith("/")
        ? import.meta.env.BASE_URL + prop.src.slice(1)
        : prop.src;

    return (
        <img
            className="skill-icon"
            src={src}
            alt=""
            aria-hidden="true"
            draggable={false}
            onError={() => setRotta(true)}
        />
    );
}
