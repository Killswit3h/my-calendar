const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    "http://192.168.1.138:3000",
    "http://localhost:3000",
  ],
  experimental: {
    // Allow heavy server-only packages in server bundles
    serverComponentsExternalPackages: [
      "puppeteer",
      "puppeteer-core",
      "@sparticuz/chromium",
      "exceljs",
      "@vercel/blob",
    ],
  },
};

export default nextConfig;
