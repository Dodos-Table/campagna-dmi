import { Link, Outlet } from "react-router";
import SelettoreCreatura from "~/components/skill/SelettoreCreatura";
import { getCreature } from "~/data/skill";

export default function SkillLayout() {
    return (
        <div className="container pt-8 pb-8">
            <h1 className="title text-isekai text-center">Alberi Evolutivi</h1>
            <SelettoreCreatura creature={getCreature()} />
            <Outlet />
            <div className="text-center mt-6">
                <Link className="link" to="/">
                    Torna alla home
                </Link>
            </div>
        </div>
    );
}
