import { VerticalTimelineElement } from "react-vertical-timeline-component"

interface TimelineElementProp {
    title?: string,
    body?: string,
    data?: string
}

export default function TimelineElement(prop: TimelineElementProp) {
    
    const contentStyle1= { background: 'rgb(33, 150, 243)', color: '#fff' } // width: "2rem", height: "2rem", marginLeft: "calc(2rem / -2)"

    return (
        <VerticalTimelineElement
            className="vertical-timeline-element--work"
            contentArrowStyle={{ borderRight: '7px solid  rgb(33, 150, 243)' }}
            date={prop.data}
            iconStyle={contentStyle1}
        >
            {prop.title ? <h3 className="vertical-timeline-element-title">{prop.title}</h3> : null}
            
            <p>
                {prop.body}
            </p>
        </VerticalTimelineElement>
    )

}