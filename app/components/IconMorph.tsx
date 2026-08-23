import Skull from "~/assets/img/skull-solid-full.svg?react"

interface IconMorphProp {
    type?: string
}

export default function IconMorph(prop: Readonly<IconMorphProp>) {
    

    if(prop.type === "skull") {
        return <Skull/>
    }


    return (<></>)

}