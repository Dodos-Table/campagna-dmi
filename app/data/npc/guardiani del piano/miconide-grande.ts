import { Npc } from "~/types/npc";
import img from "~/assets/img/npc/miconide-grande.jpg"

export default class MiconideGrande extends Npc {
    readonly nome = "Miconide Grande";
    readonly epiteto = "Guardiano del primo piano";
    readonly descrizione =
        "Sembra aver vissuto per anni nel suo pozzo. L'aria dell'entrata al secondo piano è ripiena di spore, che la rendono irrespirabile. Se ci si sofferma per troppo tempo, effetti collaterali possono avvenire, come tosse, ciecità e anche la morte." + 
        "A detta sua, rigetta le bestie che tentano di risalire dai piani inferiori, proteggendo il primo piano.";
    readonly ritratto = img

}