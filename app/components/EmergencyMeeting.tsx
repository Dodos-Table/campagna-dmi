
import "~/assets/css/EmergencyMeeting.css"

export default function EmergencyMeeting() {

    return (
        <div className="sceneWrapper hidden md:block">
            &nbsp;
            <div className="scene">
                &nbsp;
                <div className="platform"></div>

                <button className="button" aria-label="Emergency meeting">
                    <span className="side"></span>
                    <span className="top"></span>
                </button>
            </div>
        </div>
    )

}