import { filterStatusEnum } from "~/routes/skill";

interface SkillListElementProp {
    filter: number
    hasMp: boolean
    data: any
    owned?: boolean
}

export default function SkillListElement(prop: SkillListElementProp) {
    if (prop.filter != filterStatusEnum.ALL) {
        switch (prop.filter) {
            case filterStatusEnum.FISICHE: // solo fisiche
                if(prop.data.mp > 0){ // escludo le maghiche
                    return <></>;
                } 
                break;
            case filterStatusEnum.MAGICHE: // solo magiche
                if(prop.data.mp == 0){ // escludo le fisiche
                    return <></>;
                } 
                break;
            default:
                break;
        }
    }


    let validForMP = (!prop.hasMp && prop.data.mp > 0) ? "text-gray-500 line-through" : "text-red-500"

    return <div key={prop.data.key} className="text-xl">
        <div className={prop.owned ? "text-green-500" : validForMP}>{prop.data.name}</div>
        <div></div>
    </div>
}