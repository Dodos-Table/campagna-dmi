import { Outlet } from "react-router";

export default function MainLayout() {
    return (
        <div className="dmi-background">
            <Outlet />
        </div>
    )
}