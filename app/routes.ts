import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
    layout("routes/main-layout.tsx", [
        index("routes/index.tsx"),
    ]),
    ...prefix("scheda", [
        layout("routes/scheda/scheda-layout.tsx", [
            index("routes/scheda/index.tsx"),
        ])
    ])
] satisfies RouteConfig;
