import type { DmiCharacter, DmiSiglaStat, DmiTarget } from "~/types/dmi";

// shortcut: copia delle regole di `js/model/stats.js` e `js/rules.js` dell'app DMI,
// limitata a elusion/def/men; va riallineata a mano se l'app cambia le formule.

type Campi = Record<string, unknown>;

/** Come `toNumber` dell'app: tutto ciò che non è un numero vale 0. */
export function numero(valore: unknown): number {
    return Number.isFinite(Number(valore)) ? Number(valore) : 0;
}

/** Le parti della scheda che le formule leggono non hanno uno schema garantito. */
function campi(valore: unknown): Campi {
    return typeof valore === "object" && valore !== null ? (valore as Campi) : {};
}

function lista(valore: unknown): Campi[] {
    return Array.isArray(valore) ? valore.map(campi) : [];
}

/** Solo gli oggetti in `asset` sono indossati: il resto è inventario. */
function oggettiIndossati(scheda: DmiCharacter): Campi[] {
    return lista(campi(scheda.equipment).items).filter((oggetto) => oggetto.location === "asset");
}

function bonusEquipaggiamento(stat: DmiSiglaStat, scheda: DmiCharacter): number {
    let bonus = numero(campi(campi(scheda.equipment).manualBonuses)[stat]);
    // Armature e scudi non si sommano fra loro: conta il migliore di ciascun tipo.
    let armatura = 0;
    let scudo = 0;
    let magica = 0;
    let altra = 0;

    for (const oggetto of oggettiIndossati(scheda)) {
        bonus += numero(campi(oggetto.bonuses)[stat]);
        if (oggetto.defenseSource === "armor") armatura = Math.max(armatura, numero(oggetto.defenseBonus));
        else if (oggetto.defenseSource === "shield") scudo = Math.max(scudo, numero(oggetto.defenseBonus));
        else altra += numero(oggetto.defenseBonus);
        magica = Math.max(magica, numero(oggetto.magicDefense));
    }

    return stat === "DEF" ? bonus + armatura + scudo + magica + altra : bonus;
}

/** Come `statTotal` dell'app: evoluzioni ed equipaggiamento si ricalcolano, non si leggono da `stats`. */
function totaleStat(stat: DmiSiglaStat, scheda: DmiCharacter): number {
    const parti = campi(campi(scheda.stats)[stat]);
    const evoluzione = lista(scheda.evolutionHistory)
        .reduce((totale, passo) => totale + numero(campi(passo.bonuses)[stat]), 0);

    return numero(parti.base) + evoluzione + bonusEquipaggiamento(stat, scheda) + numero(parti.skill) + numero(parti.other);
}

const LIVELLO_ADDESTRAMENTO: Record<string, number> = { none: 0, lesser: 1, great: 2, perfect: 3 };
const LIVELLO_CATEGORIA: Record<string, number> = { light: 1, medium: 2, heavy: 3 };

/** Come `activeModifiers` dell'app, ridotto ai modificatori che toccano elusion/def/men. */
function modificatori(scheda: DmiCharacter) {
    const mod = { def: 0, agl: 0, intmen: 0, elusion: 0 };

    // Armature indossate senza addestramento sufficiente penalizzano agilità ed elusione.
    for (const oggetto of oggettiIndossati(scheda)) {
        if (!oggetto.trainingCategory || !oggetto.penalty) continue;
        const addestramento = LIVELLO_ADDESTRAMENTO[String(oggetto.armorTraining)] || 0;
        const richiesto = LIVELLO_CATEGORIA[String(oggetto.trainingCategory)] || 0;
        if (addestramento >= richiesto) continue;

        const fattore = addestramento === 2 && richiesto === 3 ? 0.5 : 1;
        const penalita = Math.ceil(numero(oggetto.penalty) * fattore);
        mod.agl -= penalita;
        mod.elusion -= penalita;
    }

    for (const status of lista(scheda.statuses)) {
        const effetti = campi(status.mods);
        for (const chiave of Object.keys(mod) as (keyof typeof mod)[]) mod[chiave] += numero(effetti[chiave]);
    }

    const postura = campi(scheda.actions).stance;
    if (postura === "defensive") mod.elusion += 10;
    if (postura === "total") mod.elusion += 20;

    mod.elusion += numero(campi(scheda.directModifiers).elusion);

    return mod;
}

/** I valori che un avversario deve copiare nel proprio `target` per attaccare questa scheda. */
export function valoriDifesa(scheda: DmiCharacter): DmiTarget {
    const mod = modificatori(scheda);

    return {
        elusion: 30 + Math.floor((totaleStat("AGL", scheda) + mod.agl) / 5) + mod.elusion,
        def: totaleStat("DEF", scheda) + mod.def,
        men: totaleStat("INTMEN", scheda) + mod.intmen,
    };
}
