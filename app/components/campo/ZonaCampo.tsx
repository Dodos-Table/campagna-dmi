import type { SchedaCampo } from "~/types/campo"

/** Cosa può fare chi guarda con una scheda: solo proprie e avversari sono cliccabili. */
export type RuoloScheda = "selezionata" | "propria" | "avversaria" | "altra"

interface ZonaCampoProp {
    titolo: string
    schede: SchedaCampo[]
    ruolo: (scheda: SchedaCampo) => RuoloScheda
    onScegli: (scheda: SchedaCampo) => void
}

const ETICHETTA: Record<RuoloScheda, string | undefined> = {
    selezionata: "Scheda tua, selezionata",
    propria: "Scheda tua: selezionala per attaccare",
    avversaria: "Scegli come bersaglio",
    altra: undefined,
}

export default function ZonaCampo(prop: Readonly<ZonaCampoProp>) {
    return (
        <section className="zonaCampo">
            <h2 className="zonaCampo-titolo text-isekai">{prop.titolo}</h2>

            {prop.schede.length === 0 ? (
                <p className="zonaCampo-vuota">Nessuna scheda in campo.</p>
            ) : (
                <div className="zonaCampo-schede">
                    {prop.schede.map((scheda) => {
                        const ruolo = prop.ruolo(scheda)
                        const contenuto = (
                            <>
                                {scheda.portrait ? (
                                    <img className="cartaCampo-ritratto" src={scheda.portrait} alt="" />
                                ) : (
                                    <div className="cartaCampo-ritratto" aria-hidden="true" />
                                )}
                                <span className="cartaCampo-nome">{scheda.nome}</span>
                            </>
                        )

                        return ruolo === "altra" ? (
                            <div key={scheda.schedaId} className="cartaCampo">{contenuto}</div>
                        ) : (
                            <button
                                key={scheda.schedaId}
                                type="button"
                                className={`cartaCampo cartaCampo--${ruolo}`}
                                title={ETICHETTA[ruolo]}
                                aria-pressed={ruolo === "avversaria" ? undefined : ruolo === "selezionata"}
                                onClick={() => prop.onScegli(scheda)}
                            >
                                {contenuto}
                            </button>
                        )
                    })}
                </div>
            )}
        </section>
    )
}
