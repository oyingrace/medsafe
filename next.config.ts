import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["tesseract.js", "jimp", "@breeztech/breez-sdk-spark"],
};

export default nextConfig;
