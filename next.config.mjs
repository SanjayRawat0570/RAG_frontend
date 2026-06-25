/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone output is used by the Docker image (self-hosted).
  // Vercel sets VERCEL=1 at build time, so we skip it there.
  ...(process.env.VERCEL !== "1" && { output: "standalone" }),
};

export default nextConfig;
