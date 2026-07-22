import MountainOverlay from "~/components/MountainOverlay";
import type { Route } from "./+types/index";
import SiteTitle from "~/components/SiteTitle";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return (
    <>
      <MountainOverlay/>
      <div className="container">
        <SiteTitle/>
        <Link to="scheda">ciao mondo</Link>
      </div>
      
    </>
  )
}
