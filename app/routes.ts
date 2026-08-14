import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
    layout("routes/__layouts/main-layout.tsx", [
        index("routes/index.tsx"),
        route("evoluzioni", "routes/evoluzioni/index.tsx"),
        route("npc", "routes/__layouts/simple-layout.tsx", [
            index("routes/npc/index.tsx"),
            route(":id", "routes/npc/npc.tsx"),
        ])
    ]),
] satisfies RouteConfig;
