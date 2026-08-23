import { VerticalTimeline } from "react-vertical-timeline-component";
import 'react-vertical-timeline-component/style.min.css';
import data from "~/data/timeline/time.json"
import TimelineElement from "./TimelineElement";
import "~/assets/css/timeline.css"

export default function TimelineVerical() {

    return (<VerticalTimeline 
        animate={false}
        lineColor="white"
        >

        {data.map((elem, index) => 
            <TimelineElement key={index+"."+elem.title} data={elem}/>
        )}
        
    </VerticalTimeline>)

}