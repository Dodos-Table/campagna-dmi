import { VerticalTimeline, VerticalTimelineElement } from "react-vertical-timeline-component";
import 'react-vertical-timeline-component/style.min.css';
import data from "~/data/timeline/time.json"
import TimelineElement from "./TimelineElement";

export default function TimelineVerical() {

    const contentStyle1= { background: 'rgb(33, 150, 243)', color: '#fff' } // width: "2rem", height: "2rem", marginLeft: "calc(2rem / -2)"


    return (<VerticalTimeline 
        animate={false}
        lineColor="white"
        >

        {data.map(elem => 
            <TimelineElement title={elem.title} data={elem.data} body={elem.body}/>
        )}
        
    </VerticalTimeline>)

}