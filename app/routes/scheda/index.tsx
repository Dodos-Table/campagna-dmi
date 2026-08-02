import { Link } from "react-router";
import IntegrazioneApp from "~/components/IntegrazioneApp";

export default function Index() {
    return (
        <>
            <div>ciao scheda</div>
            <IntegrazioneApp/>
            <Link to="/">home</Link>
        </>
    )
}