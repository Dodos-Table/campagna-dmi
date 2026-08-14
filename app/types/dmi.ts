// Tipi dello snapshot esposto dal bridge locale dell'app DMI.
// Riferimento: DMI_v0.9.7_collegamento_sito.md, sezione "Struttura principale del JSON".

/** Indice sintetico dei personaggi presenti nell'app: non contiene la scheda completa. */
export interface DmiProfile {
    id: string;
    monsterName: string;
    playerName: string;
    currentForm: string;
}

/** Bonus alle statistiche concessi da un'evoluzione. Le chiavi assenti valgono 0. */
export interface DmiBonuses {
    HP?: number;
    MP?: number;
    ATK?: number;
    DEF?: number;
    AGL?: number;
    INTMEN?: number;
}

/** Un passo di `character.evolutionHistory`: l'evoluzione scelta e quando. */
export interface DmiEvolutionStep {
    id?: string;
    treeId?: string;
    lineId?: string;
    nodeName?: string;
    label?: string;
    /** Come è stata ottenuta l'evoluzione, es. "Impronta Lesser". */
    source?: string;
    bonuses?: DmiBonuses;
    /** Data ISO. */
    createdAt?: string;
}

/**
 * Anagrafica della scheda. I campi sono opzionali perché il doc non garantisce
 * lo schema interno: la forma qui descritta è quella osservata negli export reali.
 */
export interface DmiIdentity {
    monsterName?: string;
    playerName?: string;
    level?: number;
    evolutionTree?: string;
    evolutionLine?: string;
    evolutionTier?: string;
    evolutionStart?: string;
    currentEvolution?: string;
    nextEvolution?: string;
    previousForm?: string;
    species?: string;
    family?: string;
    [chiave: string]: unknown;
}

/**
 * Scheda attiva nel formato nativo dell'app.
 * Il doc non specifica il contenuto dei singoli blocchi: restano larghi
 * finché non conosciamo la forma reale di un export.
 */
export interface DmiCharacter {
    id: string;
    identity: DmiIdentity;
    stats: Record<string, unknown>;
    resources: Record<string, unknown>;
    evolutionHistory: DmiEvolutionStep[];
    skills: unknown[];
    statuses: unknown[];
    actions: Record<string, unknown>;
    target: Record<string, unknown>;
    abilities: Record<string, unknown>;
    equipment: Record<string, unknown>;
    journal: Record<string, unknown>;
    timeline: unknown[];
    log: unknown[];
}

export interface DmiExport {
    schemaVersion: number;
    appVersion: string;
    storageVersion: number;
    /** Data ISO dell'ultimo snapshot inviato dall'app al server locale. */
    syncedAt: string;
    activeId: string;
    profileCount: number;
    profiles: DmiProfile[];
    character: DmiCharacter;
}

/** `inattivo` = nessun token inserito, quindi nessuna richiesta in corso. */
export type DmiBridgeStato = "inattivo" | "caricamento" | "connesso" | "errore";
