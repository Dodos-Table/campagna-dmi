import type {
    AlberoEvolutivo,
    ArcoEvoluzione,
    BonusEvoluzione,
    NodoEvoluzioneData,
} from "~/types/evoluzioni";
import type { DmiBonuses, DmiEvolutionStep, DmiExport, DmiProfile } from "~/types/dmi";

/** Ordine di visualizzazione dei bonus, uguale a quello della scheda nell'app DMI. */
const SIGLE_BONUS: (keyof DmiBonuses)[] = ["HP", "MP", "ATK", "DEF", "AGL", "INTMEN"];

function testo(valore: unknown): string {
    return typeof valore === "string" ? valore.trim() : "";
}

/** Confronto fra nomi di evoluzione provenienti da campi diversi dello snapshot. */
function stessoNome(a: string, b: string): boolean {
    return a.toLocaleLowerCase() === b.toLocaleLowerCase();
}

export interface SchedaAttiva {
    /** Voce dell'indice profili che corrisponde ad `activeId`, se presente. */
    profilo: DmiProfile | null;
    /** `character` non è la scheda indicata da `activeId`: lo snapshot è incoerente. */
    disallineata: boolean;
}

/**
 * L'endpoint espone una sola scheda: `activeId` dice quale dovrebbe essere.
 * Se i due non combaciano i dati restano usabili, ma vanno segnalati come dubbi.
 */
export function schedaAttiva(dati: DmiExport): SchedaAttiva {
    return {
        profilo: dati.profiles.find((p) => p.id === dati.activeId) ?? null,
        disallineata: dati.character.id !== dati.activeId,
    };
}

function nomeMostro(dati: DmiExport, profilo: DmiProfile | null): string {
    return (
        testo(dati.character.identity.monsterName) ||
        testo(profilo?.monsterName) ||
        "Scheda senza nome"
    );
}

/** Riga sotto il titolo: famiglia, linea evolutiva e livello, saltando i campi vuoti. */
function sottotitolo(dati: DmiExport, profilo: DmiProfile | null): string | undefined {
    const identity = dati.character.identity;
    const giocatore = testo(identity.playerName) || testo(profilo?.playerName);
    const linea = testo(identity.evolutionLine) || testo(identity.evolutionTree);

    const pezzi = [
        giocatore,
        testo(identity.family),
        linea,
        typeof identity.level === "number" ? `Lv. ${identity.level}` : "",
    ].filter(Boolean);

    return pezzi.length > 0 ? pezzi.join(" · ") : undefined;
}

function bonusVisibili(bonuses: DmiBonuses | undefined): BonusEvoluzione[] {
    if (!bonuses) return [];

    return SIGLE_BONUS.flatMap((sigla) => {
        const valore = bonuses[sigla];
        if (typeof valore !== "number" || valore === 0) return [];
        return [{ sigla, valore: valore > 0 ? `+${valore}` : `${valore}` }];
    });
}

function quando(createdAt: string | undefined): string | undefined {
    if (!createdAt) return undefined;
    const data = new Date(createdAt);
    return Number.isNaN(data.getTime()) ? createdAt : data.toLocaleDateString("it-IT");
}

/**
 * Ordina i passi dal più vecchio al più recente.
 * Le date mancanti o non parsabili non devono riordinare nulla: l'indice fa da
 * spareggio, così quei passi restano dove li ha messi l'app.
 */
function inOrdine(storia: DmiEvolutionStep[]): DmiEvolutionStep[] {
    return storia
        .map((passo, indice) => {
            const t = passo.createdAt ? new Date(passo.createdAt).getTime() : Number.NaN;
            return { passo, indice, t: Number.isNaN(t) ? null : t };
        })
        .sort((a, b) => (a.t !== null && b.t !== null ? a.t - b.t : 0) || a.indice - b.indice)
        .map((v) => v.passo);
}

/**
 * Costruisce il percorso evolutivo del personaggio a partire da `evolutionHistory`:
 * una catena lineare di evoluzioni ottenute, chiusa dalla prossima evoluzione dichiarata.
 */
export function percorsoEvolutivo(dati: DmiExport): AlberoEvolutivo {
    const identity = dati.character.identity;
    const { profilo } = schedaAttiva(dati);

    const nodi: NodoEvoluzioneData[] = inOrdine(dati.character.evolutionHistory ?? []).map(
        (passo, indice) => ({
            // L'id deve essere univoco e stabile: ReactFlow rimonta i nodi se cambia.
            id: passo.id ?? `passo-${indice}`,
            nome: testo(passo.label) || testo(passo.nodeName) || "Evoluzione senza nome",
            tipo: "passo",
            sorgente: testo(passo.source) || undefined,
            bonus: bonusVisibili(passo.bonuses),
            quando: quando(passo.createdAt),
        }),
    );

    // Storia vuota: la scheda conosce comunque la forma corrente, meglio un nodo che niente.
    if (nodi.length === 0) {
        const forma =
            testo(identity.currentEvolution) ||
            testo(identity.evolutionStart) ||
            testo(identity.species);
        if (forma) nodi.push({ id: "attuale", nome: forma, tipo: "passo" });
    }

    const ultimo = nodi.at(-1);
    const prossima = testo(identity.nextEvolution);
    if (prossima && !(ultimo && stessoNome(ultimo.nome, prossima))) {
        nodi.push({ id: "prossimo", nome: prossima, tipo: "prossimo" });
    }

    const corrente = testo(identity.currentEvolution);
    const passi = nodi.filter((n) => n.tipo === "passo");
    const attuale =
        passi.find((n) => corrente && stessoNome(n.nome, corrente)) ?? passi.at(-1);
    if (attuale) attuale.attuale = true;

    const archi: ArcoEvoluzione[] = nodi
        .slice(1)
        .map((nodo, indice) => ({ da: nodi[indice].id, a: nodo.id }));

    return {
        id: dati.character.id,
        titolo: nomeMostro(dati, profilo),
        sottotitolo: sottotitolo(dati, profilo),
        nodi,
        archi,
    };
}
