import { useState } from "react";

interface IconaEvoluzioneProp {
    src?: string;
    nome: string;
}

/**
 * Icona di un nodo del percorso evolutivo.
 * Se `src` manca o l'immagine non carica, mostra un segnaposto con l'iniziale del nome.
 */
export default function IconaEvoluzione(prop: Readonly<IconaEvoluzioneProp>) {
    const [rotta, setRotta] = useState(false);

    if (!prop.src || rotta) {
        return (
            <span className="evo-icon evo-icon--fallback" aria-hidden="true">
                {prop.nome.charAt(0).toUpperCase()}
            </span>
        );
    }

    // I path delle icone sono assoluti (`/img/...`) ma il sito vive sotto un base path:
    // Vite non può riscrivere una stringa costruita a runtime, quindi lo prefissiamo qui.
    const src = prop.src.startsWith("/")
        ? import.meta.env.BASE_URL + prop.src.slice(1)
        : prop.src;

    return (
        <img
            className="evo-icon"
            src={src}
            alt=""
            aria-hidden="true"
            draggable={false}
            onError={() => setRotta(true)}
        />
    );
}
