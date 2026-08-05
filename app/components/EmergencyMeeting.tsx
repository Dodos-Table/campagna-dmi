
import useSound from "use-sound";
import "~/assets/css/EmergencyMeeting.css"
import meeting from "~/assets/audio/Emergency-Meeting.mp3"
import { useEffect, useState } from "react";


export default function EmergencyMeeting() {

    const [play] = useSound(meeting, {interrupt: true});
    const [animstate, setAnimstate] = useState('')

    function emergencymeeting() {
        setAnimstate("meetinganim")
        play();

        setTimeout(() => setAnimstate(''), 3100)
    }

    return (
        <div className="sceneWrapper hidden md:block">
            <div className="relative" style={{"bottom":"85px"}}>
                <svg viewBox="0 0 30 11" xmlns="http://www.w3.org/2000/svg">
                    <path id="MyPath" fill="none" d="M 0 10 Q 15 0 30 10" pathLength="2" />
                    
                    <text fontSize="4" textAnchor="middle">
                        <textPath href="#MyPath" startOffset="1" className={"meetingtext "+animstate}>
                        Meeting di
                        </textPath>
                    </text>
                    <text fontSize="4" dominantBaseline="hanging" textAnchor="middle">
                        <textPath href="#MyPath" startOffset="1" className={"meetingtext "+animstate}>
                        emergenza!
                        </textPath>
                    </text>
                </svg>
            </div>
            <div className="scene">
                <div className="platform"></div>

                <button className="button" aria-label="Emergency meeting" onClick={emergencymeeting}>
                    <span className="side"></span>
                    <span className="top"></span>
                </button>
            </div>
        </div>
    )

}