import { Link } from "react-router"

interface DmiBtnProp {
    link?: string,
    children: React.ReactNode,
}

export default function DmiBtn(prop: Readonly<DmiBtnProp>) {


    const btn = (<button className="btn">{prop.children}</button>)

    if(prop.link) {
        return (
            <Link to={prop.link}>{btn}</Link>
        )
    }

    return btn
}