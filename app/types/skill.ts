// Tipi del catalogo skill (`app/data/skills.json`).
// Il tipo non è inferito dal JSON: le voci hanno forme eterogenee (campi opzionali,
// `page` a volte stringa, chiavi di `variants` diverse) e l'unione risultante
// renderebbe impossibile leggere `skill.variants[grado]`.

/**
 * Scheda della skill al singolo grado. `effect` e `mp` ci sono sempre;
 * `range`, `duration` e `damageBase` sono override: se assenti vale il campo
 * omonimo di primo livello della skill.
 */
export interface SkillVariant {
    effect: string;
    mp: number;
    range?: string;
    duration?: string;
    damageBase?: number;
}

export interface Skill {
    key: string;
    name: string;
    section: string;
    category: string;
    /** Assente su alcune voci del catalogo. */
    categoryTags?: string;
    grades: string[];
    /** Di norma un numero, ma una voce riporta un intervallo ("1–2"). */
    page: number | string;
    source: string;
    role: string;
    action: string;
    roll: string;
    mp: number;
    element: string;
    save: string;
    target: string;
    range: string;
    duration: string;
    damageBase: number;
    modifier: number;
    summary: string;
    requirements: string;
    notes: string;
    /** Chiavi osservate: Lesser, Great, Greater, Perfect, Unico, Base. */
    variants: Record<string, SkillVariant>;
    effect?: string;
    repeatable?: boolean;
    maxAcquisitions?: number;
}
