import type { Dispatch, SetStateAction } from "react"
import type { Skill } from "~/types/skill"

interface SkillListElementProp {
    hasMp: boolean
    data: Skill
    owned?: boolean
    setModalOpen: Dispatch<SetStateAction<boolean>>
    setClickedSkill: Dispatch<SetStateAction<Skill|null>>
}

export default function SkillListElement(prop: Readonly<SkillListElementProp>) {

    const handleClick = () => {
        prop.setClickedSkill(prop.data)
        prop.setModalOpen(true)
    }


    let validForMP = (!prop.hasMp && prop.data.mp > 0) ? "text-gray-500 line-through" : "text-red-500"

    return <div className="skillname" onClick={handleClick} >
        <div className={prop.owned ? "text-green-500" : validForMP}>{prop.data.name}</div>
    </div>
}
