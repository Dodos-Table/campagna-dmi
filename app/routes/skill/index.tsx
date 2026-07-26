import { redirect } from "react-router";
import { getCreature } from "~/data/skill";

/** `/skill` non ha contenuto proprio: apre la prima creatura disponibile. */
export function clientLoader() {
    const prima = getCreature()[0];
    if (prima) throw redirect(`/skill/${prima.id}`);
    return null;
}

export default function SkillIndex() {
    return <p className="text-center">Nessun albero evolutivo disponibile.</p>;
}
