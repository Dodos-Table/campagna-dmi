import MountainOverlay from "@/components/MountainOverlay";
import SiteTitle from "@/components/SiteTitle";
import Link from "next/link";


export default function Home() {
  return (
    <>
      <MountainOverlay/>
      <div className="@container">
        <SiteTitle/>
      </div>
      <Link href="test/">ciao mondo</Link>
    </>
  );
}
