import { Tooltip } from "react-tooltip"
import FormTokenDmi from "~/components/FormTokenDmi"
import type { DmiBridge } from "~/lib/useDmiBridge"
import type { DmiExport } from "~/types/dmi"
import "~/assets/css/IntegrazioneApp.css"

/** Il nome vive in `character.identity`, che può essere incompleta: fallback sull'indice profili. */
function nomeMostro(dati: DmiExport): string {
    const identity = dati.character.identity
    if (typeof identity.monsterName === "string" && identity.monsterName) return identity.monsterName

    const attivo = dati.profiles.find((p) => p.id === dati.activeId)
    return attivo?.monsterName ?? "Scheda senza nome"
}

function nomeGiocatore(dati: DmiExport): string | null {
    const identity = dati.character.identity
    if (typeof identity.playerName === "string" && identity.playerName) return identity.playerName

    const attivo = dati.profiles.find((p) => p.id === dati.activeId)
    return attivo?.playerName ?? null
}

function oraSync(syncedAt: string): string {
    const data = new Date(syncedAt)
    return Number.isNaN(data.getTime()) ? syncedAt : data.toLocaleString("it-IT")
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
                <div className="ml-1" data-tooltip-id="latsync" data-tooltip-content={oraSync(dati.syncedAt)}>
                    <strong>{nomeMostro(dati)}</strong>{giocatore && ` - ${giocatore}`}
                </div>
                <div className="flex">
                    <div onClick={ricarica} className="cursor-pointer">🔄</div>
                    <div onClick={() => setToken("")} className="cursor-pointer">❌</div>
                </div>
                <Tooltip id="latsync" />
            </div>
        </div>
    )

}
