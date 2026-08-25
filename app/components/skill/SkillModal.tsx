import { useState } from "react";
import ReactModal from "react-modal";
import {
    campiVariante,
    corrispondeAlPersonaggio,
    risolviGrado,
    variantiOrdinate,
    type GradoSkill,
} from "~/lib/gradoSkill";
import type { Skill } from "~/types/skill";

ReactModal.setAppElement("body");

const modalStyle: ReactModal.Styles = {
    overlay: {
        position: "fixed",
        inset: 0,
        backgroundColor: "rgb(from var(--color-terziary) r g b / 70%)",
    },
};

interface SkillModalProp {
    skill: Skill | null;
    /** Grado evolutivo della scheda collegata, `null` se il bridge non è attivo. */
    gradoPersonaggio: GradoSkill | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function SkillModal(prop: Readonly<SkillModalProp>) {
    return (
        <ReactModal
            isOpen={prop.isOpen}
            shouldCloseOnEsc={true}
            shouldCloseOnOverlayClick={true}
            shouldFocusAfterRender={true}
            onRequestClose={prop.onClose}
            style={modalStyle}
            className="modal"
        >
            <div className="flex flex-row subtitle border-b-2 border-[--color-secondary] mb-1.5 pb-1">
                <div className="grow">
                    <h2>{prop.skill?.name}</h2>
                </div>
                <div>
                    <button type="button" onClick={prop.onClose} className="cursor-pointer">
                        X
                    </button>
                </div>
            </div>

            {prop.skill && (
                // Il corpo tiene il grado selezionato: rimontandolo a ogni skill (e a
                // ogni cambio di scheda) la selezione riparte dal grado risolto.
                <CorpoSkill
                    key={`${prop.skill.key}-${prop.gradoPersonaggio ?? ""}`}
                    skill={prop.skill}
                    gradoPersonaggio={prop.gradoPersonaggio}
                />
            )}
        </ReactModal>
    );
}

interface CorpoSkillProp {
    skill: Skill;
    gradoPersonaggio: GradoSkill | null;
}

function CorpoSkill(prop: Readonly<CorpoSkillProp>) {
    const { skill, gradoPersonaggio } = prop;

    const varianti = variantiOrdinate(skill);
    const [gradoSelezionato, setGradoSelezionato] = useState(() =>
        risolviGrado(skill, gradoPersonaggio),
    );

    const campi = campiVariante(skill, gradoSelezionato);

    return (
        <div>
            <p className="skill-modal__sottotitolo">
                {[skill.section, skill.category, skill.role].filter(Boolean).join(" · ")}
            </p>

            {varianti.length > 1 ? (
                <div className="skill-gradi" role="tablist" aria-label="Grado della skill">
                    {varianti.map(({ grado }) => {
                        const tuo = corrispondeAlPersonaggio(grado, gradoPersonaggio);
                        const classi = [
                            "skill-grado",
                            grado === gradoSelezionato ? "skill-grado--attiva" : "",
                            tuo ? "skill-grado--personaggio" : "",
                        ]
                            .filter(Boolean)
                            .join(" ");

                        return (
                            <button
                                key={grado}
                                type="button"
                                role="tab"
                                aria-selected={grado === gradoSelezionato}
                                className={classi}
                                title={tuo ? "Il grado del tuo personaggio" : undefined}
                                onClick={() => setGradoSelezionato(grado)}
                            >
                                {grado}
                            </button>
                        );
                    })}
                </div>
            ) : (
                <p className="skill-modal__grado-unico">Grado: {gradoSelezionato}</p>
            )}

            {/* Sulle skill a variante singola il grado del personaggio non è confrontabile. */}
            {varianti.length > 1 &&
                gradoPersonaggio &&
                !corrispondeAlPersonaggio(gradoSelezionato, gradoPersonaggio) && (
                    <p className="skill-modal__avviso">
                        Il tuo personaggio è di grado {gradoPersonaggio}.
                    </p>
                )}

            <div className="skill-meta">
                <Campo etichetta="Tempo azione" valore={skill.action} />
                <Campo etichetta="Tiro" valore={skill.roll} />
                <Campo etichetta="Mana" valore={campi.mp} mostraZero={true} />
                <Campo etichetta="Elemento" valore={skill.element} />
                <Campo etichetta="Tiro salvezza" valore={skill.save} />
                <Campo etichetta="Bersaglio" valore={skill.target} />
                <Campo etichetta="Gittata" valore={campi.range} />
                <Campo etichetta="Durata" valore={campi.duration} />
                <Campo etichetta="Danno base" valore={campi.damageBase} />
                <Campo etichetta="Modificatore" valore={skill.modifier ? `${skill.modifier}%` : ""} />
            </div>

            {skill.requirements && (
                <div className="mt-2">
                    <p>Requisiti: {skill.requirements}</p>
                </div>
            )}

            {skill.summary && (
                <div className="mt-2">
                    <p>Descrizione:</p>
                    <p>{skill.summary}</p>
                </div>
            )}

            {campi.effect && (
                <div className="mt-2">
                    <p>Effetto ({gradoSelezionato}):</p>
                    <p className="skill-effetto">{campi.effect}</p>
                </div>
            )}

            {skill.repeatable && (
                <p className="mt-2">
                    Ripetibile
                    {typeof skill.maxAcquisitions === "number"
                        ? ` fino a ${skill.maxAcquisitions} volte`
                        : ""}
                    .
                </p>
            )}

            {skill.notes && <p className="skill-modal__note">{skill.notes}</p>}
        </div>
    );
}

interface CampoProp {
    etichetta: string;
    valore: string | number;
    /** I costi in mana vanno mostrati anche quando sono 0: "gratis" è un'informazione. */
    mostraZero?: boolean;
}

function Campo(prop: Readonly<CampoProp>) {
    if (prop.valore === "" || prop.valore === undefined || prop.valore === null) return null;
    if (prop.valore === 0 && !prop.mostraZero) return null;

    return (
        <p>
            {prop.etichetta}: {prop.valore}
        </p>
    );
}
