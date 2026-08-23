
import { useMemo, useState } from "react";
import DmiBtn from "~/components/DmiBtn";
import IntegrazioneApp from "~/components/IntegrazioneApp";
import SkillListElement from "~/components/skill/SkillListElement";
import data from "~/data/skills.json"
import useDmiBridge from "~/lib/useDmiBridge";
import type { DmiExport, DmiCharacter } from "~/types/dmi";

function getActiveScheda(dati: DmiExport | null): DmiCharacter {
    // non può tornare nullo
    const attivo = dati?.character as DmiCharacter

    return attivo
}

export enum filterStatusEnum {
    ALL,
    FISICHE,
    MAGICHE
}

export default function Skill() {
    const dmiBridge = useDmiBridge();


    const filterStatusLabel: Record<number, string> = {
        0: "Tutte le skill",
        1: "Solo fisiche",
        2: "Solo magiche"
    }

    const [filterStatus, setFilterStatus] = useState<number>(0)


    const activeSkillId = useMemo(() => {
        if (!dmiBridge.dati) {
            return []
        }

        return getActiveScheda(dmiBridge?.dati).skills.map((elem: Record<string, any>) => elem.catalogKey) as string[]
    }, [dmiBridge.dati])

    const hasMP = useMemo(() => {
        if (!dmiBridge.dati) {
            return true
        }

        let MPstats = (getActiveScheda(dmiBridge?.dati).stats.MP as Record<string, number>)

        return Object.values(MPstats).reduce((a, b) => a + b, 0) > 0
    }, [dmiBridge.dati])

    const activeSkill = data.filter(elem => activeSkillId.includes(elem.key))
    const remainingSkill = data.filter(elem => !activeSkillId.includes(elem.key))

    return <>
        <h1 className="title text-isekai text-center">Skill</h1>

        <p>Qui è presente la lista di skill selezionabili sulla scheda, alcune di queste skill necessitano di mana (MP).</p>
        <p>Se l'integrazione con la scheda è attiva, e il personaggio selezionato non ha MP, le skill magiche verranno <span className="text-gray-500 line-through">segnate</span></p>

        <DmiBtn onClick={() => setFilterStatus(prev => (prev + 1) % (Object.keys(filterStatusLabel).length))}>{filterStatusLabel[filterStatus.valueOf()]}</DmiBtn>

        <h2 className="subtitle">Skill selezionate ({activeSkill.length})</h2>

        {
            !dmiBridge.token && (
                <p>Apri l'app sullo stesso dispositivo ed effettua il <strong>Collegamento al sito</strong></p>
            )
        }

        {
            dmiBridge.token && dmiBridge.stato === "caricamento" && (
                <p>Collegamento all'app DMI…</p>
            )
        }

        {
            dmiBridge.token && dmiBridge.stato === "errore" && (
                <p>Errore nella sinconizzazione con la scheda</p>
            )
        }

        {
            <div className="grid grid-cols-4 gap-4">
                {activeSkill.map(elem => <SkillListElement key={elem.key} owned={true} filter={filterStatus} hasMp={hasMP} data={elem} />)}
            </div>

        }


        <h2 className="subtitle">Skill rimanenti ({remainingSkill.length})</h2>
        
        <div className="grid grid-cols-4 gap-4">
            {remainingSkill.map(elem => <SkillListElement key={elem.key} filter={filterStatus} hasMp={hasMP} data={elem} />)}
        </div>


        <IntegrazioneApp dmibridge={dmiBridge} />
    </>
}