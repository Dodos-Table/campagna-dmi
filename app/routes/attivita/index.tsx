import FeedAttivita from "~/components/attivita/FeedAttivita";
import FormTokenDmi from "~/components/FormTokenDmi";
import IntegrazioneApp from "~/components/IntegrazioneApp";
import useDmiBridge from "~/lib/useDmiBridge";
import useFeedAttivita from "~/lib/useFeedAttivita";
import usePubblicaLog from "~/lib/usePubblicaLog";
import type { Route } from "./+types/index";
import "~/assets/css/attivita.css";

/** Ogni quanto rileggere la scheda per accorgersi delle nuove voci di log. */
const POLL_BRIDGE_MS = 2000;

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Attività - DMI" },
        { name: "description", content: "Sito per la campagna di DnD Dungeon Monster Isekai" },
    ];
}

export default function Attivita() {
    const dmiBridge = useDmiBridge({ pollMs: POLL_BRIDGE_MS });

    // Il feed compare solo a scheda collegata: senza bridge il long-poll resterebbe
    // aperto di continuo su contenuto che il gate qui sotto non mostra comunque.
    const feed = useFeedAttivita(dmiBridge.stato === "connesso");
    const { idPropri, erroreInvio } = usePubblicaLog(dmiBridge);

    if(!dmiBridge.token || (dmiBridge.stato === "caricamento" || dmiBridge.stato === "errore")) {
        return (<>
        <h1 className="title text-isekai text-center">Attività</h1>
        {!dmiBridge.token && (
            <div className="flex flex-col items-center gap-3">
                <p className="text-center max-w-prose">
                    Questa pagina raccoglie le attività di tutti i giocatori e ci pubblica quelle
                    del personaggio attivo nell'app DMI. Per collegarla, apri l'app sullo stesso
                    dispositivo e incolla qui il token che trovi in <strong>Collegamento sito</strong>.
                </p>
                <FormTokenDmi onToken={dmiBridge.setToken} />
            </div>
        )}

        {dmiBridge.token && dmiBridge.stato === "caricamento" && (
            <p className="text-center">Collegamento all'app DMI…</p>
        )}

        {dmiBridge.token && dmiBridge.stato === "errore" && (
            <div className="flex flex-col items-center gap-3">
                <p className="text-center max-w-prose">{dmiBridge.errore}</p>
                <div className="flex gap-3">
                    <button type="button" onClick={dmiBridge.ricarica}>
                        🔄 Riprova
                    </button>
                    <button type="button" onClick={() => dmiBridge.setToken("")}>
                        ❌ Scollega
                    </button>
                </div>
            </div>
        )}
        </>)
    }

    return (<>
        <h1 className="title text-isekai text-center">Attività</h1>

        {erroreInvio && (
            <p className="text-center max-w-prose mx-auto mb-4">⚠️ {erroreInvio}</p>
        )}

        <FeedAttivita eventi={feed.eventi} stato={feed.stato} idPropri={idPropri} />

        <IntegrazioneApp dmibridge={dmiBridge} />
    </>)

}
