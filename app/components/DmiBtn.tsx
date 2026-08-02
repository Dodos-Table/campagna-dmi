import { Link } from "react-router"

interface DmiBtnProp {
    link?: string,
    children: React.ReactNode,
    type?: "button" | "submit",
    onClick?: () => void,
    disabled?: boolean,
    newPage?: boolean, 
}

export default function DmiBtn(prop: Readonly<DmiBtnProp>) {


    const btn = (
        <button
            className="btn"
            type={prop.type ?? "button"}
            onClick={prop.onClick}
            disabled={prop.disabled}
        >
            {prop.children}
        </button>
    )

    if(prop.link) {

        const _target= prop.newPage ? "_blank" : "";

        return (
            <Link to={prop.link} target={_target}>{btn}</Link>
        )
    }

    return btn
}