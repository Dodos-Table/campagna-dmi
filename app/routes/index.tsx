import MountainOverlay from "~/components/MountainOverlay";
import type { Route } from "./+types/index";
import SiteTitle from "~/components/SiteTitle";
import DmiBtn from "~/components/DmiBtn";
import EmergencyMeeting from "~/components/EmergencyMeeting";
import IntegrazioneApp from "~/components/IntegrazioneApp";
import useDmiBridge from "~/lib/useDmiBridge";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Dungeon Monster Isekai" },
    { name: "description", content: "Sito per la campagna di DnD Dungeon Monster Isekai" },
  ];
}

export default function Home() {

  const dmiBridge = useDmiBridge();

  const tooltip_scheda = (dmiBridge.stato !== "connesso") ? "Avvia il programma della scheda DMI" : undefined

  return (
    <>
      <MountainOverlay />
      <div className="container">
        <SiteTitle />
        <div className="text-center flex flex-col gap-3">
          <div>
            <DmiBtn link="http://127.0.0.1:32177/" newPage={true} disabled={dmiBridge.stato !== "connesso"} tooltip={tooltip_scheda}>Scheda Personaggio</DmiBtn>
          </div>
          <div>
            <DmiBtn link="timeline">Timeline</DmiBtn>
          </div>
          <div>
            <DmiBtn link="evoluzioni">Evoluzioni</DmiBtn>
          </div>
          <div>
            <DmiBtn link="npc">NPCs</DmiBtn>
          </div>
          <div>
            <DmiBtn link="skill">Skills</DmiBtn>
          </div>
          <div>
            <DmiBtn link="attivita">Attività</DmiBtn>
          </div>
        </div>
      </div>
      <IntegrazioneApp dmibridge={dmiBridge} />
      <EmergencyMeeting />
    </>
  )
}
