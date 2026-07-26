import MountainOverlay from "~/components/MountainOverlay";
import type { Route } from "./+types/index";
import SiteTitle from "~/components/SiteTitle";
import { Link } from "react-router";
import DmiBtn from "~/components/DmiBtn";

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
        <div className="text-center flex flex-col gap-3">
          <DmiBtn link="scheda">Scheda Personaggio</DmiBtn>
          <DmiBtn link="skill">Skill</DmiBtn>
        </div>
      </div>
      
    </>
  )
}
