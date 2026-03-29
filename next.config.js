/** @type {import('next').NextConfig} */
const nextConfig = {
  // 출력 디렉토리 변경 (캐시 문제 해결)
  distDir: '.next',
  
  // 외부 이미지 도메인 설정
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  
  // 실험적 기능 비활성화 (안정성)
  experimental: {
    // app 디렉토리 관련 설정 제거 (Next.js 14 기본값 사용)
  },
}

module.exports = nextConfig
