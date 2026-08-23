import Markdown from "react-markdown"
import { VerticalTimelineElement } from "react-vertical-timeline-component"
import "~/assets/css/timeline.css"
import IconMorph from "../IconMorph"


interface TimelineElementProp {
    title?: string,
    body?: string,
    data?: string,
    color?: string,
    icon?: string
}

interface DataTimelineProp {
    data: TimelineElementProp
}

export default function TimelineElement({data}: Readonly<DataTimelineProp>) {

    const iconBgColor = data.color ?? "rgb(33, 150, 243)"

    const contentStyle1= { background: iconBgColor, fill: '#fff' } 
    
    return (
        <VerticalTimelineElement
            className="vertical-timeline-element--work"
            contentArrowStyle={{ borderRight: '7px solid '+iconBgColor }}
            date={data.data}
            iconStyle={contentStyle1}
            icon={<IconMorph type={data.icon}/>}

        >
            {data.title ? <h3 className="vertical-timeline-element-title text-2xl">{data.title}</h3> : null}
            
            <div className="vertical-timeline-element-body">
                <Markdown>{data.body}</Markdown>
            </div>
        </VerticalTimelineElement>
    )

}