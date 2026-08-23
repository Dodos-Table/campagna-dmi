import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
    layout("routes/__layouts/main-layout.tsx", [
        index("routes/index.tsx"),
        

        layout("routes/__layouts/simple-layout.tsx", [
            ...prefix("evoluzioni", [
                index("routes/evoluzioni/index.tsx"),
            ]),
            ...prefix("npc", [
                index("routes/npc/index.tsx"),
                route(":id", "routes/npc/npc.tsx"),
            ]),
            ...prefix("timeline", [
                index("routes/timeline/index.tsx")
            ]),
            ...prefix("skill", [
                index("routes/skill/index.tsx")
            ])
        ]),

    ]),
] satisfies RouteConfig;
