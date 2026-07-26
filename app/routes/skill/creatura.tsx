import { data } from "react-router";
import type { Route } from "./+types/creatura";
import SkillTree from "~/components/skill/SkillTree";
import { getCreatura } from "~/data/skill";

export function meta({ params }: Route.MetaArgs) {
    const creatura = getCreatura(params.creatura);
    return [
        {
            title: creatura
                ? `${creatura.nome} — Albero Evolutivo`
                : "Creatura non trovata",
        },
    ];
}

export function clientLoader({ params }: Route.ClientLoaderArgs) {
    const creatura = getCreatura(params.creatura);
    if (!creatura) throw data("Creatura non trovata", { status: 404 });
    return creatura;
}

export default function CreaturaPage({ loaderData }: Route.ComponentProps) {
    return (
        <>
            <h2 className="text-center text-2xl text-isekai">
                {loaderData.numero}. {loaderData.nome}
            </h2>
            {loaderData.sottotitolo && (
                <p className="text-center mb-4 opacity-80">{loaderData.sottotitolo}</p>
            )}
            <SkillTree creatura={loaderData} />
        </>
    );
}
