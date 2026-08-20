import TimelineVerical from "~/components/timeline/TimelineVertical";
import type { Route } from "../+types";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Timeline - DMI" },
    { name: "description", content: "Sito per la campagna di DnD Dungeon Monster Isekai" },
  ];
}

export default function Timeline() {
    return (
            <>
                <h1 className="title text-isekai text-center">Timeline</h1>
                <TimelineVerical/>
                
            </>
        );
}