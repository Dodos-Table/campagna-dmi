import MountainOverlay from "~/components/MountainOverlay";
import type { Route } from "./+types/index";
import SiteTitle from "~/components/SiteTitle";
import DmiBtn from "~/components/DmiBtn";
import EmergencyMeeting from "~/components/EmergencyMeeting";
import IntegrazioneApp from "~/components/IntegrazioneApp";
import useDmiBridge from "~/lib/useDmiBridge";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dungeon Monster Isekai" },
    { name: "description", content: "Sito per la campagna di DnD Dungeon Monster Isekai" },
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
          <DmiBtn link="evoluzioni">Evoluzioni</DmiBtn>
          <DmiBtn link="npc">NPCs</DmiBtn>
        </div>
      </div>
      <IntegrazioneApp dmibridge={dmiBridge}/>
      <EmergencyMeeting/>
    </>
  )
}
