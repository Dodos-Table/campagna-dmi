import { Link } from "react-router"
import { Tooltip } from "react-tooltip";

interface DmiBtnProp {
    link?: string,
    children: React.ReactNode,
    type?: "button" | "submit",
    onClick?: () => void,
    disabled?: boolean,
    newPage?: boolean, 
    tooltip?: string
}

export default function DmiBtn(prop: Readonly<DmiBtnProp>) {


    const tooltip_id = prop.tooltip ? (Math.random() + 1).toString(36).substring(7) : undefined
    const tooltip = prop.tooltip ? (<Tooltip id={tooltip_id}/>): (<></>)

    const btn = (<>
        <button
            className="btn"
            type={prop.type ?? "button"}
            onClick={prop.onClick}
            disabled={prop.disabled}
            data-tooltip-id={tooltip_id}
            data-tooltip-content={prop?.tooltip}
        >
            {prop.children}
        </button>
        {tooltip}
    </>
    )

    
    

    if(prop.link && !prop.disabled) {

        const _target= prop.newPage ? "_blank" : "";

        return (
            <Link to={prop.link} target={_target}>{btn}</Link>
        )
    }

    return btn
}