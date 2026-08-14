import { useState } from "react"

interface FormTokenDmiProp {
    onToken: (token: string) => void
}

/** Inserimento del token personale copiato da "Collegamento sito" nell'app DMI. */
export default function FormTokenDmi(prop: Readonly<FormTokenDmiProp>) {
    const [bozza, setBozza] = useState("")

    return (
        <form
            className="flex gap-3 items-center"
            onSubmit={(e) => {
                e.preventDefault()
                prop.onToken(bozza)
                setBozza("")
            }}
        >
            <div>
                <input
                    type="password"
                    value={bozza}
                    onChange={(e) => setBozza(e.target.value)}
                    placeholder="Token DMI"
                    autoComplete="off"
                />
            </div>
            <div>
                <button type="submit" disabled={!bozza.trim()}>✔️</button>
            </div>
        </form>
    )
}
