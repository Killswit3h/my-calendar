const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    "http://192.168.1.138:3000",
    "http://localhost:3000",
  ],
  // Next.js 15: moved from experimental.serverComponentsExternalPackages
  serverExternalPackages: [
    "puppeteer",
    "puppeteer-core",
    "@sparticuz/chromium",
    "exceljs",
    "@vercel/blob",
    "pdf-lib",
    "xlsx",
  ],
};

export default nextConfig;
