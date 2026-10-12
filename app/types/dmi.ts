// Tipi dei dati esposti dal bridge locale dell'app DMI.
// L'endpoint restituisce le voci di localStorage dell'app: le schede vivono come
// stringa JSON sotto `dmi-monster-sheet-pwa-v1` (vedi `DmiBridgeRisposta`).
// Riferimento: DMI_v0.9.7_collegamento_sito.md, sezione "Struttura attuale della risposta".

/** Bonus alle statistiche concessi da un'evoluzione. Le chiavi assenti valgono 0. */
export interface DmiBonuses {
    HP?: number;
    MP?: number;
    ATK?: number;
    DEF?: number;
    AGL?: number;
    INTMEN?: number;
}

/** Sigle delle statistiche della scheda, le stesse dei bonus evolutivi. */
export type DmiSiglaStat = keyof DmiBonuses;

/** Una statistica di `character.stats`, scomposta per provenienza: il totale è la somma. */
export interface DmiStat {
    base: number;
    evolution: number;
    equip: number;
    skill: number;
    other: number;
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
 * Anagrafica della scheda (`character.identity`). I campi sono opzionali perché
 * l'app non garantisce lo schema interno: la forma qui descritta è quella
 * osservata nei dati reali, dove alcune schede ne hanno meno di altre.
 */
export interface DmiIdentity {
    monsterName?: string;
    playerName?: string;
    level?: number;
    exp?: number;
    size?: string;
    freeStats?: number;
    freeSkills?: number;
    baseMovement?: number;
    evolutionTree?: string;
    evolutionLine?: string;
    /**
     * Grado evolutivo. Nei dati attuali è una stringa ("Lesser", a volte in
     * minuscolo) o assente; in passato è stato un oggetto con una chiave per
     * grado: va letto con `gradoDaIdentity` in `~/lib/gradoSkill`.
     */
    evolutionTier?: unknown;
    evolutionStart?: string;
    currentEvolution?: string;
    nextEvolution?: string;
    previousForm?: string;
    species?: string;
    family?: string;
    heroRace?: string;
    heroRaceBonus?: string;
    evolutionNotes?: string;
    generalNotes?: string;
    [chiave: string]: unknown;
}

/** Una skill posseduta dal personaggio, copiata dal catalogo dell'app. */
export interface DmiSkill {
    id: string;
    /** Chiave della skill nel catalogo: corrisponde a `key` in `~/data/skills.json`. */
    catalogKey: string;
    name: string;
    /** Grado della skill posseduta, es. "Lesser" o "Unico". */
    grade: string;
    mp: number;
    [chiave: string]: unknown;
}

/** Una voce di `character.log`, il registro degli eventi di gioco. */
export interface DmiLogEntry {
    id: string;
    /** Data ISO. */
    at: string;
    round: number;
    message: string;
}

/**
 * Scheda completa di un personaggio nel formato nativo dell'app.
 * I blocchi che il sito non legge restano larghi finché non servono.
 */
export interface DmiCharacter {
    id: string;
    identity: DmiIdentity;
    stats: Record<DmiSiglaStat, DmiStat>;
    resources: Record<string, unknown>;
    evolutionHistory: DmiEvolutionStep[];
    skills: DmiSkill[];
    statuses: unknown[];
    actions: Record<string, unknown>;
    target: Record<string, unknown>;
    abilities: Record<string, unknown>;
    equipment: Record<string, unknown>;
    journal: Record<string, unknown>;
    timeline: unknown[];
    log: DmiLogEntry[];
    inField?: boolean;
    /** Immagine del personaggio come data URI: può pesare centinaia di KB. */
    portrait?: string;
    levelProgression?: Record<string, unknown>;
    directModifiers?: Record<string, unknown>;
    resourcePointInvestments?: Record<string, unknown>;
}

/** Risposta grezza di `/export`: le voci di localStorage dell'app, come stringhe. */
export interface DmiBridgeRisposta {
    /** JSON serializzato di `DmiStorage`. */
    'dmi-monster-sheet-pwa-v1': string;
    /** Tema dell'app: non usato dal sito. */
    'dmi-theme'?: string;
}

/** Contenuto di `dmi-monster-sheet-pwa-v1` dopo il parse. */
export interface DmiStorage {
    /** Versione del formato di salvataggio dell'app. */
    version: number;
    activeId: string;
    /** Tutte le schede presenti nell'app, complete. */
    profiles: DmiCharacter[];
}

/** Dati normalizzati da `fetchSchedaDmi`, quelli che vede il resto del sito. */
export interface DmiExport extends DmiStorage {
    /** La scheda di `profiles` con `id === activeId`: `fetchSchedaDmi` garantisce che esista. */
    character: DmiCharacter;
}

/** `inattivo` = nessun token inserito, quindi nessuna richiesta in corso. */
export type DmiBridgeStato = "inattivo" | "caricamento" | "connesso" | "errore";
