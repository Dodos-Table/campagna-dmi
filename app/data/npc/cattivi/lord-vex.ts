import { Npc } from "~/types/npc";
// Per aggiungere il ritratto: metti l'immagine in `app/assets/img/npc/` e scommenta,
// poi valorizza `readonly ritratto = ritratto;` qui sotto.
// import ritratto from "~/assets/img/npc/lord-vex.png";

export default class LordVex extends Npc {
    readonly nome = "Lord Vex";
    readonly epiteto = "Il Barone di Cenere";
    readonly descrizione =
        "Nobile decaduto che ha barattato le terre di famiglia per qualcosa di molto peggiore. " +
        "Si presenta sempre cortese, sempre in ritardo, sempre con un favore da chiedere.";
}
