/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Keep PDF parsing in node_modules at runtime so pdfjs can find its worker
    serverComponentsExternalPackages: ["pdf-parse", "pdfjs-dist"],
  },
};
export default nextConfig;
