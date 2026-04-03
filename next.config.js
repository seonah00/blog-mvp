/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export' 제거 - 대시보드 앱은 동적 라우팅이 필요
  // Static export는 빌드 시 모든 동적 경로를 사전 생성해야 하지만,
  // 이 앱은 런타임에 프로젝트 ID가 생성되는 대시보드 형태임
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // Production 환경에서도 source map 생성 (디버깅용)
  productionBrowserSourceMaps: true,
}

module.exports = nextConfig
