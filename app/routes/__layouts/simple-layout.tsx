import { Link, Outlet } from "react-router";

export default function SimpleLayout() {
    return (
        <div className="container pt-8 pb-8">
            <Outlet />
            <div className="text-center mt-6">
                <Link className="link" to="/">
                    Torna alla home
                </Link>
            </div>
        </div>
    );
}
