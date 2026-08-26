import type { Config } from "@react-router/dev/config";

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: false,
  // Deve combaciare con `base` in vite.config.ts: qui prefissa rotte e <Link>, là gli asset.
  basename: "/",
} satisfies Config;
