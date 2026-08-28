import type { EventoAttivita, StatoFeed } from "~/types/attivita"

const ETICHETTA_STATO: Record<StatoFeed, string> = {
    avvio: "Collegamento alla bacheca…",
    connesso: "In ascolto",
    disconnesso: "Bacheca non raggiungibile, riprovo…",
}

function oraEvento(timestamp: string): string {
    const data = new Date(timestamp)
    return Number.isNaN(data.getTime()) ? timestamp : data.toLocaleString("it-IT")
}

interface FeedAttivitaProp {
    eventi: EventoAttivita[]
    stato: StatoFeed
    /** Id degli eventi partiti da questo browser: vengono evidenziati. */
    idPropri: Set<number>
}

export default function FeedAttivita(prop: Readonly<FeedAttivitaProp>) {
    const { eventi, stato, idPropri } = prop

    // La bacheca li consegna in ordine di id: i più recenti vanno in cima.
    const inOrdine = [...eventi].reverse()

    return (
        <div className="feedAttivita">
            <div className={`statoFeed statoFeed--${stato}`}>
                <span className="statoFeed-spia" aria-hidden="true" />
                {ETICHETTA_STATO[stato]}
            </div>

            {inOrdine.length === 0 ? (
                <p className="feedAttivita-vuoto">Nessuna attività ancora.</p>
            ) : (
                <ul className="feedAttivita-lista">
                    {inOrdine.map((evento) => (
                        <li
                            key={evento.id}
                            className={`eventoAttivita${idPropri.has(evento.id) ? " eventoAttivita--mio" : ""}`}
                        >
                            <div className="eventoAttivita-intestazione">
                                <strong>{evento.personaggio}</strong>
                                <span className="eventoAttivita-ora">{oraEvento(evento.timestamp)}</span>
                            </div>
                            <div className="eventoAttivita-messaggio">{evento.messaggio}</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
