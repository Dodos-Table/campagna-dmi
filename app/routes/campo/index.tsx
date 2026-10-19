import { useState } from "react";
import FeedAttivita from "~/components/attivita/FeedAttivita";
import ZonaCampo, { type RuoloScheda } from "~/components/campo/ZonaCampo";
import FormTokenDmi from "~/components/FormTokenDmi";
import IntegrazioneApp from "~/components/IntegrazioneApp";
import { URL_HOSTING, normalizzaEvento } from "~/lib/attivitaHosting";
import { isGm } from "~/lib/campo";
import { impostaTarget } from "~/lib/dmiBridge";
import useCampo from "~/lib/useCampo";
import useDmiBridge from "~/lib/useDmiBridge";
import useFeedAttivita from "~/lib/useFeedAttivita";
import usePubblicaLog from "~/lib/usePubblicaLog";
import type { SchedaCampo } from "~/types/campo";
import type { Route } from "./+types/index";
import "~/assets/css/attivita.css";
import "~/assets/css/campo.css";

/** Ogni quanto rileggere la scheda per accorgersi di entrate/uscite dal campo e cambi di valori. */
const POLL_BRIDGE_MS = 2500;

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Campo - DMI" },
        { name: "description", content: "Sito per la campagna di DnD Dungeon Monster Isekai" },
    ];
}

export default function Campo() {
    const dmiBridge = useDmiBridge({ pollMs: POLL_BRIDGE_MS });
    const { schede, erroreInvio } = useCampo(dmiBridge);
    const feed = useFeedAttivita(URL_HOSTING, dmiBridge.stato === "connesso", normalizzaEvento);
    // Anche da qui: chi gioca dal Campo deve comparire nel feed degli altri.
    const { idPropri, erroreInvio: erroreLog } = usePubblicaLog(dmiBridge);

    const [selezionata, setSelezionata] = useState<string | null>(null);
    const [esito, setEsito] = useState<string | null>(null);

    if (!dmiBridge.token || dmiBridge.stato === "caricamento" || dmiBridge.stato === "errore") {
        return (<>
        <h1 className="title text-isekai text-center">Campo</h1>
        {!dmiBridge.token && (
            <div className="flex flex-col items-center gap-3">
                <p className="text-center max-w-prose">
                    Questa pagina mostra il campo di battaglia con le schede in campo di tutti i
                    giocatori e del GM. Per collegarla, apri l'app sullo stesso dispositivo e
                    incolla qui il token che trovi in <strong>Collegamento sito</strong>.
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

    // Proprie = presenti nell'app DMI di questo computer: solo con quelle si può agire.
    const proprie = new Set(dmiBridge.dati?.profiles.map((p) => p.id));
    const mieInCampo = schede.filter((s) => proprie.has(s.schedaId));
    const attaccante = mieInCampo.find((s) => s.schedaId === selezionata) ?? mieInCampo[0];

    const ruolo = (scheda: SchedaCampo): RuoloScheda => {
        if (proprie.has(scheda.schedaId)) return scheda.schedaId === attaccante?.schedaId ? "selezionata" : "propria";
        // Avversari sono le schede dell'altra zona: il GM attacca i giocatori e viceversa.
        if (attaccante && isGm(scheda.playerName) !== isGm(attaccante.playerName)) return "avversaria";
        return "altra";
    };

    const scegli = async (scheda: SchedaCampo) => {
        if (proprie.has(scheda.schedaId)) {
            setSelezionata(scheda.schedaId);
            return;
        }
        if (!attaccante) return;

        setEsito(`Invio del bersaglio ${scheda.nome}…`);
        try {
            await impostaTarget(dmiBridge.token, attaccante.schedaId, {
                elusion: scheda.elusion,
                def: scheda.def,
                men: scheda.men,
            });
            setEsito(`🎯 ${attaccante.nome} → ${scheda.nome} (Elusione ${scheda.elusion}, DEF ${scheda.def}, MEN ${scheda.men})`);
        } catch (e: unknown) {
            setEsito(`⚠️ ${e instanceof Error ? e.message : "Bersaglio non impostato."}`);
        }
    };

    return (<>
        <h1 className="title text-isekai text-center">Campo</h1>

        {erroreInvio && (
            <p className="text-center max-w-prose mx-auto mb-4">⚠️ {erroreInvio}</p>
        )}
        {erroreLog && (
            <p className="text-center max-w-prose mx-auto mb-4">⚠️ {erroreLog}</p>
        )}

        <div className="campoConFeed">
            <div className="campo">
                <ZonaCampo titolo="GM" schede={schede.filter((s) => isGm(s.playerName))} ruolo={ruolo} onScegli={scegli} />
                <p className="campo-esito" role="status">
                    {esito ?? (attaccante
                        ? `Attacchi con ${attaccante.nome}: scegli un avversario.`
                        : "Nessuna tua scheda in campo: mettine una in campo nell'app DMI.")}
                </p>
                <ZonaCampo titolo="Giocatori" schede={schede.filter((s) => !isGm(s.playerName))} ruolo={ruolo} onScegli={scegli} />
            </div>

            <aside className="campo-feed">
                <h2 className="zonaCampo-titolo">Attività</h2>
                <FeedAttivita eventi={feed.eventi} stato={feed.stato} idPropri={idPropri} />
            </aside>
        </div>

        <IntegrazioneApp dmibridge={dmiBridge} />
    </>)
}
