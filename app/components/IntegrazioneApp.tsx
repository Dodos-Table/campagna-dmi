import FormTokenDmi from "~/components/FormTokenDmi"
import { nomePersonaggio } from "~/lib/logDmi"
import type { DmiBridge } from "~/lib/useDmiBridge"
import type { DmiExport } from "~/types/dmi"
import "~/assets/css/IntegrazioneApp.css"

function nomeGiocatore(dati: DmiExport): string | null {
    const giocatore = dati.character.identity.playerName
    return typeof giocatore === "string" && giocatore ? giocatore : null
}

interface IntegrazioneAppProp {
    /** Collegamento creato dalla pagina: il componente non ne apre uno proprio,
     *  altrimenti la stessa pagina interrogherebbe il bridge due volte. */
    dmibridge: DmiBridge
}

export default function IntegrazioneApp(prop: Readonly<IntegrazioneAppProp>) {

    const { dati, stato, errore, token, setToken, ricarica } = prop.dmibridge

    if (!token) {
        return (
        <div className="statusIntegrazione">
            <FormTokenDmi onToken={setToken} />
        </div>
        )
    }

    if (stato === "caricamento") {
        return (
        <div className="statusIntegrazione">
            <div className="flex gap-3 items-center">
                <div>Collegamento all'app DMI…</div>
            </div>
        </div>)
    }

    if (stato === "errore") {
        return (
            <div className="statusIntegrazione">
                <div className="flex gap-3 items-center">
                    <div className="max-w-[25vw]">{errore}</div>
                    <div className="flex">
                        <div onClick={ricarica} className="cursor-pointer">🔄</div>
                        <div onClick={() => setToken("")} className="cursor-pointer">❌</div>
                    </div>
                </div>
            </div>
        )
    }

    if (!dati) return null

    const giocatore = nomeGiocatore(dati)

    return (
        <div className="statusIntegrazione">
            <div className="flex gap-3 items-center">
                <div className="ml-1">
                    <strong>{nomePersonaggio(dati)}</strong>{giocatore && ` - ${giocatore}`}
                </div>
                <div className="flex">
                    <div onClick={ricarica} className="cursor-pointer">🔄</div>
                    <div onClick={() => setToken("")} className="cursor-pointer">❌</div>
                </div>
            </div>
        </div>
    )

}
