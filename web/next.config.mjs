// Static export so the dashboard can be served from GitHub Pages. `basePath`
// lets it live under a repo subpath (e.g. /Overpass); it's read from an env var
// so local dev stays at the root.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
