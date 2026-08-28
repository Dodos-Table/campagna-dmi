
import { useMemo, useState, type ChangeEvent } from "react";
import DmiBtn from "~/components/DmiBtn";
import IntegrazioneApp from "~/components/IntegrazioneApp";
import SkillListElement from "~/components/skill/SkillListElement";
import SkillModal from "~/components/skill/SkillModal";
import data from "~/data/skills.json"
import { gradoDaIdentity } from "~/lib/gradoSkill";
import useDmiBridge from "~/lib/useDmiBridge";
import type { DmiExport, DmiCharacter } from "~/types/dmi";
import type { Skill as SkillData } from "~/types/skill";
import "~/assets/css/skill.css"

function getActiveScheda(dati: DmiExport | null): DmiCharacter {
    // non può tornare nullo
    const attivo = dati?.character as DmiCharacter

    return attivo
}

// Il tipo del catalogo è dichiarato a mano: l'inferenza dal JSON produce
// un'unione che non permette di leggere `variants` per chiave.
const skills = data as unknown as SkillData[]

const MP_FILTERS = [
    { label: "Skill fisiche+magiche", match: (_skill: SkillData) => true },
    { label: "Solo fisiche", match: (skill: SkillData) => skill.mp === 0 },
    { label: "Solo magiche", match: (skill: SkillData) => skill.mp > 0 },
] as const


const JSON_CATEGORY = Array.from(new Set(data.map(elem => elem.section.split(' — ')[0])))
    .map(elem => {
        return {label: elem, match: (skill: SkillData) => skill.section.startsWith(elem)}
    })

const CATEGORY_FILTERS = [
    { label: "Tutte le categorie", match: (_skill: SkillData) => true },
    ...JSON_CATEGORY
]

export default function Skill() {
    const dmiBridge = useDmiBridge();

    const [modalOpen, setModalOpen] = useState(false)
    const [clickedSkill, setClickedSkill] = useState<SkillData | null>(null)

    const [mpFilter, setMpFilter] = useState(0)
    const nextMpFilter = () => setMpFilter(prev => (prev + 1) % MP_FILTERS.length)

    const [categoriaFilter, setCategoriaFilter] = useState(0)
    const nextCategoryFilter = (e: ChangeEvent<HTMLSelectElement>) => setCategoriaFilter(Number.parseInt(e.target.value))

    const activeSkillId = useMemo(() => {
        if (!dmiBridge.dati) {
            return new Set<string>()
        }

        return new Set(
            getActiveScheda(dmiBridge.dati).skills.map((elem: Record<string, any>) => elem.catalogKey as string)
        )
    }, [dmiBridge.dati])

    const hasMP = useMemo(() => {
        if (!dmiBridge.dati) {
            return true
        }

        let MPstats = (getActiveScheda(dmiBridge?.dati).stats.MP as Record<string, number>)

        return Object.values(MPstats).reduce((a, b) => a + b, 0) > 0
    }, [dmiBridge.dati])

    const gradoPersonaggio = useMemo(
        () => gradoDaIdentity(dmiBridge.dati?.character?.identity),
        [dmiBridge.dati]
    )

    const visibleSkill = useMemo(
        () => {
            return skills
                .filter(skill => MP_FILTERS[mpFilter].match(skill))
                .filter(skill => CATEGORY_FILTERS[categoriaFilter].match(skill))
        },
        [mpFilter, categoriaFilter]
    )
    const activeSkill = visibleSkill.filter(elem => activeSkillId.has(elem.key))
    const remainingSkill = visibleSkill.filter(elem => !activeSkillId.has(elem.key))


    return <>
        <h1 className="title text-isekai text-center">Skill</h1>

        <p>Qui è presente la lista di skill selezionabili sulla scheda, alcune di queste skill necessitano di mana (MP).</p>
        <p>Se l'integrazione con la scheda è attiva, e il personaggio selezionato non ha MP, le skill magiche verranno <span className="text-gray-500 line-through">segnate</span></p>

        <div className="grid md:grid-cols-2 md:grid-rows-1 grid-rows-2 gap-4 text-center">
            <div>
                <DmiBtn onClick={nextMpFilter}>{MP_FILTERS[mpFilter].label}</DmiBtn>
            </div>
            <div>
                <select name="skillclass" id="skillclass" className="btn" onChange={nextCategoryFilter} value={categoriaFilter}>
                    {CATEGORY_FILTERS.map((elem, index) => <option key={elem.label} value={index} >{elem.label}</option>)}
                </select>
            </div>
        </div>




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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 text-center md:select-none">
                {activeSkill.map(elem => <SkillListElement key={elem.key} owned={true} hasMp={hasMP} data={elem} setClickedSkill={setClickedSkill} setModalOpen={setModalOpen} />)}
            </div>

        }


        <h2 className="subtitle">Skill rimanenti ({remainingSkill.length})</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 text-center md:select-none">
            {remainingSkill.map(elem => <SkillListElement key={elem.key} hasMp={hasMP} data={elem} setClickedSkill={setClickedSkill} setModalOpen={setModalOpen} />)}
        </div>

        <SkillModal
            skill={clickedSkill}
            gradoPersonaggio={gradoPersonaggio}
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
        />

        <IntegrazioneApp dmibridge={dmiBridge} />
    </>
}