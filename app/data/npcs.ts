import { Npc } from "~/types/npc";

/** Gruppo attribuito agli NPC che stanno nella root di `app/data/npc/`. */
const SENZA_CATEGORIA = "Senza categoria";

export interface GruppoNpc {
    nome: string;
    npc: Npc[];
}

// `Npc` è importata come valore e non con `import type`: serve a runtime per l'`instanceof`.
type ModuloNpc = { default?: new () => Npc };

// Vite risolve la glob a build time: aggiungere un file dentro `app/data/npc/`
// basta a farlo comparire nel sito, senza toccare questo file.
const moduli = import.meta.glob<ModuloNpc>("./npc/**/*.ts", { eager: true });

/** "culto-oscuro" -> "Culto oscuro". */
function etichettaGruppo(cartella: string): string {
    const testo = cartella.replaceAll("-", " ").replaceAll("_", " ");
    return testo.charAt(0).toUpperCase() + testo.slice(1);
}

/**
 * Da "./npc/cattivi/lord-vex.ts" ricava id ("lord-vex") e gruppo ("Cattivi").
 * Le cartelle annidate diventano un gruppo unico: "cattivi/culto" -> "Cattivi / Culto".
 */
function analizzaPath(path: string): { id: string; gruppo: string } {
    const segmenti = path.replace(/^\.\/npc\//, "").replace(/\.ts$/, "").split("/");
    const id = segmenti.pop()!;
    const gruppo = segmenti.length
        ? segmenti.map(etichettaGruppo).join(" / ")
        : SENZA_CATEGORIA;
    return { id, gruppo };
}

function caricaNpc(): Npc[] {
    const npc: Npc[] = [];
    const visti = new Set<string>();

    for (const [path, modulo] of Object.entries(moduli)) {
        const Classe = modulo.default;
        if (!Classe) {
            console.warn(`[npc] ${path}: manca l'export default della classe, ignorato.`);
            continue;
        }

        const istanza = new Classe();
        if (!(istanza instanceof Npc)) {
            console.warn(`[npc] ${path}: la classe non estende Npc, ignorato.`);
            continue;
        }

        const { id, gruppo } = analizzaPath(path);
        if (visti.has(id)) {
            console.warn(`[npc] ${path}: esiste già un NPC con id "${id}", ignorato.`);
            continue;
        }
        visti.add(id);

        istanza.id = id;
        istanza.gruppo = gruppo;
        npc.push(istanza);
    }

    return npc.sort((a, b) => a.nome.localeCompare(b.nome, "it"));
}

const tuttiGliNpc = caricaNpc();
const perId = new Map(tuttiGliNpc.map((n) => [n.id, n]));

export function getNpcs(): Npc[] {
    return tuttiGliNpc;
}

export function getNpc(id: string | undefined): Npc | undefined {
    if (!id) return undefined;
    return perId.get(id);
}

/** Gruppi in ordine alfabetico, con "Senza categoria" sempre in fondo. */
export function getGruppiNpc(): GruppoNpc[] {
    const gruppi = new Map<string, Npc[]>();
    for (const n of tuttiGliNpc) {
        const lista = gruppi.get(n.gruppo);
        if (lista) lista.push(n);
        else gruppi.set(n.gruppo, [n]);
    }

    return [...gruppi.entries()]
        .map(([nome, npc]) => ({ nome, npc }))
        .sort((a, b) => {
            if (a.nome === SENZA_CATEGORIA) return 1;
            if (b.nome === SENZA_CATEGORIA) return -1;
            return a.nome.localeCompare(b.nome, "it");
        });
}
