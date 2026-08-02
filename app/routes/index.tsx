import MountainOverlay from "~/components/MountainOverlay";
import type { Route } from "./+types/index";
import SiteTitle from "~/components/SiteTitle";
import { Link } from "react-router";
import DmiBtn from "~/components/DmiBtn";
import EmergencyMeeting from "~/components/EmergencyMeeting";
import IntegrazioneApp from "~/components/IntegrazioneApp";
import useDmiBridge from "~/lib/useDmiBridge";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {

  const dmiBridge = useDmiBridge();


  return (
    <>
      <MountainOverlay/>
      <div className="container">
        <SiteTitle/>
        <div className="text-center flex flex-col gap-3">
          <DmiBtn link="http://127.0.0.1:32177/" newPage={true}>Scheda Personaggio</DmiBtn>
          <DmiBtn link="skill">Skill</DmiBtn>
        </div>
      </div>
      <IntegrazioneApp dmibridge={dmiBridge}/>
      <EmergencyMeeting/>
    </>
  )
}
