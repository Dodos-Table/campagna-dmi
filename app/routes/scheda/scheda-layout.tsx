import { Links, Meta, Scripts, ScrollRestoration } from "react-router";
import "~/assets/css/fonts.css";

export function Layout({children}: {children: React.ReactNode}) {
  return (
    <html lang="it">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <Meta />
        <Links />
      </head>
      <body>
        {/* children will be the root Component, ErrorBoundary, or HydrateFallback */}
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}