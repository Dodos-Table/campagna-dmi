import { NavLink } from "react-router";
import type { Creatura } from "~/types/skill";

interface SelettoreCreaturaProp {
    creature: Creatura[];
}

/** Tab per scegliere quale albero evolutivo mostrare. */
export default function SelettoreCreatura(prop: Readonly<SelettoreCreaturaProp>) {
    return (
        <nav className="skill-tabs" aria-label="Creature">
            {prop.creature.map((c) => (
                <NavLink
                    key={c.nome}
                    to={`/skill/${c.id}`}
                    className={({ isActive }) => (isActive ? "skill-tab skill-tab--attiva" : "skill-tab")}
                >
                {c.nome}
                </NavLink>
            ))}
        </nav>
    );
}
