/**
 * Classe base di ogni NPC della campagna.
 *
 * Ogni NPC è un file `.ts` dentro `app/data/npc/` che esporta di default una classe
 * che estende questa: il registro (`~/data/npcs`) li raccoglie da solo, non serve
 * registrarli da nessuna parte.
 *
 * Vive in `app/types/` e non in `app/data/npc/` proprio perché la glob del registro
 * raccoglie tutto ciò che sta in quella cartella e la scambierebbe per un NPC.
 */
export abstract class Npc {
    /** Slug usato nell'URL: /npc/<id>. Assegnato dal registro in base al nome del file. */
    id!: string;
    /** Raggruppamento mostrato nell'indice. Assegnato dal registro in base alla cartella. */
    gruppo!: string;
    // `id` e `gruppo` usano il definite assignment perché li popola il registro:
    // una classe non può conoscere il path del file in cui è scritta.

    abstract readonly nome: string;
    /** Sottotitolo breve mostrato sotto il nome, es. "Oste del Cinghiale Zoppo". */
    readonly epiteto?: string;
    /**
     * URL del ritratto: va prodotto da un import di modulo, es.
     * `import ritratto from "~/assets/img/npc/gorm.png"`, così Vite ci pensa da solo
     * a hash e base path.
     */
    readonly ritratto?: string;
    abstract readonly descrizione: string;
}
