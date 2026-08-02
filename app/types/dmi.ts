// Tipi dello snapshot esposto dal bridge locale dell'app DMI.
// Riferimento: DMI_v0.9.7_collegamento_sito.md, sezione "Struttura principale del JSON".

/** Indice sintetico dei personaggi presenti nell'app: non contiene la scheda completa. */
export interface DmiProfile {
    id: string;
    monsterName: string;
    playerName: string;
    currentForm: string;
}

/**
 * Scheda attiva nel formato nativo dell'app.
 * Il doc non specifica il contenuto dei singoli blocchi: restano larghi
 * finché non conosciamo la forma reale di un export.
 */
export interface DmiCharacter {
    id: string;
    identity: Record<string, unknown>;
    stats: Record<string, unknown>;
    resources: Record<string, unknown>;
    evolutionHistory: unknown[];
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
