import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Avoid blocking production builds due to ESLint. We run lint in CI separately.
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizeCss: false, // 🚑 desativa lightningcss no build da Vercel
  },
};

export default withNextIntl(nextConfig);
