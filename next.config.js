/** @type {import('next').NextConfig} */
const nextConfig = {
  // 외부 이미지 도메인 설정
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  
  // TypeScript 오류 무시 (빌드 우선)
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint 오류 무시
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
