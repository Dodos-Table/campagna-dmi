import { useMemo } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/index";
import AlberoEvoluzioni from "~/components/evoluzioni/AlberoEvoluzioni";
import FormTokenDmi from "~/components/FormTokenDmi";
import IntegrazioneApp from "~/components/IntegrazioneApp";
import useDmiBridge from "~/lib/useDmiBridge";
import { percorsoEvolutivo, schedaAttiva } from "~/lib/percorsoEvolutivo";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Evoluzioni - DMI" },
    { name: "description", content: "Sito per la campagna di DnD Dungeon Monster Isekai" },
  ];
}

/** Il percorso evolutivo esiste solo se l'app DMI è collegata: senza dati non c'è nulla da mostrare. */
export default function EvoluzioniPage() {
    const bridge = useDmiBridge();
    const { dati } = bridge;

    // `AlberoEvoluzioni` memoizza il layout sull'albero: ricostruirlo ad ogni render
    // annullerebbe quella memo.
    const albero = useMemo(() => (dati ? percorsoEvolutivo(dati) : null), [dati]);
    const disallineata = dati ? schedaAttiva(dati).disallineata : false;

    return (
        <div className="container pt-8 pb-8">
            <h1 className="title text-isekai text-center">Evoluzioni</h1>

            {!bridge.token && (
                <div className="flex flex-col items-center gap-3">
                    <p className="text-center max-w-prose">
                        Questa pagina mostra il percorso evolutivo del personaggio attivo nell'app
                        DMI. Per vederlo, apri l'app sullo stesso dispositivo e incolla qui il token
                        che trovi in <strong>Collegamento sito</strong>.
                    </p>
                    <FormTokenDmi onToken={bridge.setToken} />
                </div>
            )}

            {bridge.token && bridge.stato === "caricamento" && (
                <p className="text-center">Collegamento all'app DMI…</p>
            )}

            {bridge.token && bridge.stato === "errore" && (
                <div className="flex flex-col items-center gap-3">
                    <p className="text-center max-w-prose">{bridge.errore}</p>
                    <div className="flex gap-3">
                        <button type="button" onClick={bridge.ricarica}>
                            🔄 Riprova
                        </button>
                        <button type="button" onClick={() => bridge.setToken("")}>
                            ❌ Scollega
                        </button>
                    </div>
                </div>
            )}

            {albero && (
                <>
                    <h2 className="text-center text-2xl text-isekai">{albero.titolo}</h2>
                    {albero.sottotitolo && (
                        <p className="text-center mb-4 opacity-80">{albero.sottotitolo}</p>
                    )}

                    {disallineata && (
                        <p className="text-center mb-4 opacity-80">
                            ⚠️ La scheda esportata non corrisponde al personaggio attivo nell'app:
                            cambia personaggio nell'app DMI e ricarica.
                        </p>
                    )}

                    {albero.nodi.length > 0 ? (
                        <AlberoEvoluzioni albero={albero} />
                    ) : (
                        <p className="text-center">
                            Nessuna evoluzione registrata su questa scheda.
                        </p>
                    )}
                </>
            )}

            <div className="text-center mt-6">
                <Link className="link" to="/">
                    Torna alla home
                </Link>
            </div>

            {/* Solo a collegamento riuscito: negli altri stati la pagina mostra già
                form ed errori a tutta larghezza, il badge li ripeterebbe. */}
            {dati && <IntegrazioneApp dmibridge={bridge} />}
        </div>
    );
}
