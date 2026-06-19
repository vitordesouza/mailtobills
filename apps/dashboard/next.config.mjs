import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@mailtobills/domain",
    "@mailtobills/i18n",
    "@mailtobills/ui",
  ],
};

export default withNextIntl(nextConfig);
