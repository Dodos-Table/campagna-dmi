import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
    layout("routes/__layouts/main-layout.tsx", [
        index("routes/index.tsx"),
        /*route("skill", "routes/__layouts/skill-layout.tsx", [
            index("routes/skill/index.tsx"),
            route(":creatura", "routes/skill/creatura.tsx"),*/
        ]),
        route("npc", "routes/__layouts/simple-layout.tsx", [
            index("routes/npc/index.tsx")
        ])
    ]),
] satisfies RouteConfig;
