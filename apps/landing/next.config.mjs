import path from "path";
import { fileURLToPath } from "url";
import createNextIntlPlugin from "next-intl/plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@mailtobills/i18n", "@mailtobills/ui"],
  turbopack: {
    root: path.resolve(__dirname, "../../"),
  },
};

export default withNextIntl(nextConfig);
