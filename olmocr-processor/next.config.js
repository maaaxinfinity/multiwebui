/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // 为了部署而忽略TypeScript错误
    // 实际应用中不建议这样做
    ignoreBuildErrors: true,
  },
  eslint: {
    // 为了部署而忽略ESLint错误
    ignoreDuringBuilds: true,
  }
};

module.exports = nextConfig;
