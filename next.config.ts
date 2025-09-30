import path from 'path'

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
  ],
  // Ensure Next uses this project as the tracing root (monorepo safe)
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
