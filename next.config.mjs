/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['sqlite3'],
  // Add any Next.js configurations here that are compatible
  // with both Webpack and Turbopack, or specific to Turbopack
  // if needed based on the Next.js documentation.
  // For now, it will be empty as we removed the Webpack-specific part.

  // Example of a Turbopack-specific option if needed in the future:
  // experimental: {
  //   turbo: {
  //     // Turbopack specific options here
  //   },
  // },
};

export default nextConfig;
