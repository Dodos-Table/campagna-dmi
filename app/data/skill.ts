import raw from "~/data/skill-tree.json";
import type { Creatura, SkillData } from "~/types/skill";

// Il JSON grezzo tipizza `tipo`/`linea` come `string`: l'asserzione le riporta alle union di ~/types/skill.
const skillData = raw as SkillData;

export function getCreature(): Creatura[] {
    return skillData.creature;
}

export function getCreatura(id: string | undefined): Creatura | undefined {
    if (!id) return undefined;
    return skillData.creature.find((c) => c.id === id);
}
