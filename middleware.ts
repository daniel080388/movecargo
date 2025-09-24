// middleware.ts
import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./i18n";

export default createMiddleware({
  locales,
  defaultLocale,
});

export const config = {
  // Exclude Next internals and API/static files from the middleware.
  // Match root and any other path that does NOT start with api, _next, static, or favicon.ico.
  // This avoids the middleware adding a locale prefix to API requests.
  matcher: [
    "/",
    "/((?!api/|_next/|static/|favicon.ico).*)",
  ],
};
