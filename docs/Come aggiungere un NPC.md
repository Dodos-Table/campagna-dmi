# Come aggiungere un NPC

1. Crea un file `.ts` in questa cartella. **Il nome del file è l'URL**: `lord-vex.ts` → `/npc/lord-vex`.
2. **La cartella è il raggruppamento** mostrato nell'indice: `cattivi/lord-vex.ts` finisce nel gruppo
   "Cattivi", un file nella root finisce in "Senza categoria". Le cartelle annidate diventano un
   gruppo unico (`cattivi/culto/x.ts` → "Cattivi / Culto").
3. Esporta di default una classe che estende `Npc` (vedi [`app/types/npc.ts`](../../types/npc.ts)):

```ts
import { Npc } from "~/types/npc";
import ritratto from "~/assets/img/npc/lord-vex.png"; // opzionale

export default class LordVex extends Npc {
    readonly nome = "Lord Vex";
    readonly epiteto = "Il Barone di Cenere"; // opzionale
    readonly ritratto = ritratto;             // opzionale, senza mostra l'iniziale
    readonly descrizione = "…";
}
```

Non serve registrarlo da nessuna parte: [`app/data/npcs.ts`](../npcs.ts) raccoglie da solo tutti i
file di questa cartella. `id` e `gruppo` li assegna il registro, non vanno scritti nella classe.

Le immagini vanno in `app/assets/img/npc/` e vanno **importate** (non scritte come stringa di path),
così Vite le versiona e ci mette da solo il base path del sito.
