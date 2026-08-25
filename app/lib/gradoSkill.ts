import type { DmiIdentity } from "~/types/dmi";
import type { Skill, SkillVariant } from "~/types/skill";

/**
 * Gradi usati come chiavi di `skill.variants`.
 * `Great` e `Greater` sono due grafie dello stesso gradino intermedio: il
 * catalogo usa la prima in alcune sezioni e la seconda in altre.
 * `Unico` e `Base` sono gradi isolati, propri delle skill a variante singola.
 */
export type GradoSkill = "Base" | "Lesser" | "Great" | "Greater" | "Perfect" | "Unico";

/** Dal più basso al più alto. Serve a ordinare i tab e a scegliere il ripiego. */
export const ORDINE_GRADI: GradoSkill[] = ["Base", "Lesser", "Great", "Greater", "Perfect", "Unico"];

/** Rango di progressione: `Great` e `Greater` condividono lo stesso gradino. */
const RANGO: Record<GradoSkill, number> = {
    Base: 0,
    Lesser: 1,
    Great: 2,
    Greater: 2,
    Perfect: 3,
    // Fuori scala: una skill Unico non ha gradi con cui confrontarsi.
    Unico: -1,
};

/** Tier numerici, nel caso l'app esponga il grado come 1/2/3. */
const DA_NUMERO: Record<number, GradoSkill> = { 1: "Lesser", 2: "Greater", 3: "Perfect" };

export function normalizzaGrado(valore: unknown): GradoSkill | null {
    if (typeof valore === "number") {
        return DA_NUMERO[valore] ?? null;
    }

    if (typeof valore !== "string") return null;

    switch (valore.trim().toLowerCase()) {
        case "base":
            return "Base";
        case "lesser":
            return "Lesser";
        case "great":
            return "Great";
        case "greater":
            return "Greater";
        case "perfect":
            return "Perfect";
        case "unico":
        case "unique":
            return "Unico";
        default:
            return null;
    }
}

/** Un grado dichiarato nel tier vale come raggiunto se non è marcato come vuoto/spento. */
function raggiunto(valore: unknown): boolean {
    if (valore === false || valore === null || valore === undefined) return false;
    if (typeof valore === "number") return valore !== 0;
    if (typeof valore === "string") return valore.trim() !== "";
    return true;
}

/**
 * Grado evolutivo del personaggio letto da `identity.evolutionTier`.
 *
 * Il doc del bridge non descrive il campo: negli export osservati è un oggetto
 * con una chiave per grado, ma non sappiamo quale valore marchi quello attivo.
 * Prendiamo quindi il grado più alto fra quelli raggiunti, accettando anche le
 * forme più semplici (stringa o numero) nel caso l'app cambi formato.
 * `null` = nessun grado ricavabile, la scheda non è collegata o il formato è ignoto.
 */
export function gradoDaIdentity(identity: DmiIdentity | undefined): GradoSkill | null {
    const tier = identity?.evolutionTier;
    if (tier === null || tier === undefined) return null;

    if (typeof tier === "string" || typeof tier === "number") {
        return normalizzaGrado(tier);
    }

    if (typeof tier !== "object") return null;

    let migliore: GradoSkill | null = null;
    for (const [chiave, valore] of Object.entries(tier as Record<string, unknown>)) {
        const grado = normalizzaGrado(chiave);
        if (!grado || !raggiunto(valore)) continue;
        if (!migliore || ORDINE_GRADI.indexOf(grado) > ORDINE_GRADI.indexOf(migliore)) {
            migliore = grado;
        }
    }

    return migliore;
}

export interface VarianteSkill {
    /** Chiave originale di `skill.variants`: normalmente un `GradoSkill`. */
    grado: string;
    variante: SkillVariant;
}

/** Le varianti dalla più bassa alla più alta; le chiavi ignote restano in coda. */
export function variantiOrdinate(skill: Skill): VarianteSkill[] {
    const voci = Object.entries(skill.variants).map(([grado, variante]) => ({ grado, variante }));

    return voci.sort((a, b) => {
        const posA = ORDINE_GRADI.indexOf(normalizzaGrado(a.grado) as GradoSkill);
        const posB = ORDINE_GRADI.indexOf(normalizzaGrado(b.grado) as GradoSkill);
        if (posA === -1 && posB === -1) return 0;
        if (posA === -1) return 1;
        if (posB === -1) return -1;
        return posA - posB;
    });
}

/**
 * Grado da mostrare per primo: quello del personaggio se la skill ce l'ha,
 * altrimenti il più alto fra quelli che il personaggio ha già superato.
 * Senza scheda collegata (o per le skill a variante singola) si parte dal primo.
 */
export function risolviGrado(skill: Skill, gradoPersonaggio: GradoSkill | null): string {
    const voci = variantiOrdinate(skill);
    if (voci.length === 0) return "";

    const primo = voci[0].grado;
    if (!gradoPersonaggio) return primo;

    const rangoPersonaggio = RANGO[gradoPersonaggio];
    if (rangoPersonaggio < 0) return primo;

    let ripiego: string | null = null;
    let rangoRipiego = -1;

    for (const voce of voci) {
        const grado = normalizzaGrado(voce.grado);
        if (!grado) continue;

        const rango = RANGO[grado];
        if (rango === rangoPersonaggio) return voce.grado;
        if (rango >= 0 && rango < rangoPersonaggio && rango > rangoRipiego) {
            ripiego = voce.grado;
            rangoRipiego = rango;
        }
    }

    return ripiego ?? primo;
}

/** Vero se il grado della skill corrisponde a quello del personaggio (Great ≡ Greater). */
export function corrispondeAlPersonaggio(grado: string, gradoPersonaggio: GradoSkill | null): boolean {
    if (!gradoPersonaggio) return false;
    const normalizzato = normalizzaGrado(grado);
    if (!normalizzato) return false;
    const rango = RANGO[normalizzato];
    return rango >= 0 && rango === RANGO[gradoPersonaggio];
}

export interface CampiSkill {
    effect: string;
    mp: number;
    range: string;
    duration: string;
    damageBase: number;
}

/** Campi della skill al grado indicato: la variante sovrascrive il valore generale. */
export function campiVariante(skill: Skill, grado: string): CampiSkill {
    const variante = skill.variants[grado];

    return {
        effect: variante?.effect ?? skill.effect ?? "",
        mp: variante?.mp ?? skill.mp,
        range: variante?.range ?? skill.range,
        duration: variante?.duration ?? skill.duration,
        damageBase: variante?.damageBase ?? skill.damageBase,
    };
}
